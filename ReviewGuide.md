# Study & Review Guide
## Microservice Architecture — Concepts & Principles

---

## How to Use This Guide

Work through each section below. For every concept listed, try to:

1. **Define it** — write a one-sentence definition without looking it up
2. **Explain why it matters** — what problem does it solve?
3. **Connect it to the project** — where did you see this in action?

If you struggle with any of these three steps, that is your signal to go back and review.

---

## Section 1 — Microservice Architecture

Start here. Everything else in this project builds on these ideas.

- Understand what makes an application a "microservice" versus a monolith.
  Think about what each of the three backend services in this project does — and more
  importantly, what it *does not* do.

- Think about **independence**. What does it mean for a service to be independently
  deployable? What would break that independence?

- Consider the concept of **single responsibility**. Why is it a good idea for one service
  to handle authentication, another to handle products, and another to handle orders?
  What would happen if one service tried to do all three?

- Think about the **trade-offs**. Microservices bring benefits, but they also introduce
  complexity. What are some challenges that come with splitting an application into
  multiple services?

- Reflect on **decoupling**. How does keeping services separate allow teams to work
  independently? What kinds of coupling should be avoided?

---

## Section 2 — Containerization & Orchestration

This project runs entirely inside containers. Make sure you understand why.

- Understand what a **container** is and what problem it solves. Think about the phrase
  "works on my machine" — how does containerization address that?

- Know the difference between building an image and running a container.

- Understand what **orchestration** means in this context. When you run all four services
  together, something has to manage their startup order, networking, and environment
  variables. Know what tool does that here and how it works at a high level.

- Think about **startup dependencies**. Why does it matter that the database is fully
  ready before the backend services try to connect to it? What mechanism enforces this?

- Understand what a **health check** is and why it is more reliable than simply waiting
  a fixed number of seconds.

- Know what **environment variables** are used for in this setup and why they are
  preferable to hardcoding values like passwords and secrets directly in code.

---

## Section 3 — Authentication & JWT

Authentication is the foundation of this entire system. Understand it deeply.

- Know the difference between **authentication** and **authorization**. These are two
  distinct steps — make sure you can explain each one clearly.

- Understand the structure of a **JSON Web Token**. It has three parts. Know what each
  part contains and what purpose it serves. Pay special attention to what is and is not
  protected in each part.

- Understand what **encoding** means versus **encryption**. This distinction is critical
  for understanding what information in a JWT is visible and to whom.

- Know what a **claim** is inside a JWT. Think about which claims are standard and what
  kinds of custom claims can be added. Consider why embedding certain information
  directly in the token is useful.

- Understand the role of the **secret key** in JWT signing. What does it prove? What
  happens if two different services share the same secret key?

- Know what **token expiry** is and why it exists. What security problem does it solve?

- Understand the concept of a **stateless** authentication system. Why does the server
  not need to remember anything between requests when JWTs are used?

---

## Section 4 — Cookies & Browser Security

The way the token is stored and transmitted matters as much as the token itself.

- Understand what an **HttpOnly cookie** is. Focus on what it prevents and why that
  matters from a security perspective.

- Know what **XSS (Cross-Site Scripting)** is at a high level and why storing tokens
  in `localStorage` is considered riskier than using `HttpOnly` cookies.

- Understand how cookies behave with respect to **domains and ports**. Think about
  how a single login can grant access to multiple services running on different ports.

- Know what **CORS (Cross-Origin Resource Sharing)** is and why it exists. Understand
  the relationship between the server's CORS configuration and the browser's enforcement.

- Understand why `withCredentials: true` is required when making cross-origin requests
  that need to include cookies. Know what the server must also do for this to work.

- Think about the difference between a **development** CORS configuration and a
  **production** one. Why would a permissive setting be acceptable in development but
  dangerous in production?

---

## Section 5 — Password Security

Passwords are sensitive. Understand how they are handled safely.

- Know what **hashing** is and how it differs from encryption. Understand why passwords
  should be hashed rather than encrypted or stored in plain text.

- Understand what makes a good password hashing algorithm. Think about properties like
  **irreversibility** and **computational cost**.

- Know what a **salt** is in the context of password hashing. Understand why the same
  password can produce a different hash each time, and how verification still works.

