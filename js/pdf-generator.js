// ============================================================
// MITENSION - generador de informe PDF (usa pdfmake)
// Construye el "docDefinition" y devuelve un objeto pdfDoc
// listo para descarga o compartir.
// ============================================================

(function () {
    "use strict";

    // Colores (versiones aptas para PDF, un poco mas pasteles que los OMS de pantalla)
    const COLOR_VERDE     = "#d8f0d8";
    const COLOR_AMARILLO  = "#fff4c4";
    const COLOR_ROJO      = "#ffd2d2";
    const COLOR_ACENTO    = "#4ab0b0";

    function colorPorCategoria(cat) {
        if (cat === "rojo")     return COLOR_ROJO;
        if (cat === "amarillo") return COLOR_AMARILLO;
        return COLOR_VERDE;
    }

    function etiquetaCorta(cat) {
        if (cat === "rojo")     return "Alta";
        if (cat === "amarillo") return "Elev.";
        return "Norm.";
    }

    function formatearMedicacion(entrada) {
        if (!entrada || !entrada.medicamentos || entrada.medicamentos.length === 0) {
            return "—";
        }
        return entrada.medicamentos.map(function (m) {
            let txt = m.nombre;
            if (m.momentos && m.momentos.length > 0) {
                txt += " (" + m.momentos.join(", ") + ")";
            }
            return txt;
        }).join("; ");
    }

    function calcularEstadisticas(tomas) {
        const n = tomas.length;
        if (n === 0) return { n: 0 };

        let sumSis = 0, sumDia = 0, sumPulso = 0, nPulso = 0;
        const cnt = { verde: 0, amarillo: 0, rojo: 0 };

        for (const t of tomas) {
            sumSis += t.sistolica;
            sumDia += t.diastolica;
            if (t.pulso !== null && t.pulso !== undefined) {
                sumPulso += t.pulso;
                nPulso++;
            }
            cnt[MITENSION.clasificarOMS(t.sistolica, t.diastolica)]++;
        }

        return {
            n: n,
            avgSis:   Math.round(sumSis / n),
            avgDia:   Math.round(sumDia / n),
            avgPulso: nPulso > 0 ? Math.round(sumPulso / nPulso) : null,
            cnt: cnt
        };
    }

    function construirDocDefinition(tomas, entradasMedicacion) {
        // entradas vienen ordenadas por fecha desc; busca la mas reciente con fecha <= dada
        function findVigente(fecha) {
            for (const e of entradasMedicacion) {
                if (e.fecha <= fecha) return e;
            }
            return null;
        }

        const stats = calcularEstadisticas(tomas);

        // Periodo (tomas[0] es la mas reciente porque vienen desc)
        const fechaFin = tomas[0].fecha;
        const fechaIni = tomas[tomas.length - 1].fecha;
        const generado = MITENSION.formatearFecha(MITENSION.hoyISO()) + " " + MITENSION.ahoraHora();

        // Cabecera de la tabla
        const bodyTabla = [[
            { text: "Fecha · Hora", style: "th" },
            { text: "Sis",          style: "th" },
            { text: "Dia",          style: "th" },
            { text: "Pulso",        style: "th" },
            { text: "Cat.",         style: "th" },
            { text: "Medicación",   style: "th" }
        ]];

        for (const t of tomas) {
            const cat  = MITENSION.clasificarOMS(t.sistolica, t.diastolica);
            const fill = colorPorCategoria(cat);
            const vig  = findVigente(t.fecha);
            const pulsoTxt = (t.pulso !== null && t.pulso !== undefined) ? String(t.pulso) : "—";

            bodyTabla.push([
                { text: MITENSION.formatearFecha(t.fecha) + " " + t.hora, fillColor: fill, fontSize: 9 },
                { text: String(t.sistolica),  fillColor: fill, alignment: "center", fontSize: 9, bold: true },
                { text: String(t.diastolica), fillColor: fill, alignment: "center", fontSize: 9, bold: true },
                { text: pulsoTxt,             fillColor: fill, alignment: "center", fontSize: 9 },
                { text: etiquetaCorta(cat),   fillColor: fill, alignment: "center", fontSize: 8 },
                { text: formatearMedicacion(vig), fillColor: fill, fontSize: 8 }
            ]);
        }

        return {
            pageSize:    "A4",
            pageMargins: [30, 40, 30, 50],

            content: [
                { text: "MITENSION", style: "titulo" },
                { text: "Informe de tensión arterial", style: "subtitulo" },
                {
                    columns: [
                        { text: "Generado: " + generado, style: "meta" },
                        { text: "Tomas incluidas: " + stats.n, style: "meta", alignment: "right" }
                    ],
                    margin: [0, 8, 0, 0]
                },
                {
                    text: "Periodo: " + MITENSION.formatearFecha(fechaIni) +
                          " a " + MITENSION.formatearFecha(fechaFin),
                    style: "meta"
                },
                {
                    text: "Distribución: " +
                          stats.cnt.verde    + " óptimas · " +
                          stats.cnt.amarillo + " elevadas · " +
                          stats.cnt.rojo     + " altas",
                    style: "meta",
                    margin: [0, 6, 0, 0]
                },

                { text: "Tomas (más reciente arriba)", style: "sectionHeader" },
                {
                    table: {
                        headerRows: 1,
                        widths: ["auto", "auto", "auto", "auto", "auto", "*"],
                        body: bodyTabla
                    },
                    layout: {
                        hLineColor: function () { return "#dddddd"; },
                        vLineColor: function () { return "#dddddd"; },
                        hLineWidth: function () { return 0.5; },
                        vLineWidth: function () { return 0.5; }
                    }
                }
            ],

            styles: {
                titulo:        { fontSize: 22, bold: true, color: COLOR_ACENTO },
                subtitulo:     { fontSize: 12, color: "#555555" },
                meta:          { fontSize: 9,  color: "#666666" },
                sectionHeader: { fontSize: 13, bold: true, color: COLOR_ACENTO, margin: [0, 14, 0, 6] },
                th:            { bold: true, fillColor: COLOR_ACENTO, color: "#ffffff", alignment: "center", fontSize: 9 },
                statLabel:     { fontSize: 9,  color: "#666666", alignment: "center" },
                statValue:     { fontSize: 14, bold: true, alignment: "center" }
            },

            footer: function (currentPage, pageCount) {
                return {
                    text: "MITENSION · página " + currentPage + " de " + pageCount,
                    fontSize: 8,
                    color: "#888888",
                    alignment: "center",
                    margin: [0, 12, 0, 0]
                };
            }
        };
    }

    // ============================================================
    // ESTILO MEDICO: solo hechos y datos, sin colores ni categorias
    // ============================================================
    function construirDocDefinitionMedico(tomas, entradasMedicacion) {
        function findVigente(fecha) {
            for (const e of entradasMedicacion) {
                if (e.fecha <= fecha) return e;
            }
            return null;
        }

        const stats     = calcularEstadisticas(tomas);
        const fechaFin  = tomas[0].fecha;
        const fechaIni  = tomas[tomas.length - 1].fecha;
        const generado  = MITENSION.formatearFecha(MITENSION.hoyISO()) + " " + MITENSION.ahoraHora();

        const bodyTabla = [[
            { text: "Fecha",      style: "thM" },
            { text: "Hora",       style: "thM" },
            { text: "Sis",        style: "thM" },
            { text: "Dia",        style: "thM" },
            { text: "Pulso",      style: "thM" },
            { text: "Medicación", style: "thM" }
        ]];

        for (const t of tomas) {
            const vig      = findVigente(t.fecha);
            const pulsoTxt = (t.pulso !== null && t.pulso !== undefined) ? String(t.pulso) : "—";
            bodyTabla.push([
                { text: MITENSION.formatearFecha(t.fecha),          fontSize: 9 },
                { text: t.hora,                                     fontSize: 9, alignment: "center" },
                { text: String(t.sistolica),                        fontSize: 9, alignment: "center" },
                { text: String(t.diastolica),                       fontSize: 9, alignment: "center" },
                { text: pulsoTxt,                                   fontSize: 9, alignment: "center" },
                { text: formatearMedicacion(vig),                   fontSize: 8 }
            ]);
        }

        return {
            pageSize:    "A4",
            pageMargins: [40, 50, 40, 50],

            content: [
                { text: "INFORME DE MONITORIZACIÓN DE PRESIÓN ARTERIAL", style: "tituloM" },

                {
                    table: {
                        widths: ["auto", "*"],
                        body: [
                            [{ text: "Generado:",   style: "labelM" }, { text: generado,                                            style: "valueM" }],
                            [{ text: "Periodo:",    style: "labelM" }, { text: MITENSION.formatearFecha(fechaIni) + " a " + MITENSION.formatearFecha(fechaFin), style: "valueM" }],
                            [{ text: "Mediciones:", style: "labelM" }, { text: String(stats.n),                                     style: "valueM" }]
                        ]
                    },
                    layout: "noBorders",
                    margin: [0, 10, 0, 0]
                },

                { text: "MEDICIONES", style: "sectionM" },
                {
                    table: {
                        headerRows: 1,
                        widths: ["auto", "auto", "auto", "auto", "auto", "*"],
                        body: bodyTabla
                    },
                    layout: {
                        hLineColor: function () { return "#888888"; },
                        vLineColor: function () { return "#cccccc"; },
                        hLineWidth: function (i) { return (i === 0 || i === 1) ? 1 : 0.3; },
                        vLineWidth: function () { return 0.3; }
                    }
                }
            ],

            styles: {
                tituloM:  { fontSize: 13, bold: true, alignment: "center", margin: [0, 0, 0, 6] },
                sectionM: { fontSize: 11, bold: true, margin: [0, 14, 0, 6] },
                labelM:   { fontSize: 10, color: "#444444" },
                valueM:   { fontSize: 10, bold: true },
                thM:      { bold: true, alignment: "center", fontSize: 9, fillColor: "#eeeeee", color: "#222222" }
            },

            footer: function (currentPage, pageCount) {
                return {
                    text: "MITENSION · página " + currentPage + " de " + pageCount,
                    fontSize: 8,
                    color: "#888888",
                    alignment: "center",
                    margin: [0, 12, 0, 0]
                };
            }
        };
    }

    /**
     * Genera el PDF en memoria a partir de las N tomas mas recientes.
     * @param {number} cantidad
     * @param {"visual"|"medico"} estilo
     */
    async function generarPDFDoc(cantidad, estilo) {
        estilo = estilo || "visual";

        const todasTomas = await MITENSION.listTomas();
        if (todasTomas.length === 0) {
            throw new Error("No hay tomas registradas todavía.");
        }
        const tomas = todasTomas.slice(0, cantidad);
        const entradas = await MITENSION.listEntradasMedicacion();

        const docDef = (estilo === "medico")
            ? construirDocDefinitionMedico(tomas, entradas)
            : construirDocDefinition(tomas, entradas);

        const pdfDoc = pdfMake.createPdf(docDef);
        const sufijo = (estilo === "medico") ? "medico" : "ultimas";

        return {
            pdfDoc:         pdfDoc,
            tomasIncluidas: tomas.length,
            cantidadPedida: cantidad,
            estilo:         estilo,
            filename:       "MITENSION_" + MITENSION.hoyISO() + "_" + sufijo + "_" + tomas.length + ".pdf"
        };
    }

    window.MITENSION_PDF = { generarPDFDoc };
})();
