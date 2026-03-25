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

        $token = $_COOKIE['jwt'] ?? null;
        if (!$token) {
            self::abort(401, 'No authentication cookie found. Please log in.');
        }

        $secret = getenv('JWT_SECRET');
        if (!$secret) {
            self::abort(500, 'JWT_SECRET not configured on server.');
        }

        // Spring Boot base64-encodes the secret in config, so decode it first
        $keyBytes = base64_decode($secret);

        try {
            $payload = JWT::decode($token, new Key($keyBytes, 'HS256'));
        } catch (ExpiredException) {
            self::abort(401, 'Token has expired.');
        } catch (SignatureInvalidException) {
            self::abort(401, 'Token signature is invalid.');
        } catch (\Exception $e) {
            self::abort(401, 'Invalid token: ' . $e->getMessage());
        }

        // ── Role check ────────────────────────────────────────────────────────
        if (!empty($requiredRoles)) {
            // Roles are stored as a JSON array claim in the JWT, e.g. ["ROLE_ADMIN"]
            $userRoles = (array) ($payload->roles ?? []);
            $hasRole   = !empty(array_intersect($requiredRoles, $userRoles));

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
