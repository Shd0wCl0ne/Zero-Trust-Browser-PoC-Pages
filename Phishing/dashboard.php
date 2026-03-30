<?php
/**
 * Admin Dashboard — view all collected data from every PoC test
 * Access: http://SERVER/dashboard.php?key=ztbrowser2026
 */

// Simple auth
if (($_GET['key'] ?? '') !== 'ztbrowser2026') {
    http_response_code(403);
    echo '<h1>403 Forbidden</h1><p>Append ?key=ztbrowser2026 to access.</p>';
    exit;
}

$LOG_DIR = __DIR__ . '/logs';
$PHISHING_DIR = __DIR__ . '/phishing/data';

// Parse action
$action = $_GET['action'] ?? 'overview';
$cat_filter = $_GET['cat'] ?? '';

// Load collector logs
function load_logs($file, $limit = 200) {
    if (!file_exists($file)) return [];
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $lines = array_reverse($lines); // newest first
    $entries = [];
    foreach (array_slice($lines, 0, $limit) as $line) {
        $d = json_decode($line, true);
        if ($d) $entries[] = $d;
    }
    return $entries;
}

function load_phishing_csv($file) {
    if (!file_exists($file)) return [];
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $header = str_getcsv(array_shift($lines));
    $rows = [];
    foreach (array_reverse($lines) as $line) {
        $vals = str_getcsv($line);
        if (count($vals) === count($header)) {
            $rows[] = array_combine($header, $vals);
        }
    }
    return $rows;
}

// Count stats
$all_logs = load_logs("$LOG_DIR/collector.jsonl", 500);
$phishing_csv = load_phishing_csv("$PHISHING_DIR/processed/payments.csv");
$raw_files = glob("$PHISHING_DIR/raw/*.json");

$categories = [];
foreach ($all_logs as $e) {
    $c = $e['category'] ?? 'unknown';
    $categories[$c] = ($categories[$c] ?? 0) + 1;
}

