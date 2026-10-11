// Only compressed loop editions are shipped. Credits: docs/audio-licenses.md.
export const BGM_TRACKS={
 title:{name:'Brute Force',url:new URL('../assets/audio/title.m4a',import.meta.url).href},
 battle:{name:'8-bit Epic Space Shooter',url:new URL('../assets/audio/battle.m4a',import.meta.url).href},
 boss:{name:'Fast Fight',url:new URL('../assets/audio/boss.m4a',import.meta.url).href},
 endless:{name:'Interstellar Fleet 1',url:new URL('../assets/audio/endless.m4a',import.meta.url).href},
};
// The second five-phase cycle is the start of the late endless soundtrack.
export const ENDLESS_BGM_PHASE=6;
export const BGM_FADE_SECONDS=.18;
export function normalizeBgmSettings(s={}){return {bgmMode:['AUTO','MANUAL','OFF'].includes(s.bgmMode)?s.bgmMode:'AUTO',bgmTrack:Object.hasOwn(BGM_TRACKS,s.bgmTrack)?s.bgmTrack:'battle',bgmMute:s.bgmMute===true};}
export function chooseBgm(scene,settings,previous='title'){if(scene==='hidden'||settings.mute||settings.bgmMute||settings.bgmMode==='OFF')return null;return settings.bgmMode==='MANUAL'?settings.bgmTrack:['clear','over','result'].includes(scene)?'title':Object.hasOwn(BGM_TRACKS,scene)?scene:previous;}
