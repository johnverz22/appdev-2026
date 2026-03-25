# Spring Boot — Auth Microservice

This service handles everything related to users: registration, login, logout, and issuing JWT tokens. It runs on **port 8080**.

---

## How it fits in the project

| Service | Tech | Port | Responsibility |
|---------|------|------|----------------|
| `sb` | Spring Boot | 8080 | Auth — login, register, issues JWT |
| `php` | PHP | 8081 | Products — catalog listing + CRUD |
| `django` | Django | 8082 | Checkout — place orders, order history |
| `react` | React + Vite | 3000 | Frontend for all services |

---

## Roles

There are two roles in the system:

| Role | How it's created | What they can do |
|------|-----------------|------------------|
| `ROLE_USER` | Public `/register` endpoint | Browse catalog, place orders via checkout |
| `ROLE_ADMIN` | Auto-seeded on startup from `application.properties` | Manage products (CRUD), view all orders |

The role is embedded as a claim inside the JWT, so PHP and Django can enforce it without a database lookup.

---

## Admin account

The admin account is created automatically when the app starts, if it doesn't already exist.
Credentials are configured in `application.properties`:

```properties
admin.username=admin
admin.password=Admin@1234
```

Change these before deploying anywhere real. The password is BCrypt-hashed before being stored.

---

## Project structure

```
sb/
├── pom.xml                              # Maven build file (like package.json for Java)
└── src/main/java/.../
    ├── MicroserviceDemoApplication.java # Entry point (main method)
    ├── controller/
    │   └── AuthController.java          # /login, /register, /logout, /me + admin seed
    ├── dto/
    │   ├── LoginRequest.java            # Shape of the login request body
    │   └── SignupRequest.java           # Shape of the register request body
    ├── model/
    │   └── User.java                    # User entity (id, username, password, role)
    ├── repository/
    │   └── UserRepository.java          # DB queries for users
    └── security/
        ├── SecurityConfig.java          # Public vs protected routes + CORS
        ├── JwtUtils.java                # Creates and validates JWT tokens
        ├── JwtAuthenticationFilter.java # Reads JWT cookie on every request
        └── CustomUserDetailsService.java# Loads user from DB for Spring Security
```

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create a `ROLE_USER` account, sets JWT cookie |
| POST | `/api/auth/login` | No | Log in, sets JWT cookie |
| POST | `/api/auth/logout` | No | Clears the JWT cookie |
| GET | `/api/auth/me` | Yes | Returns `{ username, role }` for the current session |

All responses that involve a user return `{ username, role }` so the frontend knows immediately what the user can do.

---

## Core concepts

### 1. Maven — Java's package manager

`pom.xml` is like `package.json`. It lists all dependencies and Maven downloads them automatically.

```bash
./mvnw spring-boot:run   # Docker Compose runs this for you
```

### 2. Login request flow

```
POST /api/auth/login  { username, password }
        ↓
AuthController.login()
        ↓
AuthenticationManager.authenticate()        ← Spring Security checks credentials
        ↓
CustomUserDetailsService.loadUserByUsername() ← Loads user from DB
        ↓
BCrypt compares the hashed password
        ↓
JwtUtils.generateToken(username, role)      ← Creates a signed JWT with role claim
        ↓
response.addCookie(buildJwtCookie(jwt))     ← Sets HttpOnly cookie
        ↓
Returns { username, role }  HTTP 200
```

### 3. JWT — JSON Web Token

A JWT is a string with three parts: `header.payload.signature`

- Header — algorithm used (HS256)
- Payload — data inside the token (`sub`, `roles`, expiry)
- Signature — proves the token wasn't tampered with

```java
// JwtUtils.java
Jwts.builder()
    .setSubject(username)
    .claim("roles", List.of(role))   // role embedded so other services can read it
    .setExpiration(...)              // 24 hours
    .signWith(getSigningKey(), HS256)
    .compact();
```

The `roles` claim is how PHP and Django enforce role-based access without calling Spring Boot.

### 4. HttpOnly cookie

After login, the JWT is stored in a cookie, not the response body.

```java
Cookie cookie = new Cookie("jwt", token);
cookie.setHttpOnly(true);      // JavaScript cannot read this (XSS protection)
cookie.setPath("/");
cookie.setDomain("localhost"); // shared across all localhost ports (8080, 8081, 8082)
```

Because the cookie is shared across ports, a single login gives access to all three backend services.

### 5. Spring Security config

`SecurityConfig.java` controls which routes are public:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/logout").permitAll()
    .anyRequest().authenticated()
)
```

### 6. Flyway — database migrations

Flyway runs SQL files automatically on startup and tracks which ones have already run.

```
src/main/resources/db/migration/
└── V1__create_users_table.sql   ← Creates the users table
```

The admin account is NOT in the SQL file. It is seeded by `AuthController.seedAdmin()` which runs after the app is fully started, so it always uses the BCrypt encoder correctly.

---

## How to add a new endpoint

**Step 1** — Add a method to `AuthController.java` (or create a new controller):

```java
@GetMapping("/api/auth/profile")
public ResponseEntity<?> profile() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = auth.getName();
    User user = userRepository.findByUsername(username).orElseThrow();
    return ResponseEntity.ok(Map.of("username", user.getUsername(), "role", user.getRole()));
}
```

**Step 2** — If the route should be public, add it to `SecurityConfig.java`:

```java
.requestMatchers("/api/auth/profile").permitAll()
```

Otherwise it's automatically protected — no extra config needed.

---

## Environment variables (set by Docker Compose)

| Variable | Description |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection string |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `JWT_SECRET` | Base64-encoded secret — must match PHP and Django |

---

## application.properties reference

```properties
# Admin seed account (created on startup if not exists)
admin.username=admin
admin.password=Admin@1234

# JWT
jwt.secret=<base64-encoded-256-bit-key>
jwt.expiration=86400000       # 24 hours in milliseconds
jwt.cookie.domain=localhost   # shares cookie across all localhost ports
```
