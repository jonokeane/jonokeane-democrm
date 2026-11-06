const V='warped-v1';
const CORE=['./','index.html','manifest.webmanifest','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function tell(){self.clients.matchAll().then(cs=>cs.forEach(c=>c.postMessage({type:'updated'})))}
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  const doc=req.mode==='navigate'||url.pathname==='/'||url.pathname.endsWith('/index.html');
  const key=doc?new Request(new URL('index.html',self.registration.scope).href):req;
  e.respondWith((async()=>{
    const cache=await caches.open(V);
    const hit=await cache.match(key);
    const net=fetch(doc?key.url:req).then(async res=>{
      if(res&&res.ok){
        if(doc&&hit){const a=await hit.clone().text(),b=await res.clone().text();if(a!==b)tell()}
        await cache.put(key,res.clone());
      }
      return res;
    }).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return (await net)||new Response('Offline',{status:503});
  })());
});
