const express = require('express');
const db = require('../db');

const router = express.Router();

/** GET /api/misa?dias=YYYY-MM-DD,YYYY-MM-DD,... - Valores de Misa por fechas */
router.get('/', (req, res) => {
  try {
    const { dias } = req.query;
    const fechas = dias ? dias.split(',').map(d => d.trim()).filter(Boolean) : [];

    const result = {};
    if (fechas.length === 0) {
      return res.json(result);
    }

    const placeholders = fechas.map(() => '?').join(',');
    const rows = db.prepare(
      `SELECT fecha, valor FROM misa WHERE fecha IN (${placeholders})`
    ).all(...fechas);

    fechas.forEach(f => { result[f] = ''; });
    rows.forEach(r => {
      const v = (r.valor || '').trim().toUpperCase();
      result[r.fecha] = ['S', 'N', 'A'].includes(v) ? v : '';
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** PUT /api/misa - body: { dia, valor } */
router.put('/', (req, res) => {
  try {
    const { dia, valor } = req.body;
    if (!dia) return res.status(400).json({ error: 'Falta dia' });
    const v = (valor ?? '').toString().trim().toUpperCase();
    const final = ['S', 'N', 'A'].includes(v) ? v : '';

    db.prepare(`
      INSERT INTO misa (fecha, valor, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(fecha) DO UPDATE SET valor = excluded.valor, updated_at = datetime('now')
    `).run(dia, final);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
