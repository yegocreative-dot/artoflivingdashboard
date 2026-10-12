import { mkdir, cp, mkdtemp, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const stage=await mkdtemp('/Volumes/sin/CodexWork/iahv-dashboard-package-');
const target=resolve(stage,'Art-of-Living-Africa-Dashboard');await mkdir(target);
// Explicit allowlist: no accounts, tokens, sessions, live state, test uploads or node_modules.
for(const name of ['app','public','tools','tests','package.json','package-lock.json','README.md','INSTALL.md','DESIGN.md','QA.md','QA-RESULTS.json','config.example.php','Open Dashboard.command','dashboard-desktop.png','dashboard-mobile.png','editor-desktop.png','editor-mobile.png'])await cp(resolve(root,name),resolve(target,name),{recursive:true});
await mkdir(resolve(target,'storage'));
for(const name of ['catalogue.json','import-manifest.json'])await cp(resolve(root,'storage',name),resolve(target,'storage',name));
const output='/Volumes/sin/CodexWork/Art-of-Living-Africa-Dashboard-2026-10-11.zip';
const archive=resolve(stage,'dashboard.zip');
const result=spawnSync('zip',['-qr',archive,'Art-of-Living-Africa-Dashboard'],{cwd:stage,stdio:'inherit'});if(result.status!==0)throw new Error('Packaging failed');
await cp(archive,output);
console.log(output);
