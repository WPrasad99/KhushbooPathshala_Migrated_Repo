<?php

namespace Drupal\khushboo_api\Service;

use Drupal\Core\Database\Connection;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Service for JWT Authentication and user sessions.
 */
class JwtAuthService {

  protected Connection $database;
  protected string $secret;

  public function __construct(Connection $database) {
    $this->database = $database;
    $this->secret = 'khushboo_pathshala_super_secure_enterprise_jwt_secret_2026';
  }

  /**
   * Generate JWT token for user.
   */
  public function generateToken(array $user): string {
    $payload = [
      'iss' => 'khushboo-pathshala-drupal',
      'sub' => $user['id'],
      'id' => $user['id'],
      'email' => $user['email'],
      'role' => $user['role'],
      'name' => $user['name'],
      'iat' => time(),
      'exp' => time() + (30 * 24 * 60 * 60), // 30 days
    ];

    return JWT::encode($payload, $this->secret, 'HS256');
  }

  /**
   * Authenticate user from Bearer token in request.
   */
  public function authenticate(Request $request): ?array {
    $authHeader = $request->headers->get('Authorization')
      ?? $request->headers->get('authorization')
      ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? null)
      ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);

    if (!$authHeader && function_exists('apache_request_headers')) {
      $headers = apache_request_headers();
      $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    }

    $token = null;
    if ($authHeader && preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
      $token = $matches[1];
    }
    elseif ($request->query->get('token')) {
      $token = $request->query->get('token');
    }

    if (!$token) {
      error_log("[JwtAuthService] No token found in headers or query. Headers: " . json_encode($request->headers->all()));
      return null;
    }

    try {
      $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
      $userId = $decoded->id ?? $decoded->sub ?? null;
      if (!$userId) {
        error_log("[JwtAuthService] Token decoded but no userId found.");
        return null;
      }

      $user = $this->database->select('kp_users', 'u')
        ->fields('u')
        ->condition('id', $userId)
        ->execute()
        ->fetchAssoc();

      if ($user) {
        unset($user['password_hash']);
        return $user;
      } else {
        error_log("[JwtAuthService] User not found in database for id: " . $userId);
      }
    }
    catch (\Exception $e) {
      error_log("[JwtAuthService] Decode exception: " . $e->getMessage());
      return null;
    }

    return null;
  }

  /**
   * Helper to return 401 Unauthorized response.
   */
  public function unauthorizedResponse(string $message = 'Unauthorized'): JsonResponse {
    return new JsonResponse([
      'success' => false,
      'error' => ['code' => 'UNAUTHORIZED', 'message' => $message],
    ], 401);
  }

  /**
   * Helper to return 403 Forbidden response.
   */
  public function forbiddenResponse(string $message = 'Forbidden'): JsonResponse {
    return new JsonResponse([
      'success' => false,
      'error' => ['code' => 'FORBIDDEN', 'message' => $message],
    ], 403);
  }

  /**
   * Helper to return standardized success JSON response.
   */
  public function successResponse($data = null, int $status = 200): JsonResponse {
    $response = ['success' => true];
    if ($data !== null) {
      if (is_array($data) && isset($data['data'])) {
        $response = array_merge($response, $data);
      } else {
        $response['data'] = $data;
      }
    }
    return new JsonResponse($response, $status);
  }

  /**
   * Helper to return standardized error JSON response.
   */
  public function errorResponse(string $message, int $status = 400, string $code = 'BAD_REQUEST'): JsonResponse {
    return new JsonResponse([
      'success' => false,
      'error' => ['code' => $code, 'message' => $message],
    ], $status);
  }
}

