// ============================================================
// MITENSION - Copia de seguridad (exportar / importar JSON)
// ============================================================

(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    function mostrarErrorBackup(texto) {
        const e = $("backup-error");
        e.textContent = texto;
        e.classList.remove("oculto");
    }

    function limpiarErrorBackup() {
        const e = $("backup-error");
        e.textContent = "";
        e.classList.add("oculto");
    }

    async function onExportarBackup() {
        limpiarErrorBackup();
        try {
            const backup = await MITENSION.exportarBackup();
            const json = JSON.stringify(backup, null, 2);
            const fecha = new Date().toISOString().slice(0, 10);
            const filename = "mitension_backup_" + fecha + ".json";

            // APK: menu nativo de compartir. Navegador: Web Share o descarga.
            await MITENSION_ARCHIVOS.guardarOCompartir({
                filename:    filename,
                mime:        "application/json",
                text:        json,
                title:       "MITENSION - copia de seguridad",
                dialogTitle: "Guardar copia de seguridad"
            });
        } catch (err) {
            console.error(err);
            MITENSION_UI.mostrarToast("No se pudo exportar la copia de seguridad", "error");
            // Detalle tecnico fijo en pantalla (no desaparece) para diagnosticar el fallo
            mostrarErrorBackup(
                "No se pudo exportar. Detalle: " + MITENSION_ARCHIVOS.describir(err) +
                "  ·  Entorno: " + MITENSION_ARCHIVOS.entorno()
            );
        }
    }

    function onSeleccionarArchivoImportar() {
        $("input-importar-backup").click();
    }

    function onArchivoImportarSeleccionado(e) {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;
        limpiarErrorBackup();

        const reader = new FileReader();
        reader.onerror = function () {
            mostrarErrorBackup("No se pudo leer el archivo seleccionado: " +
                MITENSION_ARCHIVOS.describir(reader.error));
        };
        reader.onload = async function () {
            let backup;
            try {
                backup = JSON.parse(reader.result);
            } catch (err) {
                MITENSION_UI.mostrarToast("El archivo no es un JSON válido", "error");
                mostrarErrorBackup("El archivo seleccionado no es un JSON válido (" + file.name + ").");
                return;
            }

            const confirmado = window.confirm(
                "Esto reemplazará todas las tomas y la medicación actuales por las del archivo. ¿Continuar?"
            );
            if (!confirmado) return;

            try {
                await MITENSION.importarBackup(backup);
                MITENSION_UI.cerrarModal("modal-informes");
                MITENSION_UI.mostrarToast("Copia de seguridad importada", "ok");
                await MITENSION_UI.refrescarListado();
                await MITENSION_UI.refrescarMedicacionActual();
            } catch (err) {
                MITENSION_UI.mostrarToast(err.message, "error");
                mostrarErrorBackup("No se pudo importar: " + MITENSION_ARCHIVOS.describir(err));
            }
        };
        reader.readAsText(file);
    }

    document.addEventListener("DOMContentLoaded", function () {
        $("backup-version").textContent = "Versión: " + MITENSION_ARCHIVOS.etiquetaVersion();
        $("btn-exportar-backup").addEventListener("click", onExportarBackup);
        $("btn-importar-backup").addEventListener("click", onSeleccionarArchivoImportar);
        $("input-importar-backup").addEventListener("change", onArchivoImportarSeleccionado);
    });
})();
