import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
const root=dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.mp4':'video/mp4','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain'};
const port=Number(process.env.PORT||4319);
createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://127.0.0.1:${port}`);
    const name=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
    const file=resolve(root,'.'+name.replaceAll('/',sep));
    if(!file.startsWith(root+sep)||name.includes('node_modules')){res.writeHead(403).end();return;}
    const info=await stat(file);
    if(!info.isFile()){res.writeHead(404).end();return;}
    let start=0,end=info.size-1,status=200;
    if(req.headers.range){
      const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if(!m){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}
      start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;
      if(start>end){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}
      status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);
    }
    res.writeHead(status,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-cache','X-Robots-Tag':'noindex, nofollow'});
    if(req.method==='HEAD'){res.end();return;}
    await pipeline(createReadStream(file,{start,end}),res);
  }catch(error){
    if(error.code==='ERR_STREAM_PREMATURE_CLOSE')return;
    if(!res.headersSent)res.writeHead(error.code==='ENOENT'?404:500);
    res.end();
    if(error.code!=='ENOENT')console.error(error);
  }
}).listen(port,'127.0.0.1',()=>console.log(`Animated preview: http://127.0.0.1:${port}/`));
