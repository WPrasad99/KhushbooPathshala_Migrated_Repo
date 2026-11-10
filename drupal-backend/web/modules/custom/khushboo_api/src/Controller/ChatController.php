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
 *
 * API contract (all responses wrapped in {success, data}):
 *  - groupType: lowercase string ('direct' | 'group' | 'batch')
 *  - members:   [{userId, role, user: {id, name, avatar, role}}]
 *  - messages:  {id, groupId, content, attachments, senderId, sender, createdAt}
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

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Map DB type (uppercase) to frontend groupType (lowercase).
   */
  private function mapGroupType(string $type): string {
    return strtolower($type); // DIRECT→direct, BATCH→batch, GROUP→group
  }

  /**
   * Fetch all members of a group with their user profile.
   *
   * @return array [{userId, role, user: {id, name, avatar, role}}]
   */
  private function getGroupMembers(string $groupId): array {
    $rows = $this->database->select('kp_chat_members', 'cm')
      ->fields('cm', ['user_id', 'role'])
      ->condition('group_id', $groupId)
      ->execute()
      ->fetchAll();

    $members = [];
    foreach ($rows as $row) {
      $user = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'avatar', 'role'])
        ->condition('id', $row->user_id)
        ->execute()
        ->fetchAssoc();

      $members[] = [
        'userId' => $row->user_id,
        'role'   => $row->role,
        'user'   => $user ?: ['id' => $row->user_id, 'name' => 'Unknown', 'avatar' => null, 'role' => null],
      ];
    }
    return $members;
  }

  /**
   * Build the full group response object (with groupType, members, lastMessage).
   */
  private function buildGroupObject($g): array {
    $groupId = is_object($g) ? $g->id : $g['id'];
    $name    = is_object($g) ? $g->name : $g['name'];
    $type    = is_object($g) ? $g->type : $g['type'];
    $batchId = is_object($g) ? ($g->batch_id ?? null) : ($g['batch_id'] ?? null);
    $createdAt = is_object($g) ? $g->created_at : $g['created_at'];

    // Last message
    $lastMsg = $this->database->select('kp_chat_messages', 'm')
      ->fields('m')
      ->condition('group_id', $groupId)
      ->orderBy('created_at', 'DESC')
      ->range(0, 1)
      ->execute()
      ->fetchAssoc();

    $lastMessageObj = null;
    if ($lastMsg) {
      $lastMessageObj = [
        'id'        => $lastMsg['id'],
        'content'   => $lastMsg['content'],
        'senderId'  => $lastMsg['sender_id'],
        'createdAt' => date('c', (int) $lastMsg['created_at']),
      ];
    }

    return [
      'id'          => $groupId,
      'name'        => $name,
      'groupType'   => $this->mapGroupType($type),
      'batchId'     => $batchId,
      'members'     => $this->getGroupMembers($groupId),
      'lastMessage' => $lastMessageObj,
      'createdAt'   => date('c', (int) $createdAt),
    ];
  }

  /**
   * Check if a DM group already exists between two users.
   * Returns the group id or null.
   */
  private function findExistingDM(string $userId1, string $userId2): ?string {
    // Find all DIRECT groups where userId1 is a member
    $groups1 = $this->database->select('kp_chat_groups', 'g')
      ->fields('g', ['id'])
      ->condition('type', 'DIRECT')
      ->execute()
      ->fetchCol();

    if (empty($groups1)) return null;

    foreach ($groups1 as $groupId) {
      // Check if both users are members of this group
      $members = $this->database->select('kp_chat_members', 'cm')
        ->fields('cm', ['user_id'])
        ->condition('group_id', $groupId)
        ->execute()
        ->fetchCol();

      if (in_array($userId1, $members) && in_array($userId2, $members)) {
        return $groupId;
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public endpoints
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/chat/groups
   * Returns only groups where the authenticated user is a member.
   */
  public function getGroups(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    // Get all group IDs where current user is a member
    $memberGroupIds = $this->database->select('kp_chat_members', 'cm')
      ->fields('cm', ['group_id'])
      ->condition('user_id', $user['id'])
      ->execute()
      ->fetchCol();

    if (empty($memberGroupIds)) {
      return $this->jwt->successResponse([]);
    }

    $groups = $this->database->select('kp_chat_groups', 'g')
      ->fields('g')
      ->condition('id', $memberGroupIds, 'IN')
      ->orderBy('created_at', 'DESC')
      ->execute()
      ->fetchAll();

    $list = [];
    foreach ($groups as $g) {
      $list[] = $this->buildGroupObject($g);
    }

    // Sort WhatsApp-style: most recent active conversation at the top
    usort($list, function($a, $b) {
      $timeA = !empty($a['lastMessage']['createdAt']) ? strtotime($a['lastMessage']['createdAt']) : strtotime($a['createdAt']);
      $timeB = !empty($b['lastMessage']['createdAt']) ? strtotime($b['lastMessage']['createdAt']) : strtotime($b['createdAt']);
      return $timeB <=> $timeA;
    });

    return $this->jwt->successResponse($list);
  }

  /**
   * POST /api/chat/groups
   * Create a new named group channel.
   */
  public function createGroup(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $id  = 'grp_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_chat_groups')->fields([
      'id'            => $id,
      'name'          => $data['name'] ?? 'General Channel',
      'type'          => 'GROUP',
      'batch_id'      => $data['batchId'] ?? NULL,
      'created_by_id' => $user['id'],
      'created_at'    => $now,
    ])->execute();

    // Add creator as ADMIN
    $this->database->insert('kp_chat_members')->fields([
      'id'        => 'mem_' . bin2hex(random_bytes(16)),
      'group_id'  => $id,
      'user_id'   => $user['id'],
      'role'      => 'ADMIN',
      'joined_at' => $now,
    ])->execute();

    // Add invited members if provided
    $inviteIds = $data['memberIds'] ?? [];
    foreach ($inviteIds as $memberId) {
      if ($memberId === $user['id']) continue; // Skip duplicate
      $this->database->insert('kp_chat_members')->fields([
        'id'        => 'mem_' . bin2hex(random_bytes(16)),
        'group_id'  => $id,
        'user_id'   => $memberId,
        'role'      => 'MEMBER',
        'joined_at' => $now,
      ])->execute();
    }

    $group = $this->database->select('kp_chat_groups', 'g')
      ->fields('g')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($this->buildGroupObject($group), 201);
  }

  /**
   * POST /api/chat/groups/direct
   * Find or create a direct message conversation between two users.
   */
  public function createDirect(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data     = json_decode($request->getContent(), TRUE) ?? [];
    $targetId = $data['userId'] ?? null;

    if (!$targetId) {
      return $this->jwt->errorResponse('userId is required', 400);
    }

    // Look up target user
    $targetUser = $this->database->select('kp_users', 'u')
      ->fields('u', ['id', 'name', 'avatar', 'role'])
      ->condition('id', $targetId)
      ->execute()
      ->fetchAssoc();

    if (!$targetUser) {
      return $this->jwt->errorResponse('Target user not found', 404);
    }

    // ── De-duplicate: check if DM already exists ──────────────────────────
    $existingId = $this->findExistingDM($user['id'], $targetId);
    if ($existingId) {
      $existingGroup = $this->database->select('kp_chat_groups', 'g')
        ->fields('g')
        ->condition('id', $existingId)
        ->execute()
        ->fetchAssoc();
      return $this->jwt->successResponse($this->buildGroupObject($existingGroup));
    }

    // ── Create new DM ─────────────────────────────────────────────────────
    $id  = 'dm_' . bin2hex(random_bytes(16));
    $now = time();

    // Name the DM after the OTHER user (from each user's perspective the name is irrelevant
    // since we display the other member's name in frontend, but keep it recognizable)
    $dmName = $targetUser['name'];

    $this->database->insert('kp_chat_groups')->fields([
      'id'            => $id,
      'name'          => $dmName,
      'type'          => 'DIRECT',
      'created_by_id' => $user['id'],
      'created_at'    => $now,
    ])->execute();

    // Add BOTH users to kp_chat_members
    $this->database->insert('kp_chat_members')->fields([
      'id'        => 'mem_' . bin2hex(random_bytes(16)),
      'group_id'  => $id,
      'user_id'   => $user['id'],
      'role'      => 'MEMBER',
      'joined_at' => $now,
    ])->execute();

    $this->database->insert('kp_chat_members')->fields([
      'id'        => 'mem_' . bin2hex(random_bytes(16)),
      'group_id'  => $id,
      'user_id'   => $targetId,
      'role'      => 'MEMBER',
      'joined_at' => $now,
    ])->execute();

    $group = $this->database->select('kp_chat_groups', 'g')
      ->fields('g')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($this->buildGroupObject($group), 201);
  }

  /**
   * POST /api/chat/groups/batch
   * Find or create a batch group channel (one per batch).
   */
  public function createBatchGroup(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data    = json_decode($request->getContent(), TRUE) ?? [];
    $batchId = $data['batchId'] ?? null;

    if (!$batchId) {
      return $this->jwt->errorResponse('batchId is required', 400);
    }

    // Check if batch group already exists for this batch
    $existing = $this->database->select('kp_chat_groups', 'g')
      ->fields('g')
      ->condition('type', 'BATCH')
      ->condition('batch_id', $batchId)
      ->execute()
      ->fetchAssoc();

    if ($existing) {
      // Add current user as member if not already
      $isMember = $this->database->select('kp_chat_members', 'cm')
        ->fields('cm', ['id'])
        ->condition('group_id', $existing['id'])
        ->condition('user_id', $user['id'])
        ->execute()
        ->fetchField();

      if (!$isMember) {
        $this->database->insert('kp_chat_members')->fields([
          'id'        => 'mem_' . bin2hex(random_bytes(16)),
          'group_id'  => $existing['id'],
          'user_id'   => $user['id'],
          'role'      => 'MEMBER',
          'joined_at' => time(),
        ])->execute();
      }

      return $this->jwt->successResponse($this->buildGroupObject($existing));
    }

    $batch = $this->database->select('kp_batches', 'b')
      ->fields('b', ['name'])
      ->condition('id', $batchId)
      ->execute()
      ->fetchAssoc();

    $id  = 'bgrp_' . bin2hex(random_bytes(16));
    $now = time();

    $this->database->insert('kp_chat_groups')->fields([
      'id'            => $id,
      'name'          => ($batch['name'] ?? 'Batch Channel'),
      'type'          => 'BATCH',
      'batch_id'      => $batchId,
      'created_by_id' => $user['id'],
      'created_at'    => $now,
    ])->execute();

    $this->database->insert('kp_chat_members')->fields([
      'id'        => 'mem_' . bin2hex(random_bytes(16)),
      'group_id'  => $id,
      'user_id'   => $user['id'],
      'role'      => 'ADMIN',
      'joined_at' => $now,
    ])->execute();

    $group = $this->database->select('kp_chat_groups', 'g')
      ->fields('g')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $this->jwt->successResponse($this->buildGroupObject($group), 201);
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
      ->fetchAll();

    $messages = [];
    foreach ($messagesRaw as $m) {
      $sender = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'avatar', 'role'])
        ->condition('id', $m->sender_id)
        ->execute()
        ->fetchAssoc();

      $messages[] = [
        'id'          => $m->id,
        'groupId'     => $m->group_id,
        'content'     => $m->content,
        'attachments' => !empty($m->attachments) ? json_decode($m->attachments, TRUE) : [],
        'senderId'    => $m->sender_id,
        'sender'      => $sender ?: ['id' => $m->sender_id, 'name' => 'Unknown'],
        'createdAt'   => date('c', (int) $m->created_at),
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
    $id   = 'msg_' . bin2hex(random_bytes(16));
    $now  = time();

    $this->database->insert('kp_chat_messages')->fields([
      'id'          => $id,
      'group_id'    => $groupId,
      'sender_id'   => $user['id'],
      'content'     => $data['content'] ?? '',
      'attachments' => !empty($data['attachments']) ? json_encode($data['attachments']) : '[]',
      'created_at'  => $now,
    ])->execute();

    // Trigger instant alert in alert box for other members
    $otherMembers = $this->database->select('kp_chat_members', 'cm')
      ->fields('cm', ['user_id'])
      ->condition('group_id', $groupId)
      ->condition('user_id', $user['id'], '!=')
      ->execute()
      ->fetchCol();

    $senderName = $user['name'] ?? 'User';
    $snippet    = !empty($data['content']) ? mb_substr($data['content'], 0, 90) : 'Sent an attachment';

    foreach ($otherMembers as $recipientId) {
      $this->database->insert('kp_notifications')->fields([
        'id'         => 'notif_' . bin2hex(random_bytes(16)),
        'user_id'    => $recipientId,
        'title'      => '💬 ' . $senderName,
        'message'    => $snippet,
        'type'       => 'CHAT',
        'is_read'    => 0,
        'link'       => '/messages',
        'created_at' => $now,
      ])->execute();
    }

    $msg = [
      'id'          => $id,
      'groupId'     => $groupId,
      'content'     => $data['content'] ?? '',
      'attachments' => $data['attachments'] ?? [],
      'senderId'    => $user['id'],
      'sender'      => [
        'id'     => $user['id'],
        'name'   => $user['name'],
        'avatar' => $user['avatar'] ?? null,
        'role'   => $user['role'],
      ],
      'createdAt'   => date('c', $now),
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
      $filename    = 'chat_' . time() . '_' . $file->getClientOriginalName();
      $destination = \Drupal::root() . '/sites/default/files/chat';
      if (!is_dir($destination)) {
        mkdir($destination, 0777, TRUE);
      }
      $file->move($destination, $filename);
      $url = '/sites/default/files/chat/' . $filename;

      return $this->jwt->successResponse([
        'url'  => $url,
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
      ->fetchAll();

    $list = [];
    foreach ($users as $u) {
      $list[] = [
        'id'     => $u->id,
        'name'   => $u->name,
        'email'  => $u->email,
        'avatar' => $u->avatar,
        'role'   => $u->role,
      ];
    }

    return $this->jwt->successResponse($list);
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
   * Real-time live synchronization endpoint for chat messages (polling fallback).
   */
  public function sync(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $since   = (int) $request->query->get('since', 0);
    $groupId = $request->query->get('groupId');

    $query = $this->database->select('kp_chat_messages', 'm')
      ->fields('m');

    if (!empty($groupId)) {
      $query->condition('group_id', $groupId);
    } else {
      // Find all groups where the user is a member
      $memberGroupIds = $this->database->select('kp_chat_members', 'cm')
        ->fields('cm', ['group_id'])
        ->condition('user_id', $user['id'])
        ->execute()
        ->fetchCol();

      if (empty($memberGroupIds)) {
        return $this->jwt->successResponse([
          'messages'   => [],
          'serverTime' => time(),
        ]);
      }
      $query->condition('group_id', $memberGroupIds, 'IN');
    }

    if ($since > 0) {
      $query->condition('created_at', $since, '>');
    }

    $messagesRaw = $query->orderBy('created_at', 'ASC')->range(0, 50)->execute()->fetchAll();
    $messages    = [];
    foreach ($messagesRaw as $m) {
      $sender = $this->database->select('kp_users', 'u')
        ->fields('u', ['id', 'name', 'avatar', 'role'])
        ->condition('id', $m->sender_id)
        ->execute()
        ->fetchAssoc();

      $messages[] = [
        'id'          => $m->id,
        'groupId'     => $m->group_id,
        'content'     => $m->content,
        'attachments' => !empty($m->attachments) ? json_decode($m->attachments, TRUE) : [],
        'senderId'    => $m->sender_id,
        'sender'      => $sender ?: ['id' => $m->sender_id, 'name' => 'Unknown'],
        'createdAt'   => date('c', (int) $m->created_at),
        'timestamp'   => (int) $m->created_at,
      ];
    }

    return $this->jwt->successResponse([
      'messages'   => $messages,
      'serverTime' => time(),
    ]);
  }

  /**
   * GET /api/chat/unread-count
   * Returns count of unread chat messages for the current user.
   */
  public function getUnreadCount(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $count = (int) $this->database->select('kp_notifications', 'n')
      ->condition('user_id', $user['id'])
      ->condition('type', 'CHAT')
      ->condition('is_read', 0)
      ->countQuery()
      ->execute()
      ->fetchField();

    return $this->jwt->successResponse(['unreadCount' => $count]);
  }

  /**
   * POST /api/chat/read
   * Mark all chat notifications as read for current user.
   */
  public function markRead(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $this->database->update('kp_notifications')
      ->fields(['is_read' => 1])
      ->condition('user_id', $user['id'])
      ->condition('type', 'CHAT')
      ->execute();

    return $this->jwt->successResponse(['success' => TRUE]);
  }
}
