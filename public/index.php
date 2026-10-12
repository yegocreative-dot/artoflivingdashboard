<?php
declare(strict_types=1);
require dirname(__DIR__).'/app/bootstrap.php';
$slug=$_GET['page'] ?? basename(parse_url($_SERVER['REQUEST_URI'] ?? '/',PHP_URL_PATH));
if ($slug==='' || $slug==='index.php') $slug='index.html';
$edit=($_GET['edit'] ?? '')==='1';$preview=($_GET['preview'] ?? '')==='1';
if ($edit || $preview) {user();header('Cache-Control: no-store');header('X-Robots-Tag: noindex, nofollow');}
else {header('Cache-Control: no-cache');}
$s=state_read();$ps=isset(catalog()[$slug])?page_state($s,$slug):['draft'=>[],'published'=>[]];
header('Content-Type: text/html; charset=utf-8');
echo render_page($slug,$preview || $edit?$ps['draft']:$ps['published'],$edit);
