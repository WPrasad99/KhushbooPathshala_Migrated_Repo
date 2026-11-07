<?php

namespace Drupal\khushboo_api\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Enterprise CORS Event Subscriber for Khushboo Pathshala API.
 */
class CorsSubscriber implements EventSubscriberInterface {

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [
      KernelEvents::REQUEST => ['onRequest', 1000],
      KernelEvents::RESPONSE => ['onResponse', -1000],
    ];
  }

  /**
   * Handle preflight OPTIONS requests early.
   */
  public function onRequest(RequestEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }

    $request = $event->getRequest();
    $path = $request->getPathInfo();

    if (!str_starts_with($path, '/api/')) {
      return;
    }

    if ($request->getMethod() === 'OPTIONS') {
      $origin = $request->headers->get('Origin') ?: 'http://localhost:5173';
      $response = new Response('', 204);
      $response->headers->set('Access-Control-Allow-Origin', $origin);
      $response->headers->set('Access-Control-Allow-Credentials', 'true');
      $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Origin, X-Requested-With');
      $response->headers->set('Access-Control-Max-Age', '86400');
      $event->setResponse($response);
    }
  }

  /**
   * Add CORS headers to all /api/ responses.
   */
  public function onResponse(ResponseEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }

    $request = $event->getRequest();
    $path = $request->getPathInfo();

    if (!str_starts_with($path, '/api/')) {
      return;
    }

    $response = $event->getResponse();
    $origin = $request->headers->get('Origin');
    if (!$origin) {
      $origin = 'http://localhost:5173';
    }

    $response->headers->set('Access-Control-Allow-Origin', $origin);
    $response->headers->set('Access-Control-Allow-Credentials', 'true');
    $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Origin, X-Requested-With');
    $response->headers->set('Access-Control-Expose-Headers', 'Authorization, Content-Type');
  }
}

