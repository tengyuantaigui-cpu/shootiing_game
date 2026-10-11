import { writeFile, mkdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { SPRITES } from '../src/rendering/sprites.js';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const tag = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([length, tag, data, crc]);
}
function icon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const palette = { a: [32,62,88], b: [80,117,139], c: [114,234,211], d: [232,250,255] };
  function rect(x, y, w, h, color) {
    for (let row = y; row < y+h; row++) for (let col = x; col < x+w; col++) {
      pixels.set([...color,255], (row*size+col)*4);
    }
  }
  rect(0,0,size,size,[8,18,36]);
  // Entire ship stays inside the central maskable safe circle. No pre-rounded corners.
  const scale = Math.max(1,Math.floor(size*0.027));
  const left = Math.floor((size-16*scale)/2), top = Math.floor((size-19*scale)/2);
  SPRITES.player.forEach((row,y) => [...row].forEach((symbol,x) => {
    if (palette[symbol]) rect(left+x*scale,top+y*scale,scale,scale,palette[symbol]);
  }));
  const header=Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size,4);
  header[8]=8; header[9]=6;
  const scanlines=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++) pixels.copy(scanlines,y*(size*4+1)+1,y*size*4,(y+1)*size*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scanlines)),chunk('IEND',Buffer.alloc(0))]);
}
const output = new URL('../src/assets/icons/',import.meta.url);
await mkdir(output,{recursive:true});
for(const [name,size] of [['apple-touch-icon',180],['icon-192',192],['icon-512',512]]) {
  await writeFile(new URL(`${name}.png`,output),icon(size));
}
