export const UI_MODE_KEY='star-credit-ui-v1';
export const UI_MODES=['AUTO','MOBILE','DESKTOP'];
export function detectLayout({width=1280,coarse=false}={}){return width<=600||coarse&&width<=1024?'MOBILE':'DESKTOP';}
export function loadUiMode(storage){try{const s=JSON.parse(storage?.getItem(UI_MODE_KEY));return s?.version===1&&UI_MODES.includes(s.mode)?s.mode:'AUTO';}catch{return 'AUTO';}}
export function createUiMode(storage,environment=()=>({})){let mode=loadUiMode(storage);return {get mode(){return mode;},get layout(){return mode==='AUTO'?detectLayout(environment()):mode;},setMode(next){if(!UI_MODES.includes(next))return false;mode=next;try{storage?.setItem(UI_MODE_KEY,JSON.stringify({version:1,mode}));}catch{}return true;}};}
