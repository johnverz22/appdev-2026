# Guide: Implementing Google Authentication alongside Local Login

This guide reflects the precise, implemented steps taken to add Google Social Login to the existing `sb` (Spring Boot) Authentication service while expanding the database schema to support explicit user emails via Flyway migrations.

## Overview
Currently, the frontend sends a username and password to `/api/auth/login`. Spring Boot verifies this against the Database, generates a JWT, and sets an `HttpOnly` cookie.

To add Google Login natively, we updated the `sb` service to verify a Google ID token passed from the React frontend, created a database migration to officially capture user emails, and configured the system to issue the identical internal `HttpOnly` JWT cookie so the rest of the microservices (`php/`, `django/`) required **no changes**.

---

## Step 1: Set up Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `microservices-auth`).
3. Set up the **OAuth consent screen** (User Type: External).
4. Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
5. Choose **Web application**.
6. Set **Authorized JavaScript origins** to `http://localhost:3000` (the React frontend).
7. Save your `Client ID`. Provide it in the React frontend as an environment variable (`VITE_GOOGLE_CLIENT_ID`) and the Spring Boot backend (`google.client.id`).

---

## Step 2: Database & Backend Model Changes
To keep logins robust, we updated the backend entities and Postgres database to track emails.

### 1. Database Migration
Added a Flyway script to alter the database natively on startup.
**File Changed**: `sb/src/main/resources/db/migration/V2__add_email_to_users.sql`
```sql
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
```

### 2. Update User Entity
Appended the `email` field to the JPA entity so it persists into the database correctly.
**File Changed**: `sb/src/main/java/com/johnverz/microservice_demo/model/User.java`
- Added `private String email;`
- Recreated the `User()` constructor to accept `(username, password, email, role)`.
- Added `getEmail()` and `setEmail()` getters and setters.

### 3. Update User Repository
Created an optional lookup interface method to allow Spring Boot to find users securely by their Google email.
**File Changed**: `sb/src/main/java/com/johnverz/microservice_demo/repository/UserRepository.java`
- Added `Optional<User> findByEmail(String email);`

---

## Step 3: Backend Authentication Logic Configuration
Integrated the official verification libraries and new `/google` API endpoint.

### 1. Update Maven Dependencies
Imported Google's authentication packages.
**File Changed**: `sb/pom.xml`
- Added `google-api-client` (v2.2.0)
- Added `gson` (v2.10.1, required by Google Factory parser)

### 2. Implement the API Controller
Engineered the new endpoint to handle verification, mapped the Google account to the internal user table, and issued the JWT.
**File Changed**: `sb/src/main/java/com/johnverz/microservice_demo/controller/AuthController.java`

- Defined an environment property mapping: `@Value("${google.client.id:placeholder}") private String googleClientId;`
- Swapped old `User(...)` usages to use the updated 4-property constructor.
- Authored the Google verifier payload:

```java
@PostMapping("/google")
public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request, HttpServletResponse response) {
    try {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), new GsonFactory())
            .setAudience(Collections.singletonList(googleClientId))
            .build();
            
        GoogleIdToken idToken = verifier.verify(request.get("token"));
        if (idToken != null) {
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            
            // Look up by email explicitly
            User user = userRepository.findByEmail(email).orElse(null);
            
            if (user == null) {
                user = new User();
                user.setUsername(email.split("@")[0]);
                user.setEmail(email);
                // Lock account to social-login only by randomizing the local password
                user.setPassword(encoder.encode(UUID.randomUUID().toString()));
                user.setRole("ROLE_USER");
                userRepository.save(user);
            }
            
            // Dispatch standard system JWT
            String jwt = jwtUtils.generateToken(user.getUsername(), user.getRole());
            response.addCookie(buildJwtCookie(jwt));
            return ResponseEntity.ok(Map.of("username", user.getUsername(), "role", user.getRole()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid ID token."));
        }
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

### 3. Configure CORS and Gateway Bypasses (Critical for Preflight Requests)
CORS must be handled at the **API Gateway level** — the browser only ever talks to the gateway directly, so that is where the `Access-Control-Allow-*` headers must originate. Configuring CORS inside `sb` alone is insufficient because the gateway will still reject the preflight `OPTIONS` request before it ever reaches `sb`.

**File Changed**: `api-gateway/src/main/resources/application.yml`
- Added a `globalcors` block under `spring.cloud.gateway` to respond to browser preflight requests with the correct CORS headers:

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins:
              - "http://localhost:3000"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowedHeaders:
              - "*"
            allowCredentials: true
```

