<?php
/**
 * Central Data Collector — receives callbacks from ALL PoC test pages
 * Logs every request (XSS callbacks, CSRF fires, SSRF probes, phishing captures, bypass attempts)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$LOG_DIR = __DIR__ . '/logs';
if (!is_dir($LOG_DIR)) mkdir($LOG_DIR, 0777, true);

$timestamp = date('Y-m-d H:i:s');
$client_ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

// Collect request data
$raw_input = file_get_contents('php://input');
$json_data = json_decode($raw_input, true);
$request_data = $json_data ?: $_POST ?: $_GET;

// Determine test category from URL parameter or data
$category = $_GET['cat'] ?? $request_data['category'] ?? 'unknown';
$test_name = $_GET['test'] ?? $request_data['test'] ?? 'unknown';

$entry = [
    'timestamp'  => $timestamp,
    'category'   => $category,
    'test'       => $test_name,
    'ip'         => $client_ip,
    'user_agent' => substr($user_agent, 0, 150),
    'method'     => $_SERVER['REQUEST_METHOD'],
    'referer'    => $_SERVER['HTTP_REFERER'] ?? '',
    'query'      => $_SERVER['QUERY_STRING'] ?? '',
    'data'       => $request_data,
    'raw_body'   => strlen($raw_input) > 0 ? substr($raw_input, 0, 5000) : null,
    'cookies'    => $_COOKIE ?: null,
    'headers'    => [
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
        'origin'       => $_SERVER['HTTP_ORIGIN'] ?? '',
        'x_requested'  => $_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''
    ]
];

// Append to unified log
$log_line = json_encode($entry) . "\n";
file_put_contents($LOG_DIR . '/collector.jsonl', $log_line, FILE_APPEND | LOCK_EX);

// Also write per-category logs
$cat_file = $LOG_DIR . '/' . preg_replace('/[^a-z0-9_-]/i', '', $category) . '.jsonl';
file_put_contents($cat_file, $log_line, FILE_APPEND | LOCK_EX);

// Return success
echo json_encode([
    'status'    => 'received',
    'id'        => uniqid('evt_'),
    'timestamp' => $timestamp,
    'category'  => $category
]);
