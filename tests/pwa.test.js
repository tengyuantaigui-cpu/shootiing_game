import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, readdir, rm } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { preparePublication } from '../tools/prepare-publication.mjs';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url))); 
const read = name => readFile(path.join(root,name));

test('PWAはルートからstandalone・縦向きで起動し、iPhoneメタタグと一致する', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));
  const html = (await read('index.html')).toString();
  assert.equal(manifest.name,'STAR CREDIT');
  assert.equal(manifest.id,'./'); assert.equal(manifest.scope,'./'); assert.equal(manifest.start_url,'./');
  assert.equal(manifest.display,'standalone'); assert.equal(manifest.orientation,'portrait');
  assert.match(html,/rel="manifest" href="\.\/manifest.webmanifest"/);
  assert.match(html,/name="apple-mobile-web-app-capable" content="yes"/);
  assert.match(html,/name="apple-mobile-web-app-title" content="STAR CREDIT"/);
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/name="theme-color" content="#081224"/);
  const css = (await read('src/style.css')).toString();
  for (const edge of ['top','right','bottom','left']) assert.ok(css.includes(`safe-area-inset-${edge}`));
});

test('ホーム画面用PNGは宣言寸法と一致し、不透明な背景とmaskable安全領域を持つ', async () => {
  const manifest=JSON.parse(await read('manifest.webmanifest'));
  const icons=[...manifest.icons,{src:'/src/assets/icons/apple-touch-icon.png',sizes:'180x180'}];
  for (const icon of icons) {
    const png=await read(icon.src.replace(/^\.\//,''));
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    assert.equal(`${width}x${height}`,icon.sizes); assert.equal(png[25],6);
    const compressed=[];
    for(let offset=8;offset<png.length;) {
      const length=png.readUInt32BE(offset);
      if(png.toString('ascii',offset+4,offset+8)==='IDAT') compressed.push(png.subarray(offset+8,offset+8+length));
      offset+=12+length;
    }
    const raw=inflateSync(Buffer.concat(compressed));
    assert.equal(raw.length,(width*4+1)*height);
    for(let y=0;y<height;y++) {
      assert.equal(raw[y*(width*4+1)],0);
      for(let x=0;x<width;x++) {
        const offset=y*(width*4+1)+1+x*4;
        assert.equal(raw[offset+3],255);
        if(raw[offset]!==8 || raw[offset+1]!==18 || raw[offset+2]!==36) {
          assert.ok(Math.hypot(x-width/2,y-height/2)<width*0.4);
        }
      }
    }
  }
});

test('HTTPS公開用パッケージは実行資産だけを含み、ゲーム・保存コードをそのままコピーする', async () => {
  const output=await mkdtemp(path.join(tmpdir(),'star-credit-pwa-'));
  try {
    await preparePublication(output);
    assert.deepEqual((await readdir(output)).sort(),['.nojekyll','_headers','index.html','manifest.webmanifest','src','sw.js']);
    async function compare(directory='src') {
      for(const entry of await readdir(path.join(root,directory),{withFileTypes:true})) {
        const name=path.join(directory,entry.name);
        if(entry.isDirectory()) await compare(name);
        else assert.deepEqual(await readFile(path.join(output,name)),await read(name));
      }
    }
    await compare();
    for(const name of ['index.html','manifest.webmanifest']) assert.deepEqual(await readFile(path.join(output,name)),await read(name));
  } finally { await rm(output,{recursive:true,force:true}); }
});

test('開発サーバーはmanifestとアイコンを正しいContent-Typeで返す', async () => {
  let handler;
  const source=(await read('server.js')).toString().replace(/^import .*;\n/gm,'');
  vm.runInNewContext(source,{
    http:{createServer(fn){handler=fn;return {listen(){}};}},readFile,path,
    process:{cwd:()=>root},URL,console
  });
  for(const [url,type] of [['/manifest.webmanifest','application/manifest+json'],['/src/assets/icons/apple-touch-icon.png','image/png'],['/src/assets/audio/battle.m4a','audio/mp4'],['/','text/html']]) {
    const headers={}; let body;
    await handler({url},{setHeader(key,value){headers[key]=value;},end(data){body=data;},writeHead(code){assert.fail(`HTTP ${code}`);}});
    assert.equal(headers['Content-Type'],type);assert.equal(headers['Cache-Control'],'no-cache'); assert.ok(body.length>0);
  }
});
test('公開用キャッシュ方針は同名のJS・音源も再検証対象にする',async()=>{const headers=(await read('_headers')).toString();assert.match(headers,/\/\*\s+Cache-Control: no-cache/);});

test('Pagesのリポジトリ配下でもHTML・manifest・音源のURLが同じscopeに解決する',async()=>{const base=new URL('https://example.github.io/shootiing_game/');const html=(await read('index.html')).toString();for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){const url=new URL(match[1],base);assert.ok(url.pathname.startsWith(base.pathname));assert.ok((await read(url.pathname.slice(base.pathname.length))).length>0);}const m=JSON.parse(await read('manifest.webmanifest'));assert.equal(new URL(m.scope,new URL('manifest.webmanifest',base)).pathname,base.pathname);for(const icon of m.icons)assert.ok((await read(new URL(icon.src,base).pathname.slice(base.pathname.length))).length>0);const {BGM_TRACKS}=await import('../src/audio/bgmCatalog.js');for(const item of Object.values(BGM_TRACKS))assert.ok(item.url.endsWith('.m4a'));});

test('Service Workerは自scopeのみ再検証し、外部通信・POST・保存を変更しない',async()=>{const events={};let fetched;vm.runInNewContext((await read('sw.js')).toString(),{self:{registration:{scope:'https://example.github.io/shootiing_game/'},addEventListener:(name,fn)=>events[name]=fn},URL,Request,fetch:request=>{fetched=request;return Promise.resolve({ok:true});}});let response;events.fetch({request:new Request('https://example.github.io/shootiing_game/src/main.js'),respondWith:p=>response=p});await response;assert.equal(fetched.cache,'no-cache');for(const url of ['https://example.github.io/other/main.js','https://other.example/audio.m4a'])events.fetch({request:new Request(url),respondWith:()=>assert.fail('scope外')});events.fetch({request:new Request('https://example.github.io/shootiing_game/',{method:'POST'}),respondWith:()=>assert.fail('POST')});assert.equal(events.activate,undefined);});

test('公開SWに資産内容の更新識別子が付き、自動デプロイはテスト後に実行する',async()=>{const output=await mkdtemp(path.join(tmpdir(),'star-pages-'));try{await preparePublication(output);const sw=await readFile(path.join(output,'sw.js'),'utf8');assert.match(sw,/Build: [a-f0-9]{64}/);const workflow=(await read('.github/workflows/pages.yml')).toString();assert.ok(workflow.indexOf('npm test')<workflow.indexOf('npm run build'));assert.match(workflow,/actions\/deploy-pages@v4/);assert.match(workflow,/steps.source.outputs.directory.*\/dist/);assert.match(workflow,/shooting_game\/package.json/);}finally{await rm(output,{recursive:true,force:true});}});
