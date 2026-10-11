import {CONFIG,UPGRADES} from '../config.js';
import {collect} from '../model.js';
export function moveItems(run,dt,onCollect=()=>{}){
 const p=run.player,radius=UPGRADES.magnet.values[run.levels.magnet??0];
 const speed=CONFIG.magnetSpeeds[run.levels.magnet??0];
 for(const item of run.items){
  if(item.dead)continue;
  const distance=Math.hypot(p.x-item.x,p.y-item.y);
  if(distance<=radius){const step=Math.min(distance,speed*dt);item.x+=(p.x-item.x)/(distance||1)*step;item.y+=(p.y-item.y)/(distance||1)*step;}
  else item.y+=CONFIG.itemSpeed*dt;
  if(Math.hypot(p.x-item.x,p.y-item.y)<16&&collect(run,item))onCollect(item);
 }
}
