const CACHE_NAME = 'agencias-pwa-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/data.html',
  '/manifest.json',
  '/css/app.css',
  '/js/app.js',
  '/js/network.js',
  '/js/sw-register.js',
  '/js/location.service.js',
  '/js/agencies/agencies.store.js',
  '/js/map/map.actions.js'
];

const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11'
];

// ==========================================
// INSTALL
// ==========================================
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([...STATIC_ASSETS, ...EXTERNAL_ASSETS]))
  );
  self.skipWaiting();
});

// ==========================================
// ACTIVATE
// ==========================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ==========================================
// FETCH – CACHE FIRST para estáticos, NETWORK FIRST para API / JSON
// ==========================================
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Si es API o JSON (agencias), NETWORK FIRST
  if (url.pathname.endsWith('.json') || url.pathname.includes('/agencies')) {
    event.respondWith(networkFirst(req));
  } else {
    // Archivos estáticos, cache primero
    event.respondWith(cacheFirst(req));
  }
});

// Estrategias
async function cacheFirst(req) {
  const cacheResp = await caches.match(req);
  if (cacheResp) return cacheResp;

  try {
    const networkResp = await fetch(req);
    if (req.method === 'GET' && networkResp.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, networkResp.clone());
    }
    return networkResp;
  } catch (err) {
    return caches.match('/offline.html');
  }
}

async function networkFirst(req) {
  try {
    const networkResp = await fetch(req);
    if (req.method === 'GET' && networkResp.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, networkResp.clone());
    }
    return networkResp;
  } catch (err) {
    const cacheResp = await caches.match(req);
    return cacheResp || caches.match('/offline.html');
  }
}

// ==========================================
// SYNC – Cola de sincronización
// ==========================================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-agencies') {
    event.waitUntil(syncAgencies());
  }
});

async function syncAgencies() {
  console.log('[SW] Syncing agencies...');
  // Aquí llamarías a tu cola: queueSync
  // Ejemplo: enviar cambios pendientes al servidor
  // fetch('/api/sync', { method: 'POST', body: ... })
}

// ==========================================
// PUSH NOTIFICATIONS (opcional)
// ==========================================
// self.addEventListener('push', event => {...});
