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
async function game(options={}){const listeners={},elements=new Map();const element=()=>({eventHandlers:{},addEventListener(type,fn){this.eventHandlers[type]=fn;},click(){let stopped=false;this.eventHandlers.click?.({detail:1,preventDefault(){},stopImmediatePropagation(){stopped=true;}});if(!stopped&&!this.disabled)this.onclick?.();},getBoundingClientRect:()=>({left:0,top:0,width:480,height:800}),setPointerCapture(){},append(){},setAttribute(){},replaceChildren(){},querySelector:()=>element(),querySelectorAll:()=>[],getContext:()=>new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(target,key)=>target[key]||(()=>{})})});const context={testElements:elements,createUiMode,bindEquipment,selectAttack,cycleAttack,equipmentUI,createWeaponInventory,WEAPON_CATALOG,initializeExtra,moveItems,rollWeaponDrop,weaponMultiplier,createTouchDrag,createProgress,SKINS,createControls,touchPoint,touchVector,collectionUI,controlsUI,keyLabel,enableEndless,updateEndless,loadEndlessRecord,storeEndlessRecord,allowsExtra,modeFor,fireExtra,moveExtra,hitExtra,createVisuals,loadVisualSettings,VISUAL_KEY,EXTRA_WEAPONS,enableChallenge,updateChallenge,cycleExtra,createAudioManager:options.audioFactory??createAudioManager,loadAudioSettings,AUDIO_KEY,...model,render,C:CONFIG,UPGRADES,Math,Number,Set,document:{querySelector:key=>{if(!elements.has(key))elements.set(key,element());return elements.get(key);},createElement:()=>element(),addEventListener(){}},window:{get innerWidth(){return options.width??(options.mobile?390:1280);},matchMedia:()=>({matches:options.mobile??false}),addEventListener(type,fn){listeners[type]=fn;}},navigator:options.navigator??{},requestAnimationFrame(){},localStorage:options.storage??{getItem:()=>null,setItem(){}}};vm.createContext(context);const source=(await readFile(new URL('../src/main.js',import.meta.url),'utf8')).replace(/^import .*;$/gm,'').replace('audio.tryAutoplay?.();','').replace('menu();requestAnimationFrame(frame);','globalThis.api={start,update,frame,shop,pause,switchWeapon,blur,spawn,controls,canvas,chargeButton,settingsButton,openArchive,openEquipment,openSettings,equipWeapon,get mobileButtons(){return [document.querySelector("#weapon"),document.querySelector("#upgrade"),document.querySelector("#pause"),extraButton]},get progressData(){return progress.data},get visualSnapshot(){return visuals.snapshot},get run(){return run},get state(){return state},get audioStatus(){return audio.status},get layout(){return uiMode.layout},get uiSelection(){return uiMode.mode},setUiMode(mode){uiMode.setMode(mode);refreshLayout();},get nodes(){return testElements}};');vm.runInContext(source,context);context.api.listeners=listeners;return context.api;}
test('実際の戦闘更新で弾・ビームが敵を撃破しドロップする',async()=>{const g=await game();g.start();g.run.spawn=100;g.spawn(0);Object.assign(g.run.enemies[0],{x:240,y:600,speed:0,hp:1});for(let i=0;i<10;i++)g.update(.025);assert.equal(g.run.kills,1);assert.equal(g.run.items.length,1);assert.equal(g.run.credits,0);g.run.inventory.acquire('beam');g.switchWeapon();g.spawn(0);Object.assign(g.run.enemies[0],{x:240,y:400,speed:0,hp:2});for(let i=0;i<21;i++)g.update(.025);assert.equal(g.run.kills,2);});
test('強化・停止・フォーカス喪失で時間が進まない、被弾無敵',async()=>{const g=await game();g.start();g.run.spawn=100;g.spawn(0);Object.assign(g.run.enemies[0],{x:240,y:690,speed:0,hp:999});g.update(.01);assert.equal(g.run.player.hp,2);g.update(.05);assert.equal(g.run.player.hp,2);const t=g.run.time;g.shop();g.frame(50);assert.equal(g.run.time,t);g.shop();g.pause();g.frame(100);assert.equal(g.run.time,t);g.pause();g.blur();assert.equal(g.state,'paused');g.frame(150);assert.equal(g.run.time,t);});
test('180秒後にボス、クリア自動回収、同時HP0はゲームオーバー',async()=>{const g=await game();g.start();g.run.time=180;g.update(.01);assert.equal(g.run.enemies[0].type,3);g.run.enemies[0].hp=0;g.update(.01);assert.equal(g.state,'result');assert.equal(g.run.clear,true);assert.equal(g.run.credits,200);assert.equal(g.run.score,1200);g.start();g.run.time=180;g.update(.01);g.run.enemies[0].hp=0;g.run.player.hp=0;g.update(.01);assert.equal(g.run.clear,false);assert.equal(g.run.score,200);});
test('本番チャレンジ分岐の装備・Space・停止・終了・再開始とクラシック復帰',async()=>{const g=await game();g.start('challenge');g.run.inventory.acquire('spread');g.run.inventory.acquire('beam');g.equipWeapon('spread');g.run.challengeSpawn=999;g.update(.025);assert.equal(g.run.mode,'challenge');assert.equal(g.run.extraProjectiles.length,3);g.switchWeapon();assert.equal(g.run.weapon,'bullet');g.switchWeapon();assert.equal(g.run.weapon,'beam');assert.equal(g.run.extra,'off');const snapshot=JSON.stringify(g.run);g.shop();g.frame(100);assert.equal(JSON.stringify(g.run),snapshot);g.shop();g.run.time=90;g.run.enemies=[];g.update(.01);assert.equal(g.run.enemies[0].variant,'boss');g.run.enemies[0].hp=0;g.update(.01);assert.equal(g.state,'result');assert.equal(g.run.clear,true);assert.equal(g.run.score,1300);assert.equal(g.run.credits,300);g.start('challenge');assert.equal(g.run.weapon,'bullet');assert.equal(g.run.extra,'off');assert.equal(g.run.extraProjectiles.length,0);assert.equal(g.run.credits,0);g.start();assert.equal(g.run.mode,undefined);assert.equal(g.run.extraProjectiles,undefined);assert.equal(g.run.player.hp,3);});

