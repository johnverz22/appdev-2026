<?php

declare(strict_types=1);

namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

/**
 * JwtMiddleware — validates the JWT cookie and enforces role-based access.
 *
 * Basic usage (authentication only):
 *   JwtMiddleware::authenticate();
 *
 * Role-based usage (e.g. admin only):
 *   JwtMiddleware::authenticate(['ROLE_ADMIN']);
 *
 * The decoded payload is returned so controllers can read claims:
 *   $payload = JwtMiddleware::authenticate();
 *   $username = $payload->sub;
 *   $roles    = $payload->roles ?? [];
 */
class JwtMiddleware
{
    /**
     * Validate the JWT from the HttpOnly 'jwt' cookie set by Spring Boot.
     *
     * @param  string[] $requiredRoles  If non-empty, the token must contain at
     *                                  least one of these roles or a 403 is sent.
     * @return object                   The decoded JWT payload.
     */
    public static function authenticate(array $requiredRoles = []): object
    {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        $username = $_SERVER['HTTP_X_USER_NAME'] ?? null;
        $rolesStr = $_SERVER['HTTP_X_USER_ROLES'] ?? '';
        $userRoles = !empty($rolesStr) ? explode(',', $rolesStr) : [];

        if (!$username) {
            self::abort(401, 'Unauthorized: Missing identity header from Gateway.');
        }

        // Create a payload object to maintain compatibility with controllers
        $payload = (object) [
            'sub'   => $username,
            'roles' => $userRoles
        ];

        // ── Role check ────────────────────────────────────────────────────────
        if (!empty($requiredRoles)) {
            $hasRole = !empty(array_intersect($requiredRoles, $userRoles));

            if (!$hasRole) {
                self::abort(403, 'Forbidden: insufficient role.');
            }
        }

        return $payload;
    }

    private static function abort(int $code, string $message): never
    {
        http_response_code($code);
        echo json_encode(['error' => $message]);
        exit();
    }
}
