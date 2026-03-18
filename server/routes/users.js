const express = require('express');
const db = require('../db');

const router = express.Router();

/** GET /api/users - Lista de iniciales (usuarios) */
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT iniciales FROM users ORDER BY orden ASC, iniciales ASC');
    res.json(rows.map(r => r.iniciales));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/users - Crear o actualizar usuarios (body: { users: string[] }) */
router.post('/', async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Se requiere users: string[]' });
    }
    for (let i = 0; i < users.length; i++) {
      const ini = users[i];
      if (!ini || !String(ini).trim()) continue;
      await db.query(
        `INSERT INTO users (iniciales, orden) VALUES ($1, $2)
         ON CONFLICT (iniciales) DO UPDATE SET orden = EXCLUDED.orden`,
        [String(ini).trim(), i]
      );
    }
    res.json({ success: true, count: users.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
