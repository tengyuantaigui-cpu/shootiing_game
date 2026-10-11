import {createUiMode} from '../src/features/uiMode.js';
import {bindEquipment,selectAttack,cycleAttack} from '../src/features/equipment.js';
import {equipmentUI} from '../src/features/equipmentUI.js';
import {createWeaponInventory as createInventory} from '../src/features/weaponInventory.js';
import {WEAPON_CATALOG,rollWeaponDrop,weaponMultiplier} from '../src/features/weaponCatalog.js';
import {initializeExtra} from '../src/features/modes.js';
import {moveItems} from '../src/features/items.js';
const createWeaponInventory=(storage,options={})=>createInventory(storage,{...options,random:()=>1});
import {createTouchDrag} from '../src/features/touchDrag.js';
import {createProgress,SKINS} from '../src/features/progression.js';
import {createControls,touchPoint,touchVector} from '../src/features/controls.js';
import {collectionUI} from '../src/features/collectionUI.js';
import {controlsUI,keyLabel} from '../src/features/controlsUI.js';
import {enableEndless,updateEndless,loadEndlessRecord,storeEndlessRecord} from '../src/features/endless.js';
import {allowsExtra,modeFor} from '../src/features/modes.js';
import {createVisuals,loadVisualSettings,VISUAL_KEY} from '../src/rendering/particles.js';
import {enableChallenge,updateChallenge} from '../src/features/challenge.js';
import {cycleExtra,EXTRA_WEAPONS,fireExtra,moveExtra,hitExtra} from '../src/features/extraWeapons.js';
import {createAudioManager,loadAudioSettings,AUDIO_KEY} from '../src/audio/audioManager.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {CONFIG,UPGRADES} from '../src/config.js';
import * as model from '../src/model.js';
import {render} from '../src/rendering/renderer.js';

async function harness(file){
  let next=0,seed=12345;
  const math=Object.create(Math);math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const listeners={},drawing=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(target,key)=>target[key]||(()=>{})});
  const element=()=>({append(){},setAttribute(){},replaceChildren(){},querySelector:()=>element(),querySelectorAll:()=>[],getContext:()=>drawing});
  const context={createUiMode,bindEquipment,selectAttack,cycleAttack,equipmentUI,createWeaponInventory,WEAPON_CATALOG,initializeExtra,moveItems,rollWeaponDrop,weaponMultiplier,createTouchDrag,createProgress,SKINS,createControls,touchPoint,touchVector,collectionUI,controlsUI,keyLabel,enableEndless,updateEndless,loadEndlessRecord,storeEndlessRecord,allowsExtra,modeFor,fireExtra,moveExtra,hitExtra,createVisuals,loadVisualSettings,VISUAL_KEY,EXTRA_WEAPONS,enableChallenge,updateChallenge,cycleExtra,createAudioManager,loadAudioSettings,AUDIO_KEY,...model,id:()=>++next,render,C:CONFIG,UPGRADES,Math:math,Number,Set,document:{querySelector:()=>element(),createElement:()=>element(),addEventListener(type,fn){listeners[type]=fn;}},window:{addEventListener(type,fn){listeners[type]=fn;}},requestAnimationFrame(){},localStorage:{getItem:()=>null,setItem(){}}};
  vm.createContext(context);
  const modelSource=(await readFile(new URL('../src/model.js',import.meta.url),'utf8')).replace(/^import .*;$/gm,'').replace(/\bexport /g,'');
  vm.runInContext(modelSource,context);
  const source=(await readFile(new URL(file,import.meta.url),'utf8')).replace(/^import .*;$/gm,'').replace('menu();requestAnimationFrame(frame);',`globalThis.api={start,update,draw,frame,spawn,shop,pause,switchWeapon,blur,keys,get run(){return run},get state(){return state}};`);
  vm.runInContext(source,context);
  return {...context.api,api:context.api,listeners};
}
// Compare unchanged battle state with drops disabled and Lv.1 weapons. Inventory is new persistent metadata.
const snapshot=g=>{const result=JSON.parse(JSON.stringify({run:g.api.run,state:g.api.state}));delete result.run.inventory;if(result.state==='result')result.run.weapon='bullet';if(result.run.extra==='off'){for(const key of ['extra','extraShot','charge','charging'])delete result.run[key];}return result;};

