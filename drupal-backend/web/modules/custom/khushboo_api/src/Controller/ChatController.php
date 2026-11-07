<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Messaging & Chat.
 */
class ChatController extends ControllerBase {

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
   * GET /api/chat/groups
   */
  public function getGroups(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $groups = $this->database->select('kp_chat_groups', 'g')
      ->fields('g')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAllAssoc('id');

    $list = [];
    foreach ($groups as $g) {
      $lastMsg = $this->database->select('kp_chat_messages', 'm')
        ->fields('m')
        ->condition('group_id', $g->id)
        ->orderBy('created_at', 'DESC')
        ->range(0, 1)
        ->execute()
        ->fetchAssoc();

      $list[] = [
        'id' => $g->id,
        'name' => $g->name,
        'type' => $g->type,
        'lastMessage' => $lastMsg ?: null,
        'createdAt' => date('c', $g->created_at),
      ];
    }

    return $this->jwt->successResponse($list);
  }

  /**
   * POST /api/chat/groups
   */
  public function createGroup(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'grp_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_chat_groups')->fields([
      'id' => $id,
      'name' => $data['name'] ?? 'General Channel',
      'type' => $data['type'] ?? 'GROUP',
      'batch_id' => $data['batchId'] ?? NULL,
      'created_by_id' => $user['id'],
      'created_at' => $now,
    ])->execute();

    $this->database->insert('kp_chat_members')->fields([
      'id' => 'mem_' . bin2hex(random_bytes(16)),
      'group_id' => $id,
      'user_id' => $user['id'],
      'role' => 'ADMIN',
      'joined_at' => $now,
    ])->execute();

