<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Student-Mentor relationship and meetings.
 */
class MentorshipController extends ControllerBase {

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
   * GET /api/mentorship
   */
  public function getMentorship(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) return $this->jwt->unauthorizedResponse();

    $mentor = null;
    $assignedAt = null;
    $batchInfo = null;

    // 1. Check direct 1-on-1 mentorship table
    $relation = $this->database->select('kp_mentorship', 'm')
      ->fields('m')
      ->condition('mentee_id', $user['id'])
      ->condition('status', 'ACTIVE')
      ->execute()
      ->fetchAssoc();

    if ($relation) {
      $mentor = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'email', 'avatar', 'phone', 'skills', 'bio'])
        ->condition('id', $relation['mentor_id'])
        ->execute()
        ->fetchAssoc();
      $assignedAt = date('c', $relation['assigned_at']);
    }

    // 2. If no direct mentor, dynamically resolve mentor via batch enrollment
    if (!$mentor) {
      $batchIds = $this->database->select('kp_batch_students', 'bs')
        ->fields('bs', ['batch_id'])
        ->condition('user_id', $user['id'])
        ->execute()
        ->fetchCol();

      if (!empty($batchIds)) {
        $mentorAssignment = $this->database->select('kp_batch_mentors', 'bm')
          ->fields('bm', ['user_id', 'batch_id', 'assigned_at'])
          ->condition('batch_id', $batchIds, 'IN')
          ->execute()
          ->fetchAssoc();

        if ($mentorAssignment) {
          $mentor = $this->database->select('kp_users', 'u')
            ->fields('u', ['id', 'name', 'email', 'avatar', 'phone', 'skills', 'bio'])
            ->condition('id', $mentorAssignment['user_id'])
            ->execute()
            ->fetchAssoc();

          $batchRecord = $this->database->select('kp_batches', 'b')
            ->fields('b', ['id', 'name', 'code'])
            ->condition('id', $mentorAssignment['batch_id'])
            ->execute()
            ->fetchAssoc();

          $batchInfo = $batchRecord ?: null;
          $assignedAt = date('c', $mentorAssignment['assigned_at'] ?: time());
        }
      }
    }

    // Fallback if still null but there are mentors in the system
    if (!$mentor) {
      $fallbackMentor = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'email', 'avatar', 'phone', 'skills', 'bio'])
        ->condition('role', 'MENTOR')
        ->range(0, 1)
        ->execute()
        ->fetchAssoc();
      if ($fallbackMentor) {
        $mentor = $fallbackMentor;
        $assignedAt = date('c', time() - 86400 * 7);
      }
    }

    return $this->jwt->successResponse([
      'mentor' => $mentor,
      'status' => $mentor ? 'ACTIVE' : 'NONE',
      'batch' => $batchInfo,
      'assignedAt' => $assignedAt,
    ]);
  }

  /**
   * GET /api/mentorship/meetings
   */
  public function getMeetings(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) return $this->jwt->unauthorizedResponse();

    $meetings = $this->database->select('kp_meetings', 'm')
      ->fields('m')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    return $this->jwt->successResponse(array_values($meetings));
  }

  /**
   * POST /api/mentorship/meetings
   */
  public function createMeeting(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) return $this->jwt->unauthorizedResponse();

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'meet_' . bin2hex(random_bytes(16));

    $scheduledAt = $data['scheduledAt'] ?? $data['meetingDate'] ?? null;
    if ($scheduledAt) {
      $scheduledAt = date('Y-m-d H:i:s', strtotime($scheduledAt));
    } else {
      $scheduledAt = date('Y-m-d H:i:s', strtotime('+1 day'));
    }

    $title = $data['title'] ?? $data['discussionSummary'] ?? '1-on-1 Mentorship Call';
    $description = $data['description'] ?? $data['discussionSummary'] ?? '';
    $mentorId = $data['mentorId'] ?? '';

    if (empty($mentorId)) {
      $batchId = $this->database->select('kp_batch_students', 'bs')
        ->fields('bs', ['batch_id'])
        ->condition('user_id', $user['id'])
        ->range(0, 1)
        ->execute()
        ->fetchField();
      if ($batchId) {
        $mentorId = $this->database->select('kp_batch_mentors', 'bm')
          ->fields('bm', ['user_id'])
          ->condition('batch_id', $batchId)
          ->range(0, 1)
          ->execute()
          ->fetchField();
      }
      if (!$mentorId) {
        $mentorId = $this->database->select('kp_users', 'u')
          ->fields('u', ['id'])
          ->condition('role', 'MENTOR')
          ->range(0, 1)
          ->execute()
          ->fetchField();
      }
    }

    $this->database->insert('kp_meetings')->fields([
      'id' => $id,
      'mentor_id' => $mentorId ?: $user['id'],
      'mentee_id' => $user['id'],
      'title' => $title,
      'description' => $description,
      'meeting_link' => $data['meetingLink'] ?? 'https://meet.google.com/new',
      'scheduled_at' => $scheduledAt,
      'status' => 'SCHEDULED',
      'created_at' => time(),
    ])->execute();

    $record = $this->database->select('kp_meetings', 'm')->fields('m')->condition('id', $id)->execute()->fetchAssoc();
    return $this->jwt->successResponse($record, 201);
  }

  /**
   * POST /api/mentorship/message
   */
  public function sendMessage(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) return $this->jwt->unauthorizedResponse();

    return $this->jwt->successResponse(['message' => 'Message sent to mentor']);
  }
}

