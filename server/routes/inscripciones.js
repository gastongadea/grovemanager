const express = require('express');
const db = require('../db');

const router = express.Router();

/** GET /api/inscripciones?iniciales=XX&start=YYYY-MM-DD&end=YYYY-MM-DD
 *  Devuelve { [fecha]: { Almuerzo: string, Cena: string } }
 */
router.get('/', (req, res) => {
  try {
    const { iniciales, start, end } = req.query;
    if (!iniciales) {
      return res.status(400).json({ error: 'Falta iniciales' });
    }
    const startDate = start || '2000-01-01';
    const endDate = end || '2100-12-31';

    const rows = db.prepare(`
      SELECT fecha, comida, opcion
      FROM inscripciones
      WHERE iniciales = ? AND fecha >= ? AND fecha <= ?
    `).all(iniciales.trim(), startDate, endDate);

    const byDate = {};
    rows.forEach(r => {
      if (!byDate[r.fecha]) byDate[r.fecha] = { Almuerzo: '', Cena: '' };
      const key = r.comida === 'A' ? 'Almuerzo' : 'Cena';
      byDate[r.fecha][key] = r.opcion || '';
    });

    res.json(byDate);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/inscripciones - Lote de cambios
 *  body: { changes: [{ fecha, comida, iniciales, opcion }, ...], ensureDates?: string[] }
 *  comida: "Almuerzo" | "Cena" (se guarda como A/C)
 */
router.post('/', (req, res) => {
  try {
    const { changes = [], ensureDates } = req.body;

    if (ensureDates && Array.isArray(ensureDates)) {
      const insertRow = db.prepare(`
        INSERT OR IGNORE INTO filas_fecha (fecha, tipo) VALUES (?, ?)
      `);
      ensureDates.forEach(fecha => {
        insertRow.run(fecha, 'A');
        insertRow.run(fecha, 'C');
      });
    }

    const upsert = db.prepare(`
      INSERT INTO inscripciones (fecha, comida, iniciales, opcion, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(fecha, comida, iniciales) DO UPDATE SET opcion = excluded.opcion, updated_at = datetime('now')
    `);

    const errors = [];
    let count = 0;
    for (const c of changes) {
      const fecha = c.fecha;
      const comida = c.comida === 'Cena' ? 'C' : 'A';
      const iniciales = (c.iniciales || '').trim();
      const opcion = (c.opcion ?? '').toString().trim();
      if (!fecha || !iniciales) {
        errors.push(`Falta fecha o iniciales: ${JSON.stringify(c)}`);
        continue;
      }
      try {
        upsert.run(fecha, comida, iniciales, opcion);
        count++;
      } catch (err) {
        errors.push(`${fecha} ${c.comida} ${iniciales}: ${err.message}`);
      }
    }

    res.json({ success: errors.length === 0, count, errors });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