test('本番でショップ・ポーズ中は粒子・通知・ボス警告の時計も停止',async()=>{const g=await game();g.start();g.run.time=180;g.frame(50);assert.ok(g.visualSnapshot.warningUntil>0);const frozen=JSON.stringify(g.visualSnapshot);g.shop();g.frame(100);g.frame(150);assert.equal(JSON.stringify(g.visualSnapshot),frozen);g.shop();g.pause();g.frame(200);assert.equal(JSON.stringify(g.visualSnapshot),frozen);g.pause();g.frame(250);assert.ok(g.visualSnapshot.clock>JSON.parse(frozen).clock);});

test('本番エンドレスの境界・ポーズ・継続・リトライとクラシック追加武器',async()=>{const g=await game();g.start('endless');g.run.time=44.99;g.update(.025);assert.equal(g.run.phase,2);assert.equal(g.state,'playing');const snapshot=JSON.stringify(g.run);g.pause();g.frame(100);assert.equal(JSON.stringify(g.run),snapshot);g.pause();g.run.phase=5;g.run.bossSpawned=false;g.update(.01);g.run.enemies.find(e=>e.variant==='boss').hp=0;g.update(.01);assert.equal(g.run.phase,6);assert.equal(g.state,'playing');g.run.player.hp=0;g.update(.01);assert.equal(g.state,'result');g.start('endless');assert.equal(g.run.phase,1);assert.equal(g.run.credits,0);assert.equal(g.run.charge,0);g.start();g.run.inventory.acquire('spread');cycleExtra(g.run);g.update(.01);assert.equal(g.run.extra,'spread');assert.equal(g.run.extraProjectiles.length,3);});

