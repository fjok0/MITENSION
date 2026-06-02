// ============================================================
// MITENSION - render del listado de tomas (pantalla principal)
// ============================================================

(function () {
    "use strict";

    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    async function renderizarLista() {
        const lista = document.getElementById("lista-tomas");
        const vacia = document.getElementById("lista-vacia");

        const tomas = await MITENSION.listTomas();

        lista.innerHTML = "";

        if (tomas.length === 0) {
            vacia.classList.remove("oculto");
            return;
        }
        vacia.classList.add("oculto");

        for (const t of tomas) {
            const cat = MITENSION.clasificarOMS(t.sistolica, t.diastolica);
            const fechaTxt = MITENSION.formatearFechaHoraToma(t.fecha, t.hora);

            const li = document.createElement("li");
            li.className = "toma-row toma-clickable toma-" + cat;
            li.setAttribute("role", "button");
            li.setAttribute("tabindex", "0");
            li.innerHTML = `
                <div class="toma-valores">
                    <span class="toma-cifras">${t.sistolica} / ${t.diastolica}</span>
                    ${t.pulso !== null && t.pulso !== undefined
                        ? `<span class="toma-pulso">${escapeHTML(t.pulso)} ppm</span>`
                        : ""}
                </div>
                <div class="toma-fecha">${escapeHTML(fechaTxt)}</div>
            `;
            li.addEventListener("click", function () {
                MITENSION_UI.abrirDetalleToma(t);
            });
            li.addEventListener("keydown", function (ev) {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    MITENSION_UI.abrirDetalleToma(t);
                }
            });
            lista.appendChild(li);
        }
    }

    document.addEventListener("DOMContentLoaded", renderizarLista);

    window.MITENSION_UI = window.MITENSION_UI || {};
    window.MITENSION_UI.refrescarListado = renderizarLista;
})();
