// ============================================================
// MITENSION - logica del modal "Cambiar medicacion"
// Permite anadir de 1 a 5 medicamentos, cada uno con momentos
// del dia y opcionalmente principios activos.
// ============================================================

(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    const MAX_MEDICAMENTOS = 5;

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

    async function abrir() {
        limpiarMedicamentos();

        // Precargar con la entrada de medicacion mas reciente, si existe
        const todas = await MITENSION.listEntradasMedicacion();
        if (todas.length > 0) {
            const actual = todas[0];
            for (const med of actual.medicamentos) {
                anadirMedicamentoConDatos(med);
            }
        } else {
            anadirMedicamento(); // primer arranque: un bloque vacio
        }

        $("cm-fecha").value = MITENSION.hoyISO();
        limpiarError();
        MITENSION_UI.abrirModal("modal-cambiar-medicacion");
    }

    /**
     * Crea un bloque de medicamento ya rellenado con los datos dados.
     * Se usa al pre-cargar la medicacion actual al abrir el modal.
     */
    function anadirMedicamentoConDatos(med) {
        const contenedor = $("cm-medicamentos");
        if (contenedor.children.length >= MAX_MEDICAMENTOS) return;

        const tpl   = $("tpl-medicamento").content.cloneNode(true);
        const block = tpl.querySelector(".med-block");

        // Nombre
        block.querySelector(".med-nombre").value = med.nombre || "";

        // Momentos del dia
        const checks = block.querySelectorAll(".med-momentos input[type='checkbox']");
        checks.forEach(function (c) {
            if (med.momentos && med.momentos.includes(c.value)) {
                c.checked = true;
            }
        });

        // Principios activos
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

    function actualizarNumerosYBotones() {
        const blocks = $("cm-medicamentos").querySelectorAll(".med-block");
        blocks.forEach(function (b, i) {
            b.querySelector(".med-num").textContent = i + 1;
        });
        // Si solo queda 1, el boton de eliminar se desactiva visualmente
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

    function anadirPrincipio(medBlock) {
        const tpl = $("tpl-principio").content.cloneNode(true);
        medBlock.querySelector(".med-principios-list").appendChild(tpl);
    }

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

            meds.push({ nombre, momentos, principios });
        });
        return meds;
    }

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
            await MITENSION.addEntradaMedicacion(meds, fecha);
        } catch (err) {
            console.error(err);
            mostrarError("Error al guardar: " + err.message);
            return;
        }

        MITENSION_UI.cerrarModal("modal-cambiar-medicacion");
        await MITENSION_UI.refrescarMedicacionActual();
        MITENSION_UI.mostrarToast("Medicación actualizada", "ok");
    }

    document.addEventListener("DOMContentLoaded", function () {
        $("btn-cambiar-medicacion").addEventListener("click", abrir);
        $("form-cambiar-medicacion").addEventListener("submit", onSubmit);
        $("cm-add-med").addEventListener("click", anadirMedicamento);

        // Delegacion de eventos para botones dinamicos dentro del modal
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
})();
