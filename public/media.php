<?php
declare(strict_types=1);
require dirname(__DIR__).'/app/bootstrap.php';
$s=state_read();$id=$_GET['id'] ?? ''; $media=$s['media'][$id] ?? null;
if (!$media) {http_response_code(404);exit;}
$public=false;foreach ($s['pages'] as $p) if (in_array('media.php?id='.$id,$p['published'],true)) {$public=true;break;}
if (!$public) {user();header('Cache-Control: private, no-store');}else header('Cache-Control: public, max-age=86400');
header('Content-Type: '.$media['mime']);header('Content-Length: '.filesize(STORE.'/media/'.$media['file']));readfile(STORE.'/media/'.$media['file']);
