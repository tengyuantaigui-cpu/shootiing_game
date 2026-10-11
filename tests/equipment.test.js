import test from 'node:test';
import assert from 'node:assert/strict';
import {createWeaponInventory,INVENTORY_KEY,LEGACY_INVENTORY_KEY} from '../src/features/weaponInventory.js';
import {bindEquipment,selectAttack,cycleAttack} from '../src/features/equipment.js';
import {equipmentUI} from '../src/features/equipmentUI.js';
import {newRun,purchase,value} from '../src/model.js';
import {collect} from '../src/model.js';
import {moveItems} from '../src/features/items.js';
import {drawHud} from '../src/rendering/hud.js';
const memory=()=>{const data=new Map();return {data,getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};};

test('初回取得を装備一覧へ登録、重複による成長はコインを消費しない',()=>{
 const inventory=createWeaponInventory(memory()),run=bindEquipment(newRun(),inventory);run.credits=123;
 assert.equal(collect(run,{kind:'weapon',weapon:'charge'}),true);assert.deepEqual(inventory.data.weapons.charge,{level:1,progress:0});
 collect(run,{kind:'weapon',weapon:'charge'});collect(run,{kind:'weapon',weapon:'charge'});
 assert.deepEqual(inventory.data.weapons.charge,{level:2,progress:0});assert.equal(run.credits,123);assert.equal(inventory.data.equipped,'bullet');
});

test('所有・装備・戦闘は単一状態を参照し、所有カード選択で1攻撃のみを装備する',()=>{
 const inventory=createWeaponInventory(memory()),run=bindEquipment(newRun(),inventory);
 assert.equal(selectAttack(run,'missile'),false);inventory.acquire('missile');assert.equal(selectAttack(run,'missile'),true);
 assert.equal(run.weapon,'missile');assert.equal(run.extra,'missile');assert.equal(inventory.data.equipped,'missile');
 assert.throws(()=>{run.weapon='beam';},TypeError);assert.throws(()=>{run.extra='charge';},TypeError);
 selectAttack(run,'beam');assert.equal(run.weapon,'beam');assert.equal(run.extra,'off');assert.equal(inventory.data.equipped,'beam');
 assert.equal(selectAttack(run,'off'),false);assert.equal(selectAttack(run,'toString'),false);
});

test('装備選択・循環は同じ処理で、残った弾を消さずチャージをリセットする',()=>{
 const inventory=createWeaponInventory(memory()),run=bindEquipment(newRun(),inventory);inventory.acquire('charge');selectAttack(run,'charge');
 const projectile={kind:'charge'};run.extraProjectiles.push(projectile);run.charge=.5;run.charging=true;
 cycleAttack(run,['bullet','beam']);assert.equal(run.weapon,'bullet');assert.equal(run.charge,0);assert.equal(run.charging,false);assert.equal(run.extraProjectiles[0],projectile);
 cycleAttack(run,['bullet','beam']);assert.equal(run.weapon,'beam');assert.equal(inventory.data.equipped,'beam');
});

test('v2主武器＋追加装備をv3の1選択へ移行し、所有・Lv・進捗と旧キーを保持',()=>{
 for(const [extra,expected] of [['charge','charge'],['off','beam'],[null,'beam'],['unowned','beam']]){
  const storage=memory(),legacy={version:2,weapons:{bullet:{level:2,progress:1},beam:{level:3,progress:2},charge:{level:4,progress:3}},equipped:{primary:'beam',extra}};
  const old=JSON.stringify(legacy);storage.setItem(LEGACY_INVENTORY_KEY,old);const inventory=createWeaponInventory(storage);
  assert.equal(inventory.data.version,3);assert.equal(inventory.data.equipped,expected);assert.deepEqual(inventory.data.weapons.charge,{level:4,progress:3});assert.equal(storage.getItem(LEGACY_INVENTORY_KEY),old);
  inventory.equip('spread');const restored=createWeaponInventory(storage);assert.equal(restored.data.equipped,'spread');assert.equal(JSON.parse(storage.getItem(INVENTORY_KEY)).equipped,'spread');
 }
});

test('壊れたv3はv2から復旧、v3選択は未所有・不正値を装備しない',()=>{
 const storage=memory();storage.setItem(INVENTORY_KEY,'{');storage.setItem(LEGACY_INVENTORY_KEY,JSON.stringify({version:2,weapons:{missile:{level:2,progress:1}},equipped:{primary:'bullet',extra:'missile'}}));
 assert.equal(createWeaponInventory(storage).data.equipped,'missile');
 storage.setItem(INVENTORY_KEY,JSON.stringify({version:3,weapons:{},equipped:'charge'}));assert.equal(createWeaponInventory(storage).data.equipped,'bullet');
});

test('装備カードは1つだけ選択状態を示し、未取得はロック、購入操作を持たない',()=>{
 const storage=memory(),inventory=createWeaponInventory(storage);inventory.acquire('charge');inventory.equip('charge');
 const nodes=[];const el=()=>{const node={children:[],attributes:{},append(...kids){this.children.push(...kids);},setAttribute(k,v){this.attributes[k]=v;}};nodes.push(node);return node;};
 const render=()=>equipmentUI(el(),{inventory,equip:key=>inventory.equip(key),document:{createElement:el},button:(_,onclick)=>Object.assign(el(),{onclick})});render();
 const cards=nodes.filter(n=>n.className==='equipment-card');assert.equal(cards.length,6);assert.equal(cards.filter(n=>n.attributes['aria-pressed']==='true').length,1);
 assert.equal(cards.filter(n=>n.disabled).length,2);assert.ok(cards.every(n=>!n.children.some(c=>c.textContent?.includes('購入'))));
 cards.find(n=>n.attributes['aria-label'].startsWith('ビーム')).onclick();assert.equal(inventory.data.equipped,'beam');
});

test('統合後もMAGNETは強化だけで購入し、両種の回収対象に適用',()=>{
 const inventory=createWeaponInventory(memory()),run=bindEquipment(newRun(),inventory);run.credits=50;
 assert.equal(purchase(run,'magnet'),true);assert.equal(value(run,'magnet'),80);assert.equal(run.credits,0);
 run.items.push({x:300,y:690,value:10},{x:300,y:690,kind:'weapon',weapon:'charge'});
 for(let i=0;i<25;i++)moveItems(run,.01);assert.equal(run.credits,10);assert.ok(inventory.data.weapons.charge);assert.equal(inventory.data.equipped,'bullet');
});

test('HUDは装備一覧と同じ名前・育成Lv・威力を表示する',()=>{
 const inventory=createWeaponInventory(memory()),run=bindEquipment(newRun(),inventory);inventory.acquire('charge');inventory.acquire('charge');inventory.acquire('charge');selectAttack(run,'charge');
 const hud={};drawHud({},run,hud);assert.match(hud.innerHTML,/チャージ · LV 2/);assert.match(hud.innerHTML,/威力 13.8/);assert.doesNotMatch(hud.innerHTML,/ビーム.*\/秒/);
});
