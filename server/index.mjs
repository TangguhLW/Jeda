import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createApiHandler} from './gemini.mjs';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
try {process.loadEnvFile(fileURLToPath(new URL('../.env.local',import.meta.url)));} catch(error) {if(error.code!=='ENOENT')throw error;}
const api=createApiHandler({apiKey:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL||'gemini-3.1-flash-lite'});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webm':'video/webm','.json':'application/json'};
http.createServer(async(req,res)=>{
  if ((req.url||'').startsWith('/api/')) {await api(req,res);return;}
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (path.split('/').some(p=>p.startsWith('.'))) {res.writeHead(404);res.end();return;}
    let target=resolve(root,'.'+path);
    if(target!==root&&!target.startsWith(root+sep)){res.writeHead(404);res.end();return;}
    try {if(!(await stat(target)).isFile())target=resolve(root,'index.html');}
    catch {if(extname(path)){res.writeHead(404);res.end();return;}target=resolve(root,'index.html');}
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:body);
  } catch {res.writeHead(404);res.end('Build aplikasi lebih dulu dengan npm run build.');}
}).listen(Number(process.env.PORT)||4796,'127.0.0.1',()=>console.log('Jeda: http://127.0.0.1:'+(Number(process.env.PORT)||4796)));
