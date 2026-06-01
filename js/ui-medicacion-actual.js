// ============================================================
// MITENSION - bloque "Medicacion actual" (parte inferior fija)
// Muestra la entrada de medicacion mas reciente.
// ============================================================

(function () {
    "use strict";

    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    async function renderizar() {
        const cont = document.getElementById("medicacion-actual-contenido");
        if (!cont) return;

        const todas = await MITENSION.listEntradasMedicacion();
        if (todas.length === 0) {
            cont.innerHTML = '<p class="medicacion-vacia">Sin medicación registrada</p>';
            return;
        }

        // Ya viene ordenada por fecha descendente, la primera es la actual
        const actual = todas[0];
        const items = actual.medicamentos.map(function (m) {
            const moms = m.momentos && m.momentos.length
                ? ` <span class="opcional">(${escapeHTML(m.momentos.join(", "))})</span>`
                : "";
            return `<li>${escapeHTML(m.nombre)}${moms}</li>`;
        }).join("");

        cont.innerHTML = `
            <ul class="medicacion-lista">${items}</ul>
            <p class="medicacion-fecha">Actualizada: ${escapeHTML(MITENSION.formatearFecha(actual.fecha))}</p>
        `;
    }

    document.addEventListener("DOMContentLoaded", renderizar);

    window.MITENSION_UI = window.MITENSION_UI || {};
    window.MITENSION_UI.refrescarMedicacionActual = renderizar;
})();
