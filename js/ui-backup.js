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
            const blob = new Blob([json], { type: "application/json" });

            if (navigator.canShare && navigator.share) {
                const file = new File([blob], filename, { type: "application/json" });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: filename });
                    return;
                }
            }

            // Sin Web Share (o sin soporte de archivos): descarga directa
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            MITENSION_UI.mostrarToast("No se pudo exportar la copia de seguridad", "error");
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
