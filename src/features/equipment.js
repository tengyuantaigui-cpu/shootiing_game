import {WEAPON_CATALOG} from './weaponCatalog.js';
import {modeFor} from './modes.js';

// Inventory owns the selection; combat fields are read-only views for existing attacks.
export function bindEquipment(run,inventory){
 run.inventory=inventory;
 Object.defineProperties(run,{
  weapon:{enumerable:true,configurable:true,get:()=>inventory.data.equipped},
  extra:{enumerable:true,configurable:true,get:()=>WEAPON_CATALOG[inventory.data.equipped].slot==='extra'?inventory.data.equipped:'off'},
 });
 const reset=()=>{
  run.extraShot=0;run.charge=0;run.charging=false;
  if(run.extra!=='off')run.extraProjectiles??=[];
 };
 inventory.onEquip(reset);reset();
 return run;
}
export function selectAttack(run,key){
 if(!modeFor(run).availableWeapons.includes(key))return false;
 return run.inventory?.equip(key)??false;
}
export function cycleAttack(run,candidates=modeFor(run).availableWeapons){
 const owned=candidates.filter(key=>modeFor(run).availableWeapons.includes(key)&&run.inventory?.data.weapons[key]);
 if(!owned.length)return false;
 return selectAttack(run,owned[(owned.indexOf(run.inventory.data.equipped)+1)%owned.length]);
}
