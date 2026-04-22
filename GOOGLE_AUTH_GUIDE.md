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