test('本番の全モードで図鑑・撃破・終了記録を保存し、リトライと再起動でもメタのみ保持',async()=>{const values=new Map([['star-credit-v1',JSON.stringify({version:1,high:999,volume:.5})]]),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};const g=await game({storage});for(const mode of ['classic','challenge','endless']){g.start(mode);g.run.spawn=g.run.challengeSpawn=g.run.endlessSpawn=999;if(mode==='classic'){g.spawn(0);g.run.enemies[0].hp=0;}else{g.run.enemies.push({id:9,type:0,variant:'recon',name:'偵察機',x:100,y:200,baseX:100,r:17,hp:0,maxHp:3,speed:170,reward:15,age:0,fire:99});}g.update(.01);assert.ok(g.progressData.achievements.includes('firstKill'));g.run.player.hp=0;g.update(.01);assert.equal(g.state,'result');assert.equal(g.progressData.records[0].mode,mode);assert.equal(g.progressData.records[0].kills,1);g.update(.01);assert.equal(g.progressData.records.filter(r=>r.mode===mode).length,1);}g.start();assert.equal(g.run.kills,0);assert.equal(g.run.credits,0);assert.equal(g.run.player.hp,3);assert.equal(g.progressData.records.length,3);const restarted=await game({storage});assert.equal(restarted.progressData.records.length,3);assert.ok(restarted.progressData.achievements.includes('firstKill'));});
test('変更キーを本番入力に適用し、コレクション中は戦闘・演出時計を停止',async()=>{const g=await game();g.start();g.run.spawn=999;g.controls.rebind('right',0,'KeyL');const event=code=>({code,preventDefault(){}});g.listeners.keydown(event('KeyL'));g.update(.1);assert.equal(g.run.player.x,268);g.listeners.keyup(event('KeyL'));g.update(.1);assert.equal(g.run.player.x,268);g.run.inventory.acquire('beam');g.controls.rebind('weapon',0,'KeyJ');g.listeners.keydown(event('Space'));assert.equal(g.run.weapon,'bullet');g.listeners.keydown(event('KeyJ'));assert.equal(g.run.weapon,'beam');g.pause();const frozen=JSON.stringify(g.run),visuals=JSON.stringify(g.visualSnapshot);g.openArchive();assert.equal(g.state,'archive');g.frame(100);assert.equal(JSON.stringify(g.run),frozen);assert.equal(JSON.stringify(g.visualSnapshot),visuals);g.pause();assert.equal(g.state,'paused');g.pause();assert.equal(g.state,'playing');});
test('本番パッドの移動・武器・ポーズ・切断は入力を残さない',async()=>{let buttons=[],axes=[0,0],connected=true;const navigator={getGamepads:()=>connected?[{connected:true,mapping:'standard',axes,buttons:Array.from({length:16},(_,i)=>({pressed:buttons.includes(i)}))}]:[]};const g=await game({navigator});g.start();g.run.inventory.acquire('beam');g.run.spawn=999;g.frame(0);axes=[.5,0];g.frame(100);assert.equal(g.run.player.x,247);buttons=[0];g.frame(150);assert.equal(g.run.weapon,'beam');g.frame(200);assert.equal(g.run.weapon,'beam');axes=[0,0];buttons=[];g.frame(250);buttons=[9];g.frame(300);assert.equal(g.state,'paused');const time=g.run.time;g.frame(350);assert.equal(g.state,'paused');assert.equal(g.run.time,time);buttons=[];g.frame(400);buttons=[9];g.frame(450);assert.equal(g.state,'playing');connected=false;g.frame(500);assert.equal(g.state,'paused');const x=g.run.player.x;g.pause();g.frame(550);assert.equal(g.run.player.x,x);});
test('本番タッチのドラッグ・キャンセル・チャージボタン・フォーカス喪失',async()=>{const g=await game();g.start('endless');g.run.endlessSpawn=999;const e={pointerType:'touch',pointerId:1,clientX:350,clientY:690,preventDefault(){}};g.canvas.onpointerdown(e);g.update(.1);assert.equal(g.run.player.x,268);g.canvas.onpointercancel(e);g.update(.1);assert.equal(g.run.player.x,268);g.run.inventory.acquire('charge');selectAttack(g.run,'charge');g.run.extraProjectiles=[];g.chargeButton.onpointerdown(e);g.update(.6);assert.equal(g.run.extraProjectiles.length,0);g.chargeButton.onpointerup(e);g.update(.01);assert.equal(g.run.extraProjectiles[0].damage,6);g.canvas.onpointerdown(e);g.blur();g.pause();g.update(.1);assert.equal(g.run.player.x,268);});

