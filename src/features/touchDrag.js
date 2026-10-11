// Own one movement pointer; charge has a separate owner in main.js.
export function createTouchDrag(){
 let session=null;
 return {
  begin(event,rect,player,mode='relative'){
   if(session||!['touch','pen'].includes(event.pointerType))return null;
   const scale=Math.min(rect.width/480,rect.height/800);
   if(!Number.isFinite(scale)||scale<=0)return null;
   session={id:event.pointerId,x:event.clientX,y:event.clientY,scale,mode,target:{x:player.x,y:player.y}};
   return {...session.target};
  },
  move(event){
   if(!session||event.pointerId!==session.id)return null;
   session.target={x:Math.max(18,Math.min(462,session.target.x+(event.clientX-session.x)/session.scale)),y:Math.max(24,Math.min(776,session.target.y+(event.clientY-session.y)/session.scale))};
   session.x=event.clientX;session.y=event.clientY;
   return {...session.target};
  },
  end(event){if(session&&event.pointerId===session.id){session=null;return true;}return false;},
  reset(){session=null;},
 };
}
