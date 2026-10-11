import test from 'node:test';
import assert from 'node:assert/strict';
import {WEAPON_CATALOG,WEAPON_DROPS,rollWeaponDrop} from '../src/features/weaponCatalog.js';
import {createWeaponInventory,loadWeaponInventory,INVENTORY_KEY} from '../src/features/weaponInventory.js';
import {newRun,defeat,collect,purchase,value} from '../src/model.js';
import {moveItems} from '../src/features/items.js';
import {cycleExtra,fireExtra,EXTRA_WEAPONS} from '../src/features/extraWeapons.js';
import {initializeExtra} from '../src/features/modes.js';
import {createVisuals} from '../src/rendering/particles.js';
import {equipmentUI} from '../src/features/equipmentUI.js';
import {bindEquipment,selectAttack} from '../src/features/equipment.js';
const memory=()=>{const values=new Map();return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
const equippedRun=storage=>{const run=newRun();bindEquipment(run,createWeaponInventory(storage??memory(),{random:()=>0}));return run;};
const rng=(...values)=>()=>values.shift();

test('武器抽選5%の境界、敵・ボス別率／テーブル、重みの境界',()=>{
 assert.equal(WEAPON_DROPS.rate,.05);
 assert.equal(rollWeaponDrop({type:0},rng(.049,0)),'bullet');
 assert.equal(rollWeaponDrop({type:0},rng(.05)),null);
 assert.equal(rollWeaponDrop({type:0,weaponDropRate:0},()=>{assert.fail();}),null);
 const settings={rate:0,enemyRates:{boss:1,'classic-3':1},enemyTables:{boss:['missile','charge'],'classic-3':['charge']}};
 assert.equal(rollWeaponDrop({variant:'boss'},rng(.9,0),settings),'missile');
 assert.equal(rollWeaponDrop({variant:'boss'},rng(.9,2/3),settings),'charge');
 assert.equal(rollWeaponDrop({type:3},rng(.9,.9),settings),'charge');
 assert.equal(rollWeaponDrop({variant:'shield'},rng(0),settings),null);
 assert.equal(rollWeaponDrop({variant:'boss'},rng(0,0),{...settings,enemyTables:{boss:['unknown']}}),null);
});

test('コインは100%、武器は別枠、撃破・回収とも一度だけで武器は残高に加算しない',()=>{
 const run=equippedRun(),enemy={type:3,x:240,y:200,reward:200};
 assert.equal(defeat(run,enemy),true);assert.equal(defeat(run,enemy),false);
 assert.equal(run.items.length,2);assert.equal(run.items[0].value,200);assert.equal(run.credits,0);assert.equal(run.kills,1);
 const coin=run.items[0],weapon=run.items[1];assert.notEqual(coin.id,weapon.id);
 assert.equal(collect(run,weapon),true);assert.equal(collect(run,weapon),false);
 assert.equal(run.credits,0);assert.equal(run.inventory.data.weapons.bullet.progress,1);
 assert.equal(collect(run,coin),true);assert.equal(collect(run,coin),false);assert.equal(run.credits,200);assert.equal(run.collected,200);
 const noDrop={x:100,y:100,reward:25,type:1};run.inventory.random=()=>1;defeat(run,noDrop);assert.equal(run.items.at(-1).value,25);
});

test('初回入手、必要重複数、Lv.5上限とMAX重複処理が定義に従う',()=>{
 const inventory=createWeaponInventory(memory());assert.equal(inventory.acquire('missile').event,'new');
 for(let level=1;level<WEAPON_CATALOG.missile.maxLevel;level++){
  const required=WEAPON_CATALOG.missile.duplicates[level-1];
  for(let n=1;n<=required;n++){
   const result=inventory.acquire('missile');assert.equal(result.level,n===required?level+1:level);assert.equal(result.progress,n===required?0:n);assert.equal(result.event,n===required?'level':'duplicate');
  }
 }
 const before=JSON.stringify(inventory.data);assert.equal(inventory.acquire('missile').event,'ignore');assert.equal(JSON.stringify(inventory.data),before);
 assert.equal(inventory.acquire('unknown'),null);assert.equal(inventory.acquire('toString'),null);
});

test('未入手は装備不可、所有分だけQ循環、装備・育成・進捗を再起動で復元',()=>{
 const storage=memory(),run=equippedRun(storage);assert.equal(run.inventory.equip('charge'),false);
 assert.equal(selectAttack(run,'missile'),false);fireExtra(run,.01,new Set());assert.equal(run.extraProjectiles,undefined);
 cycleExtra(run);assert.equal(run.extra,'spread');cycleExtra(run);assert.equal(run.extra,'spread');
 run.inventory.acquire('charge');run.inventory.acquire('charge');run.inventory.equip('charge');
 const restored=createWeaponInventory(storage);assert.deepEqual(restored.data,run.inventory.data);assert.equal(restored.data.weapons.charge.progress,1);assert.equal(restored.data.equipped,'charge');
 assert.equal(restored.equip('off'),false);assert.equal(restored.equip('beam'),true);assert.equal(createWeaponInventory(storage).data.equipped,'beam');assert.equal(restored.equip('toString'),false);
});

test('旧セーブは全既存武器Lv.1へ一度だけ移行し、旧キーと高スコア・設定を保持',()=>{
 for(const [key,raw] of [['star-credit-v1',{version:1,high:9999,volume:.2,instructions:true}],['star-credit-meta-v1',{version:1,skin:'gold'}],['star-credit-endless-v1',{version:1,score:100,phase:9}],['star-credit-challenge-v1',300]]){
  const storage=memory(),old=JSON.stringify(raw);storage.setItem(key,old);
  const inventory=createWeaponInventory(storage);assert.deepEqual(Object.keys(inventory.data.weapons).sort(),Object.keys(WEAPON_CATALOG).sort());
  inventory.acquire('charge');inventory.acquire('charge');inventory.equip('charge');
  const restored=createWeaponInventory(storage);assert.equal(restored.data.weapons.charge.level,2);assert.equal(restored.data.equipped,'charge');assert.equal(storage.getItem(key),old);assert.equal(JSON.parse(storage.getItem(INVENTORY_KEY)).version,3);
 }
});

test('破損・不正な装備／レベル／進捗と保存禁止を安全に復元',()=>{
 const storage=memory();storage.setItem(INVENTORY_KEY,'{');assert.equal(loadWeaponInventory(storage).weapons.charge,undefined);
 storage.setItem(INVENTORY_KEY,JSON.stringify({version:2,weapons:{charge:{level:999,progress:999},missile:{level:2,progress:999},piercing:{level:-1}},equipped:{primary:'charge',extra:'piercing'}}));
 const data=loadWeaponInventory(storage);assert.deepEqual(data.weapons.charge,{level:5,progress:0});assert.deepEqual(data.weapons.missile,{level:2,progress:2});assert.equal(data.weapons.piercing,undefined);assert.equal(data.equipped,'bullet');
 const inventory=createWeaponInventory({getItem(){throw Error();},setItem(){throw Error();}});assert.equal(inventory.acquire('charge').event,'new');assert.equal(inventory.equip('charge'),true);
});

test('育成威力は全6武器に適用、ショップ性能・発射間隔・チャージ割合は維持',()=>{
 for(const key of Object.keys(WEAPON_CATALOG)){
  const run=equippedRun();if(!run.inventory.data.weapons[key])run.inventory.acquire(key);
  const count=WEAPON_CATALOG[key].duplicates[0];for(let n=0;n<count;n++)run.inventory.acquire(key);
  const multiplier=WEAPON_CATALOG[key].damage[1];
  if(key==='bullet'){assert.equal(value(run,'power'),multiplier);run.credits=100;purchase(run,'power');assert.equal(value(run,'power'),2*multiplier);assert.equal(value(run,'interval'),.25);}
  else if(key==='beam')assert.equal(value(run,'beamPower'),4*multiplier);
  else{selectAttack(run,key);if(key==='charge')fireExtra(run,.6,new Set(['KeyF']));fireExtra(run,.01,new Set());assert.ok(Math.abs(run.extraProjectiles[0].damage-EXTRA_WEAPONS[key].damage*multiplier*(key==='charge'?.5:1))<1e-9);}
 }
});

test('MAGNETの段階・費用・リトライ初期化、コインと武器の吸引、上限と接触回収',()=>{
 const run=equippedRun();run.items.push({id:1,x:300,y:690,value:10},{id:2,kind:'weapon',weapon:'missile',x:300,y:690});
 moveItems(run,.01);assert.equal(run.items[0].x,300);assert.equal(run.items[0].y,690.9);
 run.credits=350;assert.equal(purchase(run,'magnet'),true);assert.equal(value(run,'magnet'),80);assert.equal(run.credits,300);
 const x=run.items[0].x;moveItems(run,.01);assert.ok(run.items[0].x<x);assert.equal(run.items[0].x,run.items[1].x);
 for(let n=0;n<30;n++)moveItems(run,.01);assert.equal(run.credits,310);assert.ok(run.inventory.data.weapons.missile);assert.equal(run.collected,10);
 run.credits=300;assert.equal(purchase(run,'magnet'),true);assert.equal(purchase(run,'magnet'),true);assert.equal(value(run,'magnet'),180);assert.equal(purchase(run,'magnet'),false);assert.equal(value(newRun(),'magnet'),40);
});

test('MAGNETを最大強化しても武器ドロップ確率・コイン報酬は変わらない',()=>{
 const first=equippedRun(),max=equippedRun();max.credits=350;for(let n=0;n<3;n++)purchase(max,'magnet');
 for(const roll of [.049,.05]){
  for(const run of [first,max]){run.inventory.random=rng(roll,0);defeat(run,{type:0,x:100,y:100,reward:10});}
 }
 assert.deepEqual(first.items.map(i=>({value:i.value,weapon:i.weapon})),max.items.map(i=>({value:i.value,weapon:i.weapon})));
});

test('粒子OFFでも新規入手・レベルアップ通知を表示し、一定時間で終了',()=>{
 const visuals=createVisuals({intensity:0});visuals.notify('NEW · 追尾ミサイル');visuals.notify('LEVEL UP · Lv.2');assert.equal(visuals.snapshot.notifications.length,2);visuals.update(3.1,newRun());assert.equal(visuals.snapshot.notifications.length,0);
});

test('装備UIは名前・レアリティ・Lv・進捗を表示し、未取得を無効化、所有カードをタップで装備',()=>{
 const nodes=[];const element=tag=>{const node={tag,children:[],append(...children){this.children.push(...children);},setAttribute(){}};nodes.push(node);return node;};
 const inventory=createWeaponInventory(memory());inventory.acquire('missile');let equipped;
 equipmentUI(element('panel'),{inventory,equip:key=>equipped=key,document:{createElement:element},button:(text,action)=>Object.assign(element('button'),{textContent:text,onclick:action})});
 assert.ok(nodes.some(n=>n.textContent==='追尾ミサイル · RARE'));assert.ok(nodes.some(n=>n.textContent?.includes('次のLvまで 0 / 2')));
 const cards=nodes.filter(n=>n.className==='equipment-card');assert.equal(cards.length,6);assert.equal(cards.filter(n=>n.disabled).length,2);
 const card=cards.find(n=>n.children.some(c=>c.textContent==='追尾ミサイル · RARE'));card.onclick();assert.equal(equipped,'missile');
});
test('固定シード10万撃破で5%抽選とレアリティの重みを検証する',()=>{let seed=6,total=0;const counts={};const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);for(let n=0;n<100000;n++){const key=rollWeaponDrop({type:0},random);if(key){total++;counts[key]=(counts[key]??0)+1;}}assert.ok(Math.abs(total/100000-WEAPON_DROPS.rate)<.003);const weight=Object.values(WEAPON_CATALOG).reduce((sum,w)=>sum+w.weight,0);for(const [key,spec] of Object.entries(WEAPON_CATALOG))assert.ok(Math.abs(counts[key]/total-spec.weight/weight)<.025,key);});