test('スマホ相対移動とチャージの同時タッチ：移動指を先に離しても溜めは継続',async()=>{const g=await game({mobile:true});g.start('endless');g.run.endlessSpawn=999;g.run.inventory.acquire('charge');selectAttack(g.run,'charge');const finger=(id,x,y)=>({pointerType:'touch',pointerId:id,clientX:x,clientY:y,preventDefault(){}});g.canvas.onpointerdown(finger(1,50,600));g.update(.01);assert.equal(g.run.player.x,240);g.chargeButton.onpointerdown(finger(2,400,750));g.canvas.onpointermove(finger(1,78,600));g.update(.1);assert.equal(g.run.player.x,268);assert.equal(g.run.charging,true);g.canvas.onpointerup(finger(2,400,750));g.update(.1);assert.equal(g.run.charging,true);g.canvas.onpointerup(finger(1,78,600));g.update(.4);assert.equal(g.run.player.x,268);g.chargeButton.onpointerup(finger(2,400,750));g.update(.01);assert.equal(g.run.extraProjectiles.length,1);assert.ok(Math.abs(g.run.extraProjectiles[0].damage-6)<1e-9);});
test('同時タッチでチャージ指を先に離しても移動継続、無関係な指とキャンセルを分離',async()=>{const g=await game({mobile:true});g.start('endless');g.run.endlessSpawn=999;g.run.inventory.acquire('charge');selectAttack(g.run,'charge');const e=(id,x)=>({pointerType:'touch',pointerId:id,clientX:x,clientY:600,preventDefault(){}});g.canvas.onpointerdown(e(1,10));g.chargeButton.onpointerdown(e(2,400));g.update(.6);g.chargeButton.onpointerup(e(1,10));assert.equal(g.run.charging,true);g.chargeButton.onpointerup(e(2,400));g.update(.01);assert.equal(g.run.extraProjectiles.length,1);g.canvas.onpointermove(e(1,38));g.update(.1);assert.equal(g.run.player.x,268);g.chargeButton.onpointerdown(e(3,400));g.update(.2);g.chargeButton.onpointercancel(e(3,400));g.update(.01);assert.equal(g.run.extraProjectiles.length,1);g.canvas.onpointercancel(e(1,38));g.update(.1);assert.equal(g.run.player.x,268);});
test('スマホの回転・ポーズ・フォーカス喪失で相対指と溜めを解除し誤発射しない',async()=>{const g=await game({mobile:true});g.start('endless');g.run.endlessSpawn=999;g.run.inventory.acquire('charge');selectAttack(g.run,'charge');const e={pointerType:'touch',pointerId:1,clientX:50,clientY:600,preventDefault(){}};g.canvas.onpointerdown(e);g.chargeButton.onpointerdown({...e,pointerId:2});g.update(.3);g.listeners.orientationchange();assert.equal(g.state,'paused');assert.equal(g.run.charge,0);g.pause();g.update(.01);assert.equal(g.run.extraProjectiles.length,0);assert.equal(g.run.player.x,240);});
test('スマホボタンは同じ指がボタン内で離れた時だけ実行し、取消・外側・別指で誤切替しない',async()=>{const g=await game({mobile:true});g.start();g.run.spawn=999;const b=g.mobileButtons[0],e=(id,x=100)=>({pointerType:'touch',pointerId:id,clientX:x,clientY:100,preventDefault(){}});b.onpointerdown(e(1));b.onpointerup(e(2));assert.equal(g.run.weapon,'bullet');b.onpointerup(e(1,600));assert.equal(g.run.weapon,'bullet');b.onpointerdown(e(3));b.onpointercancel(e(3));b.onpointerup(e(3));assert.equal(g.run.weapon,'bullet');b.onpointerdown(e(4));b.onpointerup(e(4));assert.equal(g.state,'equipment');assert.equal(g.run.weapon,'bullet');b.onpointerup(e(4));assert.equal(g.run.weapon,'bullet');b.onpointerdown(e(5));g.blur();g.pause();b.onpointerup(e(5));assert.equal(g.run.weapon,'bullet');});

