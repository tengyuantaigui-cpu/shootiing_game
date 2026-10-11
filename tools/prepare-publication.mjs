import { cp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
// Publish only runtime assets; development tools, saves, tests and repository metadata stay local.
export async function preparePublication(output = path.join(root, 'dist')) {
  await mkdir(output, { recursive: true });
  for (const name of ['index.html', 'manifest.webmanifest', 'src', '_headers', 'sw.js']) {
    await cp(path.join(root, name), path.join(output, name), { recursive: true });
  }
  const hash=createHash('sha256');async function digest(dir){const {readdir}=await import('node:fs/promises');for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,e.name);if(e.isDirectory())await digest(file);else hash.update(await readFile(file));}}await digest(path.join(root,'src'));hash.update(await readFile(path.join(root,'index.html')));hash.update(await readFile(path.join(root,'manifest.webmanifest')));await writeFile(path.join(output,'sw.js'),(await readFile(path.join(root,'sw.js'),'utf8'))+'\n// Build: '+hash.digest('hex')+'\n');await writeFile(path.join(output,'.nojekyll'),'');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await preparePublication();
  console.log('HTTPS静的ホスティング用ファイルを dist/ に配置しました。');
}
