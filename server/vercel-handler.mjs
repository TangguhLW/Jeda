import {createApiHandler} from './gemini.mjs';

export function createVercelHandler(options={}) {
  const handler=createApiHandler(options);
  return async function handleRequest(request) {
    const url=new URL(request.url);
    let status=500,headers={},body='';
    const response={writeHead(code,value){status=code;headers=value;},end(value){body=value??'';}};
    const incoming={
      url:url.pathname+url.search,
      method:request.method,
      headers:{...Object.fromEntries(request.headers),host:request.headers.get('host')||url.host},
      socket:{remoteAddress:request.headers.get('x-real-ip')||'vercel'},
      async *[Symbol.asyncIterator](){for await(const chunk of request.body??[])yield Buffer.from(chunk);},
    };
    await handler(incoming,response,()=>{status=404;body='Not found';});
    return new Response(body,{status,headers});
  };
}

export const handleVercelRequest=createVercelHandler({apiKey:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL||'gemini-3.1-flash-lite'});
