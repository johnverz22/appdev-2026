# Microservices Demo App

A minimal teaching demo showing how multiple independent services work together.

```
Browser (React)
  ├── GET/POST http://localhost:8080/products  →  PHP Service  →  php_db
  └── GET/POST http://localhost:8081/orders    →  Java Service →  java_db
                                                        ↓
                                                  PostgreSQL (port 5432)
```

---

## Project Structure

```
demo-microservices/
├── docker-compose.yml
├── postgres/
│   └── init.sql              ← creates php_db and java_db with tables
├── php-service/
│   ├── Dockerfile
│   └── index.php             ← GET /products, POST /products
├── java-service/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/demo/orders/
│       ├── OrdersApplication.java
│       ├── controller/OrderController.java
│       ├── model/Order.java
│       └── repository/OrderRepository.java
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── public/index.html
    └── src/
        ├── index.js
        └── App.jsx           ← Products section + Orders section
```

---

## How to Run

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Start everything

```bash
cd demo-microservices
docker compose up --build
```

> ⏳ The first run takes a few minutes — Maven downloads dependencies for the Java service.

### Open the app

| Service | URL |
|---|---|
| React Frontend | http://localhost:3000 |
| PHP Service | http://localhost:8080/products |
| Java Service | http://localhost:8081/orders |
| PostgreSQL | localhost:5432 |

### Stop everything

```bash
docker compose down
```

To also delete the database volume:

```bash
docker compose down -v
```

---

## Port Map

| Container | Host Port | Purpose |
|---|---|---|
| frontend | 3000 | React UI served by nginx |
| php-service | 8080 | Products REST API |
| java-service | 8081 | Orders REST API |
| postgres | 5432 | Both databases |

---

## API Reference

### PHP Service — Products (`http://localhost:8080`)

| Method | Path | Body | Description |
|---|---|---|---|
| GET | /products | — | List all products |
| POST | /products | `{"name":"...", "price":9.99}` | Create a product |

### Java Service — Orders (`http://localhost:8081`)

| Method | Path | Body | Description |
|---|---|---|---|
| GET | /orders | — | List all orders |
| POST | /orders | `{"productName":"...", "quantity":2}` | Create an order |

---

## What This Demonstrates (Microservices Basics)

| Concept | How it shows here |
|---|---|
| **Independent services** | PHP and Java run in separate containers with separate codebases |
| **Separate data stores** | Each service owns its own database (`php_db` / `java_db`). Neither can read the other's tables |
| **REST communication** | Frontend calls each service over HTTP; services do not call each other |
| **Technology freedom** | PHP and Java exist side-by-side — any language can be added the same way |
| **Container packaging** | Each service has its own Dockerfile; `docker-compose.yml` wires them together |
| **Environment config** | DB credentials passed via environment variables — no secrets in code |

---

## Where an API Gateway Would Fit

Right now the React frontend calls both services directly at different ports.

In a production system you would add an **API Gateway** in front:

```
Browser
  └── http://localhost/api/products  ─→  [API Gateway]  ─→  php-service:8080
  └── http://localhost/api/orders    ─→  [API Gateway]  ─→  java-service:8081
```

The gateway becomes the **single entry point**. It handles:
- routing `/api/products` → PHP service
- routing `/api/orders`   → Java service
- (optionally) auth, rate limiting, SSL termination

To add one to this project, place an **nginx** or **Kong** container in `docker-compose.yml` on port `80` and update the two `REACT_APP_*_URL` build-args to point at the gateway instead of individual service ports.
