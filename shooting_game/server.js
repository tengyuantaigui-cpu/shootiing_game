import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const target=file===root?path.join(root,'index.html'):file;const data=await readFile(target);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(target)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404).end('Not found');}}).listen(5173,'127.0.0.1',()=>console.log('http://localhost:5173'));
