import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
// Publish only runtime assets; development tools, saves, tests and repository metadata stay local.
export async function preparePublication(output = path.join(root, 'dist')) {
  await mkdir(output, { recursive: true });
  for (const name of ['index.html', 'manifest.webmanifest', 'src', '_headers']) {
    await cp(path.join(root, name), path.join(output, name), { recursive: true });
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await preparePublication();
  console.log('HTTPS静的ホスティング用ファイルを dist/ に配置しました。');
}
