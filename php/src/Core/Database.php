<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

/**
 * Database — singleton PDO connection.
 *
 * Usage anywhere in the app:
 *   $pdo = Database::connection();
 *
 * Configuration comes from environment variables set in docker-compose.yml:
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */
class Database
{
    private static ?PDO $instance = null;

    /** Returns the shared PDO instance, creating it on first call. */
    public static function connection(): PDO
    {
        if (self::$instance === null) {
            self::$instance = self::connect();
        }
        return self::$instance;
    }

    private static function connect(): PDO
    {
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            getenv('DB_HOST') ?: 'localhost',
            getenv('DB_PORT') ?: '5432',
            getenv('DB_NAME') ?: 'auth_db',
        );

        try {
            return new PDO(
                $dsn,
                getenv('DB_USER')     ?: 'postgres',
                getenv('DB_PASSWORD') ?: 'secret',
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit();
        }
    }

    // Prevent instantiation — this is a static utility class
    private function __construct() {}
}
