# TechShop — Microservices Demo

A minimal teaching project demonstrating microservices with:

| Service | Technology | Port | Database |
|---|---|---|---|
| `php-service` | PHP 8 built-in server | 8000 | `php_db` |
| `java-service` | Spring Boot 3 | 8081 | `java_db` |
| `frontend` | React (nginx) | 3000 | — |
| `postgres` | PostgreSQL 16 | 5433 | both DBs |

---

## Quick Start (just want to run it)

```bash
# First time, or after schema changes:
docker compose down -v
docker compose up --build

# Subsequent runs (no schema change):
docker compose up --build
```

Open **http://localhost:3000**

---

## Beginner Guide — How We Dockerised Each Service

> **What is Docker?**
> Docker packages an application and everything it needs (language runtime, dependencies, config)
> into a portable unit called a **container**. It runs the same way on every machine.
>
> **What is Docker Compose?**
> Docker Compose lets you define and start *multiple* containers together with one command,
> wiring their networks and environment variables automatically.

---

### Concept: The Dockerfile

A `Dockerfile` is a recipe. Each line is an instruction that builds up a container image layer by layer.

```
FROM   — which base image to start from (e.g. pre-installed PHP, Java, Node)
RUN    — run a shell command during the build (install packages, compile code)
COPY   — copy files from your machine into the image
WORKDIR — set the current directory inside the image
EXPOSE — document which port the app listens on (informational)
CMD    — the command that runs when the container starts
```

---

### Step 1 — PHP Service Dockerfile

**File:** `php-service/Dockerfile`

```dockerfile
FROM php:8.2-cli
```
> We start from an official PHP image that already has PHP installed.
> `cli` means the command-line flavour — small and enough for a dev server.

```dockerfile
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*
```
> PHP does not talk to PostgreSQL out of the box.
> We `apt-get install` the system library (`libpq-dev`) and then compile the PDO
> PostgreSQL driver into PHP. The `rm -rf` cleans up the package lists to keep
> the image small.

```dockerfile
WORKDIR /app
COPY index.php .
```
> Set the working directory to `/app` and copy our single PHP file into it.
> (`COPY src dest` — the dot means "current working directory", which is `/app`)

```dockerfile
EXPOSE 8000
CMD ["php", "-S", "0.0.0.0:8000", "index.php"]
```
> Start PHP's built-in web server on port 8000, listening on all network interfaces
> (`0.0.0.0` means "accept connections from anywhere", not just localhost).
>
> **Why 0.0.0.0?** Inside a container, `localhost` only refers to the container itself.
> To make the port reachable from outside the container you must bind to `0.0.0.0`.

**Complete file:**
```dockerfile
FROM php:8.2-cli

RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY index.php .

EXPOSE 8000
CMD ["php", "-S", "0.0.0.0:8000", "index.php"]
```

---

### Step 2 — Java Service Dockerfile (Multi-Stage Build)

**File:** `java-service/Dockerfile`

Java needs to be *compiled* before it can run. We use a **multi-stage build** to:
1. Compile the code using a full Maven + JDK image (large, used only at build time)
2. Copy the compiled JAR into a slim JRE image (small, this is what ships)

```dockerfile
# ── Stage 1: Build ──────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
```
> `AS build` gives this stage a name so we can reference it later.
> This image has Maven *and* the full JDK — everything needed to compile.

```dockerfile
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
```
> Copy `pom.xml` first and download all Maven dependencies.
> We do this as a separate step so Docker can **cache** it — if only the source
> code changes (not `pom.xml`), Docker reuses this cached layer and does not
> re-download the internet.

```dockerfile
COPY src ./src
RUN mvn package -DskipTests -q
```
> Now copy the source code and compile it.
> `-DskipTests` skips unit tests (fine for a demo build).
> This produces `target/orders-service-0.0.1.jar`.

```dockerfile
# ── Stage 2: Run ────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
```
> Fresh, small base image with just the Java Runtime Environment (no compiler, no Maven).
> The final image is much smaller because it carries only what is needed to *run*.

```dockerfile
WORKDIR /app
COPY --from=build /app/target/orders-service-0.0.1.jar app.jar
```
> `--from=build` reaches back into Stage 1 and copies the compiled JAR.
> Stage 1 is then thrown away — nothing else from it ends up in the final image.

```dockerfile
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```
> `ENTRYPOINT` is like `CMD` but harder to override accidentally.
> It is the standard way to run a JAR.

**Complete file:**
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn package -DskipTests -q

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /app/target/orders-service-0.0.1.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

### Step 3 — React Frontend Dockerfile (Multi-Stage Build)

**File:** `frontend/Dockerfile`

React also needs a build step (`npm run build`) that compiles JSX into plain HTML/JS.
The result is a folder of static files served by nginx.

```dockerfile
# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS build
```
> Alpine is a tiny Linux variant. `node:20-alpine` is much smaller than `node:20`.

