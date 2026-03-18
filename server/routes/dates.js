const express = require('express');
const db = require('../db');

const router = express.Router();

/** POST /api/dates/ensure - body: { dates: string[] } (YYYY-MM-DD). Crea filas A y C para cada fecha si no existen. */
router.post('/ensure', (req, res) => {
  try {
    const { dates } = req.body;
    const fechas = Array.isArray(dates) ? dates : [];
    const stmt = db.prepare('INSERT OR IGNORE INTO filas_fecha (fecha, tipo) VALUES (?, ?)');
    fechas.forEach(f => {
      stmt.run(f, 'A');
      stmt.run(f, 'C');
    });
    res.json({ success: true, count: fechas.length * 2 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
