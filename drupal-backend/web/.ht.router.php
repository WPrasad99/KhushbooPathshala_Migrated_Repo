<?php

/**
 * @file
 * Router script for the built-in PHP web server with Universal CORS.
 */

if (PHP_SAPI !== 'cli-server') {
  header($_SERVER['SERVER_PROTOCOL'] . ' 403 Forbidden');
  exit;
}

// Immediate Preflight OPTIONS handling before Drupal boots
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
  header("Access-Control-Allow-Origin: $origin");
  header("Access-Control-Allow-Credentials: true");
  header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
  header("Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Origin, X-Requested-With, Cache-Control");
  header("Access-Control-Expose-Headers: Authorization, Content-Type");
  header("Access-Control-Max-Age: 86400");
  http_response_code(204);
  exit;
}

$url = parse_url($_SERVER['REQUEST_URI']);
if (file_exists(__DIR__ . $url['path'])) {
  return FALSE;
}

$path = $url['path'];
$script = 'index.php';
if (str_contains($path, '.php')) {
  do {
    $path = dirname($path);
    if (preg_match('/\.php$/', $path) && is_file(__DIR__ . $path)) {
      $script = ltrim($path, '/');
      break;
    }
  } while ($path !== '/' && $path !== '.');
}

$index_file_absolute = $_SERVER['DOCUMENT_ROOT'] . DIRECTORY_SEPARATOR . $script;
$index_file_relative = DIRECTORY_SEPARATOR . $script;

$_SERVER['SCRIPT_FILENAME'] = $index_file_absolute;
$_SERVER['SCRIPT_NAME'] = $index_file_relative;
$_SERVER['PHP_SELF'] = $index_file_relative;

require $_SERVER['SCRIPT_FILENAME'];
