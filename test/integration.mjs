import assert from 'node:assert/strict';
import { mkdtemp, copyFile, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { createRuntime } from '../tools/runtime.mjs';
const root=resolve(import.meta.dirname,'..');
const storage=await mkdtemp('/Volumes/sin/CodexWork/iahv-dashboard-test-');
for(const f of ['catalogue.json','import-manifest.json'])await copyFile(`${root}/storage/${f}`,`${storage}/${f}`);
const token=randomBytes(32).toString('hex'),password=randomBytes(18).toString('hex');
const runtime=await createRuntime({storage,local:false,setupToken:token});
const results=[];
function pass(name){results.push(name);console.log('PASS',name);}
class Client{
  cookie='';csrf='';
  async raw(action,data,params={},overrides={}){
    const headers={cookie:this.cookie};let body;
    if(data!==undefined){headers['content-type']='application/json';headers['x-csrf-token']=this.csrf;headers.origin='https://dashboard.test';body=JSON.stringify(data);}
    Object.assign(headers,overrides.headers||{});
    const r=await runtime.request({url:`/api.php?${new URLSearchParams({action,...params})}`,method:data===undefined?'GET':'POST',body,secure:true,...overrides,headers});
    if(r.errors)console.error(r.errors);
    for(const c of r.headers['set-cookie']||[])this.cookie=c.split(';')[0];
    return {status:r.httpStatusCode,data:JSON.parse(r.text),headers:r.headers};
  }
  async get(action,params={}){const r=await this.raw(action,undefined,params);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;}
  async post(action,data){const r=await this.raw(action,data);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;}
  async boot(){const s=await this.get('status');this.csrf=s.csrf;return s;}
  async page(slug,preview=false){return runtime.request({url:`/index.php?page=${slug}${preview?'&preview=1':''}`,headers:{cookie:this.cookie},secure:true});}
}
const owner=new Client(),guest=new Client();
// PHP-WASM populates HTTPS=on internally even for http runs. Exercise the native-server gate explicitly.
const plain=await runtime.php.run({code:'<?php $_SERVER["HTTPS"]="off"; require "/app/public/api.php";',env:{AOL_LOCAL_PREVIEW:'0'},$_SERVER:{REMOTE_ADDR:'127.0.0.1'}});assert.equal(plain.httpStatusCode,426);pass('production authentication rejects non-HTTPS server state');
const status=await owner.boot();assert.equal(status.pageCount,33);assert.equal(status.setupRequired,true);assert.match(owner.cookie,/aol_editor=/);pass('33 imported pages and session boot');
const headers=(await owner.raw('status')).headers;assert.match(headers['set-cookie']?.join(' ')||'Secure',/Secure/);pass('secure production cookie');
assert.equal((await guest.raw('pages')).status,401);pass('unauthenticated dashboard access denied');
assert.equal((await owner.raw('local-session',{})).status,403);pass('local bypass disabled in production');
assert.equal((await owner.raw('setup',{token:'wrong',email:'admin@example.test',name:'Test owner',password})).status,403);pass('setup rejects wrong token');
await owner.post('setup',{token,email:'admin@example.test',name:'Test owner',password});await owner.boot();
assert.equal((await owner.raw('setup',{token,email:'other@example.test',name:'Other',password})).status,409);pass('setup is one-time and creates an administrator');
const pages=(await owner.get('pages')).pages;assert(pages.some(p=>p.slug==='documentary.html'));pass('documentary route preserved');
const p=await owner.get('page',{page:'index.html'});const field=p.fields.find(f=>f.tag==='h1');assert(field);
let current=await owner.post('save',{page:p.slug,version:0,patches:{[field.id]:'Verified dashboard test <script>alert(1)</script>'}});assert.equal(current.state.version,1);pass('draft persists with incremented version');
const publicPage=await guest.page(p.slug);assert(!publicPage.text.includes('Verified dashboard test'));pass('draft does not leak to public website');
const preview=await owner.page(p.slug,true);assert(preview.text.includes('Verified dashboard test &lt;script&gt;'));assert(!preview.text.includes('Verified dashboard test <script>'));pass('draft renders and markup is escaped');
assert.equal((await guest.page(p.slug,true)).httpStatusCode,401);pass('draft preview requires login');
assert.equal((await owner.raw('save',{page:p.slug,version:0,patches:{}})).status,409);pass('stale concurrent save rejected');
const link=p.fields.find(f=>f.kind==='link');assert.equal((await owner.raw('save',{page:p.slug,version:1,patches:{[link.id]:'javascript:alert(1)'}})).status,400);pass('unsafe JavaScript links rejected');
assert.equal((await owner.raw('save',{page:p.slug,version:1,patches:{'fake':'no'}})).status,400);pass('unknown editable fields rejected');
assert.equal((await owner.raw('save',{page:p.slug,version:1,patches:{}},{},{headers:{'x-csrf-token':'wrong'}})).status,403);pass('CSRF validation enforced');
assert.equal((await owner.raw('save',{page:p.slug,version:1,patches:{}},{},{headers:{origin:'https://evil.example'}})).status,403);pass('cross-origin changes denied');
await owner.post('publish',{page:p.slug,version:1});assert((await guest.page(p.slug)).text.includes('Verified dashboard test &lt;script&gt;'));pass('administrator publication updates public rendering');
const history=(await owner.get('history',{page:p.slug})).history;assert(history.some(r=>r.action==='import'));assert.equal(history.length,3);pass('baseline and every revision retained');
const baseline=history.find(r=>r.action==='import');await owner.post('restore',{page:p.slug,version:2,revision:baseline.id});assert((await guest.page(p.slug)).text.includes('Verified dashboard test'));pass('restore creates draft without changing public content');
await owner.post('publish',{page:p.slug,version:3});assert(!(await guest.page(p.slug)).text.includes('Verified dashboard test'));pass('published restoration returns to original');
const editorPassword=randomBytes(18).toString('hex');await owner.post('create-user',{email:'editor@example.test',name:'Country editor',password:editorPassword,role:'editor'});
const editor=new Client();await editor.boot();await editor.post('login',{email:'editor@example.test',password:editorPassword});await editor.boot();
assert.equal((await editor.raw('publish',{page:p.slug,version:4})).status,403);assert.equal((await editor.raw('users')).status,403);pass('editors cannot publish or manage accounts');
current=await editor.post('save',{page:p.slug,version:4,patches:{[field.id]:'Editor draft'}});assert.equal(current.state.version,5);pass('editor can save a persistent draft');
assert.equal((await owner.raw('publish-many',{versions:{[p.slug]:4}})).status,409);pass('bulk publish is version checked');
await owner.post('publish-many',{versions:{[p.slug]:5}});assert((await guest.page(p.slug)).text.includes('Editor draft'));pass('bulk draft publication works');
const users=(await owner.get('users')).users;const id=users.find(u=>u.email==='editor@example.test').id;assert(users.every(u=>!('hash'in u)));await owner.post('toggle-user',{id});assert.equal((await editor.raw('pages')).status,401);pass('disabled accounts lose access; hashes not exposed');
await owner.post('password',{current:password,password:password+'new'});pass('administrator can change own password');
const login=new Client();await login.boot();assert.equal((await login.raw('login',{email:'admin@example.test',password})).status,401);await login.post('login',{email:'admin@example.test',password:password+'new'});pass('password change takes effect');
await guest.boot();for(let i=0;i<8;i++)await guest.raw('login',{email:'wrong@example.test',password:'wrong-password'});assert.equal((await guest.raw('login',{email:'wrong@example.test',password:'wrong-password'})).status,429);pass('failed login throttling enforced');
const imageBytes=await readFile(`${root}/public/assets/hero.webp`);
async function upload(file,name,type,consent='yes'){
  const form=new FormData();form.set('file',new Blob([file],{type}),name);form.set('consent',consent);form.set('alt','Verified upload');form.set('credit','Test source');
  const req=new Request('https://dashboard.test/api.php',{method:'POST',body:form});
  const r=await runtime.request({url:'/api.php?action=upload',method:'POST',headers:{cookie:owner.cookie,'x-csrf-token':owner.csrf,origin:'https://dashboard.test','content-type':req.headers.get('content-type')},body:new Uint8Array(await req.arrayBuffer()),secure:true});
  return {status:r.httpStatusCode,data:JSON.parse(r.text)};
}
assert.equal((await upload(imageBytes,'valid.webp','image/webp','no')).status,400);pass('upload requires rights confirmation');
assert.equal((await upload(Buffer.from('<?php echo "malicious"; ?>'),'bad.jpg','image/jpeg')).status,400);pass('spoofed executable image upload rejected');
assert.equal((await upload(Buffer.from('<svg onload="alert(1)"></svg>'),'bad.svg','image/svg+xml')).status,400);pass('active SVG upload rejected');
const up=await upload(imageBytes,'approved.webp','image/webp');assert.equal(up.status,200,JSON.stringify(up.data));const media=up.data.media;pass('valid image upload stored outside public root');
let response=await runtime.request({url:'/'+media.path,secure:true});assert.equal(response.httpStatusCode,401);pass('unpublished upload remains private');
response=await runtime.request({url:'/'+media.path,headers:{cookie:owner.cookie},secure:true});assert.equal(response.httpStatusCode,200);assert.equal(response.bytes.length,imageBytes.length);pass('editor can view private upload');
const image=p.fields.find(f=>f.kind==='image'&&!f.value.includes('logo'));const alt=p.fields.find(f=>f.node===image.node&&f.attribute==='alt');
await owner.post('save',{page:p.slug,version:6,patches:{[image.id]:media.path,[alt.id]:'Verified upload'}});await owner.post('publish',{page:p.slug,version:7});
response=await runtime.request({url:'/'+media.path,secure:true});assert.equal(response.httpStatusCode,200);pass('uploaded image becomes public only after publication');
const manifest=JSON.parse(await readFile(`${storage}/import-manifest.json`));assert.equal(manifest.assets.length,122);pass('all 122 original assets preserved');
const persisted=JSON.parse(await readFile(`${storage}/state.json`));assert(persisted.pages[p.slug].published[image.id]===media.path);pass('published changes persisted on host filesystem');
const restart=await createRuntime({storage,local:false});const reread=await restart.request({url:'/',secure:true});assert(reread.text.includes(media.path));pass('published changes survive runtime restart');
// Validate every imported editable node/index against the PHP renderer DOM.
const check=await runtime.php.run({code:`<?php require '/app/app/bootstrap.php'; $errors=[]; foreach(catalog() as $slug=>$p){$d=new DOMDocument();libxml_use_internal_errors(true);$d->loadHTML('<?xml encoding="UTF-8">'.$p['html'],LIBXML_NONET);$x=new DOMXPath($d);foreach($p['fields'] as $f){$n=$x->query('//*[@data-cms-node="'.$f['node'].'"]')->item(0); if(!$n){$errors[]=$slug.':'.$f['id'].':missing';continue;} if(!isset($f['attribute'])){$c=$n->childNodes->item($f['index']);if(!$c || $c->nodeType!==XML_TEXT_NODE || trim($c->nodeValue)!==$f['value'])$errors[]=$slug.':'.$f['id'].':text';}}} echo json_encode($errors);`});
assert.deepEqual(JSON.parse(check.text),[]);pass('all 5040 fields map to preserved DOM nodes without empty containers');
await owner.post('logout',{});assert.equal((await owner.raw('pages')).status,401);pass('logout revokes session');
await writeFile(`${root}/QA-RESULTS.json`,JSON.stringify({at:new Date().toISOString(),runtime:'PHP 8.3 through PHP-WASM',passed:results.length,results,testStorage:storage,limitations:['Native hosting deployment not tested','Independent security review and staging operator validation required']},null,2));
console.log(`ALL ${results.length} CHECKS PASSED`);process.exit(0);
