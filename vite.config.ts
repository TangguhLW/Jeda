import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createApiHandler } from './server/gemini.mjs';
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  const middleware=createApiHandler({apiKey:process.env.GEMINI_API_KEY||env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL||env.GEMINI_MODEL||'gemini-3.1-flash-lite'});
  return {plugins:[react(),{name:'jeda-gemini-api',configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);}}]};
});
