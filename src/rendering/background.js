export function drawBackground(ctx,time,stars){ctx.fillStyle='#081224';ctx.fillRect(0,0,480,800);
  // Three deterministic layers reuse the original stars, preserving gameplay RNG.
  const layers=[{speed:18,size:1,color:'#344a68'},{speed:38,size:2,color:'#50758b'},{speed:65,size:2,color:'#84a8ce'}];
  layers.forEach((layer,index)=>{ctx.fillStyle=layer.color;for(let i=index;i<stars.length;i+=3){const star=stars[i];ctx.fillRect(Math.round(star.x),Math.floor((star.y+time*layer.speed)%800),layer.size,layer.size);}});
  ctx.strokeStyle='#13253b';ctx.lineWidth=1;for(let x=0;x<=480;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,800);ctx.stroke();}
}