```dockerfile
WORKDIR /app
COPY package.json .
RUN npm install
```
> Same caching trick as Maven: copy `package.json` first, install dependencies,
> then copy source code. This way Docker only re-runs `npm install` when
> `package.json` actually changes.

```dockerfile
COPY public ./public
COPY src    ./src
```
> Now copy the actual source files.

```dockerfile
ARG REACT_APP_PHP_URL=http://localhost:8000
ARG REACT_APP_JAVA_URL=http://localhost:8081
ENV REACT_APP_PHP_URL=$REACT_APP_PHP_URL
ENV REACT_APP_JAVA_URL=$REACT_APP_JAVA_URL
```
> **Important for microservices:** React runs in the *user's browser*, not in Docker.
> So the service URLs in the bundle must be reachable from the browser (`localhost`),
> not from inside Docker's internal network.
>
> `ARG` receives values passed from `docker-compose.yml` at build time.
> `ENV` bakes them into the React build so `process.env.REACT_APP_*` works.

```dockerfile
RUN npm run build
```
> Compiles everything into `build/` — plain HTML, CSS, and JS files.

```dockerfile
# ── Stage 2: Serve ──────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
```
> nginx is a lightweight web server. We drop the static files into its document root
> and provide a minimal config file. No Node.js, no React toolchain in the final image.

**nginx.conf:**
```nginx
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    # Return index.html for any unknown path (React single-page app)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Complete Dockerfile:**
```dockerfile
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json .
RUN npm install
COPY public ./public
COPY src    ./src

ARG REACT_APP_PHP_URL=http://localhost:8000
ARG REACT_APP_JAVA_URL=http://localhost:8081
ENV REACT_APP_PHP_URL=$REACT_APP_PHP_URL
ENV REACT_APP_JAVA_URL=$REACT_APP_JAVA_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
```

---

### Step 4 — docker-compose.yml (Wiring Everything Together)

`docker-compose.yml` describes all the services and how they connect.

#### 4.1 The top-level structure

```yaml
services:       # ← list of all containers
  ...
volumes:        # ← named volumes (persistent storage)
  pg_data:
```

#### 4.2 PostgreSQL

```yaml
postgres:
  image: postgres:16-alpine
```
> We do not need a Dockerfile here — we use an official image directly.

```yaml
  environment:
    POSTGRES_USER:     postgres
    POSTGRES_PASSWORD: password
    POSTGRES_DB:       postgres
```
> The `POSTGRES_*` variables are read by the official image's startup script to
> initialise the server. `POSTGRES_DB` is the default database; our services use
> `php_db` and `java_db` which are created by the init script below.

```yaml
  volumes:
    - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    - pg_data:/var/lib/postgresql/data
```
> Any `.sql` file placed in `/docker-entrypoint-initdb.d/` is run automatically
> the **first time** the container starts (when the data directory is empty).
> Our `init.sql` creates `php_db`, `java_db`, and their tables.
>
> `pg_data` is a named volume that survives container restarts. Without it,
> the database would be wiped every time you restart the container.

```yaml
  ports:
    - "5433:5432"
```
> Format: `"host_port:container_port"`.
> PostgreSQL listens on 5432 inside the container.
> We map it to 5433 on your machine (in case 5432 is already taken).

#### 4.3 PHP Service

```yaml
php-service:
  build: ./php-service
```
> `build` tells Compose to build an image from the `Dockerfile` in that folder.
> (Compare with `image:` which uses a pre-built image.)

```yaml
  environment:
    DB_HOST: postgres
    DB_PORT: 5432
    DB_NAME: php_db
    DB_USER: postgres
    DB_PASS: password
```
> These become environment variables inside the container, read by `index.php`.
> Notice `DB_HOST: postgres` — inside Docker Compose, services find each other
> by their **service name**, not by IP address. Docker handles the DNS.

```yaml
  volumes:
    - ./php-service:/app   # live-mount for development
```
> This bind-mount overlays your local `php-service/` folder over `/app` in the
> container at runtime. Because PHP reads files on each request, any change
> you make to `index.php` is live immediately — **no rebuild needed**.

```yaml
  depends_on:
    - postgres
```
> Tells Compose to start `postgres` before `php-service`.
> Note: this only waits for the container to *start*, not for PostgreSQL to be
> fully ready. For a demo this is fine; in production you would add a health check.

#### 4.4 Java Service

```yaml
java-service:
  build: ./java-service
  environment:
    DB_HOST: postgres
    ...
    PRODUCT_SERVICE_URL: http://php-service:8000   # inter-service call
  depends_on:
    - postgres
    - php-service
```
> `PRODUCT_SERVICE_URL` is the key addition. The Java service calls the PHP service
> over HTTP to validate products before creating an order. Inside Docker Compose
> the hostname is simply the service name: `php-service`.

#### 4.5 React Frontend

```yaml
frontend:
  build:
    context: ./frontend
    args:
      REACT_APP_PHP_URL:  http://localhost:8000
      REACT_APP_JAVA_URL: http://localhost:8081
