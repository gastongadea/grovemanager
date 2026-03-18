const express = require('express');
const db = require('../db');

const router = express.Router();

/** POST /api/dates/ensure - body: { dates: string[] } (YYYY-MM-DD). Crea filas A y C para cada fecha si no existen. */
router.post('/ensure', async (req, res) => {
  try {
    const { dates } = req.body;
    const fechas = Array.isArray(dates) ? dates : [];
    let count = 0;
    for (const f of fechas) {
      await db.query(
        `INSERT INTO filas_fecha (fecha, tipo) VALUES ($1, $2)
         ON CONFLICT (fecha, tipo) DO NOTHING`,
        [f, 'A']
      );
      await db.query(
        `INSERT INTO filas_fecha (fecha, tipo) VALUES ($1, $2)
         ON CONFLICT (fecha, tipo) DO NOTHING`,
        [f, 'C']
      );
      count += 2;
    }
    res.json({ success: true, count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
