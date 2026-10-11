export const VISUAL_KEY='star-credit-visual-v1';
export const DEFAULT_VISUALS={version:1,intensity:.35,flash:false,shake:false,crt:false};
export function loadVisualSettings(storage){try{const s=JSON.parse(storage?.getItem(VISUAL_KEY));if(s?.version!==1)throw Error();return {...DEFAULT_VISUALS,intensity:[0,.35,.7].includes(s.intensity)?s.intensity:.35,flash:s.flash===true,shake:s.shake===true,crt:s.crt===true};}catch{return {...DEFAULT_VISUALS};}}
export function createVisuals(settings={...DEFAULT_VISUALS}){
 let particles=[],notifications=[],clock=0,warningUntil=0,bossSeen=false,serial=0;
 return {get settings(){return {...settings};},setSettings(patch){settings={...settings,...patch};if(settings.intensity===0)particles=[];},reset(){particles=[];notifications=[];clock=0;warningUntil=0;bossSeen=false;serial=0;},
 notify(text){notifications.push({x:60,y:180,text,until:clock+3});if(notifications.length>20)notifications.shift();},
 emit(kind,x,y,color='#ffe49a'){
  if(kind==='collect'||kind==='purchase')notifications.push({x,y,text:kind==='collect'?'◇ GET':'UPGRADE',until:clock+.65});if(notifications.length>20)notifications.shift();
  if(settings.intensity===0)return;const count=kind==='explosion'?Math.round(20*settings.intensity):Math.round(8*settings.intensity);if(kind==='hit'&&particles.filter(p=>p.kind==='hit').length>18)return;
  for(let i=0;i<count&&particles.length<100;i++){const angle=(i/count)*Math.PI*2+serial*.4;particles.push({kind,x,y,vx:Math.cos(angle)*(kind==='explosion'?100:50),vy:Math.sin(angle)*80,color,life:kind==='explosion'?.5:.25,max:kind==='explosion'?.5:.25});}serial++;
 },
 update(dt,run){clock+=dt;if(run.mode!=='endless'&&run.bossSpawned&&!bossSeen){bossSeen=true;warningUntil=clock+2;}particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);notifications=notifications.filter(n=>n.until>clock);},
 draw(ctx){for(const p of particles){ctx.globalAlpha=p.life/p.max;ctx.fillStyle=p.color;const size=p.kind==='explosion'?4:2;ctx.fillRect(Math.round(p.x),Math.round(p.y),size,size);}ctx.globalAlpha=1;ctx.font='12px monospace';for(const n of notifications){ctx.fillStyle='#ffe49a';ctx.fillText(n.text,n.x-20,n.y-(.65-(n.until-clock))*30);}if(clock<warningUntil){ctx.fillStyle='#13253bea';ctx.fillRect(40,330,400,68);ctx.fillStyle='#ffbf73';ctx.font='bold 24px monospace';ctx.fillText('WARNING / BOSS',120,370);}if(settings.flash&&particles.some(p=>p.kind==='hurt'&&p.life>.18)){ctx.fillStyle='#ff729814';ctx.fillRect(0,0,480,800);}},
 get offset(){return settings.shake&&particles.some(p=>p.kind==='hurt')?Math.sin(clock*50)*2:0;},get snapshot(){return {clock,particles:particles.map(p=>({...p})),notifications:notifications.map(n=>({...n})),warningUntil};}};
}
