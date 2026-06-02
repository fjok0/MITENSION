// ============================================================
// MITENSION - modal de detalle / editar / borrar de una toma
// Tres vistas dentro del mismo modal.
// ============================================================

(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    let tomaActual = null; // {id, fecha, hora, sistolica, diastolica, pulso, createdAt}

    // ---------------- gestion de vistas ----------------

    function mostrarVista(idVista) {
        $("dt-vista-detalle").classList.add("oculto");
        $("dt-vista-confirmar").classList.add("oculto");
        $("dt-vista-editar").classList.add("oculto");
        $(idVista).classList.remove("oculto");
    }

    // ---------------- vista DETALLE ----------------

    function pintarDetalle() {
        if (!tomaActual) return;
        const t   = tomaActual;
        const cat = MITENSION.clasificarOMS(t.sistolica, t.diastolica);

        const block = $("dt-cifras-block");
        block.className = "dt-cifras-block dt-" + cat;

        $("dt-fecha-hora").textContent = MITENSION.formatearFechaHoraToma(t.fecha, t.hora);
        $("dt-cifras").textContent     = t.sistolica + " / " + t.diastolica;
        $("dt-pulso").textContent = (t.pulso !== null && t.pulso !== undefined)
            ? "Pulso: " + t.pulso + " ppm"
            : "Pulso no registrado";
        $("dt-categoria").textContent = MITENSION.etiquetaCategoria(cat);
    }

    function abrirDetalle(toma) {
        tomaActual = toma;
        pintarDetalle();
        mostrarVista("dt-vista-detalle");
        MITENSION_UI.abrirModal("modal-detalle-toma");
    }

    // ---------------- vista CONFIRMAR BORRADO ----------------

    function pedirConfirmarBorrar() {
        if (!tomaActual) return;
        mostrarVista("dt-vista-confirmar");
    }

    async function confirmarBorrado() {
        if (!tomaActual) return;
        try {
            await MITENSION.deleteToma(tomaActual.id);
        } catch (err) {
            console.error(err);
            MITENSION_UI.mostrarToast("Error al borrar: " + err.message, "error");
            return;
        }
        MITENSION_UI.cerrarModal("modal-detalle-toma");
        await MITENSION_UI.refrescarListado();
        MITENSION_UI.mostrarToast("Toma borrada", "ok");
        tomaActual = null;
    }

    // ---------------- vista EDITAR ----------------

    function mostrarErrorEditar(msg) {
        const e = $("et-error");
        e.textContent = msg;
        e.classList.remove("oculto");
    }
    function limpiarErrorEditar() {
        const e = $("et-error");
        e.textContent = "";
        e.classList.add("oculto");
    }

    function abrirEditar() {
        if (!tomaActual) return;
        const t = tomaActual;
        $("et-fecha").value      = t.fecha;
        $("et-hora").value       = t.hora;
        $("et-sistolica").value  = t.sistolica;
        $("et-diastolica").value = t.diastolica;
        $("et-pulso").value      = (t.pulso !== null && t.pulso !== undefined) ? t.pulso : "";
        limpiarErrorEditar();
        mostrarVista("dt-vista-editar");
    }

    async function guardarCambios(e) {
        e.preventDefault();
        limpiarErrorEditar();
        if (!tomaActual) return;

        const fecha = $("et-fecha").value;
        const hora  = $("et-hora").value;
        const sTxt  = $("et-sistolica").value.trim();
        const dTxt  = $("et-diastolica").value.trim();
        const pTxt  = $("et-pulso").value.trim();

        if (!fecha || !hora) {
            mostrarErrorEditar("Fecha y hora son obligatorias.");
            return;
        }
        if (!sTxt || !dTxt) {
            mostrarErrorEditar("Sistólica y diastólica son obligatorias.");
            return;
        }
        const s = parseInt(sTxt, 10);
        const d = parseInt(dTxt, 10);
        const p = pTxt ? parseInt(pTxt, 10) : null;
        if (isNaN(s) || s < 0 || s > 999) { mostrarErrorEditar("Sistólica entre 0 y 999.");  return; }
        if (isNaN(d) || d < 0 || d > 999) { mostrarErrorEditar("Diastólica entre 0 y 999."); return; }
        if (p !== null && (isNaN(p) || p < 0 || p > 999)) {
            mostrarErrorEditar("Pulso entre 0 y 999.");
            return;
        }

        try {
            await MITENSION.updateToma(tomaActual.id, {
                fecha:      fecha,
                hora:       hora,
                sistolica:  s,
                diastolica: d,
                pulso:      p
            });
        } catch (err) {
            console.error(err);
            mostrarErrorEditar("Error al guardar: " + err.message);
            return;
        }

        MITENSION_UI.cerrarModal("modal-detalle-toma");
        await MITENSION_UI.refrescarListado();
        MITENSION_UI.mostrarToast("Toma actualizada", "ok");
        tomaActual = null;
    }

    // ---------------- navegacion entre vistas ----------------

    function volverADetalle() {
        if (!tomaActual) {
            MITENSION_UI.cerrarModal("modal-detalle-toma");
            return;
        }
        mostrarVista("dt-vista-detalle");
    }

    // ---------------- init ----------------

    document.addEventListener("DOMContentLoaded", function () {
        $("dt-editar").addEventListener("click", abrirEditar);
        $("dt-borrar").addEventListener("click", pedirConfirmarBorrar);
        $("dt-cancelar-borrar").addEventListener("click", volverADetalle);
        $("dt-confirmar-borrar").addEventListener("click", confirmarBorrado);
        $("et-cancelar").addEventListener("click", volverADetalle);
        $("form-editar-toma").addEventListener("submit", guardarCambios);
    });

    window.MITENSION_UI = window.MITENSION_UI || {};
    window.MITENSION_UI.abrirDetalleToma = abrirDetalle;
})();
