import {WEAPON_CATALOG,weaponMultiplier} from '../features/weaponCatalog.js';
import {EXTRA_WEAPONS} from '../features/extraWeapons.js';
import {value} from '../model.js';
const number=n=>Number(n.toFixed(2));
const time=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
export function drawHud(ctx,run,hud){const p=run.player;
const boss=run.enemies.find(e=>e.type===3);if(boss){ctx.fillStyle='#233047';ctx.fillRect(30,28,420,8);ctx.fillStyle='#ff7298';ctx.fillRect(30,28,420*Math.max(0,boss.hp)/(boss.maxHp??180),8);ctx.fillStyle='#fff';ctx.font='11px system-ui';ctx.fillText('BOSS / '+Math.ceil(boss.hp)+' HP'+(boss.variant==='boss'?' / PHASE '+boss.phase:''),30,20);}
const selected=run.inventory?.data.equipped??run.weapon,spec=WEAPON_CATALOG[selected],level=run.inventory?.data.weapons[selected]?.level;
const weapon=selected==='bullet'?`弾 ${value(run,'count')}発 / 威力${number(value(run,'power'))} / ${value(run,'interval')}秒`:selected==='beam'?`ビーム ${number(value(run,'beamPower'))}/秒 / ${value(run,'beamWidth')}px`:`威力 ${number(EXTRA_WEAPONS[selected].damage*weaponMultiplier(run,selected))}${selected==='charge'?' / 最大溜め':' / 発'}`;
const phase=run.mode==='endless'?'PHASE '+String(run.phase).padStart(2,'0'):run.bossSpawned?'BOSS':`WAVE ${Math.min(3,Math.floor(run.time/(run.mode==='challenge'?30:60))+1)}`;
const markup=`<div class="hud-cell"><span class="hud-label">SHIP / CREDIT</span><strong>HP ${'♥'.repeat(Math.max(0,p.hp))}${'♡'.repeat(3-Math.max(0,p.hp))}</strong><span>◇ ${run.credits.toLocaleString()}</span></div><div class="hud-cell hud-weapon"><span class="hud-label">SCORE ${run.score.toLocaleString()}</span><strong>${spec?.name??selected} · LV ${level??(selected==='bullet'?run.levels.power+1:run.levels.beamPower+1)}</strong><span>${weapon}</span></div><div class="hud-cell hud-stage"><span class="hud-label">${run.mode==='endless'?'ENDLESS':run.mode==='challenge'?'CHALLENGE':'CLASSIC'}</span><strong>${time(run.time)}</strong><span>${phase}</span></div>`;
// Preserve DOM nodes between visible HUD changes.
if(hud.innerHTML!==markup)hud.innerHTML=markup;
}
