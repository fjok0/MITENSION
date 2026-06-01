// ============================================================
// MITENSION - logica del modal "Nueva toma"
// ============================================================

(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    function mostrarError(msg) {
        const e = $("nt-error");
        e.textContent = msg;
        e.classList.remove("oculto");
    }
    function limpiarError() {
        const e = $("nt-error");
        e.textContent = "";
        e.classList.add("oculto");
    }

    function abrir() {
        $("form-nueva-toma").reset();
        limpiarError();
        MITENSION_UI.abrirModal("modal-nueva-toma");
        // pequeno delay para dar tiempo a la animacion
        setTimeout(function () { $("nt-sistolica").focus(); }, 120);
    }

    async function onSubmit(e) {
        e.preventDefault();
        limpiarError();

        const sTxt = $("nt-sistolica").value.trim();
        const dTxt = $("nt-diastolica").value.trim();
        const pTxt = $("nt-pulso").value.trim();

        if (!sTxt || !dTxt) {
            mostrarError("Sistólica y diastólica son obligatorias.");
            return;
        }

        const s = parseInt(sTxt, 10);
        const d = parseInt(dTxt, 10);
        const p = pTxt ? parseInt(pTxt, 10) : null;

        if (isNaN(s) || s < 0 || s > 999) {
            mostrarError("Sistólica debe ser entero entre 0 y 999.");
            return;
        }
        if (isNaN(d) || d < 0 || d > 999) {
            mostrarError("Diastólica debe ser entero entre 0 y 999.");
            return;
        }
        if (p !== null && (isNaN(p) || p < 0 || p > 999)) {
            mostrarError("Pulso debe ser entero entre 0 y 999.");
            return;
        }

        try {
            await MITENSION.addToma(s, d, p);
        } catch (err) {
            console.error(err);
            mostrarError("Error al guardar: " + err.message);
            return;
        }

        MITENSION_UI.cerrarModal("modal-nueva-toma");
        await MITENSION_UI.refrescarListado();
        MITENSION_UI.mostrarToast("Toma registrada", "ok");
    }

    document.addEventListener("DOMContentLoaded", function () {
        $("form-nueva-toma").addEventListener("submit", onSubmit);
        $("btn-nueva-toma").addEventListener("click", abrir);
    });
})();
