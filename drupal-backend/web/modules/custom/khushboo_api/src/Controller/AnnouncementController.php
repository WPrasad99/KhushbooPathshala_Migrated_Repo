<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Announcements.
 */
class AnnouncementController extends ControllerBase {

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
   * GET /api/announcements
   */
  public function getAll(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $announcements = $this->database->select('kp_announcements', 'a')
      ->fields('a')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($announcements as $a) {
      $author = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'avatar', 'role'])
        ->condition('id', $a->author_id)
        ->execute()
        ->fetchAssoc();

      $list[] = [
        'id' => $a->id,
        'title' => $a->title,
        'content' => $a->content,
        'priority' => $a->priority,
        'author' => $author,
        'createdAt' => date('c', $a->created_at),
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * POST /api/announcements
   */
  public function createAnnouncement(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'ann_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_announcements')->fields([
      'id' => $id,
      'title' => $data['title'] ?? 'Announcement',
      'content' => $data['content'] ?? '',
      'priority' => strtoupper($data['priority'] ?? 'NORMAL'),
      'author_id' => $user['id'],
      'batch_id' => !empty($data['batchIds'][0]) ? $data['batchIds'][0] : ($data['batchId'] ?? NULL),
      'created_at' => $now,
    ])->execute();

    $record = $this->database->select('kp_announcements', 'a')
      ->fields('a')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($record, 201);
  }

  /**
   * DELETE /api/announcements/{id}
   */
  public function deleteAnnouncement(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }
    if ($user['role'] !== 'ADMIN') {
      return $this->jwt->forbiddenResponse('Admin access required');
    }

    $this->database->delete('kp_announcements')->condition('id', $id)->execute();
    return $this->jwt->successResponse(['message' => 'Announcement deleted successfully']);
  }
}

