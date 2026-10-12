import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { parse, serialize } from 'parse5';

const root = resolve(import.meta.dirname, '..');
const source = process.argv[2] || '/Volumes/sin/CodexWork/iahv-wordpress-assessment-20261010/live-standalone.html';
const html = await readFile(source, 'utf8');
// Parse JSON values, not executable JavaScript from the source website.
function constant(name) {
  const start = html.indexOf(`const ${name} = `);
  if (start < 0) throw new Error(`Missing ${name}`);
  let end = start + `const ${name} = `.length, quoted = false, escaped = false, depth = 0;
  const begin = end;
  for (; end < html.length; end++) {
    const c = html[end];
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
    else if (c === '"') quoted = true;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') depth--;
    else if (c === ';' && depth === 0) break;
  }
  return JSON.parse(html.slice(begin, end));
}
const pages = constant('PAGES'), assets = constant('ASSETS');
await mkdir(`${root}/storage`, { recursive: true });
await mkdir(`${root}/public/assets`, { recursive: true });
for (const [path, data] of Object.entries(assets)) {
  if (!/^assets\/[\w. -]+$/.test(path)) throw new Error(`Unsafe asset path ${path}`);
  const match = data.match(/^data:([^;,]+);base64,(.*)$/s);
  if (!match) throw new Error(`Invalid asset ${path}`);
  await writeFile(`${root}/public/${path}`, Buffer.from(match[2], 'base64'));
}
await writeFile(`${root}/public/site.css`, constant('SITE_CSS'));
await writeFile(`${root}/public/site.js`, constant('SITE_SCRIPT'));
const catalogue = {};
const text = n => n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join('');
const attr = (n,k) => n.attrs?.find(a=>a.name===k)?.value || '';
const set = (n,k,v) => { n.attrs ||= []; n.attrs.push({name:k,value:v}); };
const blocked = new Set(['script','style','svg','noscript','template','textarea','select','button']);
for (const [slug, raw] of Object.entries(pages)) {
  const doc = parse(raw); const fields = []; let seq = 0, heading = 'Page content', area = 'Page content';
  const visit = (n, inBody = false, denied = false) => {
    const tag = n.tagName; inBody ||= tag === 'body'; denied ||= blocked.has(tag);
    if (tag === 'header') area = 'Header & navigation';
    if (tag === 'main') area = 'Page content';
    if (tag === 'footer') area = 'Footer';
    if (/^h[1-3]$/.test(tag)) heading = text(n).trim().slice(0,110);
    if (tag && !denied && (inBody || tag === 'title' || (tag === 'meta' && attr(n,'name') === 'description'))) {
      const id = `n${++seq}`; const own = [];
      (n.childNodes || []).forEach((child,index) => {
        if (child.nodeName !== '#text' || !child.value.trim()) return;
        const value = child.value.trim();
        own.push({id:`${id}:t${index}`,node:id,index,kind:'text',tag,label:/^h[1-6]$/.test(tag)?'Heading':tag==='title'?'Browser title':tag==='a'?'Link label':tag==='p'?'Paragraph':'Text',value,section:area==='Page content'?heading:area});
      });
      const attributes = tag === 'img' ? ['src','alt'] : ['video','source','iframe'].includes(tag) ? ['src'] : tag === 'a' ? ['href'] : tag === 'meta' ? ['content'] : [];
      for (const name of attributes) {
        const value = attr(n,name); if (!value && name !== 'alt') continue;
        own.push({id:`${id}:${name}`,node:id,attribute:name,kind:name==='src'?(tag==='img'?'image':'video'):name==='href'?'link':'text',tag,label:name==='alt'?'Image description':name==='src'?'Media source':name==='href'?'Link destination':'Search description',value,section:area==='Page content'?heading:area});
      }
      // Animated counters must keep their numeric target in sync with their visible label.
      if (attr(n,'data-count')) own.push({id:`${id}:data-count`,node:id,attribute:'data-count',kind:'number',tag,label:'Counter target',value:attr(n,'data-count'),section:heading});
      if (own.length) {set(n,'data-cms-node',id);fields.push(...own);}
    }
    for (const child of n.childNodes || []) visit(child,inBody,denied);
  };
  visit(doc);
  const title = fields.find(f=>f.tag==='title')?.value.replace(/\s*[|—]\s*Art of Living.*$/,'') || slug;
  const category = slug==='index.html'?'Home':slug.startsWith('country-')?'Countries':slug.startsWith('project-') || /children|youth-projects|breath-wellbeing/.test(slug)?'Programmes':/news|events|field|stories|documentary/.test(slug)?'News & stories':'Other pages';
  const hero = fields.find(f=>f.kind==='image' && !/logo/.test(f.value))?.value || 'assets/hero.webp';
  catalogue[slug] = {slug,title,category,hero,html:serialize(doc),fields};
}
await writeFile(`${root}/storage/catalogue.json`,JSON.stringify(catalogue));
await writeFile(`${root}/storage/import-manifest.json`,JSON.stringify({source:source.split('/').pop(),sha256:createHash('sha256').update(html).digest('hex'),importedAt:new Date().toISOString(),pages:Object.keys(pages),assets:Object.keys(assets),fieldCount:Object.values(catalogue).reduce((n,p)=>n+p.fields.length,0)},null,2));
console.log(JSON.stringify({pages:Object.keys(pages).length,assets:Object.keys(assets).length,fields:Object.values(catalogue).reduce((n,p)=>n+p.fields.length,0)}));
