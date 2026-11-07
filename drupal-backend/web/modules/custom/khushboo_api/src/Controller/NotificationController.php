<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for User Notifications.
 */
class NotificationController extends ControllerBase {

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
   * GET /api/notifications
   */
  public function getAll(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $notifications = $this->database->select('kp_notifications', 'n')
      ->fields('n')
      ->condition('user_id', $user['id'])
      ->orderBy('created_at', 'DESC')
      ->range(0, 30)
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($notifications as $n) {
      $list[] = [
        'id' => $n->id,
        'title' => $n->title,
        'message' => $n->message,
        'type' => $n->type,
        'isRead' => (bool)$n->is_read,
        'link' => $n->link,
        'createdAt' => date('c', $n->created_at),
      ];
    }

    return $this->jwt->successResponse($list);
  }
}

