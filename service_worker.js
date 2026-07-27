// Name des Caches
const CACHE_NAME = 'lidl-plu-cache-v2';

// Nur die absolut notwendigen lokalen Dateien sofort cachen
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// Installation: Nur die lokalen Basis-Dateien sichern
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Lokale Basis-Dateien gecacht');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivierung: Alten Cache löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Lösche alten Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Dynamische Cache-Strategie: Findet und speichert CDN-Dateien im laufenden Betrieb
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Wenn im Cache vorhanden, sofort nutzen (Offline-Modus)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Ansonsten aus dem Internet laden und für das nächste Mal im Cache ablegen
      return fetch(event.request).then((networkResponse) => {
        // Externe CDNs (Tailwind, React, Lucide etc.) sicher mitspeichern
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback falls komplett offline und Datei nicht im Cache
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
