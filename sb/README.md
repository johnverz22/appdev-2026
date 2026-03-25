# Spring Boot — Auth Microservice

This service handles everything related to users: registration, login, logout, and issuing JWT tokens. It runs on **port 8080**.

---

## What Does This Service Do?

- Accepts a username and password
- Hashes the password with BCrypt before saving it to the database
- On successful login, creates a JWT token and stores it in an HttpOnly cookie
- Exposes a `/api/auth/me` endpoint so the frontend can check if a session is still valid

It does **not** handle products, orders, or anything else. That separation is the point of microservices.

---

## Project Structure

```
sb/
├── pom.xml                          ← Maven build file (like package.json for Java)
└── src/main/java/.../
    ├── MicroserviceDemoApplication  ← Entry point (main method)
    ├── controller/
    │   └── AuthController.java      ← HTTP endpoints: /login, /register, /logout, /me
    ├── dto/
    │   ├── LoginRequest.java        ← Shape of the login request body
    │   ├── SignupRequest.java       ← Shape of the register request body
    │   └── JwtResponse.java        ← Shape of the response (not used directly)
    ├── model/
    │   └── User.java               ← The User database entity
    ├── repository/
    │   └── UserRepository.java     ← Database queries for users
    └── security/
        ├── SecurityConfig.java     ← Which routes are public vs protected + CORS
        ├── JwtUtils.java           ← Creates and validates JWT tokens
        ├── JwtAuthenticationFilter ← Reads JWT from cookie on every request
        └── CustomUserDetailsService← Loads user from DB for Spring Security
```

---

## Core Concepts

### 1. Maven — Java's Package Manager

`pom.xml` is like `package.json`. It lists all dependencies (Spring Security, JWT library, PostgreSQL driver, etc.) and Maven downloads them automatically.

```bash
# Run the app (Docker Compose does this for you)
./mvnw spring-boot:run
```

### 2. The Request Flow for Login

```
POST /api/auth/login  { username, password }
        ↓
AuthController.login()
        ↓
AuthenticationManager.authenticate()   ← Spring Security checks credentials
        ↓
CustomUserDetailsService.loadUserByUsername()  ← Loads user from DB
        ↓
BCrypt compares the hashed password
        ↓
JwtUtils.generateToken(username)       ← Creates a signed JWT
        ↓
response.addCookie(buildJwtCookie(jwt)) ← Sets HttpOnly cookie
        ↓
Returns { username: "..." }  HTTP 200
```

### 3. JWT — JSON Web Token

A JWT is a string with three parts separated by dots:

```
header.payload.signature
```

- **Header** — algorithm used (HS256)
- **Payload** — data inside the token (username, expiry time)
- **Signature** — proves the token wasn't tampered with

```java
// JwtUtils.java — creating a token
Jwts.builder()
    .setSubject(username)          // who this token belongs to
    .setExpiration(...)            // when it expires (24 hours)
    .signWith(getSigningKey(), HS256) // sign with the secret key
    .compact();
```

Anyone can read the payload (it's just Base64 encoded), but they **cannot fake the signature** without knowing the secret key.

### 4. HttpOnly Cookie

After login, the JWT is stored in a cookie, not returned in the response body.

```java
Cookie cookie = new Cookie("jwt", token);
cookie.setHttpOnly(true);   // JavaScript cannot read this
cookie.setPath("/");        // sent on all requests
cookie.setDomain("localhost"); // shared across all localhost ports
```

`HttpOnly` means even if an attacker injects malicious JavaScript into your page (XSS attack), they still cannot steal the token.

### 5. Spring Security Config

`SecurityConfig.java` controls which endpoints require authentication:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/logout").permitAll()
    .anyRequest().authenticated()  // everything else needs a valid JWT
)
```

It also configures CORS — which frontend origins are allowed to call this API.

### 6. Flyway — Database Migrations

Instead of manually creating tables, Flyway runs SQL files automatically on startup.

```
src/main/resources/db/migration/
└── V1__create_users_table.sql   ← Creates the users table
```

The `V1__` prefix is the version number. Flyway tracks which migrations have run and only runs new ones. This is how teams keep database schemas in sync.

---

## API Endpoints

| Method | Path | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create a new account |
| POST | `/api/auth/login` | No | Log in, receive JWT cookie |
| POST | `/api/auth/logout` | No | Clear the JWT cookie |
| GET | `/api/auth/me` | Yes | Get the current logged-in user |

### Example: Register

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "student", "password": "password123"}'
```

### Example: Login

```bash
curl -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "student", "password": "password123"}'
```

---

## Configuration (`application.properties`)

```properties
# Database connection
spring.datasource.url=jdbc:postgresql://localhost:5434/auth_db

# JWT settings
jwt.secret=<base64-encoded-secret>   # must match PHP's JWT_SECRET
jwt.expiration=86400000              # 24 hours in milliseconds
jwt.cookie.domain=localhost          # share cookie across all localhost ports
```

> The `jwt.secret` and PHP's `JWT_SECRET` environment variable must be identical. This shared secret is how PHP can verify tokens that Spring Boot created.

---

## Environment Variables (set by Docker Compose)

| Variable | Purpose |
|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection string |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `JWT_SECRET` | Secret key for signing/verifying tokens |