test('本番の全モードでコイン＋新武器を別ドロップし、吸引・通知・Lvアップ・再起動リセットを統合',async()=>{
 for(const mode of ['classic','challenge','endless']){
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const g=await game({storage});g.start(mode);const run=g.run;run.spawn=run.challengeSpawn=run.endlessSpawn=999;
  let rolls=0;run.inventory.random=()=>rolls++%2===0?0:.999;
  const enemy=()=>mode==='classic'?{...CONFIG.enemies[0],id:model.id(),type:0,x:240,y:650,hp:0,speed:0,age:0,fire:999}:{id:model.id(),type:0,variant:'recon',name:'偵察機',x:240,y:650,baseX:240,r:17,hp:0,maxHp:3,speed:0,reward:15,age:0,fire:999};
  for(let n=0;n<3;n++){
   run.enemies.push(enemy());g.update(.01);assert.equal(run.items.filter(i=>i.kind==='weapon').length,1);assert.equal(run.items.filter(i=>i.kind!=='weapon').length,1);
   for(let i=0;i<15;i++)g.update(.01);
  }
  assert.equal(run.kills,3);assert.equal(run.credits,mode==='classic'?30:45);assert.equal(run.items.length,0);assert.equal(run.inventory.data.weapons.charge.level,2);
  assert.ok(g.visualSnapshot.notifications.some(n=>n.text.includes('NEW')));assert.ok(g.visualSnapshot.notifications.some(n=>n.text.includes('LEVEL UP')));
  g.shop();g.openEquipment();assert.equal(g.state,'equipment');const time=run.time;g.frame(500);assert.equal(run.time,time);
  assert.equal(g.equipWeapon('charge'),true);assert.equal(run.extra,'charge');assert.equal(g.equipWeapon('missile'),false);g.pause();assert.equal(g.state,'playing');
  const restarted=await game({storage});restarted.start(mode);assert.equal(restarted.run.extra,'off');assert.equal(restarted.run.inventory.data.weapons.charge,undefined);assert.equal(restarted.run.credits,0);assert.equal(restarted.run.levels.magnet,0);
 }
});

test('本番装備変更は既存の弾を消さず、溜めを解除し、選択した1つの攻撃方法を戦闘内だけ保持',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const g=await game({storage});g.start('endless');g.run.inventory.acquire('spread');g.run.inventory.acquire('beam');g.equipWeapon('spread');g.run.endlessSpawn=999;g.update(.01);const projectile=g.run.extraProjectiles[0];
 g.run.inventory.acquire('charge');g.shop();g.openEquipment();assert.equal(g.equipWeapon('charge'),true);assert.equal(g.run.extraProjectiles[0],projectile);
 g.run.charge=.6;g.run.charging=true;g.equipWeapon('spread');assert.equal(g.run.charge,0);assert.equal(g.run.charging,false);g.equipWeapon('beam');
 const restored=await game({storage});restored.start();assert.equal(restored.run.weapon,'bullet');assert.equal(restored.run.extra,'off');
});

test('クラシック・チャレンジのボスクリア自動回収で新武器も一度だけ登録',async()=>{
 for(const mode of ['classic','challenge']){
  const g=await game();g.start(mode);g.run.time=mode==='classic'?180:90;g.update(.01);let calls=0;g.run.inventory.random=()=>calls++%2===0?0:.999;g.run.enemies[0].hp=0;g.update(.01);
  assert.equal(g.state,'result');assert.equal(g.run.inventory.data.weapons.charge,undefined);assert.equal(g.run.weapon,'bullet');
  assert.ok(g.run.weaponEvents.some(text=>text.includes('NEW')));g.frame(200);assert.equal(g.run.inventory.data.weapons.charge,undefined);
 }
});


test('統合装備：PCキー・モバイルカード選択・設定復帰が同じ戦闘内状態を参照し時計を停止',async()=>{
 for(const mobile of [false,true]){
  const g=await game({mobile});g.start();g.run.inventory.acquire('spread');g.run.spawn=999;g.openEquipment();assert.equal(g.state,'equipment');
  const time=g.run.time;g.frame(100);assert.equal(g.run.time,time);assert.equal(g.equipWeapon('spread'),true);assert.equal(g.run.weapon,'spread');assert.equal(g.run.inventory.data.equipped,'spread');
  g.openSettings();assert.equal(g.state,'settings');g.frame(150);assert.equal(g.run.time,time);g.pause();assert.equal(g.state,'playing');
  g.listeners.keydown({code:'Space',preventDefault(){}});assert.equal(g.run.weapon,'bullet');assert.equal(g.run.extra,'off');
  g.listeners.keydown({code:'KeyQ',preventDefault(){}});assert.equal(g.run.weapon,'spread');assert.equal(g.run.inventory.data.equipped,'spread');
 }
});

