<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Student endpoints.
 */
class StudentController extends ControllerBase {

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
   * GET /api/student/dashboard
   */
  public function dashboard(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $userId = $user['id'];

    // Trackings
    $trackings = $this->database->select('kp_session_tracking', 'st')
      ->fields('st')
      ->condition('user_id', $userId)
      ->execute()
      ->fetchAllAssoc('id');

    $totalTracked = count($trackings);
    $attendedCount = 0;
    $totalProgress = 0;
    foreach ($trackings as $t) {
      if (!empty($t->attendance_marked)) {
        $attendedCount++;
      }
      $totalProgress += (int)$t->completion_percentage;
    }

    $totalCourses = (int)$this->database->select('kp_resources', 'r')
      ->condition('deleted_at', NULL, 'IS NULL')
      ->countQuery()
      ->execute()
      ->fetchField();
    if ($totalCourses < 1) {
      $totalCourses = 1;
    }

    $attendancePercentage = $totalCourses > 0 ? round(($attendedCount / $totalCourses) * 100) : 0;
    $avgProgress = $totalCourses > 0 ? min(100, round(($totalProgress / max(1, $totalCourses * 100)) * 100)) : 0;

    // Login logs for loginDates / heatmap
    $logs = $this->database->select('kp_login_logs', 'l')
      ->fields('l', ['created_at'])
      ->condition('user_id', $userId)
      ->orderBy('created_at', 'ASC')
      ->execute()
      ->fetchCol();

    $loginDates = [];
    foreach ($logs as $ts) {
      $loginDates[] = date('Y-m-d', $ts);
    }
    if (empty($loginDates)) {
      $loginDates = [date('Y-m-d')];
    }
    $loginDates = array_values(array_unique($loginDates));

    // Upcoming sessions / meetings
    $meetings = $this->database->select('kp_meetings', 'm')
      ->fields('m')
      ->orderBy('created_at', 'DESC')
      ->range(0, 5)
      ->execute()
      ->fetchAllAssoc('id');

    $upcomingSessions = [];
    foreach ($meetings as $m) {
      $mentorName = 'Rakesh Sinha';
      if ($m->mentor_id) {
        $name = $this->database->select('kp_users', 'u')
          ->fields('u', ['name'])
          ->condition('id', $m->mentor_id)
          ->execute()
          ->fetchField();
        if ($name) $mentorName = $name;
      }
      $upcomingSessions[] = [
        'id' => $m->id,
        'title' => $m->title,
        'description' => $m->description,
        'scheduledAt' => $m->scheduled_at,
        'meetingLink' => $m->meeting_link,
        'mentor' => [
          'name' => $mentorName,
          'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . urlencode($mentorName),
        ],
      ];
    }

    // Announcements
    $announcementsRaw = $this->database->select('kp_announcements', 'a')
      ->fields('a')
      ->orderBy('created_at', 'DESC')
      ->range(0, 5)
      ->execute()
      ->fetchAllAssoc('id');
    $announcements = [];
    foreach ($announcementsRaw as $a) {
      $announcements[] = [
        'id' => $a->id,
        'title' => $a->title,
        'content' => $a->content,
        'priority' => $a->priority,
        'createdAt' => date('c', $a->created_at),
      ];
    }

    // Upcoming Assignments
    $assignmentsRaw = $this->database->select('kp_assignments', 'ass')
      ->fields('ass')
      ->orderBy('created_at', 'DESC')
      ->range(0, 5)
      ->execute()
      ->fetchAllAssoc('id');
    $upcomingAssignments = [];
    foreach ($assignmentsRaw as $ass) {
      $upcomingAssignments[] = [
        'id' => $ass->id,
        'title' => $ass->title,
        'description' => $ass->description,
        'dueDate' => $ass->due_date,
      ];
    }

    // Batches enrolled by student
    $enrolledBatchIds = $this->database->select('kp_batch_students', 'bs')
      ->fields('bs', ['batch_id'])
      ->condition('user_id', $userId)
      ->execute()
      ->fetchCol();

    $bQuery = $this->database->select('kp_batches', 'b')->fields('b');
    if (!empty($enrolledBatchIds)) {
      $bQuery->condition('id', $enrolledBatchIds, 'IN');
    }
    $batchesRaw = $bQuery->execute()->fetchAllAssoc('id');
    $batches = [];
    foreach ($batchesRaw as $b) {
      $mentorId = $this->database->select('kp_batch_mentors', 'bm')
        ->fields('bm', ['user_id'])
        ->condition('batch_id', $b->id)
        ->execute()
        ->fetchField();
      $mentor = null;
      if ($mentorId) {
        $mentor = $this->database->select('kp_users', 'u')
          ->fields('u', ['id', 'name', 'email', 'avatar'])
          ->condition('id', $mentorId)
          ->execute()
          ->fetchAssoc();
      }
      $batches[] = [
        'id' => $b->id,
        'name' => $b->name,
        'code' => $b->code,
        'description' => $b->description,
        'mentor' => $mentor,
      ];
    }

    $recentActivities = [];
    foreach ($trackings as $t) {
      $resTitle = $this->database->select('kp_resources', 'r')
        ->fields('r', ['title'])
        ->condition('id', $t->resource_id)
        ->execute()
        ->fetchField();

      $recentActivities[] = [
        'id' => 'act_' . $t->id,
        'type' => $t->attendance_marked ? 'ATTENDANCE' : 'WATCH',
        'description' => $t->attendance_marked ? ("Completed attendance: " . ($resTitle ?: 'Course')) : ("Watched: " . ($resTitle ?: 'Session')),
        'createdAt' => date('c', $t->updated_at),
      ];
    }

    // Assignments stats
    $totalAssignments = 0;
    if (!empty($enrolledBatchIds)) {
      $totalAssignments = (int)$this->database->select('kp_assignments', 'ass')
        ->condition('batch_id', $enrolledBatchIds, 'IN')
        ->countQuery()
        ->execute()
        ->fetchField();
    } else {
      $totalAssignments = (int)$this->database->select('kp_assignments', 'ass')
        ->countQuery()
        ->execute()
        ->fetchField();
    }

    $submittedAssignments = (int)$this->database->select('kp_assignment_submissions', 'sub')
      ->condition('student_id', $userId)
      ->countQuery()
      ->execute()
      ->fetchField();

    $reviewedAssignments = (int)$this->database->select('kp_assignment_submissions', 'sub')
      ->condition('student_id', $userId)
      ->condition('status', 'REVIEWED')
      ->countQuery()
      ->execute()
      ->fetchField();

    return $this->jwt->successResponse([
      'stats' => [
        'attendancePercentage' => $attendancePercentage,
        'avgProgress' => $avgProgress,
        'completedCourses' => $attendedCount,
        'totalCourses' => $totalCourses,
        'badgesCount' => $attendedCount * 2,
        'activeDays' => count($loginDates),
        'attendanceCount' => $attendedCount,
        'totalAssignments' => $totalAssignments,
        'submittedAssignments' => $submittedAssignments,
        'reviewedAssignments' => $reviewedAssignments,
      ],
      'loginDates' => $loginDates,
      'upcomingSessions' => $upcomingSessions,
      'announcements' => $announcements,
      'upcomingAssignments' => $upcomingAssignments,
      'batches' => array_values($batches),
      'recentActivities' => $recentActivities,
    ]);
  }

