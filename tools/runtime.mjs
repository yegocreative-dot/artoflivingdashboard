import { PHP } from '@php-wasm/universal';
import { loadNodeRuntime, createNodeFsMountHandler } from '@php-wasm/node';
import { resolve } from 'node:path';
let runtimeId = 10;
export async function createRuntime({root=resolve(import.meta.dirname,'..'),storage,local=true,setupToken=''}={}) {
  const php=new PHP(await loadNodeRuntime('8.3',{emscriptenOptions:{processId:++runtimeId}}));
  await php.mount('/app',createNodeFsMountHandler(root));
  if(storage) await php.mount('/app/storage',createNodeFsMountHandler(storage));
  php.writeFile('/internal/shared/php.ini','display_errors=0\nlog_errors=1\nmemory_limit=256M\nupload_max_filesize=20M\npost_max_size=21M\n');
  let queue=Promise.resolve();
  const request=({url='/',method='GET',headers={},body,secure=false}={})=>{
    const run=async()=>{
      const origin=secure?'https://dashboard.test':'http://127.0.0.1:4188';const u=new URL(url,origin);
      let script='index.php';let uri=u.pathname+u.search;
      if(u.pathname==='/api.php'||u.pathname==='/media.php')script=u.pathname.slice(1);
      else if(u.pathname.endsWith('.html'))uri=`/index.php?page=${encodeURIComponent(u.pathname.split('/').pop())}${u.search?'&'+u.search.slice(1):''}`;
      return php.run({scriptPath:`/app/public/${script}`,relativeUri:uri,method,headers:{host:u.host,...headers},body:typeof body==='string'?new TextEncoder().encode(body):body,protocol:secure?'https':'http',env:{AOL_LOCAL_PREVIEW:local?'1':'0',AOL_SETUP_TOKEN:setupToken},$_SERVER:{REMOTE_ADDR:'127.0.0.1',HTTP_HOST:u.host,SERVER_NAME:u.hostname,SERVER_PORT:u.port||(secure?'443':'80'),REQUEST_URI:u.pathname+u.search,HTTPS:secure?'on':'off'}});
    };
    const result=queue.then(run);queue=result.catch(()=>{});return result;
  };
  return {php,request};
}
