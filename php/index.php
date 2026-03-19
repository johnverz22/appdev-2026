<?php

echo "hello world";
exit();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type:application/json");

$host = getenv('DB_HOST') ?: "localhost";
$port = getenv('DB_PORT') ?: 5432;
$db = getenv('DB_NAME') ?: 'php_db';
$user = getenv('DB_USER') ?: 'postgres';
$pass = getenv('DB_PASSWORD') ?: 'secret';


// CONNECT TO DATABASE
try{
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

} catch(PDOException $e){
    http_response_code(500);
    echo json_encode(['error'=> 'DB connection failed: ' . $e->getMessage()]);
    exit();
}


$stmt = $pdo->prepare("Select * from products");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows);
exit();