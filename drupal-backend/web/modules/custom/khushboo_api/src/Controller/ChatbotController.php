<?php

namespace Drupal\khushboo_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\khushboo_api\Service\GeminiService;
use Drupal\khushboo_api\Service\JwtAuthService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for AI Chatbot tutor.
 */
class ChatbotController extends ControllerBase {

  protected JwtAuthService $jwt;
  protected GeminiService $gemini;

  public function __construct(JwtAuthService $jwt, GeminiService $gemini) {
    $this->jwt = $jwt;
    $this->gemini = $gemini;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('khushboo_api.jwt'),
      $container->get('khushboo_api.gemini')
    );
  }

  /**
   * POST /api/chatbot/ask
   */
  public function ask(Request $request): JsonResponse {
    $user = $this->jwt->authenticate($request);
    if (!$user) {
      return $this->jwt->unauthorizedResponse();
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];
    $question = trim($data['question'] ?? '');
    $history = $data['conversationHistory'] ?? [];

    if (empty($question)) {
      return $this->jwt->errorResponse('Question cannot be empty', 400);
    }

    $reply = $this->gemini->ask($question, $history);

    return $this->jwt->successResponse([
      'reply' => $reply,
      'message' => $reply,
      'answer' => $reply,
      'timestamp' => date('c'),
    ]);
  }
}

