<?php

namespace Drupal\Tests\khushboo_api\Unit;

use Drupal\Core\Database\Connection;
use Drupal\khushboo_api\Service\JwtAuthService;
use Drupal\Tests\UnitTestCase;
use Symfony\Component\HttpFoundation\Request;

/**
 * Unit tests for JwtAuthService.
 *
 * @group khushboo_api
 */
class JwtAuthServiceTest extends UnitTestCase {

  protected Connection $database;
  protected JwtAuthService $jwtService;

  protected function setUp(): void {
    parent::setUp();
    $this->database = $this->createMock(Connection::class);
    $this->jwtService = new JwtAuthService($this->database);
  }

  /**
   * Tests that generateToken returns a non-empty string.
   */
  public function testGenerateToken(): void {
    $user = [
      'id' => 'user_test_123',
      'email' => 'scholar@cybage.com',
      'role' => 'STUDENT',
      'name' => 'Scholar Test',
    ];

    $token = $this->jwtService->generateToken($user);
    $this->assertIsString($token);
    $this->assertNotEmpty($token);
    // JWT has 3 parts separated by dots
    $parts = explode('.', $token);
    $this->assertCount(3, $parts);
  }

  /**
   * Tests authenticate returns null when no token is provided.
   */
  public function testAuthenticateNoToken(): void {
    $request = new Request();
    $result = $this->jwtService->authenticate($request);
    $this->assertNull($result);
  }

  /**
   * Tests authenticate returns null when malformed token is provided.
   */
  public function testAuthenticateInvalidToken(): void {
    $request = new Request();
    $request->headers->set('Authorization', 'Bearer invalid.malformed.token');
    $result = $this->jwtService->authenticate($request);
    $this->assertNull($result);
  }

  /**
   * Tests unauthorizedResponse format.
   */
  public function testUnauthorizedResponse(): void {
    $response = $this->jwtService->unauthorizedResponse('Access denied');
    $this->assertEquals(401, $response->getStatusCode());
    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertEquals('UNAUTHORIZED', $data['error']['code']);
  }

  /**
   * Tests forbiddenResponse format.
   */
  public function testForbiddenResponse(): void {
    $response = $this->jwtService->forbiddenResponse('Admin access required');
    $this->assertEquals(403, $response->getStatusCode());
    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertEquals('FORBIDDEN', $data['error']['code']);
  }
}