**File Changed**: `api-gateway/src/main/java/com/johnverz/apigateway/filter/JwtAuthFilter.java`
- Bypassed the JWT check for `OPTIONS` preflight requests and the `/api/auth/google` endpoint so the filter does not block them before the CORS response can be formed.

**File Changed**: `sb/src/main/java/com/johnverz/microservice_demo/security/SecurityConfig.java`
- Added `/api/auth/google` to `.permitAll()` so Spring Security in `sb` does not reject the forwarded POST after the preflight is cleared.
- **No `CorsConfigurationSource` bean needed** — CORS is handled entirely by the gateway.

---

## Step 4: Frontend React Ecosystem
Configured the Google SDK across the global app lifecycle and updated the login forms.

### 1. Install Google Client
**File Changed**: `react/package.json`
- Added dependency `"@react-oauth/google": "^0.12.1"`

### 2. Global Provider Setup
Wrapped the application to propagate context for Google Buttons seamlessly.
**File Changed**: `react/src/main.jsx`
- Imported `<GoogleOAuthProvider>` and wrapped the standard `<App />` component using `clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}`.

### 3. State Management (Auth Hook)
Exported the new bridging function to securely sync state.
**File Changed**: `react/src/hooks/useAuth.jsx`
- Appended `googleLogin` asynchronous callback logic to `POST /api/auth/google` with our unverified ID Token as the request body. Extracted the subsequent application role routing logic to transition to the Dashboard upon success.

### 4. Login Page Presentation
Rendered the physical Google Login elements inside the form schema.
**File Changed**: `react/src/pages/Login.jsx`
- Appended `<GoogleLogin />` below the classic password form. Triggers `handleGoogleSuccess`, returning visual success feedback (or error logs) if a cross-site sign in fails midway through.

---

## Troubleshooting

### `403 Forbidden` on `OPTIONS /api/auth/google` — CORS Missing Allow Origin
**Symptom**: The browser sends a preflight `OPTIONS` request to the API Gateway and receives a `403 Forbidden` with no `Access-Control-Allow-Origin` header. The browser then blocks the actual `POST` request.

**Cause**: Spring Cloud Gateway (WebFlux-based) has its own CORS layer that runs *before* any custom filters. Without a `globalcors` configuration, the gateway rejects preflight requests with a 403 before they ever reach `JwtAuthFilter` or the downstream `sb` service. Configuring CORS only inside `sb`'s `SecurityConfig` is not sufficient — the gateway blocks the request at the edge before forwarding it.

**Fix**: Add a `globalcors` block to `api-gateway/src/main/resources/application.yml` (see Step 3.3 above). Then restart the gateway container to pick up the change.

> [!NOTE]
> Do **not** add `CorsConfigurationSource` to `sb`'s `SecurityConfig`. CORS is the gateway's responsibility. `sb` only needs `/api/auth/google` in `.permitAll()` so Spring Security doesn't block the forwarded POST after the preflight passes.

---

### Spring Boot `sb` Fails to Compile or Boot Up (CORS Persists Despite Fixes)
If CORS errors continue even after the gateway config is set, ensure `sb` itself has compiled and booted successfully. If the auth service is offline, the gateway has nothing to proxy to and returns errors without CORS headers.

During the social login integration, a few structural errors can arise in the `pom.xml` causing compilation failure:
1. **Missing Spring Cloud Dependency Management**: Ensure `spring-cloud-dependencies` is declared in `<dependencyManagement>` so Eureka client dependencies resolve their versions.
2. **XML Syntax Malformations**: Check for duplicated or malformed closing tags (e.g., duplicated `</project>` or stray `roupId>` tags) at the end of the file.

---

### `ClassNotFoundException: WebMvcAutoConfiguration` on Startup
**Symptom**: The `sb` container starts but immediately crashes with:
```
Caused by: java.lang.ClassNotFoundException: org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration
```

