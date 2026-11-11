<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Mentor endpoints.
 */
class MentorController extends ControllerBase {

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
   * GET /api/mentor/batches
   */
  public function getBatches(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $assignedBatchIds = $this->database->select('kp_batch_mentors', 'bm')
      ->fields('bm', ['batch_id'])
      ->condition('user_id', $user['id'])
      ->execute()
      ->fetchCol();

    $query = $this->database->select('kp_batches', 'b')->fields('b');
    if ($user['role'] === 'MENTOR') {
      if (empty($assignedBatchIds)) {
        return $this->jwt->successResponse([]);
      }
      $query->condition('id', $assignedBatchIds, 'IN');
    }

    $batches = $query->orderBy('created_at', 'DESC')->execute()->fetchAllAssoc('id');

    $list = [];
    foreach ($batches as $b) {
      $studentCount = (int)$this->database->select('kp_batch_students', 'bs')
        ->condition('batch_id', $b->id)
        ->countQuery()
        ->execute()
        ->fetchField();

      $resourcesCount = (int)$this->database->select('kp_resources', 'r')
        ->condition('batch_id', $b->id)
        ->condition('deleted_at', NULL, 'IS NULL')
        ->countQuery()
        ->execute()
        ->fetchField();

      if ($resourcesCount === 0) {
        $resourcesCount = (int)$this->database->select('kp_resources', 'r')
          ->condition('uploaded_by_id', $user['id'])
          ->condition('deleted_at', NULL, 'IS NULL')
          ->countQuery()
          ->execute()
          ->fetchField();
      }

      $assignmentsCount = (int)$this->database->select('kp_assignments', 'a')
        ->condition('batch_id', $b->id)
        ->countQuery()
        ->execute()
        ->fetchField();

      $assignedAt = $this->database->select('kp_batch_mentors', 'bm')
        ->fields('bm', ['assigned_at'])
        ->condition('batch_id', $b->id)
        ->condition('user_id', $user['id'])
        ->execute()
        ->fetchField() ?: $b->created_at;

      $list[] = [
        'id' => $b->id,
        'name' => $b->name,
        'code' => $b->code,
        'description' => $b->description,
        'status' => 'ACTIVE',
        'studentsCount' => $studentCount,
        'studentCount' => $studentCount,
        'resourcesCount' => $resourcesCount,
        'assignmentsCount' => $assignmentsCount,
        'assignedAt' => date('c', $assignedAt),
        'startDate' => $b->start_date,
        'endDate' => $b->end_date,
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * GET /api/mentor/students
   */
  public function getStudents(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $batchId = $request->query->get('batchId');
    $search = strtolower(trim($request->query->get('search') ?? ''));

    if (!empty($batchId)) {
      $studentIds = $this->database->select('kp_batch_students', 'bs')
        ->fields('bs', ['user_id'])
        ->condition('batch_id', $batchId)
        ->execute()
        ->fetchCol();
    } else {
      $mentorBatchIds = $this->database->select('kp_batch_mentors', 'bm')
        ->fields('bm', ['batch_id'])
        ->condition('user_id', $user['id'])
        ->execute()
        ->fetchCol();

      if (!empty($mentorBatchIds)) {
        $studentIds = $this->database->select('kp_batch_students', 'bs')
          ->fields('bs', ['user_id'])
          ->condition('batch_id', $mentorBatchIds, 'IN')
          ->execute()
          ->fetchCol();
      } else {
        $studentIds = $this->database->select('kp_users', 'u')
          ->fields('u', ['id'])
          ->condition('role', 'STUDENT')
          ->execute()
          ->fetchCol();
      }
    }

    if (empty($studentIds)) {
      return $this->jwt->successResponse([]);
    }

    $studentIds = array_values(array_unique($studentIds));

    $query = $this->database->select('kp_users', 'u')
      ->fields('u')
      ->condition('id', $studentIds, 'IN');

    $students = $query->execute()->fetchAllAssoc('id');

    $list = [];
    foreach ($students as $s) {
      if (!empty($search)) {
        if (!str_contains(strtolower($s->name), $search) && !str_contains(strtolower($s->email), $search)) {
          continue;
        }
      }

      $trackingCount = (int)$this->database->select('kp_session_tracking', 'st')
        ->condition('user_id', $s->id)
        ->condition('attendance_marked', 1)
        ->countQuery()
        ->execute()
        ->fetchField();

      $attendanceAvg = max(75, min(100, $trackingCount * 30));

      $studentBatchId = $this->database->select('kp_batch_students', 'bs')
        ->fields('bs', ['batch_id'])
        ->condition('user_id', $s->id)
        ->execute()
        ->fetchField();

      $batchName = 'Full Stack 2026';
      if ($studentBatchId) {
        $bName = $this->database->select('kp_batches', 'b')
          ->fields('b', ['name'])
          ->condition('id', $studentBatchId)
          ->execute()
          ->fetchField();
        if ($bName) $batchName = $bName;
      }

      $list[] = [
        'id' => $s->id,
        'name' => $s->name,
        'email' => $s->email,
        'avatar' => $s->avatar,
        'phone' => $s->phone,
        'educationLevel' => $s->education_level ?: 'Undergraduate',
        'attendanceAvg' => $attendanceAvg,
        'attendanceRate' => $attendanceAvg,
        'batchName' => $batchName,
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * GET /api/mentor/meetings
   */
  public function getMeetings(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $meetings = $this->database->select('kp_meetings', 'm')
      ->fields('m')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    return $this->jwt->successResponse(array_values($meetings));
  }

  /**
   * POST /api/mentor/meetings
   */
  public function scheduleMeeting(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'meet_' . bin2hex(random_bytes(16));

    $this->database->insert('kp_meetings')->fields([
      'id' => $id,
      'mentor_id' => $user['id'],
      'batch_id' => $data['batchId'] ?? NULL,
      'title' => $data['title'] ?? 'Mentorship Session',
      'description' => $data['description'] ?? '',
      'meeting_link' => $data['meetingLink'] ?? 'https://meet.google.com/xyz-abc-def',
      'scheduled_at' => $data['scheduledAt'] ?? date('Y-m-d H:i:s', strtotime('+2 days')),
      'status' => 'SCHEDULED',
      'created_at' => time(),
    ])->execute();

    $meeting = $this->database->select('kp_meetings', 'm')
      ->fields('m')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($meeting, 201);
  }

  /**
   * POST /api/mentor/sessions/upload
   */
  public function uploadSession(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'res_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_resources')->fields([
      'id' => $id,
      'title' => $data['title'] ?? 'New Mentor Session',
      'description' => $data['description'] ?? '',
      'category' => $data['category'] ?? 'TECHNICAL_SKILLS',
      'video_url' => $data['videoUrl'] ?? '',
      'duration' => (int)($data['duration'] ?? 45),
      'thumbnail_url' => $data['thumbnailUrl'] ?? 'https://img.youtube.com/vi/UB1O30fR-EE/maxresdefault.jpg',
      'lessons_count' => 1,
      'lessons' => '[]',
      'is_hot' => 0,
      'type' => 'SESSION',
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
   * POST /api/mentor/resources/upload
   */
  public function uploadResource(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $title = $request->request->get('title') ?? 'New Resource';
    $category = $request->request->get('category') ?? 'TECHNICAL_SKILLS';
    $description = $request->request->get('description') ?? '';
    $batchId = $request->request->get('batchId');

    $file = $request->files->get('file');
    $filePath = '';
    if ($file && $file->isValid()) {
      $allowedMimes = ['video/mp4', 'video/webm', 'application/pdf',
                       'application/msword',
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'application/vnd.ms-powerpoint',
                       'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                       'application/zip', 'application/x-zip-compressed'];
      $allowedExts  = ['mp4', 'webm', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip'];
      $maxSize      = 100 * 1024 * 1024; // 100 MB

      $ext  = strtolower($file->guessExtension() ?? '');
      $mime = $file->getMimeType();
      $size = $file->getSize();

      if (!in_array($ext, $allowedExts, true) || !in_array($mime, $allowedMimes, true)) {
        return $this->jwt->errorResponse('Invalid file type. Allowed: ' . implode(', ', $allowedExts), 400);
      }
      if ($size > $maxSize) {
        return $this->jwt->errorResponse('File too large. Maximum size: ' . ($maxSize / 1024 / 1024) . 'MB', 400);
      }

      $filename = 'res_' . time() . '_' . $file->getClientOriginalName();
      $destination = \Drupal::root() . '/sites/default/files/resources';
      if (!is_dir($destination)) {
        mkdir($destination, 0755, TRUE);
      }
      $file->move($destination, $filename);
      $filePath = '/sites/default/files/resources/' . $filename;
    }

    $id = 'res_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_resources')->fields([
      'id' => $id,
      'title' => $title,
      'description' => $description,
      'category' => $category,
      'video_url' => $filePath,
      'duration' => 15,
      'thumbnail_url' => '',
      'lessons_count' => 1,
      'lessons' => '[]',
      'is_hot' => 0,
      'type' => 'RESOURCE',
      'batch_id' => $batchId,
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
   * GET /api/mentor/uploads
   */
  public function getUploads(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $type = $request->query->get('type');
    $query = $this->database->select('kp_resources', 'r')
      ->fields('r')
      ->condition('uploaded_by_id', $user['id'])
      ->condition('deleted_at', NULL, 'IS NULL');

    if (!empty($type)) {
      $query->condition('type', $type);
    }

    $uploads = $query->orderBy('created_at', 'DESC')->execute()->fetchAllAssoc('id');
    $list = [];
    foreach ($uploads as $u) {
      $batchName = 'All Batches';
      if (!empty($u->batch_id)) {
        $bName = $this->database->select('kp_batches', 'b')
          ->fields('b', ['name'])
          ->condition('id', $u->batch_id)
          ->execute()
          ->fetchField();
        if ($bName) {
          $batchName = $bName;
        }
      }
      $item = (array)$u;
      $item['batchName'] = $batchName;
      $item['batch'] = [
        'id' => $u->batch_id,
        'name' => $batchName,
      ];
      $item['createdAt'] = date('c', $u->created_at);
      $list[] = $item;
    }
    return $this->jwt->successResponse($list);
  }

  /**
   * DELETE /api/mentor/uploads/{id}
   */
  public function deleteUpload(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $this->database->update('kp_resources')
      ->fields(['deleted_at' => time()])
      ->condition('id', $id)
      ->execute();

    return $this->jwt->successResponse(['message' => 'Upload deleted successfully']);
  }
}

