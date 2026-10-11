// No offline cache: preserve live updates and keep audio loading independent.
if('serviceWorker' in navigator && window.isSecureContext){
 const worker=new URL('../sw.js',import.meta.url);
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register(worker,{scope:new URL('../',import.meta.url).pathname,updateViaCache:'none'})
   .then(registration=>registration.update()).catch(error=>console.warn('STAR CREDIT PWA registration failed',error));
 });
}
