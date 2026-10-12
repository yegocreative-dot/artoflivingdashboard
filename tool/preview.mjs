import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { createRuntime } from './runtime.mjs';
const root=resolve(import.meta.dirname,'..'),publicRoot=resolve(root,'public');
const runtime=await createRuntime();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4'};
const server=createServer(async(req,res)=>{
  try {
    const u=new URL(req.url,'http://127.0.0.1:4188');
    if(u.pathname==='/admin'){res.writeHead(302,{location:'/admin/'});res.end();return;}
    const path=resolve(publicRoot,'.'+decodeURIComponent(u.pathname==='/admin/'?'/admin/index.html':u.pathname));
    if(!path.startsWith(publicRoot+sep)&&path!==publicRoot){res.writeHead(403);res.end();return;}
    if(u.pathname.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end();return;}
    const extension=extname(path);
    if(types[extension]){
      const info=await stat(path).catch(()=>null);
      if(info?.isFile()){
        const headers={'Content-Type':types[extension],'X-Content-Type-Options':'nosniff','Content-Length':info.size};
        if(extension==='.mp4' && req.headers.range){const m=req.headers.range.match(/^bytes=(\d+)-(\d*)$/);if(m){const start=Number(m[1]),end=Math.min(m[2]?Number(m[2]):info.size-1,info.size-1);if(start> end){res.writeHead(416);res.end();return;}res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${info.size}`,'Accept-Ranges':'bytes'});createReadStream(path,{start,end}).pipe(res);return;}}
        res.writeHead(200,headers);if(req.method==='HEAD')res.end();else createReadStream(path).pipe(res);return;
      }
    }
    if(!['/','/index.php','/api.php','/media.php'].includes(u.pathname)&&!/^\/[a-z0-9-]+\.html$/.test(u.pathname)){res.writeHead(404);res.end('Not found');return;}
    let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>21*1024*1024){res.writeHead(413);res.end();return;}chunks.push(chunk);}
    const r=await runtime.request({url:req.url,method:req.method,headers:req.headers,body:chunks.length?Buffer.concat(chunks):undefined});
    if(r.errors)process.stderr.write(r.errors+'\n');
    res.writeHead(r.httpStatusCode,r.headers);res.end(Buffer.from(r.bytes));
  }catch(e){console.error(e.message);if(!res.headersSent)res.writeHead(500);res.end('Preview server error');}
});
server.listen(4188,'127.0.0.1',()=>console.log('Local dashboard: http://127.0.0.1:4188/admin/\nLocal website: http://127.0.0.1:4188/\nThis server is bound to loopback. It does not deploy anything.'));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
