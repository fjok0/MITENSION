// ============================================================
// MITENSION - Service Worker
// Estrategia: cache-first con precarga al instalar.
// La app funciona 100% offline desde el segundo arranque.
// ============================================================

const CACHE_NAME = "mitension-v4";

// Lista de TODOS los recursos de la app, que se descargan
// y se cachean al instalar el service worker.
const PRECACHE = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./css/styles.css",
    "./assets/logo.svg",

    "./js/lib/dexie.min.js",
    "./js/lib/pdfmake.min.js",
    "./js/lib/vfs_fonts.js",

    "./js/db.js",
    "./js/ui-comunes.js",
    "./js/archivos.js",
    "./js/ui-listado.js",
    "./js/ui-medicacion-actual.js",
    "./js/ui-nueva-toma.js",
    "./js/ui-cambiar-medicacion.js",
    "./js/ui-historial-medicacion.js",
    "./js/ui-detalle-toma.js",
    "./js/pdf-generator.js",
    "./js/ui-informes.js",
    "./js/ui-backup.js",
    "./js/app.js"
];

// ---------- INSTALL ----------
// Precarga todos los recursos esenciales en el cache.
self.addEventListener("install", function (event) {
    console.log("[SW] install");
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(PRECACHE);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// ---------- ACTIVATE ----------
// Limpia caches viejos cuando subimos de version.
self.addEventListener("activate", function (event) {
    console.log("[SW] activate");
    event.waitUntil(
        caches.keys().then(function (claves) {
            return Promise.all(
                claves
                    .filter(function (k) { return k !== CACHE_NAME; })
                    .map(function (k) { return caches.delete(k); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

// ---------- FETCH ----------
// Solo interceptamos GET dentro de nuestro propio origen.
// Estrategia: cache-first, con fallback a red.
self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) return cached;
            return fetch(event.request).then(function (response) {
                // Cacheamos sobre la marcha cualquier nuevo recurso valido.
                if (response.ok && response.type === "basic") {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});
