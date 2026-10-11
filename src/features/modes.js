const allWeapons=Object.freeze(['bullet','beam','spread','piercing','missile','charge']);
export const MODES=Object.freeze({classic:{name:'CLASSIC',availableWeapons:allWeapons,initialExtra:'off'},challenge:{name:'CHALLENGE',availableWeapons:allWeapons,initialExtra:'spread'},endless:{name:'ENDLESS',availableWeapons:allWeapons,initialExtra:'spread'}});
export const modeFor=run=>MODES[run.mode??'classic']??MODES.classic;
export const allowsExtra=run=>modeFor(run).availableWeapons.some(w=>w!=='bullet'&&w!=='beam');
export function initializeExtra(run,extra=modeFor(run).initialExtra){Object.assign(run,{extra,extraShot:0,charge:0,charging:false,extraProjectiles:[]});return run;}
