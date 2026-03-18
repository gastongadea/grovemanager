const express = require('express');
const db = require('../db');

const router = express.Router();

/** GET /api/misa?dias=YYYY-MM-DD,YYYY-MM-DD,... - Valores de Misa por fechas */
router.get('/', async (req, res) => {
  try {
    const { dias } = req.query;
    const fechas = dias ? dias.split(',').map(d => d.trim()).filter(Boolean) : [];

    const result = {};
    if (fechas.length === 0) {
      return res.json(result);
    }

    const { rows } = await db.query(
      `SELECT fecha, valor FROM misa WHERE fecha = ANY($1::text[])`,
      [fechas]
    );

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
router.put('/', async (req, res) => {
  try {
    const { dia, valor } = req.body;
    if (!dia) return res.status(400).json({ error: 'Falta dia' });
    const v = (valor ?? '').toString().trim().toUpperCase();
    const final = ['S', 'N', 'A'].includes(v) ? v : '';

    await db.query(
      `
        INSERT INTO misa (fecha, valor, updated_at) VALUES ($1, $2, now())
        ON CONFLICT (fecha) DO UPDATE SET valor = EXCLUDED.valor, updated_at = now()
      `,
      [dia, final]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
