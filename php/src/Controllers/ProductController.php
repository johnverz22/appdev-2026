<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use PDOException;

/**
 * ProductController — full CRUD for the products table.
 *
 * Auth and role checks are declared in routes.php, not here.
 * Controllers only contain business logic.
 *
 * Routes wired in routes.php:
 *   GET    /products          → index()   (any authenticated user)
 *   GET    /products/{id}     → show()    (any authenticated user)
 *   POST   /products          → store()   (ROLE_ADMIN)
 *   PUT    /products/{id}     → update()  (ROLE_ADMIN)
 *   DELETE /products/{id}     → destroy() (ROLE_ADMIN)
 */
class ProductController
{
    // ── GET /products ─────────────────────────────────────────────────────────
    public function index(): void
    {
        try {
            $stmt = Database::connection()->query(
                'SELECT id, name, price, category, stock, image_url FROM products ORDER BY id'
            );
            $this->json($stmt->fetchAll());
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── GET /products/{id} ────────────────────────────────────────────────────
    public function show(int $id): void
    {
        try {
            $stmt = Database::connection()->prepare(
                'SELECT id, name, price, category, stock, image_url FROM products WHERE id = ?'
            );
            $stmt->execute([$id]);
            $row = $stmt->fetch();

            $row
                ? $this->json($row)
                : $this->json(['error' => 'Product not found.'], 404);
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── POST /products ────────────────────────────────────────────────────────
    public function store(): void
    {
        $body = $this->body();

        $errors = $this->validate($body, ['name', 'price', 'category', 'stock']);
        if ($errors) {
            $this->json(['error' => 'Validation failed.', 'fields' => $errors], 422);
            return;
        }

        try {
            $stmt = Database::connection()->prepare(
                'INSERT INTO products (name, price, category, stock, image_url)
                 VALUES (:name, :price, :category, :stock, :image_url)
                 RETURNING id, name, price, category, stock, image_url'
            );
            $stmt->execute([
                'name'      => $body['name'],
                'price'     => $body['price'],
                'category'  => $body['category'],
                'stock'     => (int) $body['stock'],
                'image_url' => $body['image_url'] ?? null,
            ]);
            $this->json($stmt->fetch(), 201);
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── PUT /products/{id} ────────────────────────────────────────────────────
    public function update(int $id): void
    {
        $body = $this->body();

        $errors = $this->validate($body, ['name', 'price', 'category', 'stock']);
        if ($errors) {
            $this->json(['error' => 'Validation failed.', 'fields' => $errors], 422);
            return;
        }

        try {
            $stmt = Database::connection()->prepare(
                'UPDATE products
                 SET name = :name, price = :price, category = :category,
                     stock = :stock, image_url = :image_url
                 WHERE id = :id
                 RETURNING id, name, price, category, stock, image_url'
            );
            $stmt->execute([
                'id'        => $id,
                'name'      => $body['name'],
                'price'     => $body['price'],
                'category'  => $body['category'],
                'stock'     => (int) $body['stock'],
                'image_url' => $body['image_url'] ?? null,
            ]);
            $row = $stmt->fetch();

            $row
                ? $this->json($row)
                : $this->json(['error' => 'Product not found.'], 404);
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── DELETE /products/{id} ─────────────────────────────────────────────────
    public function destroy(int $id): void
    {
        try {
            $stmt = Database::connection()->prepare(
                'DELETE FROM products WHERE id = ? RETURNING id'
            );
            $stmt->execute([$id]);
            $deleted = $stmt->fetch();

            $deleted
                ? $this->json(['message' => "Product $id deleted."])
                : $this->json(['error' => 'Product not found.'], 404);
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Decode the JSON request body. */
    private function body(): array
    {
        return (array) json_decode(file_get_contents('php://input'), true);
    }

    /** Check that required fields are present and non-empty. */
    private function validate(array $data, array $required): array
    {
        $errors = [];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                $errors[] = "$field is required.";
            }
        }
        return $errors;
    }

    private function json(mixed $data, int $code = 200): void
    {
        http_response_code($code);
        echo json_encode($data);
    }
}
