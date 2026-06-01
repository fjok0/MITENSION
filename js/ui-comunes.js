// ============================================================
// MITENSION - utilidades de UI compartidas
// (toasts, apertura/cierre de modales)
// ============================================================

(function () {
    "use strict";

    const TOAST_DURACION_MS = 3000;
    let toastTimer = null;

    /**
     * Muestra un toast en la parte superior durante 3 segundos.
     * @param {string} mensaje
     * @param {"ok"|"info"|"error"} tipo
     */
    function mostrarToast(mensaje, tipo = "ok") {
        const t = document.getElementById("toast");
        if (!t) return;
        t.textContent = mensaje;
        t.className = "toast toast-" + tipo;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            t.classList.add("oculto");
        }, TOAST_DURACION_MS);
    }

    function abrirModal(modalId) {
        const m = document.getElementById(modalId);
        if (!m) return;
        m.classList.remove("oculto");
    }

    function cerrarModal(modalId) {
        const m = document.getElementById(modalId);
        if (!m) return;
        m.classList.add("oculto");
    }

    // Cierre por clic en backdrop o en X
    document.addEventListener("click", function (e) {
        if (e.target.hasAttribute("data-cierra-modal")) {
            const m = e.target.closest(".modal");
            if (m) cerrarModal(m.id);
        }
    });

    // Cierre con Escape
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            const m = document.querySelector(".modal:not(.oculto)");
            if (m) cerrarModal(m.id);
        }
    });

    window.MITENSION_UI = window.MITENSION_UI || {};
    window.MITENSION_UI.mostrarToast = mostrarToast;
    window.MITENSION_UI.abrirModal   = abrirModal;
    window.MITENSION_UI.cerrarModal  = cerrarModal;
})();
