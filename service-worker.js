// VENBUSCA - Service Worker
// Versión del caché - incrementar para forzar actualización
const CACHE_NAME = 'venbusca-cache-v1';

// Archivos esenciales a cachear para funcionamiento offline
const ASSETS_TO_CACHE = [
  './index.html',
  './styles.css',
  './script.js',
  './icono.png',
  './manifest.json'
];

// ─── EVENTO INSTALL ────────────────────────────────────────────────────────────
// Se ejecuta la primera vez que el SW se instala
self.addEventListener('install', (event) => {
  console.log('[VENBUSCA SW] Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[VENBUSCA SW] Cacheando archivos de la app...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('[VENBUSCA SW] Instalación completa.');
      // Fuerza al SW a activarse sin esperar a que se cierren todas las pestañas
      return self.skipWaiting();
    })
  );
});

// ─── EVENTO ACTIVATE ───────────────────────────────────────────────────────────
// Limpia versiones antiguas del caché al activar un nuevo SW
self.addEventListener('activate', (event) => {
  console.log('[VENBUSCA SW] Activando Service Worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[VENBUSCA SW] Eliminando caché antiguo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[VENBUSCA SW] Activación completa. Tomando control.');
      // Permite al nuevo SW tomar control de inmediato
      return self.clients.claim();
    })
  );
});

// ─── EVENTO FETCH ──────────────────────────────────────────────────────────────
// Estrategia: Network First (intenta red, si falla usa caché)
// Ideal para una app que consume APIs externas
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET
  if (event.request.method !== 'GET') return;

  // Ignorar peticiones a APIs externas (IA, diccionario, Wikipedia)
  const url = new URL(event.request.url);
  const isExternalApi =
    url.hostname === 'text.pollinations.ai' ||
    url.hostname === 'api.dictionaryapi.dev' ||
    url.hostname === 'es.wikipedia.org' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdnjs.cloudflare.com';

  if (isExternalApi) {
    // Para APIs externas: solo red, sin cachear
    return;
  }

  // Para archivos locales: Network First con fallback a caché
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la red responde bien, actualizamos el caché y devolvemos la respuesta
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si la red falla, intentamos servir desde caché (modo offline)
        console.log('[VENBUSCA SW] Sin conexión. Sirviendo desde caché:', event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si tampoco está en caché, devolvemos el index.html como fallback
          return caches.match('./index.html');
        });
      })
  );
});
