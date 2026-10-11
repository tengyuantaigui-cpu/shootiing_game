import {WEAPON_CATALOG} from './weaponCatalog.js';
export const INVENTORY_KEY='star-credit-weapons-v3';
export const LEGACY_INVENTORY_KEY='star-credit-weapons-v2';
const owned=()=>({level:1,progress:0});
function blank(legacy=false){return {version:3,weapons:Object.fromEntries(Object.entries(WEAPON_CATALOG).filter(([,s])=>legacy||s.starter).map(([key])=>[key,owned()])),equipped:'bullet'};}
export function loadWeaponInventory(storage){
 let raw;
 try{raw=JSON.parse(storage?.getItem(INVENTORY_KEY));}catch{}
 if(raw?.version!==3){try{const old=JSON.parse(storage?.getItem(LEGACY_INVENTORY_KEY));if(old?.version===2)raw=old;}catch{}}
 if(![2,3].includes(raw?.version)){
  let legacy=false;
  // Older releases had no weapon inventory; all six weapons were usable.
  for(const key of ['star-credit-v1','star-credit-meta-v1','star-credit-endless-v1','star-credit-challenge-v1']){
   try{const old=JSON.parse(storage?.getItem(key));if(old&&(key==='star-credit-challenge-v1'?Number.isSafeInteger(old)&&old>=0:old.version===1))legacy=true;}catch{}
  }
  return blank(legacy);
 }
 const data=blank();
 for(const [key,spec] of Object.entries(WEAPON_CATALOG)){
  const entry=raw.weapons?.[key];if(!entry||!Number.isSafeInteger(entry.level)||entry.level<1)continue;
  const level=Math.min(spec.maxLevel,entry.level),required=spec.duplicates[level-1];
  data.weapons[key]={level,progress:level===spec.maxLevel?0:Number.isSafeInteger(entry.progress)&&entry.progress>=0?Math.min(entry.progress,required-1):0};
 }
 const previous=raw.version===3?raw.equipped:(WEAPON_CATALOG[raw.equipped?.extra]?.slot==='extra'&&data.weapons[raw.equipped.extra]?raw.equipped.extra:WEAPON_CATALOG[raw.equipped?.primary]?.slot==='primary'?raw.equipped.primary:'bullet');
 if(Object.hasOwn(WEAPON_CATALOG,previous)&&data.weapons[previous])data.equipped=previous;
 return data;
}
export function createWeaponInventory(storage,{random=Math.random,battle=false}={}){
 const initial=()=>({version:3,weapons:{bullet:owned()},equipped:'bullet'});
 const data=battle?initial():loadWeaponInventory(storage);let listener=()=>{};
 const persist=()=>{if(battle)return;try{storage?.setItem(INVENTORY_KEY,JSON.stringify(data));}catch{}};
 persist(); // Idempotent migration; existing save keys remain untouched.
 return {
  data,random,onEquip(fn){listener=fn;},reset(){if(!battle)return false;Object.assign(data,initial());listener();return true;},
  acquire(key){
   if(!Object.hasOwn(WEAPON_CATALOG,key))return null;const spec=WEAPON_CATALOG[key];
   let event;
   if(!data.weapons[key]){data.weapons[key]=owned();event='new';}
   else{const entry=data.weapons[key];event='duplicate';
    if(entry.level>=spec.maxLevel){event=spec.maxDuplicate;entry.progress=0;}
    else if(++entry.progress>=spec.duplicates[entry.level-1]){entry.progress=0;entry.level++;event='level';}
   }
   persist();return {key,event,...data.weapons[key]};
  },
  equip(key){
   if(!data.weapons[key]||!Object.hasOwn(WEAPON_CATALOG,key))return false;
   if(data.equipped===key)return true;data.equipped=key;listener();persist();return true;
  },
 };
}
