import {createUiMode} from './features/uiMode.js';
import {bindEquipment,selectAttack,cycleAttack} from './features/equipment.js';
import {equipmentUI} from './features/equipmentUI.js';
import {createWeaponInventory} from './features/weaponInventory.js';
import {WEAPON_CATALOG} from './features/weaponCatalog.js';
import {moveItems} from './features/items.js';
import {createTouchDrag} from './features/touchDrag.js';
import {createProgress,SKINS} from './features/progression.js';
import {createControls,touchPoint,touchVector} from './features/controls.js';
import {collectionUI} from './features/collectionUI.js';
import {controlsUI,keyLabel} from './features/controlsUI.js';
import {enableEndless,updateEndless,loadEndlessRecord,storeEndlessRecord} from './features/endless.js';
import {allowsExtra} from './features/modes.js';
import {createVisuals,loadVisualSettings,VISUAL_KEY} from './rendering/particles.js';
import {enableChallenge,updateChallenge} from './features/challenge.js';
import {cycleExtra,EXTRA_WEAPONS,fireExtra,moveExtra,hitExtra} from './features/extraWeapons.js';
import {createAudioManager,loadAudioSettings,AUDIO_KEY} from './audio/audioManager.js';
import {render} from './rendering/renderer.js';
import {CONFIG as C,UPGRADES} from './config.js';
import {id,newRun,value,purchase,defeat,collect,loadSave} from './model.js';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),overlay=document.querySelector('#overlay'),hud=document.querySelector('#hud');
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null};}
let save=loadSave(storage),run=newRun(),state='title',keys=new Set(),last=0,selected=0;
const inventory=createWeaponInventory(storage,{battle:true}),progress=createProgress(storage),controls=createControls(storage);
bindEquipment(run,inventory);let panelReturn='title';
const touchDrag=createTouchDrag(),mobileButtonResets=[];const coarse=()=>window.matchMedia?.('(pointer:coarse)')?.matches??false;const uiMode=createUiMode(storage,()=>({width:window.innerWidth??(coarse()?390:1280),coarse:coarse()}));let mobileTouch=uiMode.layout==='MOBILE';let touchMode='relative';
let archiveTab='enemies',archiveReturn='title',touchTarget=null,touchId=null,touchCharge=false,padMotion={x:0,y:0,charge:false},padConnected=false;
let endlessRecord=loadEndlessRecord(storage);
let challengeHigh=0;try{const n=Number(storage.getItem('star-credit-challenge-v1'));if(Number.isSafeInteger(n)&&n>=0)challengeHigh=n;}catch{}
const visuals=createVisuals(loadVisualSettings(storage));
const audio=createAudioManager({volume:save.volume,settings:loadAudioSettings(storage),debug:globalThis.location?.search?.includes('audioDebug=1')??false});
function audioScene(){const music=panelReturn==='title'&&state!=='playing'?'title':run.bossSpawned?'boss':run.mode==='endless'&&run.phase>=audio.endlessPhaseStart?'endless':'battle';audio.setScene(document.hidden?'hidden':state==='playing'?music:state==='result'?(run.clear?'clear':'over'):state,{music:state==='title'?'title':music});audio.setBeam(state==='playing'&&run.weapon==='beam'&&!document.hidden);}
document.addEventListener('change',e=>{if(e.target?.closest?.('#overlay')&&['INPUT','SELECT'].includes(e.target.tagName))audio.playUi('move');},true);
window.addEventListener('pointerdown',e=>{audio.unlock();if(e.target?.closest?.('.shop button:disabled'))audio.playUi('denied');});
const persist=()=>{try{storage.setItem('star-credit-v1',JSON.stringify(save));}catch{}};
const time=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
function change(next){if(next==='title')inventory.reset();state=next;window.scrollTo?.(0,0);document.documentElement?.classList?.toggle('mobile-playing',mobileTouch&&next==='playing');keys.clear();controls.clear();touchTarget=null;touchId=null;touchDrag.reset();mobileButtonResets.forEach(reset=>reset());if(run.extra==='charge'){run.charge=0;run.charging=false;}touchCharge=false;chargePointer=null;padMotion={x:0,y:0,charge:false};selected=0;audioScene();menu();}
function start(mode='classic'){inventory.reset();visuals.reset();run=newRun();if(mode==='challenge')enableChallenge(run);else if(mode==='endless')enableEndless(run);bindEquipment(run,inventory);panelReturn='playing';progress.start(run);save.instructions=true;persist();change('playing');}
function end(clear){if(state!=='playing')return;run.clear=clear;if(clear){run.score+=1000;run.items.forEach(i=>{if(collect(run,i))itemCollected(i);});}const oldHigh=run.mode==='endless'?endlessRecord.score:run.mode==='challenge'?challengeHigh:save.high;progress.finish(run,run.score>oldHigh);if(run.mode==='endless'){endlessRecord=storeEndlessRecord(storage,endlessRecord,run);}else if(run.mode==='challenge'){challengeHigh=Math.max(challengeHigh,run.score);try{storage.setItem('star-credit-challenge-v1',String(challengeHigh));}catch{}}else{save.high=Math.max(save.high,run.score);persist();}inventory.reset();change('result');}
function button(text,action,primary=false,sound='confirm'){const b=document.createElement('button');b.textContent=text;b.className=primary?'primary':'';b.onclick=()=>{if(sound)audio.playUi(sound);action();};return b;}
function volume(panel){const label=document.createElement('label');label.textContent='マスター音量 ';const input=document.createElement('input');input.type='range';input.min=0;input.max=1;input.step=.05;input.value=save.volume;input.setAttribute('aria-label','音量');input.oninput=()=>{save.volume=Number(input.value);audio.setVolume(save.volume);persist();};label.append(input);panel.append(label);for(const [key,title] of [['bgm','BGM音量'],['se','効果音量']]){const l=document.createElement('label'),i=document.createElement('input');l.textContent=title+' ';i.type='range';i.min=0;i.max=1;i.step=.05;i.value=audio.settings[key];i.setAttribute('aria-label',title);i.oninput=()=>{audio.setSettings({[key]:Number(i.value)});persistAudio();};l.append(i);panel.append(l);}const mute=button(audio.settings.mute?'ミュート解除':'ミュート',()=>{audio.setSettings({mute:!audio.settings.mute});persistAudio();menu();});panel.append(mute);uiSettings(panel);bgmSettings(panel);visualSettings(panel);controlsUI(panel,{controls,button,document,mobileTouch,touchMode,feedback:name=>audio.playUi(name),setTouchMode:mode=>{touchMode=mode;touchDrag.reset();touchTarget=null;touchId=null;}});}
function visualSettings(panel){const heading=document.createElement('p');heading.textContent='演出設定';panel.append(heading);const strength=document.createElement('label');strength.textContent='粒子の強度 ';const select=document.createElement('select');select.setAttribute('aria-label','粒子の強度');for(const [v,name] of [[0,'OFF'],[.35,'控えめ'],[.7,'多め']]){const option=document.createElement('option');option.value=v;option.textContent=name;select.append(option);}select.value=visuals.settings.intensity;select.onchange=()=>{visuals.setSettings({intensity:Number(select.value)});persistVisuals();};strength.append(select);panel.append(strength);for(const [key,name] of [['shake','画面振動'],['flash','被弾フラッシュ'],['crt','CRT走査線']]){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=visuals.settings[key];input.setAttribute('aria-label',name);input.onchange=()=>{visuals.setSettings({[key]:input.checked});persistVisuals();};label.append(input);label.append(document.createTextNode?document.createTextNode(' '+name):name);panel.append(label);}}
function persistVisuals(){try{storage.setItem(VISUAL_KEY,JSON.stringify(visuals.settings));}catch{}}
function applyUi(){
 const next=uiMode.layout==='MOBILE';
 if(mobileTouch!==next){keys.clear();controls.clear();touchTarget=null;touchId=null;touchDrag.reset();mobileButtonResets.forEach(reset=>reset());run.charge=0;run.charging=false;touchCharge=false;chargePointer=null;padMotion={x:0,y:0,charge:false};}
 mobileTouch=next;document.documentElement?.classList?.toggle('ui-mobile',next);document.documentElement?.classList?.toggle('ui-desktop',!next);document.documentElement?.classList?.toggle('mobile-playing',next&&state==='playing');
}
function uiSettings(panel){
 const label=document.createElement('label'),select=document.createElement('select');label.textContent='UIモード ';select.setAttribute('aria-label','UIモード');
 for(const mode of ['AUTO','MOBILE','DESKTOP']){const option=document.createElement('option');option.value=mode;option.textContent=mode;select.append(option);}select.value=uiMode.mode;
 select.onchange=()=>{uiMode.setMode(select.value);applyUi();menu();};label.append(select);panel.append(label);
}
function refreshLayout(){applyUi();menu();}
window.addEventListener('resize',refreshLayout);window.matchMedia?.('(pointer:coarse)')?.addEventListener?.('change',refreshLayout);
function bgmSettings(panel){
 const select=(label,entries,value,change,disabled=false)=>{
  const l=document.createElement('label'),input=document.createElement('select');l.textContent=label+' ';
  input.setAttribute('aria-label',label);
  for(const [key,text] of entries){const option=document.createElement('option');option.value=key;option.textContent=text;input.append(option);}
  input.value=value;input.disabled=disabled;input.onchange=()=>{audio.unlock();change(input.value);persistAudio();};l.append(input);panel.append(l);
 };
 select('BGM選曲',['AUTO','MANUAL','OFF'].map(key=>[key,key]),audio.settings.bgmMode,value=>{audio.setSettings({bgmMode:value});menu();});
 select('固定BGM',Object.entries(audio.tracks).map(([key,item])=>[key,item.name]),audio.settings.bgmTrack,value=>audio.setSettings({bgmTrack:value}),audio.settings.bgmMode!=='MANUAL');
 panel.append(button(audio.settings.bgmMute?'BGMミュート解除':'BGMミュート',()=>{audio.setSettings({bgmMute:!audio.settings.bgmMute});persistAudio();menu();}));
}
function persistAudio(){try{storage.setItem(AUDIO_KEY,JSON.stringify(audio.settings));}catch{}}
function controlHelp(){return Object.entries(controls.bindings).map(([key,codes])=>({up:'上',down:'下',left:'左',right:'右',weapon:'パルス弾 / ビーム選択',extra:'追加攻撃を選択',charge:'保持してチャージ',shop:'強化',pause:'停止 / 再開'}[key])+': '+codes.map(keyLabel).join(' / ')).join('<br>');}
function equipWeapon(key){if(!selectAttack(run,key))return false;const scroll=overlay.scrollTop;audioScene();menu();overlay.querySelector('.equipment-card[aria-pressed="true"]')?.focus?.();overlay.scrollTop=scroll;window.scrollTo?.(0,0);return true;}
function openPanel(next){if(!['equipment','settings','shop'].includes(state))panelReturn=state;if(next==='equipment'&&['title','result'].includes(panelReturn))return;change(next);}
function openEquipment(){openPanel('equipment');}
function openSettings(){openPanel('settings');}
function panelNavigation(panel){const nav=document.createElement('nav');nav.className='menu-navigation';nav.setAttribute('aria-label','ゲームメニュー');for(const [key,name] of (['title','result'].includes(state)||panelReturn==='title'?[['shop','強化'],['settings','設定']]:[['equipment','装備'],['shop','強化'],['settings','設定']])){const b=button(name,()=>openPanel(key));b.setAttribute('aria-pressed',String(state===key));nav.append(b);}panel.append(nav);}
function itemCollected(item){if(!item.acquisition)return;const {key,event,level}=item.acquisition;const name=WEAPON_CATALOG[key].name;const text=event==='new'?`NEW · ${name}`:event==='level'?`LEVEL UP · ${name} Lv.${level}`:event==='ignore'?`${name} · MAX`:`${name} · 育成進捗 +1`;visuals.notify(text);(run.weaponEvents??=[]).push(text);if(run.weaponEvents.length>6)run.weaponEvents.shift();}
function openArchive(){archiveReturn=state;change('archive');}
function menu(){
 const side=document.querySelector('#equipment-panel');if(side){side.innerHTML='<h2>EQUIPMENT</h2><p data-equipment-summary></p>';side.append(button('装備変更',openEquipment),button('強化',shop));}
 overlay.replaceChildren();overlay.scrollTop=0;if(state==='playing')return;
 const p=document.createElement('div');p.className='panel';overlay.append(p);
 if(['title','paused','shop','equipment','settings'].includes(state))panelNavigation(p);
 if(state==='equipment'){equipmentUI(p,{inventory,equip:equipWeapon,button,document,mobile:mobileTouch});p.append(button(panelReturn==='playing'?'戦闘に戻る':'戻る',()=>change(panelReturn),true));}
 if(state==='settings'){p.append(Object.assign(document.createElement('h2'),{textContent:'設定'}));volume(p);p.append(button('戻る',()=>change(panelReturn),true));}
 if(state==='archive'){collectionUI(p,{progress,tab:archiveTab,selectTab:tab=>{archiveTab=tab;menu();},back:()=>change(archiveReturn),button,document});}
 if(state==='title'){
  const enableMusic=button('タップ・クリックで音楽を開始',()=>audio.unlock());enableMusic.id='enable-music';enableMusic.hidden=audio.status.unlocked||audio.settings.mute||audio.settings.bgmMute||audio.settings.bgmMode==='OFF';p.append(enableMusic);
  const heading=document.createElement('div');heading.innerHTML=`<span class="eyebrow">READY FOR TAKEOFF</span><h2>STAR CREDIT</h2><p>ハイスコア ${save.high.toLocaleString()}<br>3分間の星域を抜け、ボスを撃破せよ。</p>`;p.append(heading,button('CLASSIC MODE',()=>start(),true),button('ENDLESS MODE',()=>start('endless')),button('チャレンジ：新敵と新ボス',()=>start('challenge')));
  const help=document.createElement('p');help.id='control-help';help.innerHTML=controlHelp()+'<br>メニュー：上下矢印 / Tab / Enter<br>コインと攻撃方法を回収できます。';
  const record=document.createElement('p');record.textContent='ENDLESS BEST · PHASE '+endlessRecord.phase+' / SCORE '+endlessRecord.score;
  help.hidden=mobileTouch;p.classList?.add('title-panel');p.append(help,record,button('図鑑・実績・スキン・ラン記録',openArchive));
 }
 if(state==='paused'){const heading=document.createElement('h2');heading.textContent='PAUSED';p.append(heading,button('戦闘を再開',()=>change('playing'),true),button('図鑑・実績・スキン・ラン記録',openArchive),button('タイトルへ',()=>{panelReturn='title';change('title');}));}
 if(state==='shop'){
  const preview=panelReturn==='title';
  const heading=document.createElement('div');heading.innerHTML=`<h2>強化</h2><p>${preview?'機体強化の一覧 · 購入は戦闘中に行えます':`残高 ◇ ${run.credits} · 戦闘時間は停止中`}</p>`;p.append(heading);
  const list=document.createElement('div');list.className='shop';p.append(list);
  for(const [key,u] of Object.entries(UPGRADES)){
   const level=preview?0:run.levels[key],cost=u.costs[level],max=cost===undefined,b=button('',()=>{if(state==='shop'&&!preview&&purchase(run,key)){progress.upgrade(run);audio.playUi('purchase');effect(run.player.x,run.player.y,'#72ead3','purchase');menu();}else audio.playUi('denied');},false,null);
   b.textContent=`${u.name}：${u.values[level]}${u.unit}${max?' / MAX':` → ${u.values[level+1]}${u.unit}`}`;
   const small=document.createElement('small');small.textContent=preview?`◇ ${cost} / 戦闘中に購入`:max?'最大強化済み':`◇ ${cost}${run.credits<cost?' / 残高不足':' / 購入する'}`;b.append(small);b.disabled=preview||max||run.credits<cost;list.append(b);
  }
  p.append(button(preview?'タイトルへ戻る':mobileTouch?'戦闘に戻る':'戦闘へ戻る ['+keyLabel(controls.bindings.shop[0])+' / '+keyLabel(controls.bindings.pause[0])+']',()=>change(preview?'title':'playing'),true));
 }
 if(state==='result'){
  p.innerHTML=`<span class="eyebrow">MISSION REPORT</span><h2>${run.clear?'STAGE CLEAR':'GAME OVER'}</h2><div class="stats"><div><strong>${run.score}</strong><span>スコア</span></div><div><strong>${run.kills}</strong><span>撃破数</span></div><div><strong>${run.collected}</strong><span>累計回収量</span></div><div><strong>${time(run.time)}</strong><span>到達時間</span></div></div><p>${run.mode==='endless'?`ENDLESS · 到達PHASE ${run.phase}<br>最高PHASE ${endlessRecord.phase} / ハイスコア ${endlessRecord.score}`:`${run.mode==='challenge'?'CHALLENGE · ':''}ハイスコア ${run.mode==='challenge'?challengeHigh:save.high}`}</p>`;
  p.append(button('リトライ',()=>start(run.mode||'classic'),true),button('タイトルへ',()=>{panelReturn='title';change('title');}));
  if(run.weaponEvents?.length){const notices=document.createElement('p');notices.textContent=run.weaponEvents.join(' / ');p.append(notices);}
 }
 overlay.scrollTop=0;
}
function switchWeapon(){if(state==='playing'){cycleAttack(run,['bullet','beam']);audioScene();}}
function shop(){if(state==='playing'||state==='title')openPanel('shop');else if(state==='shop')change(panelReturn==='title'?'title':'playing');else if(['equipment','settings'].includes(state)&&panelReturn!=='title')openPanel('shop');}
function pause(){if(state==='archive')change(archiveReturn);else if(['equipment','settings'].includes(state))change(panelReturn);else if(state==='playing')change('paused');else if(state==='paused'||state==='shop')change(state==='shop'&&panelReturn==='title'?'title':'playing');}
document.querySelector('#weapon').onclick=()=>{audio.playUi();openEquipment();};document.querySelector('#upgrade').onclick=()=>{audio.playUi();shop();};document.querySelector('#pause').onclick=()=>{audio.playUi();pause();};
const settingsButton=button('設定',openSettings);settingsButton.id='settings';document.querySelector('footer').append(settingsButton);
const extraButton=button('Q：攻撃切替',()=>{if(state==='playing')cycleExtra(run);audioScene();});extraButton.hidden=true;document.querySelector('footer').append(extraButton);
function menuInput(code){const bs=[...overlay.querySelectorAll('button:not(:disabled)')];if(!bs.length)return;const current=bs.indexOf(document.activeElement);if(code==='Enter'){(current>=0?bs[current]:bs[selected]||bs[0]).click();}else{selected=(Math.max(current,selected)+(code==='ArrowDown'?1:-1)+bs.length)%bs.length;bs[selected].focus();audio.playUi('move');}}
function perform(action){if(['weapon','extra','shop','pause'].includes(action)&&(state==='playing'||['extra','shop','pause'].includes(action)))audio.playUi();if(state!=='playing'&&['weapon','up','down'].includes(action)){menuInput(action==='weapon'?'Enter':action==='up'?'ArrowUp':'ArrowDown');return;}if(state!=='playing'&&action==='extra'){pause();return;}if(action==='weapon')switchWeapon();else if(action==='extra'&&state==='playing'){cycleExtra(run);audioScene();}else if(action==='shop')shop();else if(action==='pause')pause();}
function refreshKeys(){keys.clear();for(const code of controls.keyboard())keys.add(code);if(touchCharge||padMotion.charge)keys.add('KeyF');}
window.addEventListener('keydown',e=>{audio.unlock();if(['INPUT','SELECT','TEXTAREA','SUMMARY'].includes(e.target?.tagName)||e.target?.closest?.('summary'))return;
 const action=controls.action(e.code);if(action||['ArrowUp','ArrowDown','Enter'].includes(e.code))e.preventDefault();if(e.repeat)return;
 if(state!=='playing'&&['ArrowDown','ArrowUp','Enter'].includes(e.code)){menuInput(e.code);return;}
 if(action){if(['weapon','extra','shop','pause'].includes(action))perform(action);else if(state==='playing'){controls.down(e.code);refreshKeys();}}
});
window.addEventListener('keyup',e=>{controls.up(e.code);refreshKeys();});const blur=()=>{keys.clear();controls.clear();touchTarget=null;touchId=null;touchDrag.reset();mobileButtonResets.forEach(reset=>reset());if(run.extra==='charge'){run.charge=0;run.charging=false;}touchCharge=false;chargePointer=null;padMotion={x:0,y:0,charge:false};if(state==='playing')change('paused');};window.addEventListener('blur',blur);window.addEventListener('pagehide',()=>{blur();audio.setScene('hidden');});window.addEventListener('pageshow',audioScene);window.addEventListener('orientationchange',()=>{if(mobileTouch)blur();});document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();audioScene();});
canvas.onpointerdown=e=>{if(state!=='playing'||!['touch','pen'].includes(e.pointerType)||touchId!==null)return;e.preventDefault();touchId=e.pointerId;touchTarget=mobileTouch&&touchMode==='relative'?touchDrag.begin(e,canvas.getBoundingClientRect(),run.player):touchPoint(canvas.getBoundingClientRect(),e.clientX,e.clientY);canvas.setPointerCapture?.(e.pointerId);};
canvas.onpointermove=e=>{if(state==='playing'&&e.pointerId===touchId){e.preventDefault?.();touchTarget=mobileTouch&&touchMode==='relative'?touchDrag.move(e):touchPoint(canvas.getBoundingClientRect(),e.clientX,e.clientY);}};
const stopTouch=e=>{if(e.pointerId===touchId){touchTarget=null;touchId=null;touchDrag.end(e);}};canvas.onpointerup=stopTouch;canvas.onpointercancel=stopTouch;canvas.onlostpointercapture=stopTouch;
const chargeButton=document.createElement('button');chargeButton.textContent='F：チャージ（保持）';chargeButton.setAttribute('aria-label','チャージ（保持して離す）');chargeButton.className='touch-charge';let chargePointer=null;
chargeButton.onpointerdown=e=>{if(state!=='playing'||chargePointer!==null||run.extra!=='charge')return;e.preventDefault();audio.playUi();chargePointer=e.pointerId;touchCharge=true;refreshKeys();chargeButton.setPointerCapture?.(e.pointerId);};
const stopCharge=e=>{if(e.pointerId===chargePointer){chargePointer=null;touchCharge=false;refreshKeys();}};chargeButton.onpointerup=stopCharge;const cancelCharge=e=>{if(e.pointerId!==chargePointer)return;if(mobileTouch){run.charge=0;run.charging=false;}stopCharge(e);};chargeButton.onpointercancel=cancelCharge;chargeButton.onlostpointercapture=cancelCharge;document.querySelector('footer').append(chargeButton);
function mobileButton(node,action){let owner=null,lastTouch=false;mobileButtonResets.push(()=>{owner=null;});node.onpointerdown=e=>{lastTouch=e.pointerType==='touch';if(!mobileTouch||e.pointerType!=='touch')return;if(owner!==null)return;e.preventDefault();owner=e.pointerId;node.setPointerCapture?.(owner);};node.onpointerup=e=>{if(e.pointerId!==owner)return;e.preventDefault();owner=null;const r=node.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.left+r.width&&e.clientY>=r.top&&e.clientY<=r.top+r.height)node.onclick?.();};node.onpointercancel=node.onlostpointercapture=()=>{owner=null;};node.addEventListener?.('click',e=>{if(mobileTouch&&lastTouch&&e.detail>0){e.preventDefault();e.stopImmediatePropagation();}lastTouch=false;},true);}
mobileButton(document.querySelector('#weapon'),openEquipment);mobileButton(document.querySelector('#upgrade'),shop);mobileButton(document.querySelector('#pause'),pause);mobileButton(extraButton,()=>{if(state==='playing')cycleExtra(run);audioScene();});mobileButton(settingsButton,openSettings);
const preventGesture=e=>{if(mobileTouch&&state==='playing'&&e.cancelable)e.preventDefault();};document.querySelector('.cabinet').addEventListener?.('touchmove',preventGesture,{passive:false});document.querySelector('.cabinet').addEventListener?.('gesturestart',preventGesture,{passive:false});document.querySelector('.cabinet').addEventListener?.('gesturechange',preventGesture,{passive:false});
function pollGamepad(){let pads=[];try{if(typeof navigator!=='undefined')pads=navigator.getGamepads?.()??[];}catch{}const pad=controls.poll(pads);if(padConnected&&!pad.connected&&state==='playing')blur();padConnected=pad.connected;padMotion=pad;for(const action of pad.actions){audio.unlock();perform(action);}if(state!=='playing')padMotion={x:0,y:0,charge:false};refreshKeys();const label=document.querySelector('[data-gamepad-status]');if(label)label.textContent=pad.connected?'ゲームパッド：接続中（標準マッピング）':'ゲームパッド：未接続（標準マッピング対応）';}
function effect(x,y,color,kind='explosion'){visuals.emit(kind,x,y,color);run.effects.push({x,y,color,life:.45});}
function spawn(type){const def=C.enemies[type];run.enemies.push({...def,id:id(),type,x:type===3?240:40+Math.random()*400,y:-def.r-5,age:0,fire:type===1?1.5:2.1,baseX:40+Math.random()*400,dead:false});}
function hit(){if(run.player.inv>0||run.player.hp<=0)return;audio.emit('hurt');progress.hurt();run.player.hp--;run.player.inv=C.invincible;effect(run.player.x,run.player.y,'#ff7298','hurt');}
function enemyShot(e,angle,speed=175){run.hostiles.push({id:id(),x:e.x,y:e.y+e.r,vx:Math.sin(angle)*speed,vy:Math.cos(angle)*speed,r:5});}
function update(dt){const p=run.player;run.time+=dt;p.inv=Math.max(0,p.inv-dt);let dx=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA')),dy=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'));const touch=touchVector(p,touchTarget,dt,C.playerSpeed);dx+=padMotion.x+touch.x;dy+=padMotion.y+touch.y;const len=Math.max(1,Math.hypot(dx,dy));p.x=Math.max(18,Math.min(462,p.x+dx/len*C.playerSpeed*dt));p.y=Math.max(24,Math.min(776,p.y+dy/len*C.playerSpeed*dt));
if(run.mode==='endless'){const result=updateEndless(run,dt,keys,{hit,effect,sound:name=>audio.emit(name),boss:audioScene,spark:e=>visuals.emit('hit',e.x,e.y,e.color),encounter:progress.encounter,defeated:progress.defeated,collected:itemCollected});if(result==='over')end(false);else audioScene();return;}
if(run.mode==='challenge'){const result=updateChallenge(run,dt,keys,{hit,effect,sound:name=>audio.emit(name),boss:audioScene,spark:e=>visuals.emit('hit',e.x,e.y,e.color),encounter:progress.encounter,defeated:progress.defeated,collected:itemCollected});if(result)end(result==='clear');return;}
if(run.time<C.stageDuration){run.spawn-=dt;if(run.spawn<=0){const phase=C.phases.find(a=>run.time<a.until)||C.phases.at(-1);run.spawn+=phase.interval;const r=Math.random();spawn(r<phase.weights[0]?0:r<phase.weights[0]+phase.weights[1]?1:2);}}else if(!run.bossSpawned&&run.enemies.length===0){run.bossSpawned=true;spawn(3);audio.emit('warning');audioScene();}
run.shot-=dt;if(run.weapon==='bullet'&&run.shot<=0){audio.emit('shot');run.shot=value(run,'interval');const count=value(run,'count');for(let i=0;i<count;i++)run.bullets.push({id:id(),x:p.x+(i-(count-1)/2)*14,y:p.y-25,r:3,damage:value(run,'power')});}
fireExtra(run,dt,keys,()=>audio.emit('shot'));
for(const e of run.enemies){progress.encounter(e);e.age+=dt;if(e.type===3){e.y=Math.min(110,e.y+e.speed*dt);e.x=240+Math.sin(e.age*.7)*150;}else{if(e.type!==2||e.age<2||e.age>4)e.y+=e.speed*dt;if(e.type===1)e.x=Math.max(e.r,Math.min(480-e.r,e.baseX+Math.sin(e.age*2)*45));}if(e.type>0){e.fire-=dt;if(e.fire<=0&&e.y>0){e.fire=e.type===3?.95:e.type===2?2:1.5;if(e.type===1)enemyShot(e,0);else if(e.type===2)[-.4,0,.4].forEach(a=>enemyShot(e,a));else if(Math.floor(e.age)%2===0)[-.65,-.32,0,.32,.65].forEach(a=>enemyShot(e,a,190));else enemyShot(e,Math.atan2(p.x-e.x,p.y-e.y),210);}}
if(run.weapon==='beam'&&e.y+e.r>0&&e.y-e.r<p.y-22&&Math.abs(e.x-p.x)<e.r+value(run,'beamWidth')/2){e.hp-=value(run,'beamPower')*dt;visuals.emit('hit',e.x,e.y,e.color);audio.emit('hit');}
if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+4)hit();}
for(const b of run.bullets){b.y-=600*dt;for(const e of run.enemies){if(!e.dead&&e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+b.r){e.hp-=b.damage;visuals.emit('hit',e.x,e.y,e.color);audio.emit('hit');b.dead=true;break;}}}
moveExtra(run,dt);hitExtra(run,(e,n)=>{e.hp-=n;visuals.emit('hit',e.x,e.y,e.color);audio.emit('hit');});
for(const b of run.hostiles){b.x+=b.vx*dt;b.y+=b.vy*dt;if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+4){b.dead=true;hit();}}
let bossKilled=false;for(const e of run.enemies){if(e.hp<=0&&defeat(run,e)){progress.defeated(e);audio.emit(e.type>=2?'large':'explosion');effect(e.x,e.y,e.color);if(e.type===3)bossKilled=true;}}
moveItems(run,dt,item=>{audio.emit('collect');effect(item.x,item.y,'#ffe49a','collect');itemCollected(item);});
run.enemies=run.enemies.filter(e=>!e.dead&&e.y<800+e.r);run.bullets=run.bullets.filter(b=>!b.dead&&b.y>-20);run.hostiles=run.hostiles.filter(b=>!b.dead&&b.y<820&&b.x>-20&&b.x<500);run.items=run.items.filter(i=>!i.dead&&i.y<820);run.effects.forEach(e=>e.life-=dt);run.effects=run.effects.filter(e=>e.life>0);
if(p.hp<=0)end(false);else if(bossKilled)end(true);}
const stars=Array.from({length:90},()=>({x:Math.random()*480,y:Math.random()*800,r:Math.random()*1.6+.3}));
function draw(){
 const enableMusic=document.querySelector('#enable-music');if(enableMusic)enableMusic.hidden=audio.status.unlocked||audio.settings.mute||audio.settings.bgmMute||audio.settings.bgmMode==='OFF';
 if(state==='title'){const help=document.querySelector('#control-help');if(help){help.hidden=mobileTouch;help.innerHTML=controlHelp()+'<br>メニュー：上下矢印 / Tab / Enter<br>コインと攻撃方法を回収できます。';}}
 const movement=document.querySelector('#movement-help');if(movement)movement.textContent='移動：'+['up','down','left','right'].map(a=>controls.bindings[a].map(keyLabel).join('/')).join(' · ');
 chargeButton.textContent=keyLabel(controls.bindings.charge[0])+'：チャージ（保持）';document.querySelector('#weapon').textContent='装備';document.querySelector('#upgrade').textContent=keyLabel(controls.bindings.shop[0])+'：強化';document.querySelector('#pause').textContent=keyLabel(controls.bindings.pause[0])+'：停止';
 chargeButton.hidden=!mobileTouch||!['playing','paused','equipment','shop','settings'].includes(state)||panelReturn==='title'||run.extra!=='charge';chargeButton.disabled=state!=='playing'||run.extra!=='charge';document.documentElement?.classList?.toggle('has-charge',!chargeButton.hidden);extraButton.textContent=keyLabel(controls.bindings.extra[0])+'：切替';extraButton.hidden=mobileTouch||state!=='playing';settingsButton.hidden=!['playing','paused','shop','equipment','settings'].includes(state)||(state==='playing'&&!mobileTouch);
 const battle=['playing','paused','equipment','shop','settings'].includes(state)&&panelReturn!=='title';document.querySelector('#weapon').hidden=!battle;document.querySelector('#pause').hidden=!battle;document.querySelector('#upgrade').hidden=!battle;
 if(mobileTouch){chargeButton.textContent='CHARGE';document.querySelector('#pause').textContent='PAUSE';document.querySelector('#upgrade').textContent='強化';}
 document.documentElement?.classList?.toggle('in-battle',battle);document.documentElement?.classList?.toggle('equipment-open',state==='equipment');document.documentElement?.classList?.toggle('on-title',state==='title');
 const selectedWeapon=inventory.data.equipped,entry=inventory.data.weapons[selectedWeapon];
 const playerPanel=document.querySelector('#player-panel'),equipmentPanel=document.querySelector('#equipment-panel');
 if(playerPanel)playerPanel.innerHTML=`<h2>PLAYER</h2><p>HP ${'♥'.repeat(Math.max(0,run.player.hp))}</p><p>${run.mode==='endless'?'PHASE '+run.phase:run.bossSpawned?'BOSS':'WAVE '+Math.min(3,Math.floor(run.time/(run.mode==='challenge'?30:60))+1)}</p><p>COIN ${run.credits}</p><p>SCORE ${run.score}</p>`;
 if(equipmentPanel){const summary=equipmentPanel.querySelector('[data-equipment-summary]');if(summary)summary.textContent=WEAPON_CATALOG[selectedWeapon].name+' · Lv.'+entry.level;}
 render(ctx,run,state,hud,stars,visuals,SKINS[progress.data.skin].color,{mobile:mobileTouch,extra:keyLabel(controls.bindings.extra[0]),charge:keyLabel(controls.bindings.charge[0])});
}
function frame(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000));last=t;pollGamepad();if(state==='playing'){update(dt);visuals.update(dt,run);}audio.tick();draw();requestAnimationFrame(frame);}applyUi();audio.tryAutoplay?.();menu();requestAnimationFrame(frame);
