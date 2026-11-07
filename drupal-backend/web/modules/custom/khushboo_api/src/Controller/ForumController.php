<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Discussion Forum & Q&A.
 */
class ForumController extends ControllerBase {

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
   * GET /api/forum/posts
   */
  public function getPosts(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $batchId = $request->query->get('batchId');
    $query = $this->database->select('kp_forum_posts', 'p')->fields('p');

    if (!empty($batchId)) {
      $query->condition('batch_id', $batchId);
    }

    $posts = $query->orderBy('created_at', 'DESC')->execute()->fetchAllAssoc('id');

    $list = [];
    foreach ($posts as $p) {
      $author = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'avatar', 'role'])
        ->condition('id', $p->user_id)
        ->execute()
        ->fetchAssoc();

      $answerCount = (int)$this->database->select('kp_forum_answers', 'a')
        ->condition('post_id', $p->id)
        ->countQuery()
        ->execute()
        ->fetchField();

      $list[] = [
        'id' => $p->id,
        'title' => $p->title,
        'content' => $p->content,
        'tags' => !empty($p->tags) ? explode(',', $p->tags) : [],
        'upvotes' => (int)$p->upvotes,
        'author' => $author,
        'answersCount' => $answerCount,
        'createdAt' => date('c', $p->created_at),
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * GET /api/forum/posts/{id}
   */
  public function getPostById(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $post = $this->database->select('kp_forum_posts', 'p')
      ->fields('p')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    if (!$post) {
      return $this->jwt->errorResponse('Post not found', 404);
    }

    $author = $this->database->select('kp_users', 'u')
      ->fields('u', ['id', 'name', 'avatar', 'role'])
      ->condition('id', $post['user_id'])
      ->execute()
      ->fetchAssoc();

    $answersRaw = $this->database->select('kp_forum_answers', 'a')
      ->fields('a')
      ->condition('post_id', $id)
      ->orderBy('upvotes', 'DESC')
      ->orderBy('created_at', 'ASC')
      ->execute()
      ->fetchAllAssoc('id');

    $answers = [];
    foreach ($answersRaw as $ans) {
      $ansAuthor = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'avatar', 'role'])
        ->condition('id', $ans->user_id)
        ->execute()
        ->fetchAssoc();

      $answers[] = [
        'id' => $ans->id,
        'content' => $ans->content,
        'upvotes' => (int)$ans->upvotes,
        'isAccepted' => (bool)$ans->is_accepted,
        'author' => $ansAuthor,
        'createdAt' => date('c', $ans->created_at),
      ];
    }

    $post['author'] = $author;
    $post['tags'] = !empty($post['tags']) ? explode(',', $post['tags']) : [];
    $post['answers'] = $answers;

    return $this->jwt->successResponse($post);
  }

  /**
   * POST /api/forum/posts
   */
  public function createPost(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'post_' . bin2hex(random_bytes(16));
    $now = time();

    $tags = is_array($data['tags'] ?? null) ? implode(',', $data['tags']) : ($data['tags'] ?? '');

    $this->database->insert('kp_forum_posts')->fields([
      'id' => $id,
      'user_id' => $user['id'],
      'batch_id' => $data['batchId'] ?? NULL,
      'title' => $data['title'] ?? 'Question',
      'content' => $data['content'] ?? '',
      'tags' => $tags,
      'upvotes' => 0,
      'created_at' => $now,
      'updated_at' => $now,
    ])->execute();

    $post = $this->database->select('kp_forum_posts', 'p')
      ->fields('p')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($post, 201);
  }

  /**
   * POST /api/forum/posts/{postId}/answers
   */
  public function createAnswer(string $postId, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'ans_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_forum_answers')->fields([
      'id' => $id,
      'post_id' => $postId,
      'user_id' => $user['id'],
      'content' => $data['content'] ?? '',
      'upvotes' => 0,
      'is_accepted' => 0,
      'created_at' => $now,
    ])->execute();

    $answer = $this->database->select('kp_forum_answers', 'a')
      ->fields('a')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($answer, 201);
  }

  /**
   * POST /api/forum/answers/{answerId}/upvote
   */
  public function upvoteAnswer(string $answerId, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $this->database->update('kp_forum_answers')
      ->expression('upvotes', 'upvotes + 1')
      ->condition('id', $answerId)
      ->execute();

    $votes = (int)$this->database->select('kp_forum_answers', 'a')
      ->fields('a', ['upvotes'])
      ->condition('id', $answerId)
      ->execute()
      ->fetchField();

    return $this->jwt->successResponse(['upvotes' => $votes]);
  }

  /**
   * POST /api/forum/posts/{id}/upvote
   */
  public function upvotePost(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $this->database->update('kp_forum_posts')
      ->expression('upvotes', 'upvotes + 1')
      ->condition('id', $id)
      ->execute();

    $votes = (int)$this->database->select('kp_forum_posts', 'p')
      ->fields('p', ['upvotes'])
      ->condition('id', $id)
      ->execute()
      ->fetchField();

    return $this->jwt->successResponse(['upvotes' => $votes]);
  }

  /**
   * DELETE /api/forum/posts/{id}
   */
  public function deletePost(string $id, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $this->database->delete('kp_forum_answers')
      ->condition('post_id', $id)
      ->execute();

    $this->database->delete('kp_forum_posts')
      ->condition('id', $id)
      ->execute();

    return $this->jwt->successResponse(['message' => 'Post deleted successfully']);
  }
}

