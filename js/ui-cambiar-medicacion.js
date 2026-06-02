// ============================================================
// MITENSION - logica del modal "Actualizar / Editar medicacion"
// Soporta dos modos:
//   - NUEVA: arrancado desde el boton azul. Precarga con la
//            entrada mas reciente y al guardar crea una nueva.
//   - EDITAR: arrancado desde el historial. Precarga con la
//            entrada concreta y al guardar la actualiza.
// ============================================================

(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    const MAX_MEDICAMENTOS = 5;

    let editandoId = null;   // null = modo NUEVA, numero = modo EDITAR

    // ---------------- helpers de error ----------------

    function mostrarError(msg) {
        const e = $("cm-error");
        e.textContent = msg;
        e.classList.remove("oculto");
    }
    function limpiarError() {
        const e = $("cm-error");
        e.textContent = "";
        e.classList.add("oculto");
    }

    function limpiarMedicamentos() {
        $("cm-medicamentos").innerHTML = "";
    }

    // ---------------- gestion de bloques de medicamento ----------------

    function actualizarNumerosYBotones() {
        const blocks = $("cm-medicamentos").querySelectorAll(".med-block");
        blocks.forEach(function (b, i) {
            b.querySelector(".med-num").textContent = i + 1;
        });
        if (blocks.length === 1) {
            blocks[0].querySelector(".med-block-remove").style.visibility = "hidden";
        } else {
            blocks.forEach(function (b) {
                b.querySelector(".med-block-remove").style.visibility = "visible";
            });
        }
        $("cm-add-med").disabled = blocks.length >= MAX_MEDICAMENTOS;
    }

    function anadirMedicamento() {
        const contenedor = $("cm-medicamentos");
        if (contenedor.children.length >= MAX_MEDICAMENTOS) return;

        const tpl   = $("tpl-medicamento").content.cloneNode(true);
        const block = tpl.querySelector(".med-block");
        contenedor.appendChild(tpl);
        actualizarNumerosYBotones();
        block.querySelector(".med-nombre").focus();
    }

    function anadirMedicamentoConDatos(med) {
        const contenedor = $("cm-medicamentos");
        if (contenedor.children.length >= MAX_MEDICAMENTOS) return;

        const tpl   = $("tpl-medicamento").content.cloneNode(true);
        const block = tpl.querySelector(".med-block");

        block.querySelector(".med-nombre").value = med.nombre || "";

        const checks = block.querySelectorAll(".med-momentos input[type='checkbox']");
        checks.forEach(function (c) {
            if (med.momentos && med.momentos.includes(c.value)) {
                c.checked = true;
            }
        });

        const listaPrincipios = block.querySelector(".med-principios-list");
        if (med.principios && med.principios.length > 0) {
            for (const p of med.principios) {
                const tplP = $("tpl-principio").content.cloneNode(true);
                const row  = tplP.querySelector(".principio-row");
                row.querySelector(".principio-nombre").value = p.nombre || "";
                row.querySelector(".principio-mg").value =
                    (p.mg !== null && p.mg !== undefined) ? p.mg : "";
                listaPrincipios.appendChild(tplP);
            }
        }

        contenedor.appendChild(tpl);
        actualizarNumerosYBotones();
    }

    function anadirPrincipio(medBlock) {
        const tpl = $("tpl-principio").content.cloneNode(true);
        medBlock.querySelector(".med-principios-list").appendChild(tpl);
    }

    // ---------------- recoger datos del formulario ----------------

    function recogerDatos() {
        const blocks = $("cm-medicamentos").querySelectorAll(".med-block");
        const meds = [];
        blocks.forEach(function (b) {
            const nombre = b.querySelector(".med-nombre").value.trim();
            const momentos = Array.from(
                b.querySelectorAll(".med-momentos input:checked")
            ).map(function (c) { return c.value; });

            const principios = [];
            const filas = b.querySelectorAll(".med-principios-list .principio-row");
            filas.forEach(function (pb) {
                const pn = pb.querySelector(".principio-nombre").value.trim();
                const mg = pb.querySelector(".principio-mg").value.trim();
                if (pn || mg) {
                    principios.push({
                        nombre: pn,
                        mg: mg ? parseFloat(mg) : null
                    });
                }
            });

            meds.push({ nombre: nombre, momentos: momentos, principios: principios });
        });
        return meds;
    }

    // ---------------- apertura del modal ----------------

    /**
     * Modo NUEVA: precarga con la entrada mas reciente, fecha = hoy.
     */
    async function abrirNueva() {
        editandoId = null;
        $("cm-titulo").textContent = "Actualizar medicación";

        limpiarMedicamentos();

        const todas = await MITENSION.listEntradasMedicacion();
        if (todas.length > 0) {
            const actual = todas[0];
            for (const med of actual.medicamentos) {
                anadirMedicamentoConDatos(med);
            }
        } else {
            anadirMedicamento();
        }

        $("cm-fecha").value = MITENSION.hoyISO();
        limpiarError();
        MITENSION_UI.abrirModal("modal-cambiar-medicacion");
    }

    /**
     * Modo EDITAR: precarga con la entrada concreta, fecha = la de la entrada.
     */
    function abrirEnModoEdicion(entrada) {
        editandoId = entrada.id;
        $("cm-titulo").textContent = "Editar medicación";

        limpiarMedicamentos();
        for (const med of entrada.medicamentos) {
            anadirMedicamentoConDatos(med);
        }
        $("cm-fecha").value = entrada.fecha;
        limpiarError();
        MITENSION_UI.abrirModal("modal-cambiar-medicacion");
    }

    // ---------------- envio ----------------

    async function onSubmit(e) {
        e.preventDefault();
        limpiarError();

        const meds = recogerDatos();
        if (meds.length === 0) {
            mostrarError("Debe haber al menos un medicamento.");
            return;
        }
        for (let i = 0; i < meds.length; i++) {
            if (!meds[i].nombre) {
                mostrarError("El medicamento " + (i + 1) + " necesita nombre.");
                return;
            }
        }

        const fecha = $("cm-fecha").value || MITENSION.hoyISO();

        try {
            if (editandoId !== null) {
                await MITENSION.updateEntradaMedicacion(editandoId, meds, fecha);
            } else {
                await MITENSION.addEntradaMedicacion(meds, fecha);
            }
        } catch (err) {
            console.error(err);
            mostrarError("Error al guardar: " + err.message);
            return;
        }

        const mensajeToast = editandoId !== null
            ? "Entrada actualizada"
            : "Medicación actualizada";

        editandoId = null;
        MITENSION_UI.cerrarModal("modal-cambiar-medicacion");
        await MITENSION_UI.refrescarMedicacionActual();
        MITENSION_UI.mostrarToast(mensajeToast, "ok");
    }

    // ---------------- init ----------------

    document.addEventListener("DOMContentLoaded", function () {
        $("btn-cambiar-medicacion").addEventListener("click", abrirNueva);
        $("form-cambiar-medicacion").addEventListener("submit", onSubmit);
        $("cm-add-med").addEventListener("click", anadirMedicamento);

        $("cm-medicamentos").addEventListener("click", function (e) {
            const t = e.target;
            if (t.classList.contains("med-block-remove")) {
                const block = t.closest(".med-block");
                if ($("cm-medicamentos").children.length > 1) {
                    block.remove();
                    actualizarNumerosYBotones();
                }
            } else if (t.classList.contains("med-add-principio")) {
                anadirPrincipio(t.closest(".med-block"));
            } else if (t.classList.contains("principio-remove")) {
                t.closest(".principio-row").remove();
            }
        });
    });

    window.MITENSION_UI = window.MITENSION_UI || {};
    window.MITENSION_UI.abrirCambiarMedicacionEnModoEdicion = abrirEnModoEdicion;
})();
