import {drawPhaseBanner} from './endless.js';
import {drawChallenge} from './challenge.js';
import {CONFIG as C} from '../config.js';
import {value} from '../model.js';
import {drawBackground} from './background.js';
import {drawWeaponItem,drawCredit,drawEnemy,drawProjectiles,drawPlayer} from './sprites.js';
import {drawHud} from './hud.js';

// Render-only: never changes the run or advances timers.
export function render(ctx,run,state,hud,stars,visuals,skinColor,inputLabels){
ctx.save();ctx.imageSmoothingEnabled=false;if(visuals?.offset)ctx.translate(visuals.offset,0);
drawBackground(ctx,run.time,stars);
if(state!=='title'){
for(const item of run.items)if(item.kind==='weapon')drawWeaponItem(ctx,item);else drawCredit(ctx,item);
if(run.weapon==='beam'){const p=run.player,width=value(run,'beamWidth');const g=ctx.createLinearGradient(p.x-width,0,p.x+width,0);g.addColorStop(0,'#6efbe100');g.addColorStop(.5,'#b9ffefaa');g.addColorStop(1,'#6efbe100');ctx.fillStyle=g;ctx.fillRect(p.x-width/2,0,width,p.y-22);ctx.fillStyle='#d1fff2';ctx.fillRect(p.x-1,0,2,p.y-22);}
for(const e of run.enemies){drawEnemy(ctx,e);const maxHp=e.maxHp??C.enemies[e.type].hp;if(e.type!==3&&e.hp<maxHp){ctx.fillStyle='#72ead3';ctx.fillRect(e.x-e.r,e.y-e.r-8,e.r*2*Math.max(0,e.hp)/maxHp,3);}}
drawProjectiles(ctx,run);drawChallenge(ctx,run,inputLabels);drawPlayer(ctx,run.player,run.time,skinColor);
}
for(const e of run.effects){ctx.strokeStyle=e.color;ctx.globalAlpha=e.life/.45;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,(.45-e.life)*100+5,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
visuals?.draw(ctx);if(state!=='title')drawPhaseBanner(ctx,run);drawHud(ctx,run,hud);ctx.restore();if(visuals?.settings.crt){ctx.fillStyle='#0002';for(let y=0;y<800;y+=4)ctx.fillRect(0,y,480,1);}
}