  /**
   * GET /api/student/resources
   */
  public function resources(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $resources = $this->database->select('kp_resources', 'r')
      ->fields('r')
      ->condition('deleted_at', NULL, 'IS NULL')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

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
   * GET /api/student/batches
   */
  public function batches(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $enrolledBatchIds = $this->database->select('kp_batch_students', 'bs')
      ->fields('bs', ['batch_id'])
      ->condition('user_id', $user['id'])
      ->execute()
      ->fetchCol();

    $query = $this->database->select('kp_batches', 'b')->fields('b');
    if (!empty($enrolledBatchIds)) {
      $query->condition('id', $enrolledBatchIds, 'IN');
    }

    $batches = $query->execute()->fetchAllAssoc('id');

    $list = [];
    foreach ($batches as $b) {
      $mentorId = $this->database->select('kp_batch_mentors', 'bm')
        ->fields('bm', ['user_id'])
        ->condition('batch_id', $b->id)
        ->execute()
        ->fetchField();

      $mentor = null;
      if ($mentorId) {
        $mentor = $this->database->select('kp_users', 'u')
          ->fields('u', ['id', 'name', 'email', 'avatar'])
          ->condition('id', $mentorId)
          ->execute()
          ->fetchAssoc();
      }

      $list[] = [
        'id' => $b->id,
        'name' => $b->name,
        'code' => $b->code,
        'description' => $b->description,
        'startDate' => $b->start_date,
        'endDate' => $b->end_date,
        'mentor' => $mentor,
      ];
    }

    return $this->jwt->successResponse($list);
  }
}

