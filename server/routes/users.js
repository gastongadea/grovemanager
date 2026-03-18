const express = require('express');
const db = require('../db');

const router = express.Router();

/** GET /api/users - Lista de iniciales (usuarios) */
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT iniciales FROM users ORDER BY orden ASC, iniciales ASC').all();
    const users = rows.map(r => r.iniciales);
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/users - Crear o actualizar usuarios (body: { users: string[] }) */
router.post('/', (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Se requiere users: string[]' });
    }
    const stmt = db.prepare(`
      INSERT INTO users (iniciales, orden) VALUES (?, ?)
      ON CONFLICT(iniciales) DO UPDATE SET orden = excluded.orden
    `);
    users.forEach((ini, i) => {
      if (ini && String(ini).trim()) stmt.run(String(ini).trim(), i);
    });
    res.json({ success: true, count: users.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