```
> `args` passes values to the `ARG` instructions in the Dockerfile.
> They must use `localhost` because the React app runs in your **browser**,
> not inside Docker's internal network.

#### Complete docker-compose.yml

```yaml
services:

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER:     postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB:       postgres
    volumes:
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  php-service:
    build: ./php-service
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: php_db
      DB_USER: postgres
      DB_PASS: password
    volumes:
      - ./php-service:/app
    ports:
      - "8000:8000"
    depends_on:
      - postgres

  java-service:
    build: ./java-service
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: java_db
      DB_USER: postgres
      DB_PASS: password
      PRODUCT_SERVICE_URL: http://php-service:8000
    ports:
      - "8081:8081"
    depends_on:
      - postgres
      - php-service

  frontend:
    build:
      context: ./frontend
      args:
        REACT_APP_PHP_URL:  http://localhost:8000
        REACT_APP_JAVA_URL: http://localhost:8081
    ports:
      - "3000:3000"
    depends_on:
      - php-service
      - java-service

volumes:
  pg_data:
```

---

## Project File Structure

```
demo-microservices/
├── docker-compose.yml
│
├── postgres/
│   └── init.sql                    ← creates php_db + java_db with tables & seed data
│
├── php-service/
│   ├── Dockerfile
│   └── index.php                   ← GET /products, GET /products/{id}, POST /products
│
├── java-service/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/demo/orders/
│       │   ├── OrdersApplication.java
│       │   ├── client/
│       │   │   ├── ProductClient.java   ← calls PHP service via REST
│       │   │   └── ProductDto.java
│       │   ├── controller/
│       │   │   └── OrderController.java ← GET /orders, POST /orders
│       │   ├── model/
│       │   │   └── Order.java
│       │   └── repository/
│       │       └── OrderRepository.java
│       └── resources/
│           └── application.properties
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── public/index.html
    └── src/
        ├── index.js
        └── App.jsx                  ← catalog, cart, checkout, orders history
```

---

## Service URLs

| URL | What it hits |
|---|---|
| http://localhost:3000 | React frontend |
| http://localhost:8000/products | PHP — list products |
| http://localhost:8000/products/1 | PHP — single product |
| http://localhost:8081/orders | Java — list orders |
| localhost:5433 | PostgreSQL (psql / DBeaver) |

---

## How the Services Talk to Each Other

```
Your Browser (React :3000)
  │
  ├── GET/POST http://localhost:8000/products ──► php-service ──► php_db
  │
  └── GET/POST http://localhost:8081/orders  ──► java-service ──► java_db
                                                      │
                                           (validates product by calling)
                                                      │
                                      GET http://php-service:8000/products/{id}
```

**Why two different hostnames?**

| Caller | Hostname used | Why |
|---|---|---|
| React (browser) | `localhost:8000` | React runs on your machine, not inside Docker |
| Java service (container) | `php-service:8000` | Inside Docker, services use each other's names |

---

## Database Design

```
PostgreSQL server (one container, port 5433)
│
├── php_db
│   └── products (id, name, price)
│
└── java_db
    └── orders (id, product_id, product_name, quantity, price)
```

`product_id` in `orders` is **not** a foreign key. Foreign keys do not work across
separate databases. Instead, the Java service calls the PHP service by HTTP to validate
the product before creating an order — this is the microservices way.

The `product_name` and `price` stored in `orders` are **snapshots** taken at order time.
This means the order record stays accurate even if a product is renamed or repriced later.

---

## Useful Docker Commands

```bash
# Start all services (build images first)
docker compose up --build

# Start in background (detached)
docker compose up --build -d

# View logs
docker compose logs -f
docker compose logs -f php-service

# Rebuild only one service
docker compose up --build php-service

# Stop all services
docker compose down

# Stop and WIPE the database volume (needed after init.sql changes)
docker compose down -v

# Open a shell inside a running container
docker compose exec php-service bash
docker compose exec postgres psql -U postgres -d php_db

# List running containers
docker compose ps
```

---

## How This Demonstrates Microservices

| Principle | Where you see it |
|---|---|
| **Independent deployment** | Each service has its own Dockerfile and container |
| **Technology freedom** | PHP and Java coexist — any language can be added |
| **Database isolation** | Each service owns one database; no shared tables |
| **REST communication** | Services call each other over HTTP, not shared memory |
| **Data snapshots** | Orders store name/price at order time for stability |
| **Environment config** | All secrets/URLs are env vars — nothing hardcoded |

---

## Where an API Gateway Would Fit

Currently the browser calls both backends at different ports.
An API Gateway would sit in front, giving the browser a single entry point:

```
Browser  →  http://localhost/api/products  ─► API Gateway ─► php-service:8000
Browser  →  http://localhost/api/orders    ─► API Gateway ─► java-service:8081
```

To add one: introduce an nginx or Kong container in `docker-compose.yml` on port `80`,
configure routing rules, and change the two `REACT_APP_*_URL` build-args to point at
`http://localhost` instead of individual ports. No service code needs to change.