// Filter if needed
$display_logs = $cat_filter ? array_filter($all_logs, function($e) use ($cat_filter) { return ($e['category'] ?? '') === $cat_filter; }) : $all_logs;
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ZT Browser Test — Admin Dashboard</title>
    <meta http-equiv="refresh" content="15">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#0a0a0a; color:#c0c0c0; font-family:'Courier New',monospace; padding:20px; }
        h1 { color:#ff6600; margin-bottom:5px; }
        h2 { color:#00bfff; margin:20px 0 10px; }
        .subtitle { color:#666; margin-bottom:20px; font-size:13px; }
        .stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:15px; margin:20px 0; }
        .stat-card { background:#111; border:1px solid #333; border-radius:8px; padding:20px; text-align:center; }
        .stat-card .num { font-size:36px; color:#00ff41; font-weight:bold; }
        .stat-card .label { color:#888; font-size:13px; margin-top:5px; }
        .stat-card.phish .num { color:#ff4444; }
        .stat-card.xss .num { color:#ffaa00; }
        .stat-card.csrf .num { color:#aa44ff; }
        .stat-card.ssrf .num { color:#00bfff; }
        .stat-card.bypass .num { color:#ff6600; }
        table { width:100%; border-collapse:collapse; margin:10px 0; font-size:13px; }
        th,td { border:1px solid #222; padding:8px 10px; text-align:left; }
        th { background:#1a1a2e; color:#00bfff; position:sticky; top:0; }
        tr:hover { background:#1a1a1a; }
        .tag { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:bold; }
        .tag-phishing { background:#330000; color:#ff4444; }
        .tag-xss { background:#332200; color:#ffaa00; }
        .tag-csrf { background:#220033; color:#aa44ff; }
        .tag-ssrf { background:#002233; color:#00bfff; }
        .tag-bypass { background:#331a00; color:#ff6600; }
        .tag-unknown { background:#222; color:#888; }
        .nav { margin:15px 0; }
        .nav a { color:#00ff41; background:#1a1a2e; border:1px solid #333; padding:8px 16px; text-decoration:none; border-radius:4px; margin-right:5px; font-family:monospace; font-size:13px; }
        .nav a:hover, .nav a.active { background:#00ff41; color:#000; }
        .raw { background:#000; border:1px solid #333; padding:10px; font-size:12px; max-height:200px; overflow:auto; white-space:pre-wrap; word-break:break-all; color:#0f0; margin:5px 0; }
        .empty { color:#666; padding:40px; text-align:center; }
        .refresh { color:#444; font-size:12px; float:right; }
    </style>
</head>
<body>
    <h1>ZERO-TRUST BROWSER TEST — ADMIN DASHBOARD</h1>
    <p class="subtitle">Live collection results from all PoC test pages <span class="refresh">Auto-refresh: 15s | <?= date('H:i:s') ?></span></p>

    <!-- Stats -->
    <div class="stats">
        <div class="stat-card phish">
            <div class="num"><?= count($phishing_csv) ?></div>
            <div class="label">Phishing Captures</div>
        </div>
        <div class="stat-card xss">
            <div class="num"><?= $categories['xss'] ?? 0 ?></div>
            <div class="label">XSS Callbacks</div>
        </div>
        <div class="stat-card csrf">
            <div class="num"><?= $categories['csrf'] ?? 0 ?></div>
            <div class="label">CSRF Fires</div>
        </div>
        <div class="stat-card ssrf">
            <div class="num"><?= $categories['ssrf'] ?? 0 ?></div>
            <div class="label">SSRF Probes</div>
        </div>
        <div class="stat-card bypass">
            <div class="num"><?= $categories['bypass'] ?? 0 ?></div>
            <div class="label">Bypass Attempts</div>
        </div>
        <div class="stat-card">
            <div class="num"><?= count($all_logs) ?></div>
            <div class="label">Total Events</div>
        </div>
        <div class="stat-card">
            <div class="num"><?= count($raw_files) ?></div>
            <div class="label">Raw JSON Files</div>
        </div>
    </div>

    <!-- Navigation -->
    <div class="nav">
        <a href="?key=ztbrowser2026" class="<?= !$cat_filter ? 'active' : '' ?>">All Events</a>
        <a href="?key=ztbrowser2026&cat=phishing" class="<?= $cat_filter==='phishing' ? 'active' : '' ?>">Phishing</a>
        <a href="?key=ztbrowser2026&cat=xss" class="<?= $cat_filter==='xss' ? 'active' : '' ?>">XSS</a>
        <a href="?key=ztbrowser2026&cat=csrf" class="<?= $cat_filter==='csrf' ? 'active' : '' ?>">CSRF</a>
        <a href="?key=ztbrowser2026&cat=ssrf" class="<?= $cat_filter==='ssrf' ? 'active' : '' ?>">SSRF</a>
        <a href="?key=ztbrowser2026&cat=bypass" class="<?= $cat_filter==='bypass' ? 'active' : '' ?>">Bypass</a>
        <a href="?key=ztbrowser2026&action=phishing_detail">Phishing Detail (CSV)</a>
        <a href="?key=ztbrowser2026&action=raw_files">Raw JSON Files</a>
    </div>

    <?php if ($action === 'phishing_detail'): ?>
    <!-- Phishing Detail View -->
    <h2>Phishing Captures (payments.csv)</h2>
    <?php if (empty($phishing_csv)): ?>
        <div class="empty">No phishing captures yet. Submit a payment on the phishing page to see data here.</div>
    <?php else: ?>
    <table>
        <thead><tr><th>Time</th><th>Transaction ID</th><th>Card Last 4</th><th>Email</th><th>Amount</th><th>Country</th><th>IP</th><th>Status</th></tr></thead>
        <tbody>
        <?php foreach ($phishing_csv as $row): ?>
        <tr>
            <td><?= htmlspecialchars($row['timestamp'] ?? '') ?></td>
            <td><code><?= htmlspecialchars($row['transaction_id'] ?? '') ?></code></td>
            <td style="color:#ff4444;font-weight:bold;"><?= htmlspecialchars($row['card_last4'] ?? '') ?></td>
            <td><?= htmlspecialchars($row['email'] ?? '') ?></td>
            <td>$<?= htmlspecialchars($row['amount'] ?? '0') ?></td>
            <td><?= htmlspecialchars($row['country'] ?? '') ?></td>
            <td><code><?= htmlspecialchars($row['ip'] ?? '') ?></code></td>
            <td><span class="tag tag-phishing"><?= htmlspecialchars($row['status'] ?? '') ?></span></td>
        </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php endif; ?>

    <!-- Raw JSON files -->
    <h2>Raw Capture Files</h2>
    <?php
    $raw_files_sorted = $raw_files;
    rsort($raw_files_sorted);
    foreach (array_slice($raw_files_sorted, 0, 10) as $f):
        $data = json_decode(file_get_contents($f), true);
    ?>
    <details>
        <summary style="color:#00ff41;cursor:pointer;padding:5px;">📄 <?= basename($f) ?> (<?= date('Y-m-d H:i:s', filemtime($f)) ?>)</summary>
        <div class="raw"><?= htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT)) ?></div>
    </details>
    <?php endforeach; ?>

    <?php elseif ($action === 'raw_files'): ?>
    <!-- Raw JSON File Browser -->
    <h2>Raw JSON Capture Files</h2>
    <?php
    $raw_files_sorted = $raw_files;
    rsort($raw_files_sorted);
    if (empty($raw_files_sorted)): ?>
        <div class="empty">No raw capture files yet.</div>
    <?php else: ?>
    <?php foreach ($raw_files_sorted as $f):
        $data = json_decode(file_get_contents($f), true);
    ?>
    <details>
        <summary style="color:#00ff41;cursor:pointer;padding:8px;border-bottom:1px solid #222;">
            <?= basename($f) ?> — <?= date('Y-m-d H:i:s', filemtime($f)) ?>
            — Card: <?= htmlspecialchars($data['payment_data']['card_number'] ?? 'N/A') ?>
        </summary>
        <div class="raw"><?= htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT)) ?></div>
    </details>
    <?php endforeach; endif; ?>

    <?php else: ?>
    <!-- Event Log Table -->
    <h2><?= $cat_filter ? strtoupper($cat_filter) . ' Events' : 'All Events' ?> (<?= count($display_logs) ?>)</h2>
    <?php if (empty($display_logs)): ?>
        <div class="empty">No events captured yet. Run tests from the PoC pages and callbacks will appear here.</div>
    <?php else: ?>
    <table>
        <thead><tr><th>Time</th><th>Category</th><th>Test</th><th>IP</th><th>Method</th><th>Referer</th><th>Data</th></tr></thead>
        <tbody>
        <?php foreach (array_slice($display_logs, 0, 100) as $e):
            $tagClass = 'tag-' . ($e['category'] ?? 'unknown');
        ?>
        <tr>
            <td style="white-space:nowrap;"><?= htmlspecialchars($e['timestamp'] ?? '') ?></td>
            <td><span class="tag <?= $tagClass ?>"><?= htmlspecialchars($e['category'] ?? 'unknown') ?></span></td>
            <td><?= htmlspecialchars($e['test'] ?? '') ?></td>
            <td><code><?= htmlspecialchars($e['ip'] ?? '') ?></code></td>
            <td><?= htmlspecialchars($e['method'] ?? '') ?></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;"><?= htmlspecialchars(substr($e['referer'] ?? '', 0, 80)) ?></td>
            <td>
                <details>
                    <summary style="cursor:pointer;color:#00ff41;">View</summary>
                    <div class="raw"><?= htmlspecialchars(json_encode($e['data'] ?? [], JSON_PRETTY_PRINT)) ?></div>
                </details>
            </td>
        </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php endif; ?>
    <?php endif; ?>

    <div style="margin-top:30px;padding-top:15px;border-top:1px solid #222;color:#444;font-size:12px;">
        Log files: <code><?= $LOG_DIR ?>/collector.jsonl</code> |
        Phishing data: <code><?= $PHISHING_DIR ?>/</code> |
        Dashboard auto-refreshes every 15 seconds
    </div>
</body>
</html>