    $group = $this->database->select('kp_chat_groups', 'g')
      ->fields('g')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($group, 201);
  }

  /**
   * POST /api/chat/groups/direct
   */
  public function createDirect(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $targetId = $data['userId'] ?? null;

    $targetUser = $this->database->select('kp_users', 'u')
      ->fields('u', ['name'])
      ->condition('id', $targetId)
      ->execute()
      ->fetchAssoc();

    $id = 'dm_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_chat_groups')->fields([
      'id' => $id,
      'name' => ($targetUser['name'] ?? 'Direct Message'),
      'type' => 'DIRECT',
      'created_by_id' => $user['id'],
      'created_at' => $now,
    ])->execute();

    return $this->jwt->successResponse(['id' => $id, 'name' => $targetUser['name'] ?? 'Direct Message', 'type' => 'DIRECT'], 201);
  }

  /**
   * POST /api/chat/groups/batch
   */
  public function createBatchGroup(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $batchId = $data['batchId'] ?? null;

    $batch = $this->database->select('kp_batches', 'b')
      ->fields('b', ['name'])
      ->condition('id', $batchId)
      ->execute()
      ->fetchAssoc();

    $id = 'bgrp_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_chat_groups')->fields([
      'id' => $id,
      'name' => ($batch['name'] ?? 'Batch Channel'),
      'type' => 'BATCH',
      'batch_id' => $batchId,
      'created_by_id' => $user['id'],
      'created_at' => $now,
    ])->execute();

    return $this->jwt->successResponse(['id' => $id, 'name' => $batch['name'] ?? 'Batch Channel', 'type' => 'BATCH'], 201);
  }

  /**
   * GET /api/chat/groups/{groupId}/messages
   */
  public function getMessages(string $groupId, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $messagesRaw = $this->database->select('kp_chat_messages', 'm')
      ->fields('m')
      ->condition('group_id', $groupId)
      ->orderBy('created_at', 'ASC')
      ->execute()
      ->fetchAllAssoc('id');

    $messages = [];
    foreach ($messagesRaw as $m) {
      $sender = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'avatar', 'role'])
        ->condition('id', $m->sender_id)
        ->execute()
        ->fetchAssoc();

      $messages[] = [
        'id' => $m->id,
        'groupId' => $m->group_id,
        'content' => $m->content,
        'attachments' => !empty($m->attachments) ? json_decode($m->attachments, TRUE) : [],
        'sender' => $sender,
        'createdAt' => date('c', $m->created_at),
      ];
    }

    return $this->jwt->successResponse($messages);
  }

  /**
   * POST /api/chat/groups/{groupId}/messages
   */
  public function sendMessage(string $groupId, Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id = 'msg_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_chat_messages')->fields([
      'id' => $id,
      'group_id' => $groupId,
      'sender_id' => $user['id'],
      'content' => $data['content'] ?? '',
      'attachments' => !empty($data['attachments']) ? json_encode($data['attachments']) : '[]',
      'created_at' => $now,
    ])->execute();

    $msg = [
      'id' => $id,
      'groupId' => $groupId,
      'content' => $data['content'] ?? '',
      'attachments' => $data['attachments'] ?? [],
      'sender' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'avatar' => $user['avatar'],
        'role' => $user['role'],
      ],
      'createdAt' => date('c', $now),
    ];

    return $this->jwt->successResponse($msg, 201);
  }

  /**
   * POST /api/chat/upload
   */
  public function upload(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $file = $request->files->get('file');
    if ($file && $file->isValid()) {
      $filename = 'chat_' . time() . '_' . $file->getClientOriginalName();
      $destination = \Drupal::root() . '/sites/default/files/chat';
      if (!is_dir($destination)) {
        mkdir($destination, 0777, TRUE);
      }
      $file->move($destination, $filename);
      $url = '/sites/default/files/chat/' . $filename;

      return $this->jwt->successResponse([
        'url' => $url,
        'name' => $file->getClientOriginalName(),
        'size' => $file->getSize(),
      ]);
    }

    return $this->jwt->errorResponse('No file provided', 400);
  }

  /**
   * GET /api/chat/users
   */
  public function getUsers(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $users = $this->database->select('kp_users', 'u')
      ->fields('u', ['id', 'name', 'email', 'avatar', 'role'])
      ->condition('id', $user['id'], '!=')
      ->execute()
      ->fetchAllAssoc('id');

    return $this->jwt->successResponse(array_values($users));
  }

  /**
   * GET /api/chat/contacts
   */
  public function getContacts(Request $request): JsonResponse {
    return $this->getUsers($request);
  }

  /**
   * GET /api/chat/invites
   */
  public function getInvites(Request $request): JsonResponse {
    return $this->jwt->successResponse([]);
  }

  /**
   * PUT /api/chat/invites/{id}
   */
  public function respondInvite(string $id, Request $request): JsonResponse {
    return $this->jwt->successResponse(['status' => 'ACCEPTED']);
  }

  /**
   * GET /api/chat/sync
   * Real-time live synchronization endpoint for chat messages.
   */
  public function sync(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $since = (int)$request->query->get('since', 0);
    $groupId = $request->query->get('groupId');

    $query = $this->database->select('kp_chat_messages', 'm')
      ->fields('m');

    if (!empty($groupId)) {
      $query->condition('group_id', $groupId);
    }
    if ($since > 0) {
      $query->condition('created_at', $since, '>');
    }

    $messagesRaw = $query->orderBy('created_at', 'ASC')->range(0, 50)->execute()->fetchAllAssoc('id');
    $messages = [];
    foreach ($messagesRaw as $m) {
      $sender = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'avatar', 'role'])
        ->condition('id', $m->sender_id)
        ->execute()
        ->fetchAssoc();

      $messages[] = [
        'id' => $m->id,
        'groupId' => $m->group_id,
        'content' => $m->content,
        'attachments' => !empty($m->attachments) ? json_decode($m->attachments, TRUE) : [],
        'sender' => $sender,
        'createdAt' => date('c', $m->created_at),
        'timestamp' => (int)$m->created_at,
      ];
    }

    return $this->jwt->successResponse([
      'messages' => $messages,
      'serverTime' => time(),
    ]);
  }
}

