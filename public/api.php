<?php
declare(strict_types=1);
require dirname(__DIR__) . '/app/bootstrap.php';
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
try {
    $action = $_GET['action'] ?? 'status';
    if ($action === 'status') {
        start_session(); $u = user(false); $s = state_read();
        output(['user'=>$u,'csrf'=>$_SESSION['csrf'],'local'=>LOCAL_PREVIEW,'setupRequired'=>!count($s['users']),'setupEnabled'=>strlen(SETUP_TOKEN)>=32,'pageCount'=>count(catalog())]);
    }
    if ($action === 'login' || $action === 'setup' || $action === 'local-session') {
        mutation(); $d = request_data();
        if ($action === 'local-session') {
            if (!LOCAL_PREVIEW) fail('Local preview is disabled.',403);
            session_regenerate_id(true); $_SESSION['user']='local-preview'; $_SESSION['started']=$_SESSION['seen']=time(); output(['ok'=>true]);
        }
        if ($action === 'setup') {
            if (strlen(SETUP_TOKEN)<32 || !hash_equals(SETUP_TOKEN,$d['token'] ?? '')) fail('Invalid installation token.',403);
            $email = strtolower(trim($d['email'] ?? '')); $password = $d['password'] ?? ''; $name = trim($d['name'] ?? '');
            if (!filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($name)<2 || strlen($name)>100 || strlen($password)<12 || strlen($password)>256) fail('Use a valid email, name and a password of at least 12 characters.');
            $id = bin2hex(random_bytes(12));
            transact(function (&$s) use ($email,$password,$name,$id) {
                if (count($s['users'])) fail('An administrator already exists.',409);
                $s['users'][$id]=['id'=>$id,'name'=>$name,'email'=>$email,'hash'=>password_hash($password,PASSWORD_DEFAULT),'role'=>'admin','active'=>true];
            });
        } else {
            $email = strtolower(trim($d['email'] ?? '')); $password = $d['password'] ?? '';
            if (!is_string($password) || strlen($password)>256 || strlen($email)>254) fail('Invalid credentials.',401);
            $bucket=hash('sha256',($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $email);
            $id=transact(function (&$s) use ($email,$password,$bucket) {
                foreach ($s['attempts'] as $key=>$attempt) if ($attempt['at']<time()-900) unset($s['attempts'][$key]);
                $attempt=$s['attempts'][$bucket] ?? ['at'=>time(),'count'=>0];
                if ($attempt['count']>=8) return 'locked';
                $s['attempts'][$bucket]=['at'=>$attempt['at'],'count'=>$attempt['count']+1];
                foreach ($s['users'] as $u) if ($u['active'] && hash_equals($u['email'],$email) && password_verify($password,$u['hash'])) {unset($s['attempts'][$bucket]);return $u['id'];}
                return null;
            });
            if ($id==='locked') fail('Too many attempts. Try again in 15 minutes.',429);
            if (!$id) fail('Email or password is incorrect.',401);
        }
        session_regenerate_id(true); $_SESSION['user']=$id; $_SESSION['credential']=hash('sha256',state_read()['users'][$id]['hash']); $_SESSION['started']=$_SESSION['seen']=time(); output(['ok'=>true]);
    }
    $u = user();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') mutation();
    if ($action === 'logout') {mutation();$_SESSION=[];session_destroy();setcookie('aol_editor','',['expires'=>time()-3600,'path'=>'/','secure'=>SECURE,'httponly'=>true,'samesite'=>'Strict']);output(['ok'=>true]);}
    if ($action === 'pages') {
        $s=state_read(); $out=[];
        foreach (catalog() as $slug=>$p) {$ps=page_state($s,$slug);$out[]=['slug'=>$slug,'title'=>$slug==='index.html'?'Home':$p['title'],'category'=>$p['category'],'hero'=>$p['hero'],'fields'=>count($p['fields']),'version'=>$ps['version'],'dirty'=>$ps['draft']!=$ps['published'],'updatedAt'=>$ps['updatedAt'],'publishedAt'=>$ps['publishedAt']];}
        output(['pages'=>$out]);
    }
    if ($action === 'page') {
        $slug=$_GET['page'] ?? ''; $s=state_read();$ps=page_state($s,$slug);$p=catalog()[$slug];
        output(['slug'=>$slug,'title'=>$slug==='index.html'?'Home':$p['title'],'fields'=>$p['fields'],'state'=>$ps]);
    }
    if (in_array($action,['save','publish','restore','discard'],true)) {
        mutation(); $d=request_data();$slug=$d['page'] ?? ''; $version=$d['version'] ?? -1;
        if ($action==='publish' || $action==='discard') admin();
        $result=transact(function (&$s) use ($d,$slug,$version,$action,$u) {
            $ps=page_state($s,$slug);
            if ($ps['version']!==$version) fail('Another editor changed this page. Reload it before saving.',409);
            if ($ps['version']===0) log_revision($s,$slug,'import',$u,$ps);
            if ($action==='save') {
                $patches=$d['patches'] ?? null; if (!is_array($patches) || count($patches)>2000) fail('Invalid changes.');
                $valid=array_column(catalog()[$slug]['fields'],null,'id');$clean=[];
                foreach ($patches as $key=>$value) {if (!isset($valid[$key])) fail('Unknown content field.');$v=safe_field($valid[$key],$value,$s);if ($v!==$valid[$key]['value']) $clean[$key]=$v;}
                $ps['draft']=$clean;
            } elseif ($action==='publish') { $ps['published']=$ps['draft'];$ps['publishedAt']=gmdate('c'); }
            elseif ($action==='discard') { $ps['draft']=$ps['published']; }
            else {
                $found=null;foreach ($s['history'] as $r) if ($r['id']===($d['revision'] ?? '') && $r['page']===$slug) $found=$r;
                if (!$found) fail('Revision not found.',404);$ps['draft']=$found['draft'];
            }
            $ps['version']++;$ps['updatedAt']=gmdate('c');$s['pages'][$slug]=$ps;log_revision($s,$slug,$action,$u,$ps);return $ps;
        });output(['state'=>$result]);
    }
    if ($action==='history') {
        $s=state_read();$entries=array_reverse($s['history']);
        if (isset($_GET['page'])) $entries=array_values(array_filter($entries,fn($r)=>$r['page']===$_GET['page']));
        output(['history'=>array_map(fn($r)=>array_diff_key($r,array_flip(['draft','published'])),$entries)]);
    }
    if ($action==='media') {
        $original=[];$manifest=json_decode(file_get_contents(STORE.'/import-manifest.json'),true);
        foreach ($manifest['assets'] as $path) if (preg_match('/\.(?:jpe?g|png|webp)$/i',$path)) $original[]=['id'=>$path,'path'=>$path,'name'=>basename($path),'alt'=>'','credit'=>'Existing website asset','original'=>true];
        output(['media'=>array_merge(array_values(state_read()['media']),$original)]);
    }
    if ($action==='publish-many') {
        mutation();admin();$d=request_data();$versions=$d['versions'] ?? [];if (!$versions || !is_array($versions)) fail('No pages selected.');
        transact(function (&$s) use ($versions,$u) {
            foreach ($versions as $slug=>$version) {if (page_state($s,$slug)['version']!==$version) fail('A selected page changed. Refresh before publishing.',409);}
            foreach ($versions as $slug=>$version) {$ps=page_state($s,$slug);$ps['published']=$ps['draft'];$ps['publishedAt']=$ps['updatedAt']=gmdate('c');$ps['version']++;$s['pages'][$slug]=$ps;log_revision($s,$slug,'publish',$u,$ps);}
        });output(['ok'=>true]);
    }
    if ($action==='upload') {
        mutation(); if (($_POST['consent'] ?? '')!=='yes') fail('Confirm publication rights before uploading.');
        if (!is_string($_POST['alt'] ?? null) || !trim($_POST['alt']) || strlen($_POST['alt'])>1000 || !is_string($_POST['credit'] ?? null) || !trim($_POST['credit']) || strlen($_POST['credit'])>500) fail('Add an image description and credit before uploading.');
        $f=$_FILES['file'] ?? null; if (!$f || is_array($f['error']) || $f['error']!==UPLOAD_ERR_OK) fail('Upload failed. Check the hosting upload limit.');
        if ($f['size']>20*1024*1024) fail('Images must be 20 MB or smaller.',413);
        $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);$types=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
        if (!isset($types[$mime]) || !getimagesize($f['tmp_name'])) fail('Use a valid JPG, PNG or WebP image. SVG, scripts and videos are not accepted.');
        $id=bin2hex(random_bytes(16));$dir=STORE.'/media';if (!is_dir($dir)) mkdir($dir,0700,true);
        $path=$dir.'/'.$id.'.'.$types[$mime];if (!move_uploaded_file($f['tmp_name'],$path)) fail('Cannot save this upload.',503);chmod($path,0600);
        $media=['id'=>$id,'path'=>'media.php?id='.$id,'file'=>basename($path),'mime'=>$mime,'name'=>substr(basename($f['name']),0,150),'alt'=>substr($_POST['alt'] ?? '',0,1000),'credit'=>substr($_POST['credit'] ?? '',0,500),'size'=>$f['size'],'uploadedBy'=>$u['name'],'at'=>gmdate('c'),'rightsConfirmed'=>true];
        transact(function (&$s) use ($id,$media) {$s['media'][$id]=$media;});output(['media'=>$media]);
    }
    if ($action==='users') {admin();output(['users'=>array_values(array_map(fn($v)=>array_diff_key($v,['hash'=>true]),state_read()['users']))]);}
    if ($action==='create-user') {
        mutation();admin();$d=request_data();$email=strtolower(trim($d['email'] ?? ''));$name=trim($d['name'] ?? '');$password=$d['password'] ?? ''; $role=$d['role'] ?? 'editor';
        if (!filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($name)<2 || strlen($name)>100 || !is_string($password) || strlen($password)<12 || strlen($password)>256 || !in_array($role,['editor','admin'],true)) fail('Check the name, email, role and 12-character minimum password.');
        transact(function (&$s) use ($email,$name,$password,$role) {foreach ($s['users'] as $v) if ($v['email']===$email) fail('That email already has an account.',409);$id=bin2hex(random_bytes(12));$s['users'][$id]=['id'=>$id,'name'=>$name,'email'=>$email,'role'=>$role,'hash'=>password_hash($password,PASSWORD_DEFAULT),'active'=>true];});output(['ok'=>true]);
    }
    if ($action==='toggle-user') {
        mutation();admin();$d=request_data();transact(function (&$s) use ($d,$u) {
            $id=$d['id'] ?? '';if (!isset($s['users'][$id])) fail('Account not found.',404);if ($id===$u['id']) fail('You cannot disable your own account.');
            $s['users'][$id]['active']=!$s['users'][$id]['active'];
        });output(['ok'=>true]);
    }
    if ($action==='password') {
        mutation();$d=request_data();$p=$d['password'] ?? '';if (!is_string($p) || strlen($p)<12 || strlen($p)>256) fail('Use a password of at least 12 characters.');
        if ($u['id']==='local-preview') fail('Local preview does not have an account password.');
        transact(function (&$s) use ($u,$d,$p) {if (!password_verify($d['current'] ?? '',$s['users'][$u['id']]['hash'])) fail('Current password is incorrect.',403);$s['users'][$u['id']]['hash']=password_hash($p,PASSWORD_DEFAULT);});$_SESSION['credential']=hash('sha256',state_read()['users'][$u['id']]['hash']);output(['ok'=>true]);
    }
    if ($action==='backup') {
        admin();$s=state_read();unset($s['users'],$s['attempts']);header('Content-Type: application/json');header('Content-Disposition: attachment; filename="africa-content-backup-'.gmdate('Y-m-d').'.json"');echo json_encode(['format'=>1,'exportedAt'=>gmdate('c'),'state'=>$s,'manifest'=>json_decode(file_get_contents(STORE.'/import-manifest.json'),true)],JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);exit;
    }
    fail('Unknown action.',404);
} catch (Throwable $e) {
    error_log('AOL dashboard: '.$e->getMessage());fail('The server could not complete this request. Your changes have not been confirmed saved.',500);
}
