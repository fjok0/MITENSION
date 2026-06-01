// ============================================================
// MITENSION - coordinacion general de la app
// La logica de cada pantalla vive en su propio ui-*.js
// ============================================================

(function () {
    "use strict";

    console.log("[MITENSION] App cargada. Fase 7 OK (PWA + offline).");

    // Registro del Service Worker para PWA / offline
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
            navigator.serviceWorker.register("./service-worker.js")
                .then(function (reg) {
                    console.log("[MITENSION] Service Worker registrado:", reg.scope);
                })
                .catch(function (err) {
                    console.warn("[MITENSION] Service Worker no registrado:", err);
                });
        });
    }
})();
