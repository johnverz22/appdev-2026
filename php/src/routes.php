<?php

declare(strict_types=1);

use App\Core\Router;
use App\Controllers\ProductController;
use App\Middleware\JwtMiddleware;

$router = new Router();

// ── Public routes (no auth) ───────────────────────────────────────────────────
$router->get('/health', function (array $params) {
    echo json_encode(['status' => 'ok', 'service' => 'php-products-api']);
});

// ── Products — any authenticated user ─────────────────────────────────────────
$router->get('/products', function (array $params) {
    JwtMiddleware::authenticate();
    (new ProductController())->index();
});

$router->get('/products/{id}', function (array $params) {
    JwtMiddleware::authenticate();
    (new ProductController())->show((int) $params['id']);
});

// ── Products — admin only ─────────────────────────────────────────────────────
$router->post('/products', function (array $params) {
    JwtMiddleware::authenticate(['ROLE_ADMIN']);
    (new ProductController())->store();
});

$router->put('/products/{id}', function (array $params) {
    JwtMiddleware::authenticate(['ROLE_ADMIN']);
    (new ProductController())->update((int) $params['id']);
});

$router->delete('/products/{id}', function (array $params) {
    JwtMiddleware::authenticate(['ROLE_ADMIN']);
    (new ProductController())->destroy((int) $params['id']);
});

// ── How to add a new route ────────────────────────────────────────────────────
// 1. Add a method to an existing controller or create src/Controllers/YourController.php
// 2. Register it below with the right verb, path, and auth level.
//
// Any authenticated user:
// $router->get('/categories', function (array $params) {
//     JwtMiddleware::authenticate();
//     (new CategoryController())->index();
// });
//
// Admin only:
// $router->post('/categories', function (array $params) {
//     JwtMiddleware::authenticate(['ROLE_ADMIN']);
//     (new CategoryController())->store();
// });

// ── Dispatch ──────────────────────────────────────────────────────────────────
$router->dispatch();
