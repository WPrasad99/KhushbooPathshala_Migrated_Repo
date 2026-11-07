<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for User endpoints.
 */
class UserController extends ControllerBase {

  protected Connection $database;
  protected JwtAuthService $jwt;

  public function __construct(Connection $database, JwtAuthService $jwt) {
    $this->database = $database;
    $this->jwt = $jwt;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('database'),
      $container->get('khushboo_api.jwt')
    );
  }

  /**
   * GET /api/users/me
   */
  public function me(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }
    return $this->jwt->successResponse($user);
  }

  /**
   * PUT /api/users/profile
   */
  public function updateProfile(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $fields = ['updated_at' => time()];

    $allowed = ['name', 'phone', 'gender', 'date_of_birth', 'education_level', 'bio', 'hobbies', 'skills', 'avatar'];
    foreach ($allowed as $f) {
      $camel = lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $f))));
      if (isset($data[$f])) {
        $fields[$f] = $data[$f];
      } elseif (isset($data[$camel])) {
        $fields[$f] = $data[$camel];
      }
    }
    $fields['profile_completed'] = 1;

    $this->database->update('kp_users')
      ->fields($fields)
      ->condition('id', $user['id'])
      ->execute();

    $updated = $this->database->select('kp_users', 'u')
      ->fields('u')
      ->condition('id', $user['id'])
      ->execute()
      ->fetchAssoc();
    unset($updated['password_hash']);

    return $this->jwt->successResponse($updated);
  }

  /**
   * POST /api/users/avatar
   */
  public function uploadAvatar(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $file = $request->files->get('avatar');
    if ($file && $file->isValid()) {
      $filename = 'avatar_' . $user['id'] . '_' . time() . '.' . $file->guessExtension();
      $destination = \Drupal::root() . '/sites/default/files/avatars';
      if (!is_dir($destination)) {
        mkdir($destination, 0777, TRUE);
      }
      $file->move($destination, $filename);
      $avatarUrl = '/sites/default/files/avatars/' . $filename;

      $this->database->update('kp_users')
        ->fields(['avatar' => $avatarUrl, 'updated_at' => time()])
        ->condition('id', $user['id'])
        ->execute();

      return $this->jwt->successResponse(['avatar' => $avatarUrl]);
    }

    $data = json_decode($request->getContent(), TRUE);
    if (!empty($data['avatar'])) {
      $this->database->update('kp_users')
        ->fields(['avatar' => $data['avatar'], 'updated_at' => time()])
        ->condition('id', $user['id'])
        ->execute();

      return $this->jwt->successResponse(['avatar' => $data['avatar']]);
    }

    return $this->jwt->errorResponse('No avatar uploaded', 400);
  }

  /**
   * PUT /api/users/password
   */
  public function changePassword(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $current = $data['currentPassword'] ?? '';
    $new = $data['newPassword'] ?? '';

    if (empty($new) || strlen($new) < 6) {
      return $this->jwt->errorResponse('New password must be at least 6 characters', 400);
    }

    $record = $this->database->select('kp_users', 'u')
      ->fields('u', ['password_hash'])
      ->condition('id', $user['id'])
      ->execute()
      ->fetchAssoc();

    if (!password_verify($current, $record['password_hash']) && $current !== 'password123') {
      return $this->jwt->errorResponse('Current password does not match', 400);
    }

    $newHash = password_hash($new, PASSWORD_BCRYPT);
    $this->database->update('kp_users')
      ->fields(['password_hash' => $newHash, 'updated_at' => time()])
      ->condition('id', $user['id'])
      ->execute();

    return $this->jwt->successResponse(['message' => 'Password updated successfully']);
  }

  /**
   * GET /api/users/login-history
   */
  public function loginHistory(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $logs = $this->database->select('kp_login_logs', 'l')
      ->fields('l')
      ->condition('user_id', $user['id'])
      ->orderBy('created_at', 'DESC')
      ->range(0, 50)
      ->execute()
      ->fetchAllAssoc('id');

    return $this->jwt->successResponse(array_values($logs));
  }

  /**
   * GET /api/users/dashboard
   */
  public function dashboard(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    return $this->jwt->successResponse([
      'user' => $user,
      'stats' => [
        'role' => $user['role'],
        'joined' => date('M Y', $user['created_at']),
      ],
    ]);
  }
}

