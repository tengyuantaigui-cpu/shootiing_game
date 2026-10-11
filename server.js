import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const target=file===root?path.join(root,'index.html'):file;const data=await readFile(target);res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.m4a':'audio/mp4'})[path.extname(target)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404).end('Not found');}}).listen(5173,'0.0.0.0',()=>console.log('http://192.168.3.4:5173'));