**Cause**: The `spring-boot-starter-parent` version in `sb/pom.xml` was set to `4.0.3`. Spring Boot 4.x restructured its auto-configuration internals and the `WebMvcAutoConfiguration` class no longer exists at that path. This is incompatible with `spring-boot-devtools` (version `4.0.3`), which tries to reload classes from the old namespace using its restart classloader.

**Fix**: Downgrade `spring-boot-starter-parent` to `3.2.5` (the same version used by the `api-gateway`):
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.5</version>
    <relativePath/>
</parent>
```

---

### Multiple `'dependencies.dependency.version' is missing` Errors After Downgrade
**Symptom**: After downgrading to Spring Boot 3.2.5, Maven fails with errors like:
```
'dependencies.dependency.version' for org.springframework.boot:spring-boot-starter-flyway:jar is missing
'dependencies.dependency.version' for org.flywaydb:flyway-database-postgresql:jar is missing
```

**Cause**: The `pom.xml` contained invented artifact IDs (e.g., `spring-boot-starter-flyway`, `spring-boot-starter-flyway-test`, `spring-boot-starter-data-jpa-test`) that do not exist in any Maven repository, and `flyway-database-postgresql` is only managed by the Spring Boot BOM from version 3.3.x onwards — not 3.2.5.

**Fix**: Use only real, standard artifact IDs that exist in Maven Central. For the correct `sb/pom.xml` dependency list under Spring Boot 3.2.5:

| Purpose | Correct Artifact ID |
|---|---|
| Flyway (core) | `org.flywaydb:flyway-core` (version managed by Boot BOM) |
| Flyway + PostgreSQL | ~~`flyway-database-postgresql`~~ — not needed in Boot 3.2.x; `flyway-core` handles it |
| Testing | `spring-boot-starter-test` + `spring-security-test` |
| JPA | `spring-boot-starter-data-jpa` |

---

### `CannotLoadBeanClassException` / `Cannot find class [SecurityConfig]` After Fixing `pom.xml`
**Symptom**: Even after fixing the `pom.xml`, `sb` still crashes on boot with:
```
CannotLoadBeanClassException: Cannot find class [com.johnverz.microservice_demo.security.SecurityConfig]
```

**Cause**: The `target/` directory contains stale `.class` files compiled against the old Spring Boot 4.x JARs. The `spring-boot-devtools` restart classloader picks these up instead of the freshly compiled classes, resulting in a classloading conflict.

**Fix**: Always run a full clean build after changing the `pom.xml` to wipe the stale `target/` directory:
```bash
./mvnw clean package -DskipTests
```
Then restart the Docker containers — they will pick up the freshly packaged JARs.

---

### `503 Service Unavailable` — "Cannot execute request on any known server" (Eureka)
**Symptom**: CORS is resolved but all requests to `/api/auth/*` return `503`. The `sb` logs show:
```
Connect to http://localhost:8761 ... Connection refused
DiscoveryClient_UNKNOWN/... - registration failed Cannot execute request on any known server
```

**Cause**: Two misconfigurations in `sb/src/main/resources/application.properties`:

1. **Wrong Eureka URL** — No `eureka.client.service-url.defaultZone` was set, so the Eureka client defaulted to `http://localhost:8761`. Inside Docker, `localhost` refers to the container itself, not the host machine or other containers.
2. **Service registered as `UNKNOWN`** — No `spring.application.name` was set, so `sb` registered under the name `UNKNOWN`. The API Gateway routes using `lb://sb`, so it could never resolve the service.

**Fix**: Add the following to `sb/src/main/resources/application.properties`:
```properties
# ===============================
# EUREKA SERVICE REGISTRY
# ===============================
eureka.client.service-url.defaultZone=http://eureka-server:8761/eureka/
spring.application.name=sb
```

---

### `sb` Cannot Connect to PostgreSQL on Startup
**Symptom**: The `sb` container fails on startup with a database connection refused error.

**Cause**: `spring.datasource.url` was set to `jdbc:postgresql://localhost:5434/auth_db`. This is the host machine's mapped port — valid for running locally outside Docker, but **not** inside a container. Inside Docker, `localhost` is the container itself.

**Fix**: Use the Docker service name and internal port in `sb/src/main/resources/application.properties`:
```properties
# Use Docker service name and internal port — NOT localhost:5434
spring.datasource.url=jdbc:postgresql://db:5432/auth_db
```

