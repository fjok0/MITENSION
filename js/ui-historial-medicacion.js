// ============================================================
// MITENSION - modal de historial de medicacion
// Permite ver, editar y borrar entradas pasadas de medicacion.
// Se abre al pulsar el bloque "Medicacion actual" del fondo.
// ============================================================

(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    let entradaActual = null;

    function escapeHTML(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // ---------------- gestion de vistas ----------------

    function mostrarVista(idVista) {
        $("hm-vista-lista").classList.add("oculto");
        $("hm-vista-detalle").classList.add("oculto");
        $("hm-vista-confirmar").classList.add("oculto");
        $(idVista).classList.remove("oculto");
    }

    // ---------------- vista LISTA ----------------

    async function renderizarLista() {
        const lista = $("hm-lista");
        const vacia = $("hm-vacia");
        lista.innerHTML = "";

        const entradas = await MITENSION.listEntradasMedicacion();
        if (entradas.length === 0) {
            vacia.classList.remove("oculto");
            return;
        }
        vacia.classList.add("oculto");

        for (const e of entradas) {
            const meds = e.medicamentos.map(function (m) { return m.nombre; }).join(", ");
            const li = document.createElement("li");
            li.className = "hm-entrada-row";
            li.setAttribute("role", "button");
            li.setAttribute("tabindex", "0");
            li.innerHTML =
                '<div class="hm-entrada-fecha">' + escapeHTML(MITENSION.formatearFecha(e.fecha)) + '</div>' +
                '<div class="hm-entrada-meds">'  + escapeHTML(meds) + '</div>';
            li.addEventListener("click", function () { abrirDetalleEntrada(e); });
            li.addEventListener("keydown", function (ev) {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    abrirDetalleEntrada(e);
                }
            });
            lista.appendChild(li);
        }
    }

    async function abrirHistorial() {
        await renderizarLista();
        mostrarVista("hm-vista-lista");
        MITENSION_UI.abrirModal("modal-historial-medicacion");
    }

    // ---------------- vista DETALLE ----------------

    function abrirDetalleEntrada(entrada) {
        entradaActual = entrada;
        $("hm-detalle-fecha").textContent = MITENSION.formatearFecha(entrada.fecha);

        const cont = $("hm-detalle-meds");
        cont.innerHTML = "";
        for (const m of entrada.medicamentos) {
            const div = document.createElement("div");
            div.className = "hm-detalle-med";

            let html = "<h4>" + escapeHTML(m.nombre) + "</h4>";
            if (m.momentos && m.momentos.length > 0) {
                html += '<p class="hm-momentos">Momentos: ' + escapeHTML(m.momentos.join(", ")) + '</p>';
            }
            if (m.principios && m.principios.length > 0) {
                html += '<ul class="hm-principios">';
                for (const p of m.principios) {
                    let txt = p.nombre || "";
                    if (p.mg !== null && p.mg !== undefined && p.mg !== "") {
                        txt += " " + p.mg + " mg";
                    }
                    html += '<li>' + escapeHTML(txt.trim()) + '</li>';
                }
                html += '</ul>';
            }
            div.innerHTML = html;
            cont.appendChild(div);
        }

        mostrarVista("hm-vista-detalle");
    }

    function volverALista() {
        mostrarVista("hm-vista-lista");
    }

    // ---------------- vista CONFIRMAR BORRADO ----------------

    function pedirConfirmarBorrar() {
        if (!entradaActual) return;
        mostrarVista("hm-vista-confirmar");
    }

    async function confirmarBorrado() {
        if (!entradaActual) return;
        try {
            await MITENSION.deleteEntradaMedicacion(entradaActual.id);
        } catch (err) {
            console.error(err);
            MITENSION_UI.mostrarToast("Error al borrar: " + err.message, "error");
            return;
        }
        MITENSION_UI.cerrarModal("modal-historial-medicacion");
        await MITENSION_UI.refrescarMedicacionActual();
        MITENSION_UI.mostrarToast("Entrada borrada", "ok");
        entradaActual = null;
    }

    // ---------------- accion EDITAR ----------------

    function abrirEditar() {
        if (!entradaActual) return;
        const e = entradaActual;
        MITENSION_UI.cerrarModal("modal-historial-medicacion");
        MITENSION_UI.abrirCambiarMedicacionEnModoEdicion(e);
        entradaActual = null;
    }

    // ---------------- init ----------------

    document.addEventListener("DOMContentLoaded", function () {
        // Hacer clickable el bloque de medicacion actual
        const bloque = document.querySelector(".bloque-medicacion-actual");
        if (bloque) {
            bloque.setAttribute("role", "button");
            bloque.setAttribute("tabindex", "0");
            bloque.addEventListener("click", abrirHistorial);
            bloque.addEventListener("keydown", function (ev) {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    abrirHistorial();
                }
            });
        }

        $("hm-volver").addEventListener("click", volverALista);
        $("hm-detalle-editar").addEventListener("click", abrirEditar);
        $("hm-detalle-borrar").addEventListener("click", pedirConfirmarBorrar);
        $("hm-cancelar-borrar").addEventListener("click", function () {
            mostrarVista("hm-vista-detalle");
        });
        $("hm-confirmar-borrar").addEventListener("click", confirmarBorrado);
    });
})();
