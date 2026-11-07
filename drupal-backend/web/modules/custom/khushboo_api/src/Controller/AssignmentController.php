<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Assignments and Submissions.
 */
class AssignmentController extends ControllerBase {

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
   * GET /api/assignments
   */
  public function getAll(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $batchId = $request->query->get('batchId');
    $query = $this->database->select('kp_assignments', 'a')->fields('a');

    if (!empty($batchId)) {
      $query->condition('batch_id', $batchId);
    }

    $assignments = $query->orderBy('created_at', 'DESC')->execute()->fetchAllAssoc('id');

    $list = [];
    foreach ($assignments as $a) {
      $sub = $this->database->select('kp_assignment_submissions', 's')
        ->fields('s')
        ->condition('assignment_id', $a->id)
        ->condition('student_id', $user['id'])
        ->execute()
        ->fetchAssoc();

      $submissionsCount = (int)$this->database->select('kp_assignment_submissions', 's')
        ->condition('assignment_id', $a->id)
        ->countQuery()
        ->execute()
        ->fetchField();

      $reviewedCount = (int)$this->database->select('kp_assignment_submissions', 's')
        ->condition('assignment_id', $a->id)
        ->condition('status', 'REVIEWED')
        ->countQuery()
        ->execute()
        ->fetchField();

      $batchStudentsCount = 0;
      if (!empty($a->batch_id)) {
        $batchStudentsCount = (int)$this->database->select('kp_batch_students', 'bs')
          ->condition('batch_id', $a->batch_id)
          ->countQuery()
          ->execute()
          ->fetchField();
      }

      $list[] = [
        'id' => $a->id,
        'title' => $a->title,
        'description' => $a->description,
        'batchId' => $a->batch_id,
        'dueDate' => $a->due_date,
        'createdAt' => date('c', $a->created_at),
        'submissionsCount' => $submissionsCount,
        'reviewedCount' => $reviewedCount,
        'batchStudentsCount' => $batchStudentsCount,
        'maxMarks' => 100,
        'submission' => $sub ?: null,
        'submitted' => !empty($sub),
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * GET /api/assignments/{id}
   */
  public function getOne(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $a = $this->database->select('kp_assignments', 'a')
      ->fields('a')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    if (!$a) {
      return $this->jwt->errorResponse('Assignment not found', 404);
    }

    $submissions = $this->database->select('kp_assignment_submissions', 's')
      ->fields('s')
      ->condition('assignment_id', $id)
      ->execute()
      ->fetchAllAssoc('id');

    $mySubmission = null;
    $allSubs = [];
    foreach ($submissions as $s) {
      $student = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'email', 'avatar'])
        ->condition('id', $s->student_id)
        ->execute()
        ->fetchAssoc();

      $subData = [
        'id' => $s->id,
        'studentId' => $s->student_id,
        'student' => $student,
        'submissionUrl' => $s->submission_url,
        'filePath' => $s->file_path,
        'notes' => $s->notes,
        'grade' => $s->grade,
        'feedback' => $s->feedback,
        'status' => $s->status,
        'submittedAt' => date('c', $s->submitted_at),
      ];

      if ($s->student_id === $user['id']) {
        $mySubmission = $subData;
      }
      $allSubs[] = $subData;
    }

    $a['mySubmission'] = $mySubmission;
    $a['submissions'] = $allSubs;

    return $this->jwt->successResponse($a);
  }

  /**
   * POST /api/assignments
   */
  public function createAssignment(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'assign_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_assignments')->fields([
      'id' => $id,
      'title' => $data['title'] ?? 'New Assignment',
      'description' => $data['description'] ?? '',
      'batch_id' => $data['batchId'] ?? NULL,
      'due_date' => $data['dueDate'] ?? date('Y-m-d', strtotime('+7 days')),
      'created_by_id' => $user['id'],
      'created_at' => $now,
      'updated_at' => $now,
    ])->execute();

    $record = $this->database->select('kp_assignments', 'a')
      ->fields('a')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($record, 201);
  }

  /**
   * POST /api/assignments/{id}/submit
   */
  public function submitAssignment(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $submissionUrl = $request->request->get('submissionUrl');
    $notes = $request->request->get('notes') ?? '';

    $file = $request->files->get('file');
    $filePath = '';
    if ($file && $file->isValid()) {
      $filename = 'sub_' . $user['id'] . '_' . time() . '.' . $file->guessExtension();
      $destination = \Drupal::root() . '/sites/default/files/submissions';
      if (!is_dir($destination)) {
        mkdir($destination, 0777, TRUE);
      }
      $file->move($destination, $filename);
      $filePath = '/sites/default/files/submissions/' . $filename;
    }

    if (!$submissionUrl && !$filePath) {
      $json = json_decode($request->getContent(), TRUE) ?? [];
      $submissionUrl = $json['submissionUrl'] ?? '';
      $notes = $json['notes'] ?? '';
    }

    $subId = 'sub_' . bin2hex(random_bytes(16));
    $now = time();

    // Check existing
    $existing = $this->database->select('kp_assignment_submissions', 's')
      ->fields('s', ['id'])
      ->condition('assignment_id', $id)
      ->condition('student_id', $user['id'])
      ->execute()
      ->fetchField();

    if ($existing) {
      $this->database->update('kp_assignment_submissions')
        ->fields([
          'submission_url' => $submissionUrl,
          'file_path' => $filePath,
          'notes' => $notes,
          'status' => 'SUBMITTED',
          'submitted_at' => $now,
        ])
        ->condition('id', $existing)
        ->execute();
      $subId = $existing;
    } else {
      $this->database->insert('kp_assignment_submissions')->fields([
        'id' => $subId,
        'assignment_id' => $id,
        'student_id' => $user['id'],
        'submission_url' => $submissionUrl,
        'file_path' => $filePath,
        'notes' => $notes,
        'status' => 'SUBMITTED',
        'submitted_at' => $now,
      ])->execute();
    }

    $submission = $this->database->select('kp_assignment_submissions', 's')
      ->fields('s')
      ->condition('id', $subId)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($submission);
  }

  /**
   * PUT /api/assignments/submissions/{submissionId}/review
   */
  public function reviewSubmission(string $submissionId, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];

    $this->database->update('kp_assignment_submissions')
      ->fields([
        'grade' => $data['grade'] ?? 'A',
        'feedback' => $data['feedback'] ?? 'Great effort!',
        'status' => $data['status'] ?? 'REVIEWED',
        'reviewed_at' => time(),
        'reviewed_by_id' => $user['id'],
      ])
      ->condition('id', $submissionId)
      ->execute();

    $submission = $this->database->select('kp_assignment_submissions', 's')
      ->fields('s')
      ->condition('id', $submissionId)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($submission);
  }

  /**
   * DELETE /api/assignments/{id}
   */
  public function deleteAssignment(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $this->database->delete('kp_assignment_submissions')
      ->condition('assignment_id', $id)
      ->execute();

    $this->database->delete('kp_assignments')
      ->condition('id', $id)
      ->execute();

    return $this->jwt->successResponse(['message' => 'Assignment deleted successfully']);
  }
}

