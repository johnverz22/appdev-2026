# PHP Products Microservice

This is the products service in the microservice demo project.
It is built with plain PHP + Composer and serves the product catalog with full CRUD.

---

## How it fits in the project

| Service | Tech | Port | Responsibility |
|---------|------|------|----------------|
| `sb` | Spring Boot | 8080 | Auth — login, register, issues JWT |
| `php` | PHP | 8081 | Products — catalog listing + CRUD |
| `django` | Django | 8082 | Checkout — place orders, order history |
| `react` | React + Vite | 3000 | Frontend for all services |

Authentication is shared. Spring Boot issues a JWT stored in an **HttpOnly cookie**.
This service validates that same cookie using the shared `JWT_SECRET`.
The JWT contains a `roles` claim so role-based access works without a DB lookup.

---

## Roles

| Role | Can access |
|------|-----------|
| `ROLE_USER` | `GET /products`, `GET /products/{id}` |
| `ROLE_ADMIN` | All of the above + `POST`, `PUT`, `DELETE /products` |

---

## Project structure

```
php/
├── src/
│   ├── Controllers/
│   │   └── ProductController.php   # Business logic — no auth, no DB setup here
│   ├── Core/
│   │   ├── Database.php            # Singleton PDO connection (one place for DB config)
│   │   └── Router.php              # HTTP router with {param} support
│   ├── Middleware/
│   │   └── JwtMiddleware.php       # JWT validation + role-based access
│   └── routes.php                  # All routes — auth and roles declared per route
├── index.php                       # Entry point — CORS headers + autoloader
├── init.sql                        # DB seed (products table + sample data)
├── composer.json
└── Dockerfile
```

---

## Available endpoints

| Method | URL | Role | Description |
|--------|-----|------|-------------|
| GET | `/health` | none | Health check |
| GET | `/products` | any auth | List all products |
| GET | `/products/{id}` | any auth | Get a single product |
| POST | `/products` | `ROLE_ADMIN` | Create a product |
| PUT | `/products/{id}` | `ROLE_ADMIN` | Update a product |
| DELETE | `/products/{id}` | `ROLE_ADMIN` | Delete a product |

### POST / PUT request body

```json
{
  "name": "Wireless Headphones",
  "price": "89.99",
  "category": "Electronics",
  "stock": 42,
  "image_url": "https://..."   // optional
}
```

---

## How the database connection works

All DB access goes through `Database::connection()` in `src/Core/Database.php`.
It is a singleton — the connection is created once and reused for the request lifetime.

```php
use App\Core\Database;

$pdo  = Database::connection();
$stmt = $pdo->query('SELECT * FROM products');
$rows = $stmt->fetchAll();
```

Never create `new PDO(...)` directly in a controller.
All DB config lives in `Database.php` and is read from environment variables.

---

## How authentication works

Authentication is declared in `src/routes.php`, not inside controllers.
Call `JwtMiddleware::authenticate()` at the top of the route closure:

```php
$router->get('/products', function (array $params) {
    JwtMiddleware::authenticate();          // any logged-in user
    (new ProductController())->index();
});
```

The method returns the decoded JWT payload if you need to read claims:

```php
$payload  = JwtMiddleware::authenticate();
$username = $payload->sub;
$roles    = $payload->roles ?? [];
```

Returns `401` if the cookie is missing or the token is invalid.

---

## How to add role-based protection

Pass an array of allowed roles to `authenticate()`:

```php
// Admin only
$router->post('/products', function (array $params) {
    JwtMiddleware::authenticate(['ROLE_ADMIN']);
    (new ProductController())->store();
});

// Either role accepted
$router->delete('/products/{id}', function (array $params) {
    JwtMiddleware::authenticate(['ROLE_ADMIN', 'ROLE_MANAGER']);
    (new ProductController())->destroy((int) $params['id']);
});
```

Returns `403 Forbidden` if the user's token doesn't contain a matching role.

---

## How to add a new route

**Step 1** — Add a method to an existing controller, or create `src/Controllers/YourController.php`:

```php
public function show(int $id): void
{
    $stmt = Database::connection()->prepare(
        'SELECT * FROM products WHERE id = ?'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    $row ? $this->json($row) : $this->json(['error' => 'Not found.'], 404);
}
```

**Step 2** — Register it in `src/routes.php`:

```php
$router->get('/products/{id}', function (array $params) {
    JwtMiddleware::authenticate();
    (new ProductController())->show((int) $params['id']);
});
```

Path parameters like `{id}` are automatically extracted and passed as `$params['id']`.

---

## How to add a new controller

Create `src/Controllers/CategoryController.php`:

```php
<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\Database;

class CategoryController
{
    public function index(): void
    {
        $stmt = Database::connection()->query('SELECT DISTINCT category FROM products');
        $this->json($stmt->fetchAll());
    }

    private function json(mixed $data, int $code = 200): void
    {
        http_response_code($code);
        echo json_encode($data);
    }
}
```

Then register in `routes.php`:

```php
use App\Controllers\CategoryController;

$router->get('/categories', function (array $params) {
    JwtMiddleware::authenticate();
    (new CategoryController())->index();
});
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `auth_db` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `secret` | Database password |
| `JWT_SECRET` | *(see docker-compose)* | Base64-encoded secret, must match Spring Boot |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |
