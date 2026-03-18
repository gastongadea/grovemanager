# Sincronización con la planilla – Análisis y opciones

## Problema actual

- **Delay**: Cada cambio que guardás dispara varias llamadas en secuencia:
  1. Por cada celda modificada se hace una **lectura completa** de la hoja (`getSheetData`) para ubicar fila/columna.
  2. Luego **una escritura** por celda (`updateCell`) a través de Google Apps Script.
- Ejemplo: 20 celdas cambiadas → muchas lecturas + 20 escrituras → varios segundos y riesgo de timeouts o errores de red.
- Si una llamada falla, el resto puede no ejecutarse y **datosOriginales** queda desincronizado (cambios “sin efecto” o mensajes de error).

---

## Opción A: Mejora sin backend (recomendada primero)

**Idea**: Una sola lectura de la hoja y **una sola escritura en lote** con todas las celdas a actualizar.

### Cambios realizados

1. **Frontend (App.js)**  
   - Al guardar, se arma la lista de inscripciones que cambiaron y se llama **una vez** a `saveInscripcionesBatch(inscripciones)` en lugar de llamar `saveInscripcion` por cada una.

2. **Servicio (googleSheetsService.js)**  
   - `saveInscripcionesBatch(inscripciones)`:
     - Asegura que existan las fechas necesarias (`ensureDatesExist`).
     - Hace **una** lectura de la hoja (`getSheetData`).
     - Calcula todos los rangos (fila/columna) y arma la lista `updates: [{ range, value }, ...]`.
     - Hace **una** llamada a Apps Script con la acción `updateCells`.
   - Así se pasa de “N lecturas + N escrituras” a “1 lectura + 1 escritura en lote”.

3. **Google Apps Script**  
   - Nueva acción `updateCells` que recibe `data.updates` (array de `{ range, value }`) y aplica todas las actualizaciones en un solo paso.  
   - Código agregado en `google-apps-script-cors-enabled.js` (ver ese archivo).

### Ventajas

- Menos delay y menos fallos por muchas llamadas.
- No hace falta servidor ni base de datos.
- La planilla sigue siendo la única fuente de verdad.

### Limitación

- Si la URL de la petición GET tiene un límite de tamaño, con muchos cambios en un mismo guardado podría llegarse al límite. En ese caso se puede dividir en 2–3 lotes (por ejemplo 15 celdas por lote) o usar POST si el script lo soporta.

---

## Opción B: Backend con base de datos intermedia

**Idea**: La app **solo** escribe en tu backend; el backend guarda en una base de datos y, en segundo plano, sincroniza con la planilla.

### Flujo

1. Usuario elige comidas y pulsa “Guardar”.
2. La app envía **un solo** POST al backend con todos los cambios (por ejemplo `POST /api/inscripciones` con `{ changes: [{ fecha, comida, iniciales, opcion }, ...] }`).
3. El backend escribe en la base de datos y responde de inmediato (200). La UI puede mostrar “Guardado” sin esperar a la planilla.
4. Un proceso en segundo plano (cron cada 1–2 minutos, o cola de jobs) lee de la base los registros aún no sincronizados y los escribe en Google Sheets (vía Apps Script o API de Sheets). Luego marca esos registros como “sincronizados”.

### Cambios de arquitectura

| Componente        | Hoy                         | Con backend                         |
|-------------------|-----------------------------|-------------------------------------|
| Frontend          | Escribe en Sheets vía script| Envía cambios al backend (REST)      |
| Nuevo backend     | —                           | API (Node/Express, etc.) + BD        |
| Base de datos     | —                           | SQLite, Postgres, etc.               |
| Planilla          | Fuente de verdad            | Sincronizada por un job desde la BD  |
| Lectura al cargar | Desde Sheets (o cache)      | Decisión: desde BD o desde Sheets    |

### Ventajas

- Respuesta rápida al usuario (no depende del tiempo de escritura en Sheets).
- Menos errores “en vivo”: si Sheets falla, el backend puede reintentar más tarde.
- Permite cola, reintentos y registro de errores de sincronización.

### Desventajas / coste

- Hay que **alojar y mantener** un servidor (y opcionalmente la BD).
- Diseño de la BD (tabla de inscripciones, estado de sincronización).
- Definir **qué es la fuente de verdad** para la lectura: solo la planilla, solo la BD, o BD con sincronización eventual a la planilla.
- Si dos usuarios guardan a la vez, hay que decidir política de concurrencia (última escritura gana, o merge por usuario/fecha/comida).

---

## Resumen

- **Corto plazo**: Usar la **Opción A** (guardado en lote ya implementado). Reduce delay y fallos sin cambiar infraestructura.
- **Si más adelante necesitás** respuesta instantánea y tolerancia a fallos de Sheets: plantear la **Opción B** (backend + BD + job de sincronización).