- Think about what an attacker would need to do to crack a hashed password. How does
  the design of the hashing algorithm make this harder?

---

## Section 6 — Role-Based Access Control (RBAC)

This project has two types of users. Understand how their access is controlled.

- Know what **role-based access control** means. Understand the relationship between
  a user, a role, and a permission.

- Understand the difference between a **protected route** (requires any authenticated
  user) and a **role-restricted route** (requires a specific role). Think about where
  these checks happen — on the frontend, the backend, or both.

- Think about **why both layers matter**. Frontend route guards improve user experience,
  but they are not a security boundary. Where must the real enforcement happen?

- Understand what it means for role inheritance to be **explicit versus automatic**.
  Does having a higher-privilege role automatically grant lower-privilege permissions?
  Should it?

- Think about how roles are communicated between services in this project. Why is it
  useful to carry role information inside the token rather than looking it up on every
  request?

---

## Section 7 — Database Migrations

Schema changes need to be managed carefully. Understand how migrations solve this.

- Know what a **database migration** is and what problem it solves. Think about what
  would happen if every developer manually modified the database schema on their own.

- Understand the concept of **versioning** schema changes. Why is it important that
  migrations are applied in a consistent, ordered sequence?

- Know the difference between **generating** a migration and **applying** it. These are
  two separate steps in some frameworks.

- Understand what a **rollback** is and when it would be used.

- Think about the difference between letting a framework **auto-generate** schema from
  code (like Hibernate) versus writing **explicit migration files** (like Flyway or
  Django migrations). What are the trade-offs of each approach?

---

## Section 8 — API Design & Middleware

Understand how requests flow through a backend service.

- Know what **middleware** is in the context of a web framework. Understand its position
  in the request lifecycle — it runs before the route handler reaches business logic.

- Think about why authentication checks belong in middleware rather than inside each
  individual route handler. What principle does this support?

- Understand what an **HTTP status code** communicates. Know the difference between
  `401 Unauthorized` and `403 Forbidden` — these are not interchangeable.

- Know what **idempotency** means for HTTP methods. Which methods are expected to be
  idempotent and which are not?

- Understand what a **RESTful route** looks like. Think about how resources are named
  and how HTTP verbs map to CRUD operations.

---

## Section 9 — Frontend Architecture & State

The frontend connects everything together. Understand how it manages auth state.

- Understand what a **React context** is and why it is used to share authentication
  state across the entire application without passing props through every component.

- Know what a **route guard** is and how it works. Understand the difference between
  guarding against unauthenticated users and guarding against users with insufficient roles.

- Think about the **separation of concerns** in the frontend. Why should a page
  component not be responsible for checking authentication itself?

- Understand what happens to the user's session when they close and reopen the browser.
  How does the application know whether the user is still logged in?

---

## Quick Self-Check

Before the assessment, make sure you can answer these broad questions without notes:

- What is the flow of a login request from the browser all the way to the database and back?
- How does a backend service know who is making a request and what they are allowed to do?
- Why can't a user simply edit their JWT to give themselves admin access?
- What is the difference between a service being "authenticated" and "authorized"?
- Why do we use containers, and what would be harder without them?
- What would happen if the JWT secret was different across services?
- Why is it important that the database is ready before the application starts?
- What makes a microservice architecture different from building one big application?

If you can answer all of these clearly and confidently, you are well prepared.

---

## Glossary of Key Terms

These are the terms and commands you will encounter throughout this project.
Read each definition, then find where it appears in the codebase.

---

### Architecture & Design

| Term | Brief Description |
|------|------------------|
| **Microservice** | An independently deployable service with a single, focused responsibility. Each service in this project (auth, products, checkout) is a microservice. |
| **Monolith** | The opposite of microservices — one application that handles everything. Understanding this contrast helps explain why microservices exist. |
| **Single Responsibility Principle** | A design rule stating that a class or service should have only one reason to change. It is the core justification for splitting this app into three backends. |
| **Decoupling** | Reducing direct dependencies between components so each can change independently without breaking others. |
| **Separation of Concerns** | Organizing code so that each part handles one distinct aspect — e.g., auth logic stays in Spring Boot, not in PHP or Django. |
| **Singleton Pattern** | A design pattern that ensures only one instance of a class is created and reused. Used in the PHP service to maintain a single database connection per request. |
| **Middleware** | A layer that sits between an incoming HTTP request and the route handler. Used in all three backends to validate the JWT before business logic runs. |
| **Route Guard** | A frontend component that checks authentication or role before rendering a page. Redirects unauthorized users away. |
| **CRUD** | Create, Read, Update, Delete — the four basic operations on a resource. The products API implements all four. |
| **REST** | Representational State Transfer — an architectural style for APIs that uses HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) and resource-based URLs. |

