import {rollWeaponDrop,weaponMultiplier} from './features/weaponCatalog.js';
import {UPGRADES} from './config.js';
let sequence=0;
export const id=()=>++sequence;
export function newRun(){return {time:0,credits:0,collected:0,score:0,kills:0,weapon:'bullet',levels:Object.fromEntries(Object.keys(UPGRADES).map(k=>[k,0])),player:{id:id(),x:240,y:690,hp:3,inv:0},enemies:[],bullets:[],hostiles:[],items:[],effects:[],spawn:0,shot:0,bossSpawned:false};}
export const value=(run,key)=>UPGRADES[key].values[run.levels[key]??0]*(['power','beamPower'].includes(key)?weaponMultiplier(run,key==='power'?'bullet':'beam'):1);
export function purchase(run,key){const upgrade=UPGRADES[key];if(!upgrade)return false;const level=run.levels[key],cost=upgrade.costs[level];if(cost===undefined||run.credits<cost)return false;run.credits-=cost;run.levels[key]++;return true;}
export function defeat(run,enemy){if(enemy.dead)return false;enemy.dead=true;run.kills++;run.score+=enemy.reward;run.items.push({id:id(),x:enemy.x,y:enemy.y,value:enemy.reward});if(run.inventory){const weapon=rollWeaponDrop(enemy,run.inventory.random);if(weapon)run.items.push({id:id(),kind:'weapon',weapon,x:Math.max(12,Math.min(468,enemy.x+12)),y:enemy.y,value:0});}return true;}
export function collect(run,item){if(item.dead)return false;if(item.kind==='weapon'){const result=run.inventory?.acquire(item.weapon);if(!result)return false;item.dead=true;item.acquisition=result;return true;}item.dead=true;run.credits+=item.value;run.collected+=item.value;return true;}
export function loadSave(storage){try{const s=JSON.parse(storage.getItem('star-credit-v1'));if(s?.version!==1)throw Error();return {version:1,high:Number.isSafeInteger(s.high)&&s.high>=0?s.high:0,volume:Number.isFinite(s.volume)&&s.volume>=0&&s.volume<=1?s.volume:.5,instructions:s.instructions===true};}catch{return {version:1,high:0,volume:.5,instructions:false};}}
