import {writeFile} from 'node:fs/promises';
process.loadEnvFile('.env.local');
const base='https://jeda-setiap-hari-berarti.vercel.app';
let configured=false;
for(let attempt=0;attempt<12;attempt++) {
  const response=await fetch(base+'/api/status',{cache:'no-store'});
  const status=await response.json();
  if(status.configured){configured=true;break;}
  if(attempt===0)console.log('Waiting for production environment rollout.');
  await new Promise(resolve=>setTimeout(resolve,4000));
}
if(!configured)throw Error('Production environment is not ready yet.');
const routes=[];
for(const path of ['/','/kalkulator','/api/status','/.env.local','/server/gemini.mjs','/src/App.tsx']) {
  const response=await fetch(base+path);
  routes.push({path,status:response.status});
}
const html=await(await fetch(base+'/')).text();
const assets=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match=>match[1]);
if(!assets.length)throw Error('No production assets found.');
for(const path of assets) {
  const content=await(await fetch(new URL(path,base))).text();
  if(process.env.GEMINI_API_KEY&&content.includes(process.env.GEMINI_API_KEY))throw Error('Secret detected in public asset.');
}
const request={question:'Dari kemarin pukul 08:00 WIB sampai besok pukul 10:00 WIB, berapa lama?',now:new Date().toISOString()};
const response=await fetch(base+'/api/interpret',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(request),signal:AbortSignal.timeout(30000)});
const interpreted=await response.json();
if(response.status!==200||interpreted.kind!=='range')throw Error('Production Gemini check failed: '+JSON.stringify({status:response.status,message:interpreted.message}));
const durationSeconds=(Date.parse(interpreted.end.date+'T'+interpreted.end.time+'Z')-Date.parse(interpreted.start.date+'T'+interpreted.start.time+'Z'))/1000;
if(durationSeconds!==180000)throw Error('Unexpected interpreted duration.');
const evidence={url:base,checkedAt:new Date().toISOString(),configured,routes,publicAssetsChecked:assets.length,secretScan:'passed',gemini:{status:response.status,interpreted,durationSeconds}};
await writeFile('evidence/vercel-live.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence));
