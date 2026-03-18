const express = require('express');
const db = require('../db');

const router = express.Router();

function parseCumpleanosDate(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    if (isNaN(d.getTime())) return null;
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }
  const s = String(val).trim();
  const slash = s.split('/');
  if (slash.length >= 2) {
    const day = parseInt(slash[0], 10);
    const month = parseInt(slash[1], 10);
    let year = slash.length >= 3 ? parseInt(slash[2], 10) : null;
    if (year != null && year < 100) year = year >= 50 ? 1900 + year : 2000 + year;
    if (!isNaN(day) && !isNaN(month) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { day, month, year };
    }
  }
  const dash = s.split('-');
  if (dash.length >= 2) {
    const day = parseInt(dash[0], 10);
    const month = parseInt(dash[1], 10);
    let year = dash.length >= 3 ? parseInt(dash[2], 10) : null;
    if (year != null && year < 100) year = year >= 50 ? 1900 + year : 2000 + year;
    if (!isNaN(day) && !isNaN(month) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { day, month, year };
    }
  }
  return null;
}

/** GET /api/cumpleanos?dias=30 - Próximos cumpleaños en N días. Devuelve [{ inicial, fechaDisplay, edad }, ...] */
router.get('/', (req, res) => {
  try {
    const dias = parseInt(req.query.dias, 10) || 30;
    const rows = db.prepare('SELECT iniciales, fecha_nacimiento FROM cumpleanos').all();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() + dias);
    const year = hoy.getFullYear();
    const resultados = [];

    for (const r of rows) {
      const inicial = (r.iniciales || '').trim();
      const parsed = parseCumpleanosDate(r.fecha_nacimiento);
      if (!inicial || !parsed) continue;

      let d = new Date(year, parsed.month - 1, parsed.day);
      if (d.getDate() !== parsed.day) d = new Date(year, parsed.month - 1, Math.min(parsed.day, 28));
      if (d < hoy) {
        d = new Date(year + 1, parsed.month - 1, parsed.day);
        if (d.getDate() !== parsed.day) d = new Date(year + 1, parsed.month - 1, Math.min(parsed.day, 28));
      }
      if (d >= hoy && d <= fin) {
        const fechaDisplay = `${String(parsed.day).padStart(2, '0')}/${parsed.month}`;
        const edad = parsed.year != null ? (d.getFullYear() - parsed.year) : null;
        resultados.push({ inicial, fechaDisplay, edad, date: d.getTime() });
      }
    }

    resultados.sort((a, b) => a.date - b.date);
    res.json(resultados.map(({ inicial, fechaDisplay, edad }) => ({ inicial, fechaDisplay, edad })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/cumpleanos - body: { cumpleanos: [{ iniciales, fecha_nacimiento }, ...] } */
router.post('/', (req, res) => {
  try {
    const { cumpleanos } = req.body;
    if (!Array.isArray(cumpleanos)) return res.status(400).json({ error: 'Se requiere cumpleanos: array' });
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO cumpleanos (iniciales, fecha_nacimiento) VALUES (?, ?)
    `);
    cumpleanos.forEach(c => {
      if (c.iniciales && c.fecha_nacimiento) stmt.run(c.iniciales.trim(), String(c.fecha_nacimiento).trim());
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
