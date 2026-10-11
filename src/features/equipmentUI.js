import {WEAPON_CATALOG} from './weaponCatalog.js';
export function equipmentUI(panel,{inventory,equip,button,document=globalThis.document,mobile=true}){
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 const entryText=(entry,spec)=>entry?`Lv.${entry.level} · ${entry.level===spec.maxLevel?'MAX':`次のLvまで ${entry.progress} / ${spec.duplicates[entry.level-1]}`} · 威力 ×${spec.damage[entry.level-1]}`:'未取得 · LOCKED';
 const selected=inventory.data.equipped,current=inventory.data.weapons[selected],currentSpec=WEAPON_CATALOG[selected];
 panel.append(el('h2','装備'),el('p','この戦闘で取得した攻撃方法を選択します。重複取得で育成し、終了時にリセットされます。'));
 const summary=el('div','現在の装備：'+currentSpec.name+' · '+entryText(current,currentSpec));summary.className='equipment-current';panel.append(summary);
 const layout=el('div');layout.className='equipment-layout';const list=el('div');list.className='equipment-list';layout.append(list);panel.append(layout);
 const details=el('div');details.className='equipment-details';if(!mobile)layout.append(details);
 function show(key){const spec=WEAPON_CATALOG[key],entry=inventory.data.weapons[key];details.replaceChildren();details.append(el('h3',spec.name),el('p','RARITY: '+spec.rarity),el('p',entryText(entry,spec)),button(inventory.data.equipped===key?'装備中':'装備する',()=>equip(key)));}
 for(const [key,spec] of Object.entries(WEAPON_CATALOG)){
  const entry=inventory.data.weapons[key],active=selected===key;
  const card=button('',()=>mobile?equip(key):show(key));card.className='equipment-card';card.disabled=!entry;
  card.setAttribute('aria-pressed',String(active));card.setAttribute('aria-label',`${spec.name} · ${entry?active?'装備中':mobile?'装備する':'詳細を表示':'未取得・ロック'}`);
  card.append(el('strong',spec.name+' · '+spec.rarity),el('span',entryText(entry,spec)),el('span',active?'装備中':entry?mobile?'タップして装備':'詳細を表示':'この戦闘で取得すると解放'));list.append(card);
 }
 if(!mobile)show(selected);
}
