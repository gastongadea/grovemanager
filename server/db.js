/**
 * Postgres connection (pool) for Grovemgr backend.
 *
 * Requiere:
 * - DATABASE_URL=postgresql://user:pass@host:port/db
 *
 * Nota: la creación de tablas/índices vive en `server/migrate.js`.
 */
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  // Mantener el error temprano para evitar arrancar “a medias”
  throw new Error('Falta DATABASE_URL (Postgres).');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // útil en entornos tipo Render/Neon; en local suele ser false
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
});

module.exports = pool;
