// ============================================================
// MITENSION - UI del modal "Informes"
// Selector de cantidad + generacion + guardar/compartir
// ============================================================

(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    let ultimoPDF = null;  // {pdfDoc, filename, tomasIncluidas, cantidadPedida}

    // ---------------- estado UI ----------------

    function mostrarError(msg) {
        const e = $("inf-error");
        e.textContent = msg;
        e.classList.remove("oculto");
    }
    function limpiarError() {
        const e = $("inf-error");
        e.textContent = "";
        e.classList.add("oculto");
    }

    function vistaSelector() {
        $("inf-selector").classList.remove("oculto");
        $("inf-resultado").classList.add("oculto");
        limpiarError();
    }

    function vistaResultado(tomasIncluidas, cantidadPedida, filename) {
        $("inf-selector").classList.add("oculto");

        let mensaje = "PDF generado: " + filename;
        if (tomasIncluidas < cantidadPedida) {
            mensaje += " (solo había " + tomasIncluidas + " tomas)";
        }
        $("inf-mensaje").textContent = mensaje;

        // Habilitar/deshabilitar Compartir segun soporte del navegador
        const btnComp = $("inf-compartir");
        const btnGuardar = $("inf-guardar");

        if (MITENSION_ARCHIVOS.esNativo()) {
            // APK: un unico boton que abre el menu nativo de compartir
            // (Drive, Gmail, WhatsApp, Archivos...), que ya incluye guardar y enviar.
            btnGuardar.textContent = "Guardar / Compartir PDF";
            btnComp.classList.add("oculto");
        }

        const soporta = MITENSION_ARCHIVOS.puedeCompartir("application/pdf");

        if (soporta) {
            btnComp.disabled = false;
            btnComp.title = "";
        } else {
            btnComp.disabled = true;
            btnComp.title = "No disponible en este navegador. Usa Guardar.";
        }

        $("inf-resultado").classList.remove("oculto");
    }

    // ---------------- acciones ----------------

    function abrirModal() {
        vistaSelector();
        MITENSION_UI.abrirModal("modal-informes");
    }

    async function onClickCantidad(e) {
        const btn = e.target.closest(".inf-opcion");
        if (!btn) return;
        limpiarError();

        const cantidad = parseInt(btn.dataset.cantidad, 10);
        const estilo   = btn.dataset.estilo || "visual";
        btn.disabled = true;
        try {
            ultimoPDF = await MITENSION_PDF.generarPDFDoc(cantidad, estilo);
            vistaResultado(ultimoPDF.tomasIncluidas, ultimoPDF.cantidadPedida, ultimoPDF.filename);
        } catch (err) {
            console.error(err);
            mostrarError(err.message || "Error al generar el PDF.");
        } finally {
            btn.disabled = false;
        }
    }

    async function onClickGuardar() {
        if (!ultimoPDF) return;

        if (MITENSION_ARCHIVOS.esNativo()) {
            // APK: pdfmake .download() no funciona en el WebView -> menu nativo
            try {
                const base64 = await new Promise(function (resolve) {
                    ultimoPDF.pdfDoc.getBase64(resolve);
                });
                await MITENSION_ARCHIVOS.guardarOCompartir({
                    filename:    ultimoPDF.filename,
                    mime:        "application/pdf",
                    base64:      base64,
                    title:       "MITENSION - Informe de tensión",
                    dialogTitle: "Guardar o compartir el informe"
                });
            } catch (err) {
                console.error(err);
                mostrarError("No se pudo guardar el PDF: " + (err.message || err));
            }
            return;
        }

        ultimoPDF.pdfDoc.download(ultimoPDF.filename);
    }

    async function onClickCompartir() {
        if (!ultimoPDF) return;
        try {
            const blob = await new Promise(function (resolve) {
                ultimoPDF.pdfDoc.getBlob(resolve);
            });
            const file = new File([blob], ultimoPDF.filename, { type: "application/pdf" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "MITENSION - Informe de tensión",
                    text:  "Informe de tensión arterial"
                });
            } else {
                mostrarError("Compartir no disponible. Usa Guardar y adjúntalo a mano.");
            }
        } catch (err) {
            if (err && err.name === "AbortError") return; // cancelado por el usuario
            console.error(err);
            mostrarError("No se pudo compartir: " + (err.message || err));
        }
    }

    // ---------------- init ----------------

    document.addEventListener("DOMContentLoaded", function () {
        $("btn-informes").addEventListener("click", abrirModal);
        $("inf-selector").addEventListener("click", onClickCantidad);
        $("inf-guardar").addEventListener("click", onClickGuardar);
        $("inf-compartir").addEventListener("click", onClickCompartir);
        $("inf-volver").addEventListener("click", vistaSelector);
    });
})();
