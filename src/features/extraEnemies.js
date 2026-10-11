import {id} from '../model.js';
export const CHALLENGE={duration:90,interval:1, bossHP:240};
export const EXTRA_ENEMIES={recon:{name:'偵察機',type:0,hp:3,speed:170,reward:15,r:17,color:'#79d9ed'},shield:{name:'シールド機',type:1,hp:8,speed:70,reward:35,r:24,color:'#bba0ff',shield:4},leader:{name:'編隊リーダー',type:1,hp:10,speed:80,reward:40,r:24,color:'#72ead3'},turret:{name:'砲台機',type:2,hp:18,speed:45,reward:60,r:32,color:'#ffbf73'},boss:{name:'CORE GUARDIAN',type:3,hp:240,speed:65,reward:300,r:64,color:'#ff7298'}};
export function spawnExtra(run,variant,random=Math.random){const def=EXTRA_ENEMIES[variant],x=variant==='boss'?240:50+random()*380;const enemy={...def,id:id(),variant,maxHp:def.hp,x,baseX:x,y:-def.r-5,age:0,fire:1.5,phase:1,warning:0,attack:0,dead:false};run.enemies.push(enemy);return enemy;}
export function bossPhase(enemy){return enemy.hp/enemy.maxHp>.7?1:enemy.hp/enemy.maxHp>.35?2:3;}
export function bossAngles(phase){return phase===1?[-.45,0,.45]:phase===2?[-.6,-.3,0,.3,.6]:[-.7,-.46,-.23,0,.23,.46,.7];}
export function damageExtra(enemy,amount){if(enemy.shield>0){const absorbed=Math.min(enemy.shield,amount);enemy.shield-=absorbed;amount-=absorbed;}enemy.hp-=amount;}
export function moveEnemy(enemy,dt,player,shoot){const e=enemy;e.age+=dt;if(e.variant==='small'){e.y+=e.speed*dt;return;}
 if(e.variant==='boss'){
  e.y=Math.min(110,e.y+e.speed*dt);e.x=240+Math.sin(e.age*.65)*130;
  const phase=bossPhase(e);if(phase!==e.phase){e.phase=phase;e.fire=1.1;e.warning=0;}
  if(e.y<110)return;
  if(e.warning>0){e.warning-=dt;if(e.warning<=0){const spread=bossAngles(e.phase);const aim=e.aimAngle;spread.forEach(a=>shoot(e,a+aim,150+e.phase*15));e.attack++;e.fire=(1.8-.2*e.phase)/(e.attackRate??1);}return;}
  e.fire-=dt;if(e.fire<=0){e.warning=.7;e.aimAngle=e.attack%2===0?0:Math.max(-.45,Math.min(.45,Math.atan2(player.x-e.x,player.y-e.y)));}return;
 }
 if(e.variant!=='turret'||e.age<2||e.age>5)e.y+=e.speed*dt;
 if(e.variant==='recon')e.x=Math.max(e.r,Math.min(480-e.r,e.baseX+Math.sin(e.age*3)*35));
 if(e.variant==='leader')e.x=Math.max(e.r,Math.min(480-e.r,e.baseX+Math.sin(e.age*2)*60));
 e.fire-=dt;if(e.fire<=0&&e.y>0){e.fire=(e.variant==='turret'?2:1.8)/(e.attackRate??1);if(e.variant==='recon')return;if(e.variant==='shield')shoot(e,0,150);else if(e.variant==='leader')[-.2,.2].forEach(a=>shoot(e,a,165));else [-.35,0,.35].forEach(a=>shoot(e,a,150));}
}
