<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Database connection ─────────────────────────────────────────
$host = getenv('DB_HOST') ?: 'postgres';
$port = getenv('DB_PORT') ?: '5432';
$db   = getenv('DB_NAME') ?: 'php_db';
$user = getenv('DB_USER') ?: 'postgres';
$pass = getenv('DB_PASS') ?: 'password';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]);
    exit();
}

// Helper: cast PDO row to proper types
function formatProduct(array $row): array {
    return [
        'id'    => (int)   $row['id'],
        'name'  =>         $row['name'],
        'price' => (float) $row['price'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// ── GET /products — list all products ──────────────────────────
if ($method === 'GET' && $uri === '/products') {
    $stmt = $pdo->query("SELECT id, name, price FROM products ORDER BY id");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(array_map('formatProduct', $rows));
    exit();
}

// ── GET /products/{id} — single product ────────────────────────
//    Called by the Java Orders service to validate a product
if ($method === 'GET' && preg_match('#^/products/(\d+)$#', $uri, $m)) {
    $stmt = $pdo->prepare("SELECT id, name, price FROM products WHERE id = :id");
    $stmt->execute([':id' => (int)$m[1]]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit();
    }

    echo json_encode(formatProduct($row));
    exit();
}

// ── POST /products — create a product ──────────────────────────
if ($method === 'POST' && $uri === '/products') {
    $body  = json_decode(file_get_contents('php://input'), true);
    $name  = trim($body['name']  ?? '');
    $price = floatval($body['price'] ?? 0);

    if ($name === '' || $price <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'name and a positive price are required']);
        exit();
    }

    $stmt = $pdo->prepare(
        "INSERT INTO products (name, price) VALUES (:name, :price) RETURNING id, name, price"
    );
    $stmt->execute([':name' => $name, ':price' => $price]);
    http_response_code(201);
    echo json_encode(formatProduct($stmt->fetch(PDO::FETCH_ASSOC)));
    exit();
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
