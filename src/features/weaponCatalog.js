// Growth is independent of the five existing shop upgrades. Index 0 means Lv.1.
const growth={maxLevel:5,duplicates:[2,3,4,5],damage:[1,1.15,1.35,1.6,2],maxDuplicate:'ignore'};
export const WEAPON_CATALOG={
 bullet:{name:'パルス弾',rarity:'COMMON',slot:'primary',starter:true,weight:3,...growth},
 beam:{name:'ビーム',rarity:'COMMON',slot:'primary',starter:true,weight:3,...growth},
 spread:{name:'拡散弾',rarity:'COMMON',slot:'extra',starter:true,weight:3,...growth},
 piercing:{name:'貫通弾',rarity:'RARE',slot:'extra',weight:2,...growth},
 missile:{name:'追尾ミサイル',rarity:'RARE',slot:'extra',weight:2,...growth},
 charge:{name:'チャージ',rarity:'EPIC',slot:'extra',weight:1,...growth},
};
export const WEAPON_DROPS={rate:0.05,enemyRates:{},enemyTables:{}};
// Overrides accept classic-0..3 and recon/shield/leader/turret/boss/small.
export const dropEnemyKey=e=>e.variant??`classic-${e.type??0}`;
export function rollWeaponDrop(enemy,random=Math.random,settings=WEAPON_DROPS){
 const key=dropEnemyKey(enemy),rate=enemy.weaponDropRate??settings.enemyRates[key]??settings.rate;
 if(!Number.isFinite(rate)||rate<=0||random()>=Math.min(1,rate))return null;
 const table=settings.enemyTables[key]??Object.keys(WEAPON_CATALOG);
 const choices=table.filter(k=>Object.hasOwn(WEAPON_CATALOG,k)&&WEAPON_CATALOG[k].weight>0);
 const total=choices.reduce((sum,k)=>sum+WEAPON_CATALOG[k].weight,0);
 if(!total)return null;
 let roll=Math.max(0,Math.min(1-Number.EPSILON,random()))*total;
 for(const key of choices){roll-=WEAPON_CATALOG[key].weight;if(roll<0)return key;}
 return choices.at(-1);
}
export function weaponMultiplier(run,key){
 const level=run.inventory?.data.weapons[key]?.level??1;
 return WEAPON_CATALOG[key]?.damage[level-1]??1;
}
