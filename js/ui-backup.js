// ============================================================
// MITENSION - Copia de seguridad (exportar / importar JSON)
// ============================================================

(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    async function onExportarBackup() {
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
            // Detalle tecnico visible para poder diagnosticar el fallo en el movil
            window.alert(
                "No se pudo exportar la copia de seguridad." +
                String.fromCharCode(10, 10) + "Detalle técnico:" + String.fromCharCode(10) +
                MITENSION_ARCHIVOS.describir(err) +
                String.fromCharCode(10, 10) + "Entorno: " + MITENSION_ARCHIVOS.entorno()
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

        const reader = new FileReader();
        reader.onload = async function () {
            let backup;
            try {
                backup = JSON.parse(reader.result);
            } catch (err) {
                MITENSION_UI.mostrarToast("El archivo no es un JSON válido", "error");
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
            }
        };
        reader.readAsText(file);
    }

    document.addEventListener("DOMContentLoaded", function () {
        $("btn-exportar-backup").addEventListener("click", onExportarBackup);
        $("btn-importar-backup").addEventListener("click", onSeleccionarArchivoImportar);
        $("input-importar-backup").addEventListener("change", onArchivoImportarSeleccionado);
    });
})();
