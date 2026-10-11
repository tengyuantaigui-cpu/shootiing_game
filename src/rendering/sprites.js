// Original pixel patterns: '.' transparent, letters refer to the shared palette.
// Visual dimensions are independent of enemy radius and collision geometry.
const PALETTE={a:'#203e58',b:'#50758b',c:'#72ead3',d:'#e8faff',e:'#1e2442',f:'#79d9ed',g:'#bba0ff',h:'#ffbf73',i:'#ff7298',j:'#ffe49a'};
export const SPRITES={
  player:[
    '.......dd.......','.......dd.......','......dccd......','......dccd......',
    '......caac......','.....ccaacc.....','.....cddadc.....','....bcddadcb....',
    '....bcddadcb....','...bbcddadcbb...','...bbcaaacbbb...', '..cbbcccccbbbc..',
    '..cbbcccccbbbc..','.ccbbcccccbbbcc.','.ccbbaaaaabbbcc.','cccbbaaaaabbbccc',
    'ccbbbccccccbbbcc','.....cc..cc.....','.....aa..aa.....'],
  scout:[
    '..ff........ff..','..fbf......fbf..','.ffbf......fbff.','.fbbf..ff..fbbf.',
    'ffbbbfbaabfbbbff','ffbbbbaddabbbbff','.ffbbbbddbbbbff.','..ffbbbbbbbbff..',
    '...ffbbddbbff...','....ffbddbff....','.....ffddff.....','......ffff......',
    '.......ff.......'],
  fighter:[
    '.ggg........ggg.','.gbg..bbbb..gbg.','ggbg.bggggb.ggbg','gbbgbggddggbgbbg',
    'gbbbbggddggbbbbg','ggbbbggddggbbbgg','.ggbbggggggbbgg.','..gbbbggggbbb g.',
    '..ggbbgaagbbgg..','...ggbgaag bgg..','....gggaaggg....','.....ggddgg.....',
    '......gddg......','.......gg.......'].map(row=>row.replaceAll(' ','.')),
  heavy:[
    '..hhhh....hhhh..','.hbbbbh..hbbbbh.','hhbbbbhhhhbbbbhh','hbbb hhaahh bbbh',
    'hbebhhaaaahhbebh','hbebhaddddahbebh','hbbbhaddddahbbbh','hhbbhaddddahbbhh',
    '.hbbhhaaaahhbbh.','.hbbbhhhhhbb b h','..hhhbbhhbbhhh..','....hbbhhbbh....',
    '.....hbhhbh.....','......hhhh......'].map(row=>row.replaceAll(' ','.')),
  boss:[
    'ii............ii','ibi...iiii...ibi','ibbi.iibbii.ibbi','ibbbiiiaaiiibbbi',
    'ibbbiiaaaaiibbbi','ibbbiadddd aibbi','iibb iaddda bbii','..ibbiaaaai bbi.',
    '...ibbiiiibb i..','....ibddddbi....','.....ibddbi.....','......iiii......',
    '......iddi......','.......ii.......'].map(row=>row.replaceAll(' ','.')),
  credit:['...jj...','..jddj..','.jdaadj.','jdaaaadj','jdaaaadj','.jdaadj.','..jddj..','...jj...'],
  hostile:['..ii..','.iddi.','iddddi','iddddi','.iddi.','..ii..'],
};
function pixels(ctx,pattern,x,y,scale,palette=PALETTE){const width=Math.max(...pattern.map(row=>row.length));const left=Math.round(x-width*scale/2),top=Math.round(y-pattern.length*scale/2);for(let row=0;row<pattern.length;row++)for(let col=0;col<pattern[row].length;col++){const color=palette[pattern[row][col]];if(color){ctx.fillStyle=color;ctx.fillRect(left+col*scale,top+row*scale,scale,scale);}}}
export function drawCredit(ctx,item){pixels(ctx,SPRITES.credit,item.x,item.y,2);}
export function drawEnemy(ctx,e){pixels(ctx,[SPRITES.scout,SPRITES.fighter,SPRITES.heavy,SPRITES.boss][e.type],e.x,e.y,[2,3,4,8][e.type]);}
export function drawProjectiles(ctx,run){for(const b of run.bullets){ctx.fillStyle='#203e58';ctx.fillRect(Math.round(b.x)-2,Math.round(b.y)+4,4,8);ctx.fillStyle='#72ead3';ctx.fillRect(Math.round(b.x)-2,Math.round(b.y)-6,4,12);ctx.fillStyle='#e8faff';ctx.fillRect(Math.round(b.x)-1,Math.round(b.y)-8,2,8);}for(const b of run.hostiles)pixels(ctx,SPRITES.hostile,b.x,b.y,2);}
export function drawPlayer(ctx,player,time,color=PALETTE.c){if(player.inv<=0||Math.floor(player.inv*14)%2===0){const flame= Math.floor(time*12)%3;ctx.fillStyle='#50758b';ctx.fillRect(Math.round(player.x)-6,Math.round(player.y)+18,12,8+flame*2);ctx.fillStyle='#79d9ed';ctx.fillRect(Math.round(player.x)-4,Math.round(player.y)+18,8,6+flame*2);ctx.fillStyle='#e8faff';ctx.fillRect(Math.round(player.x)-2,Math.round(player.y)+18,4,4+flame*2);pixels(ctx,SPRITES.player,player.x,player.y,2,{...PALETTE,c:color});}ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(player.x,player.y,3,0,Math.PI*2);ctx.fill();}

// A weapon pickup is a pixel crate with a distinct glyph, never a coin sprite.
export function drawWeaponItem(ctx,item){
 pixels(ctx,['cccccccc','caaaaaac','caaddacc','caddddac','caaddacc','caaaaaac','cccccccc'].map(r=>r.replaceAll(' ','.')),item.x,item.y,2);
 ctx.fillStyle='#081224';ctx.font='bold 10px monospace';ctx.fillText({bullet:'P',beam:'B',spread:'S',piercing:'T',missile:'M',charge:'C'}[item.weapon]??'W',item.x-3,item.y+3);
}
