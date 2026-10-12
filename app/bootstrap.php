<?php
declare(strict_types=1);

// This directory and storage must remain OUTSIDE the public document root.
$configFile = dirname(__DIR__) . '/config.php';
$config = is_file($configFile) ? require $configFile : [];
define('STORE', $config['storage'] ?? dirname(__DIR__) . '/storage');
define('LOCAL_PREVIEW', getenv('AOL_LOCAL_PREVIEW') === '1' && in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true));
define('SETUP_TOKEN', $config['setup_token'] ?? (getenv('AOL_SETUP_TOKEN') ?: ''));
define('SECURE', !LOCAL_PREVIEW);
if (!is_dir(STORE) || !is_readable(STORE . '/catalogue.json')) {
    http_response_code(503); exit('Website storage is unavailable. Ask the hosting administrator to check the installation.');
}
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function fail(string $message, int $status = 400): never {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message]); exit;
}
function output(mixed $value): never {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR); exit;
}
function catalog(): array {
    static $value; return $value ??= json_decode(file_get_contents(STORE . '/catalogue.json'), true, 512, JSON_THROW_ON_ERROR);
}
function blank_state(): array { return ['pages'=>[], 'users'=>[], 'media'=>[], 'history'=>[], 'attempts'=>[]]; }
function state_read(): array {
    $handle = fopen(STORE . '/state.lock', 'c');
    if (!$handle || !flock($handle, LOCK_SH)) fail('Storage is busy. Try again.', 503);
    try { return is_file(STORE . '/state.json') ? json_decode(file_get_contents(STORE . '/state.json'), true, 512, JSON_THROW_ON_ERROR) : blank_state(); }
    finally { flock($handle, LOCK_UN); fclose($handle); }
}
function transact(callable $fn): mixed {
    $handle = fopen(STORE . '/state.lock', 'c');
    if (!$handle || !flock($handle, LOCK_EX)) fail('Storage is busy. Try again.', 503);
    try {
        $s = is_file(STORE . '/state.json') ? json_decode(file_get_contents(STORE . '/state.json'), true, 512, JSON_THROW_ON_ERROR) : blank_state();
        $result = $fn($s);
        $tmp = STORE . '/state-' . bin2hex(random_bytes(8)) . '.tmp';
        $json = json_encode($s, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        if (file_put_contents($tmp, $json) !== strlen($json)) throw new RuntimeException('Cannot write storage.');
        chmod($tmp, 0600);
        if (!rename($tmp, STORE . '/state.json')) throw new RuntimeException('Cannot commit storage.');
        return $result;
    } finally { flock($handle, LOCK_UN); fclose($handle); }
}
function start_session(): void {
    if (SECURE && !in_array(strtolower($_SERVER['HTTPS'] ?? ''), ['on','1'], true)) fail('Open the HTTPS dashboard address. The host must pass the HTTPS state to PHP.',426);
    if (session_status() === PHP_SESSION_ACTIVE) return;
    if (!is_dir(STORE . '/sessions')) mkdir(STORE . '/sessions', 0700, true);
    ini_set('session.use_strict_mode', '1'); ini_set('session.use_only_cookies', '1');
    session_save_path(STORE . '/sessions'); session_name('aol_editor');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>SECURE,'httponly'=>true,'samesite'=>'Strict']);
    session_start();
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}
function user(bool $required = true): ?array {
    start_session();
    $s = state_read(); $u = $s['users'][$_SESSION['user'] ?? ''] ?? null;
    if (LOCAL_PREVIEW && ($_SESSION['user'] ?? '') === 'local-preview') $u = ['id'=>'local-preview','name'=>'Local administrator','email'=>'','role'=>'admin','active'=>true];
    $credentialOK = $u && (($u['id']==='local-preview' && LOCAL_PREVIEW) || hash_equals(hash('sha256',$u['hash'] ?? ''), $_SESSION['credential'] ?? ''));
    if (!$u || !$u['active'] || !$credentialOK || time() - ($_SESSION['seen'] ?? 0) > 3600 || time() - ($_SESSION['started'] ?? 0) > 28800) {
        unset($_SESSION['user']); if ($required) fail('Please sign in again.', 401); return null;
    }
    $_SESSION['seen'] = time(); return array_intersect_key($u, array_flip(['id','name','email','role','active']));
}
function admin(): array { $u = user(); if ($u['role'] !== 'admin') fail('Only an administrator can do this.', 403); return $u; }
function mutation(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Use POST for changes.', 405);
    start_session();
    if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) fail('Security check failed. Refresh the dashboard.', 403);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $expected = (LOCAL_PREVIEW ? 'http://' : 'https://') . ($_SERVER['HTTP_HOST'] ?? '');
    if ($origin !== $expected) fail('This request did not originate from this dashboard.', 403);
}
function request_data(): array {
    $body = file_get_contents('php://input', false, null, 0, 1024 * 1024 + 1);
    if (strlen($body) > 1024 * 1024) fail('Request too large.', 413);
    try { $data = json_decode($body, true, 128, JSON_THROW_ON_ERROR); }
    catch (Throwable) { fail('Invalid request.'); }
    if (!is_array($data)) fail('Invalid request.'); return $data;
}
function page_state(array $s, string $slug): array {
    if (!isset(catalog()[$slug])) fail('Unknown website page.',404);
    return $s['pages'][$slug] ?? ['draft'=>[], 'published'=>[], 'version'=>0, 'updatedAt'=>null, 'publishedAt'=>null];
}
function log_revision(array &$s, string $slug, string $action, array $u, array $ps): void {
    $s['history'][] = ['id'=>bin2hex(random_bytes(12)), 'page'=>$slug, 'action'=>$action, 'actor'=>$u['name'], 'at'=>gmdate('c'), 'version'=>$ps['version'], 'draft'=>$ps['draft'], 'published'=>$ps['published']];
}
function safe_field(array $field, mixed $value, array $s): string {
    if (!is_string($value) || strlen($value) > 12000 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $value)) fail('Invalid field value.');
    $attr = $field['attribute'] ?? '';
    if ($attr === 'data-count' && !preg_match('/^\d{1,10}$/', $value)) fail('A counter target must be a non-negative whole number.');
    if (in_array($attr,['href','src'],true)) {
        if (preg_match('/[\s<>"\x27\\\\]/', $value)) fail('Links must not contain whitespace or markup.');
        $scheme = strtolower(parse_url($value, PHP_URL_SCHEME) ?? '');
        if ($scheme && !in_array($scheme, $attr==='href'?['https','http','mailto','tel']:['https','http'],true)) fail('Unsafe link type.');
        if (!$scheme && (str_starts_with($value,'//') || str_contains($value,'..') || str_starts_with($value,'/'))) fail('Use a page link or a full HTTPS address.');
        if (str_starts_with($value,'media.php')) {
            parse_str(parse_url($value, PHP_URL_QUERY) ?? '', $query);
            if (!isset($s['media'][$query['id'] ?? ''])) fail('That uploaded media does not exist.');
        }
        if (($field['tag'] ?? '') === 'iframe' && $value !== '') {
            $host = strtolower(parse_url($value, PHP_URL_HOST) ?? '');
            if ($scheme !== 'https' || !in_array($host,['www.youtube.com','www.youtube-nocookie.com','player.vimeo.com'],true)) fail('Use a YouTube or Vimeo HTTPS embed link.');
        }
    }
    return $value;
}
function render_page(string $slug, array $patches, bool $edit = false): string {
    $page = catalog()[$slug] ?? null;
    if (!$page) { http_response_code(404); $page = catalog()['404.html']; }
    $dom = new DOMDocument('1.0','UTF-8');
    libxml_use_internal_errors(true);
    $dom->loadHTML('<?xml encoding="UTF-8">' . $page['html'], LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
    $xpath = new DOMXPath($dom);
    foreach ($page['fields'] as $field) {
        if (!array_key_exists($field['id'],$patches)) continue;
        $node = $xpath->query('//*[@data-cms-node="' . $field['node'] . '"]')->item(0);
        if (!$node) continue;
        if (isset($field['attribute'])) {
            $node->setAttribute($field['attribute'],$patches[$field['id']]);
            if ($field['attribute'] === 'src' && $node->nodeName === 'img') $node->removeAttribute('srcset');
        } else {
            $child = $node->childNodes->item($field['index']);
            if ($child && $child->nodeType === XML_TEXT_NODE) {
                // Preserve surrounding whitespace around inline elements.
                preg_match('/^(\s*)/', $child->nodeValue, $lead); preg_match('/(\s*)$/', $child->nodeValue, $trail);
                $child->nodeValue = $lead[1] . $patches[$field['id']] . $trail[1];
            }
        }
    }
    foreach (iterator_to_array($dom->childNodes) as $node) if ($node->nodeType === XML_PI_NODE) $dom->removeChild($node);
    $html = $dom->saveHTML();
    $html = str_replace('</head>', '<link rel="stylesheet" href="site.css"></head>', $html);
    $html = str_replace('</body>', ($edit ? '<script src="admin/editor-bridge.js" defer></script>' : '<script src="site.js" defer></script>') . '</body>', $html);
    return $html;
}
