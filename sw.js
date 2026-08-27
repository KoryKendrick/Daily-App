/* Keeps the app working offline without ever serving a stale version.

   Network first: a fresh copy is fetched whenever there's a connection, and
   the cache is only used when the network fails. The previous cache-first
   version pinned phones to whatever they downloaded first, so updates never
   arrived. */
var CACHE = 'daily-app-v2';
var ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-maskable.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    // 'no-cache' revalidates with the server, so a deploy is picked up
    // immediately instead of waiting out the HTTP cache's lifetime
    fetch(req, { cache: 'no-cache' }).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        // an offline navigation still needs the shell back
        return hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
    })
  );
});
