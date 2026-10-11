import {moveItems} from './items.js';
import {value,defeat,collect,id} from '../model.js';
import {CHALLENGE,spawnExtra,moveEnemy,damageExtra} from './extraEnemies.js';
import {fireExtra,moveExtra,hitExtra} from './extraWeapons.js';
export function enableChallenge(run){Object.assign(run,{mode:'challenge',extra:'spread',extraShot:0,charge:0,charging:false,extraProjectiles:[],challengeSpawn:0});return run;}
// Shared challenge/endless combat, after player movement; stage controls only spawning.
export function updateChallenge(run,dt,keys,{hit=()=>{},effect=()=>{},sound=()=>{},boss=()=>{},spark=()=>{},encounter=()=>{},defeated=()=>{},collected=()=>{},stage}={}){
 const p=run.player;
 const shoot=(e,angle,speed)=>run.hostiles.push({id:id(),x:e.x,y:e.y+e.r,vx:Math.sin(angle)*speed,vy:Math.cos(angle)*speed,r:5});
 const damage=(e,n)=>{damageExtra(e,n);spark(e);sound('hit');};
 if(stage)stage(run,dt,{sound,boss});else if(run.time<CHALLENGE.duration){run.challengeSpawn-=dt;if(run.challengeSpawn<=0){run.challengeSpawn+=CHALLENGE.interval;const types=run.time<30?['recon','shield']:run.time<60?['recon','shield','leader']:['recon','shield','leader','turret'];spawnExtra(run,types[Math.floor(Math.random()*types.length)]);}}else if(!run.bossSpawned&&run.enemies.length===0){run.bossSpawned=true;spawnExtra(run,'boss');sound('warning');boss();}
 run.shot-=dt;if(run.weapon==='bullet'&&run.shot<=0){run.shot=value(run,'interval');sound('shot');const count=value(run,'count');for(let i=0;i<count;i++)run.bullets.push({id:id(),x:p.x+(i-(count-1)/2)*14,y:p.y-25,r:3,damage:value(run,'power')});}
 fireExtra(run,dt,keys,()=>sound('shot'));
 for(const e of run.enemies){encounter(e);moveEnemy(e,dt,p,shoot);if(run.weapon==='beam'&&e.y+e.r>0&&e.y-e.r<p.y-22&&Math.abs(e.x-p.x)<e.r+value(run,'beamWidth')/2)damage(e,value(run,'beamPower')*dt);if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+4)hit();}
 for(const b of run.bullets){b.y-=600*dt;for(const e of run.enemies){if(!e.dead&&e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+b.r){damage(e,b.damage);b.dead=true;break;}}}
 moveExtra(run,dt);hitExtra(run,damage);
 for(const b of run.hostiles){b.x+=b.vx*dt;b.y+=b.vy*dt;if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+4){b.dead=true;hit();}}
 let clear=false;for(const e of run.enemies)if(e.hp<=0&&defeat(run,e)){defeated(e);sound(e.type>=2?'large':'explosion');effect(e.x,e.y,e.color);if(e.variant==='boss')clear=true;}
 moveItems(run,dt,item=>{sound('collect');effect(item.x,item.y,'#ffe49a','collect');collected(item);});
 run.enemies=run.enemies.filter(e=>!e.dead&&e.y<800+e.r);run.bullets=run.bullets.filter(b=>!b.dead&&b.y>-20);run.hostiles=run.hostiles.filter(b=>!b.dead&&b.y<820&&b.x>-20&&b.x<500);run.items=run.items.filter(i=>!i.dead&&i.y<820);run.effects.forEach(e=>e.life-=dt);run.effects=run.effects.filter(e=>e.life>0);
 return p.hp<=0?'over':clear?'clear':null;
}
