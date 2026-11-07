<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\GeminiService;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for AI Career & Study Roadmaps.
 */
class RoadmapController extends ControllerBase {

  protected Connection $database;
  protected JwtAuthService $jwt;
  protected GeminiService $gemini;

  public function __construct(Connection $database, JwtAuthService $jwt, GeminiService $gemini) {
    $this->database = $database;
    $this->jwt = $jwt;
    $this->gemini = $gemini;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('database'),
      $container->get('khushboo_api.jwt'),
      $container->get('khushboo_api.gemini')
    );
  }

  /**
   * POST /api/roadmaps/generate
   */
  public function generate(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $topic = trim($data['topic'] ?? 'Full Stack Web Development');
    $days = max(1, min(90, (int)($data['days'] ?? 30)));

    $roadmapContent = $this->gemini->generateRoadmap($topic, $days);

    $id = 'road_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_roadmaps')->fields([
      'id' => $id,
      'user_id' => $user['id'],
      'topic' => $topic,
      'days' => $days,
      'content' => json_encode($roadmapContent),
      'created_at' => $now,
    ])->execute();

    return $this->jwt->successResponse([
      'id' => $id,
      'topic' => $topic,
      'days' => $days,
      'content' => $roadmapContent,
      'createdAt' => date('c', $now),
    ], 201);
  }

  /**
   * GET /api/roadmaps/history
   */
  public function getHistory(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $roadmaps = $this->database->select('kp_roadmaps', 'r')
      ->fields('r')
      ->condition('user_id', $user['id'])
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($roadmaps as $r) {
      $list[] = [
        'id' => $r->id,
        'topic' => $r->topic,
        'days' => (int)$r->days,
        'content' => json_decode($r->content, TRUE),
        'createdAt' => date('c', $r->created_at),
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * DELETE /api/roadmaps/{id}
   */
  public function deleteRoadmap(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $this->database->delete('kp_roadmaps')
      ->condition('id', $id)
      ->condition('user_id', $user['id'])
      ->execute();

    return $this->jwt->successResponse(['message' => 'Roadmap deleted']);
  }
}

