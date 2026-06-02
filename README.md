# MITENSION

Aplicacion personal para registrar tension arterial y medicacion. Funciona offline, los datos viven en el propio movil.

## Stack

- HTML + CSS + JavaScript (vanilla)
- PWA instalable en Android / iOS / escritorio
- Base de datos local: IndexedDB (via Dexie.js) — desde Fase 2
- PDF: pdfmake — desde Fase 6
- Sin backend, sin servidor en produccion

## Como arrancar en local (durante el desarrollo)

1. Abrir esta carpeta en VS Code.
2. Tener instalada la extension **Live Server** de Ritwick Dey.
3. Hacer clic derecho sobre `index.html` -> **Open with Live Server**.
4. El navegador abre `http://127.0.0.1:5500/index.html`.

## Como probar la base de datos (Fase 2)

Con la app abierta en Live Server, pulsa **F12** para abrir las DevTools del navegador y ve a la pestana **Console**. Prueba estos comandos:

```js
// Anadir una toma de tension
await MITENSION.addToma(125, 80, 72);

// Anadir otra (sin pulso)
await MITENSION.addToma(140, 90);

// Listar todas las tomas
await MITENSION.listTomas();

// Anadir una entrada de medicacion con 2 medicamentos
await MITENSION.addEntradaMedicacion([
    {
        nombre: "Losartan",
        momentos: ["manana"],
        principios: [{ nombre: "losartan", mg: 100 }]
    },
    {
        nombre: "Balzak",
        momentos: ["manana", "noche"],
        principios: [
            { nombre: "amlodipino", mg: 25 },
            { nombre: "valsartan",  mg: 150 }
        ]
    }
]);

// Listar entradas de medicacion
await MITENSION.listEntradasMedicacion();

// Que medicacion estaba vigente en una fecha dada
await MITENSION.getEntradaMedicacionVigente("2026-06-01");
```

Los datos persisten entre recargas. Para verlos en bruto: DevTools -> pestana **Application** -> **IndexedDB** -> **mitension**.

## Estado actual

### v1.0
- [x] Fase 1 — Estructura inicial del proyecto
- [x] Fase 2 — Base de datos local (Dexie)
- [x] Fase 3 — Pantalla "Nueva toma de tension" (ahora como modal)
- [x] Iteracion A — Pantalla principal con lista + medicacion actual + 3 botones
- [x] Fase 5 (parcial) — Modal "Actualizar medicacion"
- [x] Iteracion B / Fase 6 — Pantalla de Informes (PDF ultimas 30 / 60)
- [x] Fase 7 — PWA instalable + offline real
- [x] Fase 8 — Pulido visual y pruebas finales

### v1.1
- [x] Editar y borrar tomas de tension desde el listado (tap en una toma)
- [x] Historial de medicacion: ver entradas pasadas, editar y borrar (tap en el bloque "Medicacion actual")
- [x] Reordenacion del listado de tomas por fecha+hora visible

## Tips de desarrollo con el Service Worker

Una vez registrado el Service Worker, el navegador sirve los archivos cacheados
y NO los recoge de Live Server aunque los modifiques. Para ver tus cambios:

1. **Hard reload**: `Ctrl + Shift + R` (Windows) — recarga sin cache.
2. **Bypass total**: DevTools (F12) -> pestana **Application** -> **Service Workers**
   -> marca **"Bypass for network"**. Ideal mientras desarrollas.
3. **Desregistrar**: en esa misma pantalla, boton **Unregister**.

Cuando subas una version nueva en produccion, basta con cambiar `CACHE_NAME`
dentro de `service-worker.js` (ej. `mitension-v2`) — el SW limpia el cache viejo
en su `activate`.
