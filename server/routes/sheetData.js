/**
 * Devuelve datos en formato "planilla" (array de filas) para compatibilidad con getSheetData.
 * Fila 0: [reservada, 'Fecha', 'Comida', ...usuarios]
 * Filas siguientes: [reservada, DD/M/YY, A|C, ...valores por usuario]
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

function dateToSheetFormat(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d}/${m}/${y.toString().slice(-2)}`;
}

/** GET /api/sheet-data?start=YYYY-MM-DD&end=YYYY-MM-DD
 *  Sin query: todas las filas hasta 1000. Con start/end: filtrar por rango.
 */
router.get('/', (req, res) => {
  try {
    const users = db.prepare('SELECT iniciales FROM users ORDER BY orden ASC, iniciales ASC').all();
    const headers = ['', 'Fecha', 'Comida', ...users.map(u => u.iniciales)];

    const { start, end } = req.query;
    let fechas;
    if (start && end) {
      const rows = db.prepare(`
        SELECT DISTINCT fecha FROM filas_fecha WHERE fecha >= ? AND fecha <= ?
        UNION
        SELECT DISTINCT fecha FROM inscripciones WHERE fecha >= ? AND fecha <= ?
        ORDER BY fecha
      `).all(start, end, start, end);
      fechas = [...new Set(rows.map(r => r.fecha))].sort();
    } else {
      const rows = db.prepare(`
        SELECT DISTINCT fecha FROM filas_fecha
        UNION
        SELECT DISTINCT fecha FROM inscripciones
        ORDER BY fecha
        LIMIT 500
      `).all();
      fechas = rows.map(r => r.fecha);
    }

    const inscripcionesByKey = {};
    const inscRows = db.prepare(`
      SELECT fecha, comida, iniciales, opcion FROM inscripciones
      WHERE fecha >= ? AND fecha <= ?
    `).all(fechas[0] || '2000-01-01', fechas[fechas.length - 1] || '2100-12-31');
    inscRows.forEach(r => {
      const key = `${r.fecha}|${r.comida}|${r.iniciales}`;
      inscripcionesByKey[key] = r.opcion;
    });

    const userIndex = {};
    users.forEach((u, i) => { userIndex[u.iniciales] = i; });

    const misaByFecha = {};
    if (fechas.length) {
      const placeholders = fechas.map(() => '?').join(',');
      db.prepare(`SELECT fecha, valor FROM misa WHERE fecha IN (${placeholders})`).all(...fechas).forEach(r => {
        misaByFecha[r.fecha] = r.valor;
      });
    }

    const sheetData = [headers];
    const colMisa = headers.length; // columna extra para Misa (como en Sheets índice 25 si hay muchas columnas)
    const maxCol = Math.max(headers.length, 26);

    for (const fecha of fechas) {
      for (const tipo of ['A', 'C']) {
        const row = new Array(maxCol).fill('');
        row[0] = '';
        row[1] = dateToSheetFormat(fecha);
        row[2] = tipo;
        users.forEach((u, i) => {
          const key = `${fecha}|${tipo}|${u.iniciales}`;
          row[3 + i] = inscripcionesByKey[key] ?? '';
        });
        if (tipo === 'A') row[25] = misaByFecha[fecha] ?? '';
        sheetData.push(row);
      }
    }

    res.json(sheetData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