test('同一乱数・入力で旧版と新版の戦闘状態が毎フレーム一致',async()=>{
  const old=await harness('../docs/baseline/main.js'),current=await harness('../src/main.js');
  for(const g of [old,current])g.api.start();current.api.run.inventory.acquire('beam');
  for(let frame=0;frame<1200;frame++){
    for(const g of [old,current]){
      if(frame%100===0)g.api.switchWeapon();
      g.api.keys.clear();g.api.keys.add(frame%200<100?'KeyA':'ArrowRight');
      if(frame%40<20)g.api.keys.add('KeyW');
      if(g.api.state==='playing')g.api.update(.025);g.api.draw();
    }
    assert.deepEqual(snapshot(current),snapshot(old),`frame ${frame}`);
  }
});
test('斜め移動280、画面境界、フォーカス喪失で入力解除',async()=>{
  const g=await harness('../src/main.js');g.api.start();g.api.run.spawn=999;
  g.api.keys.add('KeyD');g.api.keys.add('ArrowUp');g.api.update(.1);
  assert.ok(Math.abs(Math.hypot(g.api.run.player.x-240,g.api.run.player.y-690)-28)<1e-9);
  for(let i=0;i<100;i++)g.api.update(.1);
  assert.equal(g.api.run.player.x,462);assert.equal(g.api.run.player.y,24);
  g.api.blur();assert.equal(g.api.keys.size,0);assert.equal(g.api.state,'paused');
});
test('60/120秒の出現段階と180秒後の通常敵退場待ち',async()=>{
  const g=await harness('../src/main.js');
  for(const [time,interval,allowed] of [[0,1.2,[0]],[60,.9,[0,1]],[120,.7,[0,1,2]]]){
    g.api.start();g.api.run.time=time;g.api.update(.01);
    assert.ok(allowed.includes(g.api.run.enemies[0].type));assert.ok(Math.abs(g.api.run.spawn-(interval-.01))<1e-9);
  }
  g.api.start();g.api.spawn(0);g.api.run.time=180;g.api.update(.01);assert.equal(g.api.run.bossSpawned,false);
  g.api.run.enemies[0].y=900;g.api.update(.01);assert.equal(g.api.run.bossSpawned,false);
  g.api.update(.01);assert.equal(g.api.run.enemies[0].type,3);
});
test('磁力回収、画面外消去、購入後の2発と既存弾の武器切替後移動',async()=>{
  const g=await harness('../src/main.js');g.api.start();const r=g.api.run;r.spawn=999;
  r.items.push({id:99,x:270,y:690,value:50},{id:100,x:10,y:821,value:10});
  for(let i=0;i<8;i++)g.api.update(.01);
  assert.equal(r.credits,50);assert.equal(r.items.length,0);
  assert.equal(model.purchase(r,'count'),true);r.bullets=[];r.shot=0;g.api.update(.01);
  assert.equal(r.bullets.length,2);assert.equal((r.bullets[0].x+r.bullets[1].x)/2,r.player.x);
  const y=r.bullets[0].y;g.api.switchWeapon();g.api.update(.01);assert.equal(r.bullets[0].y,y-6);
});
test('全状態の描画が凍結したモデルを変更せず、HUDを維持する',()=>{
  const freeze=obj=>{Object.values(obj).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(obj);};
  const run=model.newRun();run.enemies.push({...CONFIG.enemies[3],id:99,type:3,x:240,y:110,hp:120});run.items.push({id:100,x:100,y:400,value:25});run.effects.push({x:20,y:20,color:'#fff',life:.2});
  freeze(run);let disabled=false;
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(target,key)=>target[key]||(()=>{}),set:(target,key,value)=>{if(key==='imageSmoothingEnabled'&&value===false)disabled=true;target[key]=value;return true;}}),hud={};
  for(const state of ['title','playing','shop','paused','result'])render(ctx,run,state,hud,[{x:10,y:20,r:1}]);
  assert.equal(disabled,true);assert.match(hud.innerHTML,/HP ♥♥♥/);assert.match(hud.innerHTML,/弾 1発/);
});
