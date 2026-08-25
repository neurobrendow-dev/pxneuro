/* Receituário de Bolso: offline. Trocar VERSAO a cada atualização do index.html. */
var VERSAO = 'receituario-20260824-2353';
var NUCLEO = ['./', './index.html', './manifest.webmanifest',
              './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSAO).then(function(c){
    return c.addAll(NUCLEO);
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== VERSAO; })
                        .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var ehPagina = e.request.mode === 'navigate';
  if(ehPagina){
    /* rede primeiro: atualização aparece assim que houver sinal */
    e.respondWith(
      fetch(e.request).then(function(res){
        var cp = res.clone();
        caches.open(VERSAO).then(function(c){ c.put('./index.html', cp); });
        return res;
      }).catch(function(){
        return caches.match('./index.html').then(function(hit){
          return hit || caches.match('./');
        });
      })
    );
    return;
  }
  /* resto (fontes, ícones): cache primeiro, atualiza em segundo plano */
  e.respondWith(
    caches.match(e.request).then(function(hit){
      var rede = fetch(e.request).then(function(res){
        if(res && (res.ok || res.type === 'opaque')){
          var cp = res.clone();
          caches.open(VERSAO).then(function(c){ c.put(e.request, cp); });
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || rede;
    })
  );
});
