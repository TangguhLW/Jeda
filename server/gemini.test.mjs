import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createApiHandler,validateInterpretation} from './gemini.mjs';
import {createVercelHandler} from './vercel-handler.mjs';
const interpreted={kind:'range',message:'',start:{date:'2026-10-26',time:'16:00:00',zone:'WIB'},end:{date:'2026-10-27',time:'08:00:01',zone:'WIB'},notes:['Kemarin sore ditafsirkan pukul 16:00 WIB.']};
const upstream=value=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(value)}]}}]}),{headers:{'Content-Type':'application/json'}});
async function withApi(options,fn){const server=http.createServer(createApiHandler(options));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));try{await fn(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise(resolve=>server.close(resolve));}}
const ask=(url,question='sejak kemarin sore sampai sekarang',extra={})=>fetch(url+'/api/interpret',{method:'POST',headers:{'Content-Type':'application/json',...extra.headers},body:JSON.stringify({question,now:'2026-10-27T01:00:01Z'})});
test('no key: status is safe and interpretation is unavailable',()=>withApi({},async url=>{const status=await fetch(url+'/api/status');assert.deepEqual(await status.json(),{configured:false,provider:'gemini'});const response=await ask(url);assert.equal(response.status,503);assert.equal((await response.json()).error,'not_configured');}));
test('real request shape uses server-only key, model, schema and current time',()=>withApi({apiKey:'unit-test-placeholder',fetchImpl:async(url,options)=>{assert.match(url,/gemini-3.1-flash-lite:generateContent$/);assert.equal(options.headers['x-goog-api-key'],'unit-test-placeholder');assert.ok(options.signal);const payload=JSON.parse(options.body);assert.equal(payload.generationConfig.responseMimeType,'application/json');assert.ok(payload.generationConfig.responseJsonSchema);assert.match(payload.systemInstruction.parts[0].text,/2026-10-27T01:00:01.000Z/);assert.doesNotMatch(options.body,/unit-test-placeholder/);return upstream(interpreted);}},async url=>{const response=await ask(url);assert.equal(response.status,200);assert.deepEqual(await response.json(),interpreted);assert.doesNotMatch(await(await fetch(url+'/api/status')).text(),/unit-test-placeholder/);}));
test('clarification is returned without invented dates',()=>{assert.deepEqual(validateInterpretation({kind:'clarify',message:'Tanggal lahirmu kapan?',notes:[]}),{kind:'clarify',message:'Tanggal lahirmu kapan?',notes:[]});});
test('invalid provider endpoints are rejected',()=>{assert.throws(()=>validateInterpretation({...interpreted,start:{...interpreted.start,date:'2026-02-30'}}));assert.throws(()=>validateInterpretation({...interpreted,start:{...interpreted.start,time:'24:00:00'}}));assert.throws(()=>validateInterpretation({...interpreted,start:{...interpreted.start,zone:'Mars'}}));});
test('provider errors never expose raw responses or keys',()=>withApi({apiKey:'unit-test-placeholder',fetchImpl:async()=>new Response('private upstream error unit-test-placeholder',{status:403})},async url=>{const response=await ask(url);assert.equal(response.status,502);assert.doesNotMatch(await response.text(),/private|unit-test-placeholder/);}));
test('malformed provider JSON and timeout become retryable errors',async()=>{await withApi({apiKey:'unit-test-placeholder',fetchImpl:async()=>upstream({bad:true})},async url=>{assert.equal((await ask(url)).status,502);});await withApi({apiKey:'unit-test-placeholder',fetchImpl:async()=>{throw new DOMException('timeout','TimeoutError');}},async url=>{assert.match((await(await ask(url)).json()).message,/terlalu lama/);});});
test('input, method and cross-origin requests are checked before calling provider',()=>withApi({apiKey:'unit-test-placeholder',fetchImpl:()=>{throw Error('should not call provider');}},async url=>{assert.equal((await ask(url,'')).status,400);assert.equal((await ask(url,'x'.repeat(1201))).status,400);assert.equal((await ask(url,'question',{headers:{Origin:'https://unrelated.example'}})).status,403);assert.equal((await fetch(url+'/api/interpret')).status,405);assert.equal((await fetch(url+'/api/interpret',{method:'POST',body:'null',headers:{'Content-Type':'application/json'}})).status,400);assert.equal((await fetch(url+'/api/interpret',{method:'POST',body:'x'})).status,415);}));
test('request bursts are limited',()=>withApi({apiKey:'unit-test-placeholder',fetchImpl:async()=>upstream(interpreted)},async url=>{for(let i=0;i<15;i++)assert.equal((await ask(url)).status,200);assert.equal((await ask(url)).status,429);}));
test('Vercel Web Request adapter supports status and streamed JSON body',async()=>{
  const handler=createVercelHandler({apiKey:'unit-test-placeholder',fetchImpl:async()=>upstream(interpreted)});
  const status=await handler(new Request('https://jeda.example/api/status'));
  assert.deepEqual(await status.json(),{configured:true,provider:'gemini'});
  const response=await handler(new Request('https://jeda.example/api/interpret',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://jeda.example'},body:JSON.stringify({question:'kemarin sampai sekarang'})}));
  assert.equal(response.status,200);assert.deepEqual(await response.json(),interpreted);
});
test('Vercel Web Request adapter keeps input and origin validation',async()=>{
  const handler=createVercelHandler();
  const bad=await handler(new Request('https://jeda.example/api/interpret',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://unrelated.example'},body:'{}'}));
  assert.equal(bad.status,403);
  assert.equal((await handler(new Request('https://jeda.example/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:'invalid'}))).status,400);
});
