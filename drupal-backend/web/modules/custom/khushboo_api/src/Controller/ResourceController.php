<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Learning Resources and video tracking.
 */
class ResourceController extends ControllerBase {

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
   * GET /api/resources
   */
  public function getAll(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $query = $this->database->select('kp_resources', 'r')
      ->fields('r')
      ->condition('deleted_at', NULL, 'IS NULL');

    $category = $request->query->get('category');
    if (!empty($category)) {
      $query->condition('category', $category);
    }

    $type = $request->query->get('type');
    if (!empty($type)) {
      $query->condition('type', $type);
    }

    $resources = $query->orderBy('created_at', 'DESC')->execute()->fetchAllAssoc('id');

    $list = [];
    foreach ($resources as $r) {
      $lessons = !empty($r->lessons) ? json_decode($r->lessons, TRUE) : [];
      $list[] = [
        'id' => $r->id,
        'title' => $r->title,
        'description' => $r->description,
        'category' => $r->category,
        'videoUrl' => $r->video_url,
        'duration' => (int)$r->duration,
        'thumbnailUrl' => $r->thumbnail_url,
        'lessonsCount' => (int)$r->lessons_count,
        'lessons' => $lessons,
        'isHot' => (bool)$r->is_hot,
        'type' => $r->type,
        'batchId' => $r->batch_id,
        'createdAt' => date('c', $r->created_at),
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * GET /api/resources/{id}
   */
  public function getOne(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $r = $this->database->select('kp_resources', 'r')
      ->fields('r')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    if (!$r) {
      return $this->jwt->errorResponse('Resource not found', 404);
    }

    $tracking = $this->database->select('kp_session_tracking', 'st')
      ->fields('st')
      ->condition('user_id', $user['id'])
      ->condition('resource_id', $id)
      ->execute()
      ->fetchAssoc();

    $r['lessons'] = !empty($r['lessons']) ? json_decode($r['lessons'], TRUE) : [];
    $r['tracking'] = $tracking ?: null;

    return $this->jwt->successResponse($r);
  }

  /**
   * POST /api/resources
   */
  public function createResource(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    if (empty($data['title'])) {
      return $this->jwt->errorResponse('Title is required', 400);
    }

    $id = 'res_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_resources')->fields([
      'id' => $id,
      'title' => $data['title'],
      'description' => $data['description'] ?? '',
      'category' => $data['category'] ?? 'TECHNICAL_SKILLS',
      'video_url' => $data['videoUrl'] ?? '',
      'duration' => (int)($data['duration'] ?? 0),
      'thumbnail_url' => $data['thumbnailUrl'] ?? '',
      'lessons_count' => (int)($data['lessonsCount'] ?? 1),
      'lessons' => !empty($data['lessons']) ? json_encode($data['lessons']) : '[]',
      'is_hot' => !empty($data['isHot']) ? 1 : 0,
      'type' => $data['type'] ?? 'COURSE',
      'batch_id' => $data['batchId'] ?? NULL,
      'uploaded_by_id' => $user['id'],
      'created_at' => $now,
      'updated_at' => $now,
    ])->execute();

    $record = $this->database->select('kp_resources', 'r')
      ->fields('r')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($record, 201);
  }

  /**
   * POST /api/resources/{id}/track
   * Real-time video progress & smart auto-attendance marking at >=80%
   */
  public function trackProgress(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $watchDuration = (int)($data['watchDuration'] ?? $data['playedSeconds'] ?? 0);
    $totalDuration = max(1, (int)($data['totalDuration'] ?? 3600));
    $dropOffPoint = (int)($data['dropOffPoint'] ?? $watchDuration);

    $percentage = round(($watchDuration / $totalDuration) * 100);
    if ($percentage > 100) $percentage = 100;

    $attendanceMarked = ($percentage >= 80) ? 1 : 0;
    $now = time();

    // Check existing
    $existing = $this->database->select('kp_session_tracking', 'st')
      ->fields('st')
      ->condition('user_id', $user['id'])
      ->condition('resource_id', $id)
      ->execute()
      ->fetchAssoc();

    if ($existing) {
      // Don't unmark attendance if it was already achieved
      $finalAttendance = $existing['attendance_marked'] ? 1 : $attendanceMarked;
      $maxWatch = max((int)$existing['watch_duration'], $watchDuration);
      $maxPerc = max((int)$existing['completion_percentage'], $percentage);

      $this->database->update('kp_session_tracking')
        ->fields([
          'watch_duration' => $maxWatch,
          'total_duration' => $totalDuration,
          'drop_off_point' => $dropOffPoint,
          'completion_percentage' => $maxPerc,
          'attendance_marked' => $finalAttendance,
          'updated_at' => $now,
        ])
        ->condition('id', $existing['id'])
        ->execute();

      $tracking = $this->database->select('kp_session_tracking', 'st')
        ->fields('st')
        ->condition('id', $existing['id'])
        ->execute()
        ->fetchAssoc();
    } else {
      $trackingId = 'track_' . bin2hex(random_bytes(16));
      $this->database->insert('kp_session_tracking')->fields([
        'id' => $trackingId,
        'user_id' => $user['id'],
        'resource_id' => $id,
        'watch_duration' => $watchDuration,
        'total_duration' => $totalDuration,
        'drop_off_point' => $dropOffPoint,
        'completion_percentage' => $percentage,
        'attendance_marked' => $attendanceMarked,
        'created_at' => $now,
        'updated_at' => $now,
      ])->execute();

      $tracking = $this->database->select('kp_session_tracking', 'st')
        ->fields('st')
        ->condition('id', $trackingId)
        ->execute()
        ->fetchAssoc();
    }

    return $this->jwt->successResponse([
      'tracking' => $tracking,
      'attendanceMarked' => (bool)$tracking['attendance_marked'],
      'completionPercentage' => (int)$tracking['completion_percentage'],
    ]);
  }
}