test('統合装備：クラシック・チャレンジ・エンドレスの全攻撃は新規発射が1系統だけ',async()=>{
 for(const mode of ['classic','challenge','endless']){
  for(const key of Object.keys(WEAPON_CATALOG)){
   const g=await game();g.start(mode);const run=g.run;run.spawn=run.challengeSpawn=run.endlessSpawn=999;if(!run.inventory.data.weapons[key])run.inventory.acquire(key);g.equipWeapon(key);run.bullets=[];run.extraProjectiles=[];run.shot=0;
   if(key==='beam'){if(mode==='classic'){g.spawn(0);Object.assign(run.enemies[0],{x:240,y:200,speed:0,hp:10});}else run.enemies.push({id:model.id(),type:0,variant:'recon',x:240,y:200,baseX:240,r:17,hp:10,maxHp:10,speed:0,reward:15,age:0,fire:999});}
   if(key==='charge'){g.listeners.keydown({code:'KeyF',preventDefault(){}});g.update(.6);assert.equal(run.bullets.length,0);assert.equal(run.extraProjectiles.length,0);g.listeners.keyup({code:'KeyF'});}
   g.update(.01);assert.equal(run.inventory.data.equipped,key);assert.equal(run.weapon,key);
   if(key==='bullet'){assert.equal(run.bullets.length,1);assert.equal(run.extraProjectiles.length,0);}
   else if(key==='beam'){assert.equal(run.bullets.length,0);assert.equal(run.extraProjectiles.length,0);assert.ok(run.enemies[0].hp<10);}
   else{assert.equal(run.bullets.length,0);assert.ok(run.extraProjectiles.length>0);assert.ok(run.extraProjectiles.every(p=>p.kind===key));}
  }
 }
});

test('旧v2装備は戦闘へ混入せず、旧キーを変更しない',async()=>{
 const old=JSON.stringify({version:2,weapons:{charge:{level:3,progress:2}},equipped:{primary:'beam',extra:'charge'}});
 const values=new Map([['star-credit-weapons-v2',old]]),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const g=await game({storage});g.start();assert.equal(g.run.weapon,'bullet');assert.equal(g.run.inventory.data.weapons.charge,undefined);
 g.run.inventory.acquire('beam');g.equipWeapon('beam');g.start('endless');assert.equal(g.run.weapon,'bullet');assert.equal(g.run.extra,'off');
 const restarted=await game({storage});restarted.start('challenge');assert.equal(restarted.run.weapon,'bullet');assert.equal(values.get('star-credit-weapons-v2'),old);assert.equal(values.has('star-credit-weapons-v3'),false);
});

