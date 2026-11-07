const PREFIX = 'rota-criativa-public-';
const CACHE = PREFIX + 'v1';
const ASSETS = [
  "/css/style.css",
  "/images/avatar.svg",
  "/images/barro.svg",
  "/images/cidade.svg",
  "/images/cultura.svg",
  "/images/feira.svg",
  "/images/guia.svg",
  "/images/sabores.svg",
  "/js/app.js",
  "/js/cards.js",
  "/js/data/catalogo.js",
  "/js/data/repository.js",
  "/js/filters.js",
  "/js/forms.js",
  "/js/interests.js",
  "/js/modals.js",
  "/js/offline.js",
  "/js/pwa.js",
  "/manifest.webmanifest",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png"
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname === '/api' || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    // Respostas HTTP 4xx/5xx seguem intactas. Apenas falha de rede usa fallback.
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then(cache => cache.match('/offline.html'))));
    return;
  }
  if (url.search || !ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
});