---

### Authentication & Security

| Term | Brief Description |
|------|------------------|
| **Authentication** | The process of verifying *who* a user is. Handled exclusively by Spring Boot in this project. |
| **Authorization** | The process of determining *what* an authenticated user is allowed to do. Enforced by all three backend services using the role in the JWT. |
| **JWT (JSON Web Token)** | A compact, self-contained token with three Base64URL-encoded parts: Header, Payload, and Signature. Carries identity and role without server-side session storage. |
| **Header (JWT)** | The first part of a JWT. Declares the token type and the signing algorithm (e.g., HS256). |
| **Payload (JWT)** | The second part of a JWT. Contains claims — data like the username (`sub`), role, issued-at time, and expiry. Readable by anyone; not encrypted. |
| **Signature (JWT)** | The third part of a JWT. A cryptographic hash of the header and payload using the secret key. Proves the token has not been tampered with. |
| **Claim** | A named piece of data inside a JWT payload. Standard claims include `sub` (subject/username) and `exp` (expiry). Custom claims like `roles` can be added. |
| **`sub` claim** | The standard JWT claim for the subject — in this project, the username of the logged-in user. |
| **Secret Key** | A shared value used to sign and verify JWTs. All three backend services must use the same key. If it differs, token verification fails. |
| **HMAC-SHA256 (HS256)** | The signing algorithm used in this project. Produces a signature using a shared secret key. Any service with the key can verify the token. |
| **Token Expiry** | A JWT claim (`exp`) that makes the token invalid after a set time. Limits the damage if a token is stolen. |
| **Stateless Authentication** | An auth model where the server stores no session data. All necessary information is in the token itself. |
| **HttpOnly Cookie** | A browser cookie that cannot be read by JavaScript. Used to store the JWT so it is protected from XSS attacks. |
| **XSS (Cross-Site Scripting)** | An attack where malicious JavaScript is injected into a page to steal data. `HttpOnly` cookies prevent token theft via XSS. |
| **BCrypt** | A password hashing algorithm designed to be slow and computationally expensive, making brute-force attacks impractical. |
| **Hashing** | A one-way transformation of data into a fixed-length output. Unlike encryption, it cannot be reversed. Used for storing passwords. |
| **Salt** | A random value added to a password before hashing. Ensures the same password produces a different hash each time, defeating precomputed attack tables. |
| **RBAC (Role-Based Access Control)** | An access control model where permissions are assigned to roles, and users are assigned roles. This project uses `ROLE_USER` and `ROLE_ADMIN`. |
| **CORS (Cross-Origin Resource Sharing)** | A browser security mechanism that restricts which origins can make requests to a server on a different domain or port. Must be configured on every backend. |
| **`withCredentials`** | An Axios (and browser fetch) option that must be set to `true` for cookies to be sent with cross-origin requests. |
| **Base64URL Encoding** | The encoding used for JWT parts. It makes binary data URL-safe but does **not** encrypt it — the content is readable by anyone. |

---

### Database & Migrations

