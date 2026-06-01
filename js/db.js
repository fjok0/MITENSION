// ============================================================
// MITENSION - capa de base de datos (IndexedDB via Dexie)
// + helpers globales (clasificacion OMS, formato de fechas)
// ============================================================

const db = new Dexie("mitension");

db.version(1).stores({
    tomas:                "++id, fecha, createdAt",
    entradas_medicacion:  "++id, fecha, createdAt"
});

// ============================================================
// HELPERS DE FECHA
// ============================================================

function hoyISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function ahoraHora() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mi}`;
}

/**
 * Convierte "YYYY-MM-DD" + "HH:MM" en un texto amigable:
 *   - Si la fecha es hoy:        "Hoy · 09:34"
 *   - Si es el mismo ano:        "30/05 · 22:15"
 *   - Si es otro ano:            "30/05/2025 · 09:00"
 */
function formatearFechaHoraToma(fechaISO, hora) {
    const hoy = hoyISO();
    if (fechaISO === hoy) return `Hoy · ${hora}`;

    const [y, m, d]    = fechaISO.split("-");
    const [yh, mh, dh] = hoy.split("-");
    if (y === yh) return `${d}/${m} · ${hora}`;
    return `${d}/${m}/${y} · ${hora}`;
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY" */
function formatearFecha(fechaISO) {
    const [y, m, d] = fechaISO.split("-");
    return `${d}/${m}/${y}`;
}

// ============================================================
// CLASIFICACION OMS
// ============================================================

/**
 * Devuelve "verde" | "amarillo" | "rojo".
 * Regla: el peor de los dos valores manda.
 *   Rojo:     sis >= 140 o dia >= 90
 *   Amarillo: sis 130-139 o dia 85-89
 *   Verde:    el resto
 */
function clasificarOMS(sistolica, diastolica) {
    const catSis =
        sistolica >= 140 ? "rojo" :
        sistolica >= 130 ? "amarillo" :
        "verde";
    const catDia =
        diastolica >= 90 ? "rojo" :
        diastolica >= 85 ? "amarillo" :
        "verde";

    const orden = { verde: 0, amarillo: 1, rojo: 2 };
    return orden[catSis] >= orden[catDia] ? catSis : catDia;
}

function etiquetaCategoria(cat) {
    if (cat === "rojo")     return "Hipertensión";
    if (cat === "amarillo") return "Tensión elevada";
    return "Tensión óptima";
}

// ============================================================
// CRUD: TOMAS DE TENSION
// ============================================================

async function addToma(sistolica, diastolica, pulso = null) {
    if (!Number.isInteger(sistolica) || sistolica < 0 || sistolica > 999) {
        throw new Error("sistolica debe ser un entero entre 0 y 999");
    }
    if (!Number.isInteger(diastolica) || diastolica < 0 || diastolica > 999) {
        throw new Error("diastolica debe ser un entero entre 0 y 999");
    }
    if (pulso !== null && !Number.isInteger(pulso)) {
        throw new Error("pulso debe ser entero o null");
    }

    return await db.tomas.add({
        fecha:      hoyISO(),
        hora:       ahoraHora(),
        sistolica:  sistolica,
        diastolica: diastolica,
        pulso:      pulso,
        createdAt:  new Date()
    });
}

async function listTomas() {
    return await db.tomas.orderBy("createdAt").reverse().toArray();
}

async function deleteToma(id) {
    return await db.tomas.delete(id);
}

// ============================================================
// CRUD: ENTRADAS DE MEDICACION
// ============================================================

async function addEntradaMedicacion(medicamentos, fecha = null) {
    if (!Array.isArray(medicamentos) || medicamentos.length < 1) {
        throw new Error("Se requiere al menos 1 medicamento.");
    }
    if (medicamentos.length > 5) {
        throw new Error("Maximo 5 medicamentos por entrada.");
    }

    for (const m of medicamentos) {
        if (!m.nombre || typeof m.nombre !== "string" || !m.nombre.trim()) {
            throw new Error("Cada medicamento debe tener nombre.");
        }
        m.momentos   = Array.isArray(m.momentos)   ? m.momentos   : [];
        m.principios = Array.isArray(m.principios) ? m.principios : [];
    }

    return await db.entradas_medicacion.add({
        fecha:        fecha || hoyISO(),
        medicamentos: medicamentos,
        createdAt:    new Date()
    });
}

async function listEntradasMedicacion() {
    return await db.entradas_medicacion.orderBy("fecha").reverse().toArray();
}

async function getEntradaMedicacionVigente(fechaObjetivo) {
    const candidatos = await db.entradas_medicacion
        .where("fecha")
        .belowOrEqual(fechaObjetivo)
        .toArray();

    if (candidatos.length === 0) return null;

    candidatos.sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
        return a.createdAt < b.createdAt ? 1 : -1;
    });
    return candidatos[0];
}

async function deleteEntradaMedicacion(id) {
    return await db.entradas_medicacion.delete(id);
}

// ============================================================
// EXPOSICION GLOBAL
// ============================================================
window.MITENSION = {
    db,
    addToma, listTomas, deleteToma,
    addEntradaMedicacion, listEntradasMedicacion,
    getEntradaMedicacionVigente, deleteEntradaMedicacion,
    hoyISO, ahoraHora, formatearFechaHoraToma, formatearFecha,
    clasificarOMS, etiquetaCategoria
};
