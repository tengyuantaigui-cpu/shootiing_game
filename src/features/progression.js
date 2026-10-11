import {CONFIG,UPGRADES} from '../config.js';
import {EXTRA_ENEMIES} from './extraEnemies.js';

export const META_KEY='star-credit-meta-v1';
export const ENEMY_CATALOG=[
 ...CONFIG.enemies.map((e,i)=>({key:'classic-'+i,...e})),
 ...Object.entries(EXTRA_ENEMIES).map(([key,e])=>({key,...e})),
];
export const ACHIEVEMENTS={firstKill:'初撃破',clear:'初クリア',noDamage:'ノーダメージクリア',maxUpgrade:'いずれかの武器を最大強化',highScore:'モードのハイスコア更新'};
export const SKINS={mint:{name:'MINT / 標準',color:'#72ead3'},gold:{name:'GOLD / 初撃破',color:'#ffe49a',achievement:'firstKill'},violet:{name:'VIOLET / 初クリア',color:'#bba0ff',achievement:'clear'}};
const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const mode=m=>['classic','challenge','endless'].includes(m)?m:'classic';
const blank=()=>({version:1,enemies:{},achievements:[],skin:'mint',records:[]});

export function loadProgress(storage){
 try{
  const raw=JSON.parse(storage?.getItem(META_KEY));
  if(raw?.version!==1)return blank();
  const result=blank();
  for(const {key} of ENEMY_CATALOG){
   const e=raw.enemies?.[key];
   if(e)result.enemies[key]={encounters:count(e.encounters),kills:count(e.kills)};
  }
  result.achievements=Array.isArray(raw.achievements)?[...new Set(raw.achievements)].filter(k=>Object.hasOwn(ACHIEVEMENTS,k)):[];
  if(Object.hasOwn(SKINS,raw.skin)&&(!SKINS[raw.skin].achievement||result.achievements.includes(SKINS[raw.skin].achievement)))result.skin=raw.skin;
  result.records=Array.isArray(raw.records)?raw.records.slice(0,50)
   .filter(r=>r&&Number.isFinite(r.time)&&r.time>=0)
   .map(r=>({mode:mode(r.mode),score:count(r.score),kills:count(r.kills),collected:count(r.collected),clear:r.clear===true,phase:count(r.phase),time:Math.min(r.time,1e12),endedAt:count(r.endedAt)})):[];
  return result;
 }catch{return blank();}
}
export const enemyKey=e=>e.variant==='small'?'classic-0':Object.hasOwn(EXTRA_ENEMIES,e.variant)?e.variant:'classic-'+e.type;

// Meta progress is separate from the run. WeakSets avoid retaining every endless enemy.
export function createProgress(storage){
 const data=loadProgress(storage);
 let seen=new WeakSet(),killed=new WeakSet(),active,finished=false,damaged=false;
 const persist=()=>{try{storage?.setItem(META_KEY,JSON.stringify(data));}catch{}};
 const award=key=>{
  if(data.achievements.includes(key))return false;
  data.achievements.push(key);return true;
 };
 const encounter=e=>{
  const key=enemyKey(e);
  if(!ENEMY_CATALOG.some(c=>c.key===key)||seen.has(e))return;
  seen.add(e);
  const entry=data.enemies[key]??={encounters:0,kills:0};
  entry.encounters=Math.min(Number.MAX_SAFE_INTEGER,entry.encounters+1);
  persist();
 };
 return {
  data,
  start(run){active=run;finished=false;damaged=false;seen=new WeakSet();killed=new WeakSet();},
  encounter,
  defeated(e){
   encounter(e);
   if(killed.has(e))return;
   killed.add(e);
   const entry=data.enemies[enemyKey(e)];
   if(!entry)return;
   entry.kills=Math.min(Number.MAX_SAFE_INTEGER,entry.kills+1);
   award('firstKill');persist();
  },
  hurt(){damaged=true;},
  upgrade(run){
   if(Object.entries(UPGRADES).some(([key,u])=>key!=='magnet'&&run.levels[key]===u.values.length-1)&&award('maxUpgrade'))persist();
  },
  finish(run,newHigh=false){
   if(run!==active||finished)return;
   finished=true;
   if(run.clear){award('clear');if(!damaged&&run.player.hp===3)award('noDamage');}
   if(newHigh)award('highScore');
   data.records.unshift({mode:mode(run.mode),score:run.score,kills:run.kills,collected:run.collected,clear:run.clear===true,phase:run.phase??0,time:run.time,endedAt:Date.now()});
   data.records.length=Math.min(50,data.records.length);persist();
  },
  selectSkin(key){
   if(!Object.hasOwn(SKINS,key))return false;
   const skin=SKINS[key];
   if(skin.achievement&&!data.achievements.includes(skin.achievement))return false;
   data.skin=key;persist();return true;
  },
 };
}
