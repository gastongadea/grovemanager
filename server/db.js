/**
 * SQLite database setup and helpers for Grovemgr backend.
 * Tablas: users, inscripciones, misa, cumpleanos, filas_fecha (para fechas A/C existentes).
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'grovemgr.db');
const db = new Database(dbPath);

db.exec(`
  -- Usuarios (iniciales), orden de columnas en la "planilla virtual"
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iniciales TEXT UNIQUE NOT NULL,
    orden INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Inscripciones: una por (fecha, comida, usuario)
  CREATE TABLE IF NOT EXISTS inscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    comida TEXT NOT NULL,
    iniciales TEXT NOT NULL,
    opcion TEXT NOT NULL DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(fecha, comida, iniciales)
  );

  -- Misa: un valor por fecha (S, N, A)
  CREATE TABLE IF NOT EXISTS misa (
    fecha TEXT PRIMARY KEY,
    valor TEXT NOT NULL DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Cumpleaños: iniciales + fecha de nacimiento (DD/MM/YYYY o similar)
  CREATE TABLE IF NOT EXISTS cumpleanos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iniciales TEXT NOT NULL,
    fecha_nacimiento TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(iniciales, fecha_nacimiento)
  );

  -- Filas de fecha+tipo (A/C) existentes (para compatibilidad con ensureDatesExist)
  CREATE TABLE IF NOT EXISTS filas_fecha (
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL,
    PRIMARY KEY (fecha, tipo)
  );

  CREATE INDEX IF NOT EXISTS idx_inscripciones_fecha ON inscripciones(fecha);
  CREATE INDEX IF NOT EXISTS idx_inscripciones_iniciales ON inscripciones(iniciales);
  CREATE INDEX IF NOT EXISTS idx_inscripciones_lookup ON inscripciones(fecha, comida, iniciales);
`);

module.exports = db;
