<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Quizzes and Assessments.
 */
class QuizController extends ControllerBase {

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
   * POST /api/quizzes
   */
  public function createQuiz(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'quiz_' . bin2hex(random_bytes(16));

    $this->database->insert('kp_quizzes')->fields([
      'id' => $id,
      'title' => $data['title'] ?? 'New Quiz',
      'description' => $data['description'] ?? '',
      'batch_id' => $data['batchId'] ?? NULL,
      'created_by_id' => $user['id'],
      'duration_minutes' => (int)($data['durationMinutes'] ?? 30),
      'passing_score' => (int)($data['passingScore'] ?? 70),
      'questions' => !empty($data['questions']) ? json_encode($data['questions']) : '[]',
      'created_at' => time(),
    ])->execute();

    $quiz = $this->database->select('kp_quizzes', 'q')
      ->fields('q')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();
    $quiz['questions'] = json_decode($quiz['questions'], TRUE);

    return $this->jwt->successResponse($quiz, 201);
  }

  /**
   * GET /api/quizzes/mentor
   */
  public function getMentorQuizzes(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $quizzes = $this->database->select('kp_quizzes', 'q')
      ->fields('q')
      ->condition('created_by_id', $user['id'])
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($quizzes as $q) {
      $submissionCount = (int)$this->database->select('kp_quiz_submissions', 'qs')
        ->condition('quiz_id', $q->id)
        ->countQuery()
        ->execute()
        ->fetchField();

      $list[] = [
        'id' => $q->id,
        'title' => $q->title,
        'description' => $q->description,
        'durationMinutes' => (int)$q->duration_minutes,
        'passingScore' => (int)$q->passing_score,
        'questionsCount' => count(json_decode($q->questions ?: '[]', TRUE)),
        'submissionsCount' => $submissionCount,
        'createdAt' => date('c', $q->created_at),
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * GET /api/quizzes/student
   */
  public function getStudentQuizzes(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $quizzes = $this->database->select('kp_quizzes', 'q')
      ->fields('q')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($quizzes as $q) {
      $sub = $this->database->select('kp_quiz_submissions', 'qs')
        ->fields('qs')
        ->condition('quiz_id', $q->id)
        ->condition('student_id', $user['id'])
        ->execute()
        ->fetchAssoc();

      $list[] = [
        'id' => $q->id,
        'title' => $q->title,
        'description' => $q->description,
        'durationMinutes' => (int)$q->duration_minutes,
        'passingScore' => (int)$q->passing_score,
        'questionsCount' => count(json_decode($q->questions ?: '[]', TRUE)),
        'submitted' => !empty($sub),
        'score' => $sub ? (int)$sub['score'] : null,
        'passed' => $sub ? (bool)$sub['passed'] : null,
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * GET /api/quizzes/{id}
   */
  public function getQuizDetails(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $q = $this->database->select('kp_quizzes', 'q')
      ->fields('q')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    if (!$q) {
      return $this->jwt->errorResponse('Quiz not found', 404);
    }

    $q['questions'] = json_decode($q['questions'] ?: '[]', TRUE);

    $sub = $this->database->select('kp_quiz_submissions', 'qs')
      ->fields('qs')
      ->condition('quiz_id', $id)
      ->condition('student_id', $user['id'])
      ->execute()
      ->fetchAssoc();
    $q['submission'] = $sub ?: null;

    return $this->jwt->successResponse($q);
  }

  /**
   * POST /api/quizzes/{id}/start
   */
  public function startQuiz(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    return $this->jwt->successResponse([
      'started' => true,
      'startedAt' => date('c'),
    ]);
  }

  /**
   * POST /api/quizzes/{id}/submit
   */
  public function submitQuiz(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $answers = $data['answers'] ?? [];

    $q = $this->database->select('kp_quizzes', 'q')
      ->fields('q')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    if (!$q) {
      return $this->jwt->errorResponse('Quiz not found', 404);
    }

    $questions = json_decode($q['questions'] ?: '[]', TRUE);
    $totalQuestions = count($questions);
    $correctCount = 0;

    foreach ($questions as $idx => $question) {
      $correctIndex = $question['correctIndex'] ?? $question['correctAnswer'] ?? $question['answer'] ?? 0;
      $qId = $question['id'] ?? (string)$idx;
      $submittedAnswer = $answers[$qId] ?? ($answers[$idx] ?? null);
      if ($submittedAnswer !== null && (int)$submittedAnswer === (int)$correctIndex) {
        $correctCount++;
      }
    }

    $score = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 100) : 100;
    $passingScore = (int)($q['passing_score'] ?: 70);
    $passed = $score >= $passingScore ? 1 : 0;

    $subId = 'qsub_' . bin2hex(random_bytes(16));
    $this->database->insert('kp_quiz_submissions')->fields([
      'id' => $subId,
      'quiz_id' => $id,
      'student_id' => $user['id'],
      'score' => $score,
      'total_score' => 100,
      'passed' => $passed,
      'answers' => json_encode($answers),
      'submitted_at' => time(),
    ])->execute();

    return $this->jwt->successResponse([
      'score' => $score,
      'totalQuestions' => $totalQuestions,
      'correctCount' => $correctCount,
      'passed' => (bool)$passed,
    ]);
  }
}