test('BGM場面はエンドレス後半・ボス・撃破後・ゲームオーバーと連動する',async()=>{
 const g=await game();g.start('endless');g.run.endlessSpawn=999;g.update(.01);assert.equal(g.audioStatus.scene,'battle');
 g.run.phase=6;g.update(.01);assert.equal(g.audioStatus.scene,'endless');
 g.run.phase=10;g.run.bossSpawned=false;g.update(.01);assert.equal(g.audioStatus.scene,'boss');
 g.run.enemies.find(e=>e.variant==='boss').hp=0;g.update(.01);assert.equal(g.audioStatus.scene,'endless');
 g.run.player.hp=0;g.update(.01);assert.equal(g.audioStatus.scene,'over');
});

 test('UIモードは保存復元し、切替とAUTOリサイズでもHP・装備・強化・戦闘時間を保持',async()=>{
 const values=new Map(),options={width:1280,mobile:false,storage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}};
 const g=await game(options);assert.equal(g.layout,'DESKTOP');g.start('endless');g.run.inventory.acquire('charge');g.equipWeapon('charge');g.run.credits=77;g.run.levels.magnet=1;g.openSettings();
 const snapshot=JSON.stringify(g.run);g.setUiMode('MOBILE');assert.equal(g.layout,'MOBILE');assert.equal(JSON.stringify(g.run),snapshot);
 g.setUiMode('DESKTOP');assert.equal(g.layout,'DESKTOP');assert.equal(JSON.stringify(g.run),snapshot);g.setUiMode('AUTO');options.width=320;g.listeners.resize();assert.equal(g.layout,'MOBILE');assert.equal(JSON.stringify(g.run),snapshot);options.width=1280;g.listeners.resize();assert.equal(g.layout,'DESKTOP');
 g.setUiMode('MOBILE');const restored=await game(options);assert.equal(restored.uiSelection,'MOBILE');assert.equal(restored.layout,'MOBILE');
 });
 test('PCはタッチ専用チャージ非表示、MOBILEはキーボード切替を非表示',async()=>{
 const g=await game();g.start();g.run.inventory.acquire('charge');g.equipWeapon('charge');g.frame(1);assert.equal(g.chargeButton.hidden,true);assert.equal(g.mobileButtons[3].hidden,false);
 g.setUiMode('MOBILE');g.frame(2);assert.equal(g.chargeButton.hidden,false);assert.equal(g.mobileButtons[3].hidden,true);assert.equal(g.nodes.get('#upgrade').textContent,'強化');assert.equal(g.nodes.get('#pause').textContent,'PAUSE');
 });
 test('全モードの初期装備は基本攻撃だけ、終了・リトライ・タイトル復帰で育成もリセット',async()=>{
 for(const mode of ['classic','challenge','endless']){const g=await game();g.start(mode);assert.deepEqual(Object.keys(g.run.inventory.data.weapons),['bullet']);assert.equal(g.equipWeapon('beam'),false);g.run.inventory.acquire('bullet');g.run.inventory.acquire('bullet');g.run.inventory.acquire('charge');g.equipWeapon('charge');assert.equal(g.run.inventory.data.weapons.bullet.level,2);g.run.player.hp=0;g.update(.01);assert.equal(g.state,'result');assert.equal(g.run.weapon,'bullet');assert.deepEqual(g.run.inventory.data.weapons,{bullet:{level:1,progress:0}});g.start(mode);assert.deepEqual(Object.keys(g.run.inventory.data.weapons),['bullet']);}
 });
 test('エンドレスの通常・ボス境界は取得・レベル・装備をリセットしない',async()=>{
 const g=await game();g.start('endless');g.run.inventory.acquire('charge');g.run.inventory.acquire('charge');g.run.inventory.acquire('charge');g.equipWeapon('charge');const expected=JSON.stringify(g.run.inventory.data);g.run.time=45;g.update(.01);assert.equal(g.run.phase,2);assert.equal(JSON.stringify(g.run.inventory.data),expected);g.run.phase=5;g.run.bossSpawned=false;g.update(.01);g.run.enemies.find(e=>e.variant==='boss').hp=0;g.update(.01);assert.equal(g.run.phase,6);assert.equal(JSON.stringify(g.run.inventory.data),expected);
 });
 test('タイトルでは装備を開かず、強化の閲覧は戦闘開始・コイン消費を伴わない',async()=>{
 const g=await game();g.openEquipment();assert.equal(g.state,'title');g.shop();assert.equal(g.state,'shop');const snapshot=JSON.stringify(g.run);g.frame(100);assert.equal(JSON.stringify(g.run),snapshot);g.pause();assert.equal(g.state,'title');assert.equal(g.run.time,0);
 });

test('モバイル4ボタンはタッチとマウスで共通SEを一度だけ実行し、設定を戦闘中に表示',async()=>{const sounds=[];const g=await game({mobile:true,audioFactory:()=>({unlock(){},playUi:n=>sounds.push(n??'confirm'),emit(){},setScene(){},setBeam(){},tick(){},status:{unlocked:false},settings:{},tracks:{},endlessPhaseStart:6})});g.start();g.frame(1);assert.equal(g.settingsButton.hidden,false);const e={pointerType:'touch',pointerId:1,clientX:100,clientY:100,preventDefault(){}};for(const b of [...g.mobileButtons.slice(0,3),g.settingsButton]){g.pause();if(g.state!=='playing')g.start();const before=sounds.length;b.onpointerdown(e);b.onpointerup(e);b.onpointerup(e);b.click();assert.equal(sounds.length,before+1);assert.equal(sounds.at(-1),'confirm');}const before=sounds.length;g.settingsButton.onclick();assert.equal(sounds.length,before+1);});
test('CHARGEはメニュー中も補助行を維持し、停止中は保持できない',async()=>{const g=await game({mobile:true});g.start();g.run.inventory.acquire('charge');g.equipWeapon('charge');g.frame(1);assert.equal(g.chargeButton.hidden,false);g.openSettings();g.frame(2);assert.equal(g.chargeButton.hidden,false);assert.equal(g.chargeButton.disabled,true);assert.equal(g.settingsButton.hidden,false);g.chargeButton.onpointerdown({pointerId:1,preventDefault(){}});assert.equal(g.run.charging,false);});
