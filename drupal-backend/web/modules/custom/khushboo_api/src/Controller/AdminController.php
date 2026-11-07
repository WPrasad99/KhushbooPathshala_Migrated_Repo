<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Admin dashboard, Batch Management, and User Administration.
 */
class AdminController extends ControllerBase {

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
   * Helper to verify admin privileges.
   */
  protected function requireAdmin(Request $request): ?JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }
    if ($user['role'] !== 'ADMIN') {
      return $this->jwt->forbiddenResponse('Admin access required');
    }
    return null;
  }

  /**
   * GET /api/admin/users
   */
  public function getUsers(Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $users = $this->database->select('kp_users', 'u')
      ->fields('u')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($users as $u) {
      unset($u->password_hash);
      $list[] = $u;
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * POST /api/admin/users
   */
  public function createUser(Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $email = strtolower(trim($data['email'] ?? ''));
    $name = trim($data['name'] ?? '');
    $role = strtoupper($data['role'] ?? 'STUDENT');
    $password = $data['password'] ?? 'password123';

    if (empty($email) || empty($name)) {
      return $this->jwt->errorResponse('Name and email are required', 400);
    }

    $id = 'user_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_users')->fields([
      'id' => $id,
      'email' => $email,
      'password_hash' => password_hash($password, PASSWORD_BCRYPT),
      'name' => $name,
      'role' => $role,
      'phone' => $data['phone'] ?? NULL,
      'education_level' => $data['educationLevel'] ?? NULL,
      'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . urlencode($name),
      'profile_completed' => 1,
      'created_at' => $now,
      'updated_at' => $now,
    ])->execute();

    $u = $this->database->select('kp_users', 'u')
      ->fields('u')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();
    unset($u['password_hash']);

    return $this->jwt->successResponse($u, 201);
  }

  /**
   * POST /api/admin/users/bulk
   */
  public function bulkCreateUsers(Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $users = $data['users'] ?? $data;

    $created = 0;
    foreach ($users as $item) {
      if (!empty($item['email']) && !empty($item['name'])) {
        $id = 'user_' . bin2hex(random_bytes(16));
        $now = time();
        try {
          $this->database->insert('kp_users')->fields([
            'id' => $id,
            'email' => strtolower(trim($item['email'])),
            'password_hash' => password_hash($item['password'] ?? 'password123', PASSWORD_BCRYPT),
            'name' => trim($item['name']),
            'role' => strtoupper($item['role'] ?? 'STUDENT'),
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . urlencode($item['name']),
            'profile_completed' => 1,
            'created_at' => $now,
            'updated_at' => $now,
          ])->execute();
          $created++;
        } catch (\Exception $e) {}
      }
    }

    return $this->jwt->successResponse(['created' => $created]);
  }

  /**
   * PUT /api/admin/users/{id}/role
   */
  public function updateUserRole(string $id, Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $role = strtoupper($data['role'] ?? 'STUDENT');

    $this->database->update('kp_users')
      ->fields(['role' => $role, 'updated_at' => time()])
      ->condition('id', $id)
      ->execute();

    return $this->jwt->successResponse(['id' => $id, 'role' => $role]);
  }

  /**
   * DELETE /api/admin/users/{id}
   */
  public function deleteUser(string $id, Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $this->database->delete('kp_users')->condition('id', $id)->execute();
    return $this->jwt->successResponse(['message' => 'User deleted successfully']);
  }

  /**
   * GET /api/admin/reports
   */
  public function getReports(Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $totalUsers = (int)$this->database->select('kp_users', 'u')->countQuery()->execute()->fetchField();
    $totalStudents = (int)$this->database->select('kp_users', 'u')->condition('role', 'STUDENT')->countQuery()->execute()->fetchField();
    $totalMentors = (int)$this->database->select('kp_users', 'u')->condition('role', 'MENTOR')->countQuery()->execute()->fetchField();
    $totalBatches = (int)$this->database->select('kp_batches', 'b')->countQuery()->execute()->fetchField();
    $totalResources = (int)$this->database->select('kp_resources', 'r')->condition('deleted_at', NULL, 'IS NULL')->countQuery()->execute()->fetchField();

    // Total sessions: count of session-type resources + scheduled meetings + tracking events
    $sessionResourcesCount = (int)$this->database->select('kp_resources', 'r')
      ->condition('type', 'SESSION')
      ->condition('deleted_at', NULL, 'IS NULL')
      ->countQuery()
      ->execute()
      ->fetchField();
    $meetingsCount = (int)$this->database->select('kp_meetings', 'm')->countQuery()->execute()->fetchField();
    $totalSessions = max(1, $sessionResourcesCount + $meetingsCount);

    $attendedCount = (int)$this->database->select('kp_session_tracking', 'st')
      ->condition('attendance_marked', 1)
      ->countQuery()
      ->execute()
      ->fetchField();
    $totalTracked = (int)$this->database->select('kp_session_tracking', 'st')
      ->countQuery()
      ->execute()
      ->fetchField();

    $overallAttendance = $totalTracked > 0 ? round(($attendedCount / $totalTracked) * 100) : 0;

    // Real weekly engagement from kp_login_logs
    $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    $weeklyEngagement = [];
    foreach ($days as $day) {
      $weeklyEngagement[] = ['day' => $day, 'active' => 0];
    }
    $recentLogs = $this->database->select('kp_login_logs', 'l')
      ->fields('l', ['created_at'])
      ->condition('created_at', time() - (7 * 86400), '>=')
      ->execute()
      ->fetchCol();
    foreach ($recentLogs as $ts) {
      $dayName = date('D', $ts);
      foreach ($weeklyEngagement as &$we) {
        if ($we['day'] === $dayName) {
          $we['active']++;
        }
      }
    }

    // Real batch demographics from database
    $batches = $this->database->select('kp_batches', 'b')->fields('b')->execute()->fetchAllAssoc('id');
    $batchDemographics = [];
    foreach ($batches as $b) {
      $studentCount = (int)$this->database->select('kp_batch_students', 'bs')
        ->condition('batch_id', $b->id)
        ->countQuery()
        ->execute()
        ->fetchField();
      $batchDemographics[] = [
        'batch' => $b->name,
        'students' => $studentCount,
        'attendance' => 0,
      ];
    }

    // Recent session trackings with user & resource info
    $trackings = $this->database->select('kp_session_tracking', 'st')
      ->fields('st')
      ->orderBy('created_at', 'DESC')
      ->range(0, 10)
      ->execute()
      ->fetchAllAssoc('id');

    $recentTrackings = [];
    foreach ($trackings as $tr) {
      $userName = $this->database->select('kp_users', 'u')
        ->fields('u', ['name'])
        ->condition('id', $tr->user_id)
        ->execute()
        ->fetchField() ?: 'Student';

      $resourceTitle = $this->database->select('kp_resources', 'r')
        ->fields('r', ['title'])
        ->condition('id', $tr->resource_id)
        ->execute()
        ->fetchField() ?: 'Learning Session';

      $recentTrackings[] = [
        'id' => $tr->id,
        'user' => ['name' => $userName],
        'resource' => ['title' => $resourceTitle],
        'attendanceMarked' => (bool)$tr->attendance_marked,
        'completionPercentage' => (int)$tr->completion_percentage,
        'createdAt' => date('c', $tr->created_at),
      ];
    }

    $statsData = [
      'totalUsers' => $totalUsers,
      'totalStudents' => $totalStudents,
      'totalMentors' => $totalMentors,
      'totalBatches' => $totalBatches,
      'totalResources' => $totalResources,
      'totalSessions' => $totalSessions,
      'overallAttendance' => $overallAttendance,
    ];

    return $this->jwt->successResponse([
      'stats' => $statsData,
      'totalUsers' => $totalUsers,
      'totalStudents' => $totalStudents,
      'totalMentors' => $totalMentors,
      'totalBatches' => $totalBatches,
      'totalResources' => $totalResources,
      'totalSessions' => $totalSessions,
      'overallAttendance' => $overallAttendance,
      'weeklyEngagement' => $weeklyEngagement,
      'batchDemographics' => $batchDemographics,
      'recentTrackings' => $recentTrackings,
    ]);
  }

  /**
   * GET /api/admin/students
   */
  public function getStudents(Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $students = $this->database->select('kp_users', 'u')
      ->fields('u')
      ->condition('role', 'STUDENT')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($students as $s) {
      unset($s->password_hash);
      $list[] = $s;
    }
    return $this->jwt->successResponse($list);
  }

  /**
   * GET /api/admin/mentors
   */
  public function getMentors(Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $mentors = $this->database->select('kp_users', 'u')
      ->fields('u')
      ->condition('role', 'MENTOR')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($mentors as $m) {
      unset($m->password_hash);
      $list[] = $m;
    }
    return $this->jwt->successResponse($list);
  }

  /**
   * Helper to format a batch with full students and mentors lists.
   */
  protected function formatBatchDetails(object|array $batch): array {
    $batchArray = is_object($batch) ? (array)$batch : $batch;
    $batchId = $batchArray['id'];

    $studentIds = $this->database->select('kp_batch_students', 'bs')
      ->fields('bs', ['user_id'])
      ->condition('batch_id', $batchId)
      ->execute()
      ->fetchCol();

    $students = [];
    if (!empty($studentIds)) {
      $studentUsers = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'email', 'avatar'])
        ->condition('id', $studentIds, 'IN')
        ->execute()
        ->fetchAll();

      foreach ($studentUsers as $su) {
        $userData = [
          'id' => $su->id,
          'name' => $su->name,
          'email' => $su->email,
          'avatar' => $su->avatar,
        ];
        $students[] = array_merge($userData, ['student' => $userData]);
      }
    }

    $mentorIds = $this->database->select('kp_batch_mentors', 'bm')
      ->fields('bm', ['user_id'])
      ->condition('batch_id', $batchId)
      ->execute()
      ->fetchCol();

    $mentors = [];
    if (!empty($mentorIds)) {
      $mentorUsers = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'email', 'avatar'])
        ->condition('id', $mentorIds, 'IN')
        ->execute()
        ->fetchAll();

      foreach ($mentorUsers as $mu) {
        $userData = [
          'id' => $mu->id,
          'name' => $mu->name,
          'email' => $mu->email,
          'avatar' => $mu->avatar,
        ];
        $mentors[] = array_merge($userData, ['mentor' => $userData, 'user' => $userData]);
      }
    }

    return [
      'id' => $batchArray['id'],
      'name' => $batchArray['name'],
      'description' => $batchArray['description'] ?? '',
      'code' => $batchArray['code'] ?? '',
      'status' => 'ACTIVE',
      'startDate' => $batchArray['start_date'] ?? '',
      'endDate' => $batchArray['end_date'] ?? '',
      'students' => $students,
      'mentors' => $mentors,
      'studentsCount' => count($students),
      'mentorsCount' => count($mentors),
      '_count' => [
        'students' => count($students),
        'mentors' => count($mentors),
      ],
    ];
  }

  /**
   * GET /api/admin/batches
   */
  public function getBatches(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) return $this->jwt->unauthorizedResponse();

    $batches = $this->database->select('kp_batches', 'b')
      ->fields('b')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($batches as $b) {
      $list[] = $this->formatBatchDetails($b);
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * GET /api/admin/batches/{id}
   */
  public function getBatchById(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) return $this->jwt->unauthorizedResponse();

    $batch = $this->database->select('kp_batches', 'b')
      ->fields('b')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    if (!$batch) return $this->jwt->errorResponse('Batch not found', 404);

    return $this->jwt->successResponse($this->formatBatchDetails($batch));
  }

  /**
   * POST /api/admin/batches
   */
  public function createBatch(Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'batch_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_batches')->fields([
      'id' => $id,
      'name' => $data['name'] ?? 'New Batch',
      'description' => $data['description'] ?? '',
      'code' => $data['code'] ?? ('KP-' . date('Y')),
      'start_date' => $data['startDate'] ?? date('Y-m-d'),
      'end_date' => $data['endDate'] ?? date('Y-m-d', strtotime('+1 year')),
      'created_at' => $now,
      'updated_at' => $now,
    ])->execute();

    // Assign student IDs if provided
    $studentIds = $data['studentIds'] ?? [];
    foreach ($studentIds as $sId) {
      if (!empty($sId)) {
        try {
          $this->database->insert('kp_batch_students')->fields([
            'id' => 'bs_' . bin2hex(random_bytes(16)),
            'batch_id' => $id,
            'user_id' => $sId,
            'joined_at' => $now,
          ])->execute();
        } catch (\Exception $e) {}
      }
    }

    // Assign mentor IDs if provided
    $mentorIds = $data['mentorIds'] ?? [];
    if (!empty($data['mentorId']) && !in_array($data['mentorId'], $mentorIds)) {
      $mentorIds[] = $data['mentorId'];
    }
    foreach ($mentorIds as $mId) {
      if (!empty($mId)) {
        try {
          $this->database->insert('kp_batch_mentors')->fields([
            'id' => 'bm_' . bin2hex(random_bytes(16)),
            'batch_id' => $id,
            'user_id' => $mId,
            'assigned_at' => $now,
          ])->execute();
        } catch (\Exception $e) {}
      }
    }

    $b = $this->database->select('kp_batches', 'b')->fields('b')->condition('id', $id)->execute()->fetchAssoc();
    return $this->jwt->successResponse($this->formatBatchDetails($b), 201);
  }

  /**
   * PUT /api/admin/batches/{id}
   */
  public function updateBatch(string $id, Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $updateFields = ['updated_at' => time()];
    if (isset($data['name'])) $updateFields['name'] = $data['name'];
    if (isset($data['description'])) $updateFields['description'] = $data['description'];
    if (isset($data['code'])) $updateFields['code'] = $data['code'];

    $this->database->update('kp_batches')
      ->fields($updateFields)
      ->condition('id', $id)
      ->execute();

    // Sync student IDs if explicitly provided
    if (isset($data['studentIds']) && is_array($data['studentIds'])) {
      $this->database->delete('kp_batch_students')->condition('batch_id', $id)->execute();
      foreach ($data['studentIds'] as $sId) {
        if (!empty($sId)) {
          try {
            $this->database->insert('kp_batch_students')->fields([
              'id' => 'bs_' . bin2hex(random_bytes(16)),
              'batch_id' => $id,
              'user_id' => $sId,
              'joined_at' => time(),
            ])->execute();
          } catch (\Exception $e) {}
        }
      }
    }

    // Sync mentor IDs if explicitly provided
    if (isset($data['mentorIds']) && is_array($data['mentorIds'])) {
      $this->database->delete('kp_batch_mentors')->condition('batch_id', $id)->execute();
      foreach ($data['mentorIds'] as $mId) {
        if (!empty($mId)) {
          try {
            $this->database->insert('kp_batch_mentors')->fields([
              'id' => 'bm_' . bin2hex(random_bytes(16)),
              'batch_id' => $id,
              'user_id' => $mId,
              'assigned_at' => time(),
            ])->execute();
          } catch (\Exception $e) {}
        }
      }
    }

    $b = $this->database->select('kp_batches', 'b')->fields('b')->condition('id', $id)->execute()->fetchAssoc();
    return $this->jwt->successResponse($this->formatBatchDetails($b));
  }

  /**
   * DELETE /api/admin/batches/{id}
   */
  public function deleteBatch(string $id, Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $this->database->delete('kp_batches')->condition('id', $id)->execute();
    $this->database->delete('kp_batch_students')->condition('batch_id', $id)->execute();
    $this->database->delete('kp_batch_mentors')->condition('batch_id', $id)->execute();

    return $this->jwt->successResponse(['message' => 'Batch deleted']);
  }

  /**
   * POST /api/admin/batches/{id}/students
   */
  public function addStudents(string $id, Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $studentIds = $data['studentIds'] ?? [];

    foreach ($studentIds as $sId) {
      try {
        $this->database->insert('kp_batch_students')->fields([
          'id' => 'bs_' . bin2hex(random_bytes(16)),
          'batch_id' => $id,
          'user_id' => $sId,
          'joined_at' => time(),
        ])->execute();
      } catch (\Exception $e) {}
    }

    return $this->jwt->successResponse(['message' => 'Students added to batch']);
  }

  /**
   * DELETE /api/admin/batches/{id}/students/{studentId}
   */
  public function removeStudent(string $id, string $studentId, Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $this->database->delete('kp_batch_students')
      ->condition('batch_id', $id)
      ->condition('user_id', $studentId)
      ->execute();

    return $this->jwt->successResponse(['message' => 'Student removed from batch']);
  }

  /**
   * POST /api/admin/batches/{id}/mentors
   */
  public function addMentors(string $id, Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $mentorIds = $data['mentorIds'] ?? [];

    foreach ($mentorIds as $mId) {
      try {
        $this->database->insert('kp_batch_mentors')->fields([
          'id' => 'bm_' . bin2hex(random_bytes(16)),
          'batch_id' => $id,
          'user_id' => $mId,
          'assigned_at' => time(),
        ])->execute();
      } catch (\Exception $e) {}
    }

    return $this->jwt->successResponse(['message' => 'Mentors assigned to batch']);
  }

  /**
   * DELETE /api/admin/batches/{id}/mentors/{mentorId}
   */
  public function removeMentor(string $id, string $mentorId, Request $request): JsonResponse {
    if ($err = $this->requireAdmin($request)) return $err;

    $this->database->delete('kp_batch_mentors')
      ->condition('batch_id', $id)
      ->condition('user_id', $mentorId)
      ->execute();

    return $this->jwt->successResponse(['message' => 'Mentor removed from batch']);
  }
}

