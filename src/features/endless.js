import {CONFIG} from '../config.js';
import {spawnExtra} from './extraEnemies.js';
import {initializeExtra} from './modes.js';
import {updateChallenge} from './challenge.js';
export const ENDLESS={phaseSeconds:45,bannerSeconds:1.8,minInterval:.45,maxHP:2.5,maxAttackRate:1.6,tables:[['small','small','recon'],['recon','shield','small'],['leader','leader','recon'],['turret','shield','leader']]};
export const ENDLESS_KEY='star-credit-endless-v1';
export function loadEndlessRecord(storage){try{const r=JSON.parse(storage?.getItem(ENDLESS_KEY));if(r?.version!==1)throw Error();return {version:1,score:Number.isSafeInteger(r.score)&&r.score>=0?r.score:0,phase:Number.isSafeInteger(r.phase)&&r.phase>=0?r.phase:0};}catch{return {version:1,score:0,phase:0};}}
export function storeEndlessRecord(storage,record,run){const next={version:1,score:Math.max(record.score,run.score),phase:Math.max(record.phase,run.phase)};try{storage?.setItem(ENDLESS_KEY,JSON.stringify(next));}catch{}return next;}
export function enableEndless(run){run.mode='endless';initializeExtra(run);Object.assign(run,{phase:1,phaseStarted:0,phaseBannerUntil:ENDLESS.bannerSeconds,endlessSpawn:0,bossId:null});return run;}
export function phaseType(phase){return (phase-1)%5+1;}
export function phaseName(phase){return ['FIRST CONTACT','FAST INTERCEPT','FORMATION','SPECIAL FORCES','BOSS APPROACHING'][phaseType(phase)-1];}
export function difficulty(phase){const cycle=Math.floor((phase-1)/5);return {hp:Math.min(ENDLESS.maxHP,1+cycle*.12),attackRate:Math.min(ENDLESS.maxAttackRate,1+cycle*.06),interval:Math.max(ENDLESS.minInterval,1-cycle*.035)};}
export function advanceEndless(run){run.phase++;run.phaseStarted=run.time;run.phaseBannerUntil=run.time+ENDLESS.bannerSeconds;run.endlessSpawn=0;run.bossSpawned=false;run.bossId=null;}
export function spawnEndless(run,kind,random=Math.random){const enemy=spawnExtra(run,kind==='small'?'recon':kind,random);if(kind==='small')Object.assign(enemy,{...CONFIG.enemies[0],variant:'small',maxHp:CONFIG.enemies[0].hp});const scale=difficulty(run.phase);enemy.hp*=scale.hp;enemy.maxHp=enemy.hp;if(enemy.shield)enemy.shield*=scale.hp;enemy.attackRate=scale.attackRate;return enemy;}
export function updateEndlessStage(run,dt,{sound,boss}){
 // At most one boundary per update; existing instances retain their own parameters.
 if(phaseType(run.phase)!==5&&run.time-run.phaseStarted>=ENDLESS.phaseSeconds)advanceEndless(run);
 if(phaseType(run.phase)===5){if(!run.bossSpawned){const e=spawnEndless(run,'boss');run.bossId=e.id;run.bossSpawned=true;sound('warning');boss();}return;}
 run.endlessSpawn-=dt;if(run.endlessSpawn<=0){const table=ENDLESS.tables[phaseType(run.phase)-1];spawnEndless(run,table[Math.floor(Math.random()*table.length)]);run.endlessSpawn+=difficulty(run.phase).interval;}
}
export function updateEndless(run,dt,keys,hooks){const result=updateChallenge(run,dt,keys,{...hooks,stage:updateEndlessStage});if(result==='over')return result;if(result==='clear'){advanceEndless(run);hooks?.boss?.();}return null;}
