async function migrate(db) {
  // Esquema compatible con el backend actual (antes SQLite)
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      iniciales TEXT UNIQUE NOT NULL,
      orden INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS inscripciones (
      id SERIAL PRIMARY KEY,
      fecha TEXT NOT NULL,
      comida TEXT NOT NULL,
      iniciales TEXT NOT NULL,
      opcion TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (fecha, comida, iniciales)
    );

    CREATE TABLE IF NOT EXISTS misa (
      fecha TEXT PRIMARY KEY,
      valor TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cumpleanos (
      id SERIAL PRIMARY KEY,
      iniciales TEXT NOT NULL,
      fecha_nacimiento TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (iniciales, fecha_nacimiento)
    );

    CREATE TABLE IF NOT EXISTS filas_fecha (
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL,
      PRIMARY KEY (fecha, tipo)
    );

    CREATE INDEX IF NOT EXISTS idx_inscripciones_fecha ON inscripciones(fecha);
    CREATE INDEX IF NOT EXISTS idx_inscripciones_iniciales ON inscripciones(iniciales);
    CREATE INDEX IF NOT EXISTS idx_inscripciones_lookup ON inscripciones(fecha, comida, iniciales);

    -- Estado de sincronización (para resolver "última escritura")
    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY,
      last_sheet_push_at TIMESTAMPTZ,
      last_sheet_pull_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_sync_state_updated_at ON sync_state(updated_at);
  `);
}

module.exports = { migrate };

