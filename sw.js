// Network only; do not interrupt an active game to activate a new release.
// No skipWaiting/clients.claim, no offline assets or save-data access.
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(event.request.method==='GET'&&url.origin===scope.origin&&url.pathname.startsWith(scope.pathname)){
  event.respondWith(fetch(new Request(event.request,{cache:'no-cache'})));
 }
});
