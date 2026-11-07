<?php

namespace Drupal\khushboo_api\Service;

use GuzzleHttp\ClientInterface;

/**
 * Service for Google Gemini AI integrations in pure PHP.
 */
class GeminiService {

  protected ClientInterface $httpClient;
  protected string $apiKey;

  public function __construct(ClientInterface $httpClient) {
    $this->httpClient = $httpClient;
    // Check environment variable or fallback to provided project API key
    $this->apiKey = getenv('GEMINI_API_KEY') ?: 'AIzaSyA715Aw-FYLq7IllHybBLCIcLGLc2X8Hw8';
  }

  /**
   * Ask Gemini a question with conversation history.
   */
  public function ask(string $question, array $conversationHistory = []): string {
    if (empty($this->apiKey)) {
      return "Hello! I am your Khushboo Pathshala AI Learning Assistant. Please configure GEMINI_API_KEY to activate full AI responses.";
    }

    try {
      $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $this->apiKey;

      $contents = [];
      foreach ($conversationHistory as $msg) {
        $role = ($msg['role'] ?? 'user') === 'assistant' ? 'model' : 'user';
        $contents[] = [
          'role' => $role,
          'parts' => [['text' => $msg['content'] ?? '']],
        ];
      }
      $contents[] = [
        'role' => 'user',
        'parts' => [['text' => $question]],
      ];

      $systemInstruction = [
        'parts' => [
          ['text' => 'You are Khushboo Pathshala Tutor, a helpful, encouraging, and highly intelligent AI learning companion for scholars of the Cybage Khushboo scholarship program. Help students with technical computer science topics, full stack coding, web development, interview preparation, soft skills, and study plans. Keep your responses clear, practical, structured, and easy to understand.'],
        ],
      ];

      $response = $this->httpClient->request('POST', $endpoint, [
        'json' => [
          'system_instruction' => $systemInstruction,
          'contents' => $contents,
          'generationConfig' => [
            'temperature' => 0.7,
            'maxOutputTokens' => 1500,
          ],
        ],
        'headers' => [
          'Content-Type' => 'application/json',
        ],
        'timeout' => 30,
      ]);

      $body = json_decode((string) $response->getBody(), TRUE);
      return $body['candidates'][0]['content']['parts'][0]['text'] ?? 'Sorry, I could not generate a response right now.';
    }
    catch (\Exception $e) {
      return "I encountered a brief connection issue. Please try again shortly. (" . $e->getMessage() . ")";
    }
  }

  /**
   * Generate a structured study roadmap via Gemini 2.5 Flash with JSON schema.
   */
  public function generateRoadmap(string $topic, int $days): array {
    if (!empty($this->apiKey)) {
      try {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $this->apiKey;

        $prompt = "Create a comprehensive, highly practical, day-by-day learning roadmap for mastering '{$topic}' over exactly {$days} days. Return a valid JSON object with the following schema:
{
  \"title\": \"string (e.g. Mastering {$topic})\",
  \"description\": \"string (overview of what the student will achieve)\",
  \"days\": [
    {
      \"day\": 1,
      \"title\": \"string (daily theme)\",
      \"description\": \"string (concise summary of day goal)\",
      \"topics\": [\"specific concept 1\", \"specific concept 2\", \"specific concept 3\"],
      \"tasks\": [\"actionable exercise or code practice 1\", \"actionable exercise 2\"]
    }
  ]
}";

        $response = $this->httpClient->request('POST', $endpoint, [
          'json' => [
            'contents' => [
              [
                'parts' => [['text' => $prompt]],
              ],
            ],
            'generationConfig' => [
              'temperature' => 0.3,
              'responseMimeType' => 'application/json',
              'maxOutputTokens' => 4096,
            ],
          ],
          'headers' => [
            'Content-Type' => 'application/json',
          ],
          'timeout' => 45,
        ]);

        $body = json_decode((string) $response->getBody(), TRUE);
        $rawJson = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $parsed = json_decode($rawJson, TRUE);

        if (is_array($parsed) && !empty($parsed['days'])) {
          $parsed['topic'] = $topic;
          $parsed['duration'] = "{$days} Days";
          return $parsed;
        }
      }
      catch (\Exception $e) {
        // Fallback to structured generator below if AI times out
      }
    }

    // High quality fallback structure
    $roadmapDays = [];
    for ($i = 1; $i <= $days; $i++) {
      $roadmapDays[] = [
        'day' => $i,
        'title' => "Day {$i}: {$topic} Core Concepts & Implementation",
        'description' => "Cover core foundational principles, architecture patterns, and hands-on exercises for {$topic}.",
        'topics' => [
          "Core syntax & mental models for {$topic}",
          "Design patterns and best practices",
          "Debugging and error handling",
          "Mini project feature build",
        ],
        'tasks' => [
          "Study key concepts for {$topic}",
          "Build a working demonstration module",
          "Test edge cases and document findings",
        ],
      ];
    }

    return [
      'title' => "Mastering {$topic}",
      'topic' => $topic,
      'duration' => "{$days} Days",
      'overview' => "Comprehensive {$days}-day structured learning roadmap for {$topic}.",
      'description' => "Step-by-step curated curriculum to achieve mastery in {$topic}.",
      'days' => $roadmapDays,
    ];
  }
}
