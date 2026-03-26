# Microservice Demo

A beginner-friendly project that demonstrates how multiple independent services work
together to form a complete application. Built for students learning microservice
architecture, authentication, and role-based access control.

---

## What is a Microservice?

A traditional app puts everything — login, products, orders, UI — into one codebase.
A **microservice** architecture splits those responsibilities into small, independent
services that each do one thing well and communicate over HTTP.

This project has four services plus a shared database:

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (React)                           │
│                     http://localhost:3000                        │
└───────┬─────────────────┬──────────────────┬────────────────────┘
        │                 │                  │
   Login/Register    Get Products       Place Orders
        │                 │                  │
        ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Spring Boot  │  │   PHP API    │  │   Django API     │
│   Auth       │  │   Products   │  │   Checkout       │
│  :8080       │  │   :8081      │  │   :8082          │
└──────┬───────┘  └──────┬───────┘  └────────┬─────────┘
       │                 │                   │
       └─────────────────┴───────────────────┘
                         │
              ┌──────────▼──────────┐
              │     PostgreSQL      │
              │  (Shared Database)  │
              │     :5434           │
              └─────────────────────┘
```

| Service | Technology | Port | Responsibility |
|---------|------------|------|----------------|
| `sb/` | Spring Boot (Java) | 8080 | User registration, login, JWT issuing |
| `php/` | PHP + Apache | 8081 | Product catalog — full CRUD |
| `django/` | Django (Python) | 8082 | Checkout — place orders, order history |
| `react/` | React + Vite | 3000 | Frontend UI for all services |
| `db` | PostgreSQL | 5434 | Shared database |

---

## User Roles

The system has two roles with different capabilities:

| Role | How to get it | What they can do |
|------|--------------|------------------|
| `ROLE_USER` | Register via the signup page | Browse products, place orders, view own order history |
| `ROLE_ADMIN` | Pre-seeded on startup (see below) | Manage products (create, edit, delete), view all orders |

The default admin credentials are configured in `sb/src/main/resources/application.properties`:
```
Username: admin
Password: Admin@1234
```

---

## How Authentication Works Across All Services

This is the core concept of the project. **Only Spring Boot handles login.** PHP and
Django never store sessions — they simply verify the token Spring Boot issued.

```
1. User logs in via React
        ↓
2. React sends credentials to Spring Boot  →  POST /api/auth/login
        ↓
3. Spring Boot verifies the password, creates a JWT containing the
   username and role, and stores it in an HttpOnly cookie named "jwt"
        ↓
4. The browser automatically sends that cookie on every subsequent
   request — to Spring Boot, PHP, and Django alike
        ↓
5. PHP or Django receives a request, reads the "jwt" cookie,
   verifies the signature using the shared JWT_SECRET,
   reads the role claim, and allows or denies the request
```

The shared `JWT_SECRET` is the trust bridge between all three backend services.
All three must have the exact same value — set via environment variables in
`docker-compose.yml`.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- That's it — no Java, PHP, Python, or Node.js needed on your machine

---

## Running the Project

From the project root (where `docker-compose.yml` is):

```bash
# First run — builds images and starts all services
docker compose up --build

# Run in the background
docker compose up --build -d

# View logs from all services
docker compose logs -f

# View logs from one service only
docker compose logs -f django

# Stop everything
docker compose down

# Full reset — stops and deletes the database volume
docker compose down -v
```

Once running, open **http://localhost:3000** in your browser.

---

## Service URLs

| URL | Service |
|-----|---------|
| http://localhost:3000 | React frontend |
| http://localhost:8080 | Spring Boot auth API |
| http://localhost:8081 | PHP products API |
| http://localhost:8082 | Django checkout API |
| localhost:5434 | PostgreSQL (connect with a DB client) |

---

## Quick API Test (without the UI)

```bash
# 1. Login and save the cookie
curl -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@1234"}'

# 2. Call the PHP products service with the saved cookie
curl -b cookies.txt http://localhost:8081/products

# 3. Call the Django orders service with the saved cookie
curl -b cookies.txt http://localhost:8082/orders
```

---

## Project Structure

```
/
├── docker-compose.yml     ← Defines and connects all services
├── react/                 ← Frontend (React + Vite + Tailwind)
│   └── README.md
├── sb/                    ← Auth microservice (Spring Boot)
│   └── README.md
├── php/                   ← Products microservice (PHP)
│   └── README.md
└── django/                ← Checkout microservice (Django)
    └── README.md
```

Each service folder has its own `README.md` with a deeper explanation of that service,
how to add new routes, and how role-based access is enforced.

---

## How the Database is Set Up

All three backend services share one PostgreSQL instance. Each service manages its
own tables:

| Table | Managed by | How |
|-------|-----------|-----|
| `users` | Spring Boot | Flyway migration (`V1__create_users_table.sql`) |
| `products` | PHP | `init.sql` seeded into Postgres on first run |
| `orders` | Django | Django migrations (`makemigrations` + `migrate`) |

The admin account is not in any SQL file — it is created automatically by Spring Boot
on startup if it does not already exist.

---

## Key Concepts to Study

- **JWT (JSON Web Token)** — a signed token that carries identity and role information
  without requiring the server to store session state
- **HttpOnly Cookie** — a cookie the browser sends automatically but JavaScript cannot
  read, protecting against XSS attacks
- **Role-Based Access Control (RBAC)** — restricting what users can do based on an
  assigned role embedded in their token
- **CORS** — browser security that controls which origins can call your API; must be
  configured on every backend service
- **Docker Compose** — orchestrates all containers, their startup order, networking,
  and environment variables from a single file
- **Shared Secret** — the `JWT_SECRET` value that allows PHP and Django to verify
  tokens issued by Spring Boot without calling Spring Boot directly
- **Database Migrations** — versioned, code-managed schema changes that keep all
  environments in sync (Flyway for Spring Boot, Django migrations for Django)
- **Singleton Pattern** — used in the PHP service to maintain one database connection
  per request rather than reconnecting on every query
- **Middleware** — request processing layer that validates the JWT before any route
  handler runs, keeping auth logic out of business logic

---

## Learning Path

If you are new to this project, explore it in this order:

1. Start `docker compose up --build` and open the app at http://localhost:3000
2. Register a user account and explore what a regular user can do
3. Log in as `admin` / `Admin@1234` and explore what an admin can do
4. Read `sb/README.md` to understand how login and JWT issuance work
5. Read `php/README.md` to understand how the products API validates tokens and enforces roles
6. Read `django/README.md` to understand how the checkout service works and how migrations differ from Flyway
7. Open `docker-compose.yml` and trace how all services are connected
8. Try adding a new route to one of the services following the patterns in its README
