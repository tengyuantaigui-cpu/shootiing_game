export const INPUT_KEY='star-credit-input-v1';
export const ACTIONS={up:'上移動',down:'下移動',left:'左移動',right:'右移動',weapon:'パルス弾 / ビーム選択',extra:'追加攻撃を選択',charge:'チャージ',shop:'強化',pause:'停止 / 再開'};
export const DEFAULT_BINDINGS={up:['ArrowUp','KeyW'],down:['ArrowDown','KeyS'],left:['ArrowLeft','KeyA'],right:['ArrowRight','KeyD'],weapon:['Space'],extra:['KeyQ'],charge:['KeyF'],shop:['KeyU'],pause:['Escape']};
const canonical={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',charge:'KeyF'};
export const validCode=code=>/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Escape|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Bracket(Left|Right)|Minus|Equal|Comma|Period|Slash|Semicolon|Quote|Backquote|Backspace)$/.test(code);
const defaults=()=>Object.fromEntries(Object.entries(DEFAULT_BINDINGS).map(([k,v])=>[k,[...v]]));
function validBindings(b){
 const all=[];
 for(const [key,original] of Object.entries(DEFAULT_BINDINGS)){
  if(!Array.isArray(b?.[key])||b[key].length!==original.length||!b[key].every(validCode))return false;
  all.push(...b[key]);
 }
 return new Set(all).size===all.length;
}
export function loadBindings(storage){
 try{
  const raw=JSON.parse(storage?.getItem(INPUT_KEY));
  return raw?.version===1&&validBindings(raw.bindings)?Object.fromEntries(Object.keys(ACTIONS).map(k=>[k,[...raw.bindings[k]]])):defaults();
 }catch{return defaults();}
}

export function createControls(storage){
 let bindings=loadBindings(storage),held=new Set(),previous=new Set(),requireRelease=false;
 const persist=()=>{try{storage?.setItem(INPUT_KEY,JSON.stringify({version:1,bindings}));}catch{}};
 return {
  get bindings(){return bindings;},
  action(code){return Object.keys(ACTIONS).find(k=>bindings[k].includes(code));},
  down(code){held.add(code);},
  up(code){held.delete(code);},
  clear(){held.clear();requireRelease=true;},
  keyboard(){
   const keys=new Set();
   for(const [action,code] of Object.entries(canonical))if(bindings[action].some(k=>held.has(k)))keys.add(code);
   return keys;
  },
  rebind(action,slot,code){
   if(!Object.hasOwn(ACTIONS,action)||!Number.isInteger(slot)||slot<0||slot>=bindings[action].length||!validCode(code))return '使用できないキーです';
   if(Object.entries(bindings).some(([k,codes])=>codes.some((c,i)=>c===code&&(k!==action||i!==slot))))return '他の操作とキーが重複しています';
   bindings[action][slot]=code;held.clear();persist();return '';
  },
  reset(){bindings=defaults();held.clear();persist();},
  poll(pads=[]){
   const pad=Array.from(pads??[]).find(p=>p?.connected&&p.mapping==='standard');
   const axis=v=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;
   const pressed=i=>pad?.buttons?.[i]?.pressed===true;
   const current=new Set();
   for(const [i,a] of [[0,'weapon'],[1,'extra'],[2,'charge'],[3,'shop'],[9,'pause'],[12,'up'],[13,'down'],[14,'left'],[15,'right']])if(pressed(i))current.add(a);
   let x=axis(pad?.axes?.[0]),y=axis(pad?.axes?.[1]);
   if(Math.hypot(x,y)<.2)x=y=0;
   if(!pad){previous.clear();return {x:0,y:0,charge:false,actions:[],connected:false};}
   // A held START button must not immediately resume after a pause.
   if(requireRelease){
    if(current.size===0&&x===0&&y===0)requireRelease=false;
    previous=current;return {x:0,y:0,charge:false,actions:[],connected:true};
   }
   x+=Number(current.has('right'))-Number(current.has('left'));
   y+=Number(current.has('down'))-Number(current.has('up'));
   const actions=[...current].filter(a=>!previous.has(a)&&['weapon','extra','shop','pause','up','down'].includes(a));
   previous=current;
   return {x,y,charge:current.has('charge'),actions,connected:true};
  },
 };
}
// Convert CSS object-fit:contain coordinates to the unchanged logical canvas space.
export function touchPoint(rect,x,y){
 const scale=Math.min(rect.width/480,rect.height/800);
 if(!Number.isFinite(scale)||scale<=0)return null;
 const left=rect.left+(rect.width-480*scale)/2,top=rect.top+(rect.height-800*scale)/2;
 return {x:Math.max(18,Math.min(462,(x-left)/scale)),y:Math.max(24,Math.min(776,(y-top)/scale))};
}
export function touchVector(player,target,dt,speed=280){
 if(!target||dt<=0)return {x:0,y:0};
 const dx=target.x-player.x,dy=target.y-player.y,length=Math.hypot(dx,dy);
 if(length<.01)return {x:0,y:0};
 const factor=Math.min(1,length/(speed*dt));
 return {x:dx/length*factor,y:dy/length*factor};
}