| Term | Brief Description |
|------|------------------|
| **Migration** | A versioned, code-managed change to a database schema. Ensures every environment applies the same changes in the same order. |
| **Flyway** | A Java-based migration tool used by Spring Boot. Runs versioned SQL files from `db/migration/` automatically on startup. |
| **`V1__description.sql`** | The naming convention Flyway requires. The `V1__` prefix is the version number; Flyway tracks which versions have already run. |
| **Django Migrations** | Django's built-in migration system. Generates Python migration files from model definitions and applies them to the database. |
| **`makemigrations`** | A Django management command that inspects `models.py` and generates a new migration file describing the schema change. |
| **`migrate`** | A Django management command that applies all pending migration files to the database. |
| **Rollback** | Reverting a migration to undo a schema change. Useful when a deployment introduces a problem. |
| **Seed Data** | Initial data inserted into the database when it is first created. In this project, `init.sql` seeds the `products` table. |
| **`init.sql`** | A SQL file mounted into the Postgres container that runs once on first startup to create and populate the `products` table. |
| **PDO (PHP Data Objects)** | A PHP database abstraction layer used in the PHP service to run parameterized queries against PostgreSQL. |
| **`RETURNING`** | A PostgreSQL-specific SQL clause that returns the inserted or updated row immediately, avoiding a second `SELECT` query. |

---

### Containerization & Orchestration

| Term | Brief Description |
|------|------------------|
| **Container** | A lightweight, isolated runtime environment that packages an application with all its dependencies. Runs the same way on any machine. |
| **Docker Image** | A read-only blueprint for a container. Built from a `Dockerfile`. |
| **Dockerfile** | A text file with instructions for building a Docker image (base image, dependencies, startup command). |
| **Docker Compose** | A tool that defines and runs multi-container applications from a single `docker-compose.yml` file. |
| **`docker compose up --build`** | Builds all images and starts all containers defined in `docker-compose.yml`. |
| **`docker compose down`** | Stops and removes all running containers for the project. |
| **`docker compose down -v`** | Stops containers and also deletes named volumes (including the database data). Use for a full reset. |
| **`docker compose logs -f`** | Streams live log output from all running containers. Add a service name to filter (e.g., `logs -f django`). |
| **`depends_on`** | A Docker Compose directive that controls startup order — a service will not start until its dependency is running. |
| **`condition: service_healthy`** | A stricter form of `depends_on` that waits until the dependency's health check passes, not just until the container starts. |
| **Health Check** | A command Docker runs periodically inside a container to verify it is ready to accept traffic (e.g., `pg_isready` for Postgres). |
| **Volume** | A persistent storage mechanism in Docker. Named volumes survive container restarts; bind mounts link a host folder into the container for live code reloading. |
| **Environment Variable** | A runtime configuration value passed into a container. Used for secrets, database URLs, and API keys — keeps sensitive values out of source code. |
| **`CHOKIDAR_USEPOLLING`** | An environment variable that enables file-watching inside Docker on systems where native filesystem events don't work (e.g., macOS with bind mounts). |

---

### Spring Boot Specific

| Term | Brief Description |
|------|------------------|
| **`pom.xml`** | Maven's project descriptor file — the Java equivalent of `package.json`. Lists dependencies, plugins, and build configuration. |
| **`./mvnw spring-boot:run`** | The Maven wrapper command that compiles and starts the Spring Boot application. |
| **`@RestController`** | A Spring annotation that marks a class as an HTTP controller whose methods return JSON responses directly. |
| **`@PostMapping` / `@GetMapping`** | Spring annotations that map a method to a specific HTTP verb and path. |
| **`@Value`** | A Spring annotation that injects a value from `application.properties` or an environment variable into a field. |
| **`@EventListener(ApplicationReadyEvent.class)`** | A Spring annotation that runs a method after the application has fully started. Used here to seed the admin account. |
| **`application.properties`** | Spring Boot's external configuration file. Stores database URLs, JWT settings, admin credentials, and other environment-specific values. |
| **`SecurityConfig`** | The Spring Security configuration class that declares which routes are public and which require authentication. |
| **`JwtAuthenticationFilter`** | A Spring Security filter that reads the JWT cookie on every incoming request and sets the authenticated user in the security context. |
| **`PasswordEncoder` / BCrypt** | Spring Security's interface for hashing passwords. The implementation used here is BCrypt. |
| **`AuthenticationManager`** | A Spring Security component that verifies a username and password against the database during login. |

---

### Django Specific

