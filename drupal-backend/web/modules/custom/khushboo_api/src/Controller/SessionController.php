<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Sessions and Tracking.
 */
class SessionController extends ControllerBase {

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
   * GET /api/sessions
   */
  public function getAll(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $sessions = $this->database->select('kp_resources', 'r')
      ->fields('r')
      ->condition('type', 'SESSION')
      ->condition('deleted_at', NULL, 'IS NULL')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    return $this->jwt->successResponse(array_values($sessions));
  }

  /**
   * GET /api/sessions/tracking
   */
  public function getTracking(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $trackings = $this->database->select('kp_session_tracking', 'st')
      ->fields('st')
      ->condition('user_id', $user['id'])
      ->orderBy('updated_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($trackings as $t) {
      $res = $this->database->select('kp_resources', 'r')
        ->fields('r', ['title', 'category', 'thumbnail_url', 'type'])
        ->condition('id', $t->resource_id)
        ->execute()
        ->fetchAssoc();

      $list[] = [
        'id' => $t->id,
        'resourceId' => $t->resource_id,
        'watchDuration' => (int)$t->watch_duration,
        'totalDuration' => (int)$t->total_duration,
        'completionPercentage' => (int)$t->completion_percentage,
        'attendanceMarked' => (bool)$t->attendance_marked,
        'resource' => $res,
        'updatedAt' => date('c', $t->updated_at),
      ];
    }

    return $this->jwt->successResponse($list);
  }
}