| Term | Brief Description |
|------|------------------|
| **`manage.py`** | Django's command-line utility. Entry point for running the server, creating migrations, and other management tasks. |
| **`settings.py`** | Django's central configuration file. Defines installed apps, database connection, middleware, and CORS settings. |
| **`models.py`** | Defines the database schema as Python classes. Django reads this file to generate migrations. |
| **`serializers.py`** | Converts complex data types (like model instances) to and from JSON. Also validates incoming request data. |
| **`views.py`** | Contains the request handler classes. Each class maps to a URL and handles one or more HTTP methods. |
| **`urls.py`** | Maps URL paths to view classes. The Django equivalent of a routes file. |
| **`APIView`** | A Django REST Framework base class for writing class-based API views with explicit `get()`, `post()`, etc. methods. |
| **`JSONField`** | A Django model field that stores structured JSON data directly in a database column. Used to store order items. |
| **`@require_auth()`** | A custom decorator in this project that validates the JWT cookie and optionally checks roles before the view method runs. |
| **`request.jwt_payload`** | A custom attribute attached to the request by the `@require_auth` decorator, containing the decoded JWT claims. |
| **`CORS_ALLOW_ALL_ORIGINS`** | A `django-cors-headers` setting. When `True`, allows requests from any origin — acceptable for development, not for production. |

---

### PHP Specific

| Term | Brief Description |
|------|------------------|
| **`composer.json`** | PHP's dependency manifest file — the PHP equivalent of `package.json`. Lists libraries like the JWT library. |
| **`vendor/autoload.php`** | The Composer-generated autoloader. Including this file makes all installed packages available without manual `require` statements. |
| **`declare(strict_types=1)`** | A PHP directive that enables strict type checking in a file, catching type mismatches at runtime. |
| **`PDO`** | PHP Data Objects — a database abstraction class that supports parameterized queries to prevent SQL injection. |
| **`JwtMiddleware::authenticate()`** | The static method in this project that validates the JWT cookie and optionally checks roles. Called at the top of each protected route closure. |
| **`Database::connection()`** | The static method that returns the shared PDO instance, creating it on first call (Singleton pattern). |
| **`Router`** | The custom routing class in this project. Matches incoming request paths (including `{param}` segments) to handler closures. |
| **`{id}` path parameter** | A placeholder in a route pattern (e.g., `/products/{id}`) that the Router extracts using regex and passes to the handler as `$params['id']`. |
| **`FETCH_ASSOC`** | A PDO fetch mode that returns database rows as associative arrays (column name as key) rather than indexed arrays. |

---

### React & Frontend Specific

| Term | Brief Description |
|------|------------------|
| **`useAuth` hook** | A custom React hook that exposes `user`, `isAdmin`, `login`, `register`, `logout`, and `isLoading` to any component in the app. |
| **`AuthProvider`** | A React context provider that wraps the entire app and holds the authentication state. Runs the session check once on load. |
| **`ProtectedRoute`** | A route wrapper that redirects unauthenticated users to `/login`. Any logged-in user can pass through. |
| **`AdminRoute`** | A route wrapper that redirects unauthenticated users to `/login` and authenticated non-admins to `/dashboard`. |
| **`GuestRoute`** | A route wrapper that redirects already-authenticated users away from `/login` and `/register` to `/dashboard`. |
| **`axios` instance** | A pre-configured HTTP client created with `axios.create()`. Sets the base URL, `withCredentials: true`, and default headers once, so every API call inherits them. |
| **`useEffect`** | A React hook that runs side effects (like API calls) after a component renders. |
| **`useState`** | A React hook that declares a reactive state variable and its setter function. |
| **`useMemo`** | A React hook that memoizes a computed value, recalculating it only when its dependencies change. Used in the Orders page for stats and filtering. |
| **`React Context`** | A built-in React mechanism for sharing state across the component tree without passing props manually at every level. |
| **`react-router-dom`** | The library that handles client-side navigation in React. Provides `<Routes>`, `<Route>`, `<Link>`, `useNavigate`, and `useLocation`. |
| **`Navigate`** | A React Router component that performs a programmatic redirect when rendered. Used inside route guards. |
| **Vite** | The build tool and development server used by the React service. Faster than webpack for development due to native ES module support. |
| **Tailwind CSS** | A utility-first CSS framework used for all styling in this project. Classes like `bg-slate-900` and `rounded-xl` are applied directly in JSX. |

---

*Good luck — focus on understanding the "why" behind each concept, not just the "what."*
