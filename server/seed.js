async function seedDefaultUsers(db) {
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM users');
  const n = rows[0]?.n || 0;
  if (n > 0) return;

  const defaultUsers = [
    'MEP', 'GG', 'IJC', 'MMR', 'LMC', 'PAB', 'JBA', 'IC', 'ELF', 'FIG', 'AS', 'FAM', 'JOA', 'FMA', 'JPS', 'FEC', 'TA', 'GGP', 'H1', 'H2', 'Invitados', 'Plan'
  ];

  for (let i = 0; i < defaultUsers.length; i++) {
    const ini = defaultUsers[i];
    await db.query(
      `INSERT INTO users (iniciales, orden) VALUES ($1, $2)
       ON CONFLICT (iniciales) DO NOTHING`,
      [ini, i]
    );
  }
  console.log('Usuarios por defecto insertados:', defaultUsers.length);
}

async function seedSyncState(db) {
  // Inicializa marcas si la tabla acaba de crearse
  await db.query(
    `
      INSERT INTO sync_state (id, last_sheet_push_at, last_sheet_pull_at)
      VALUES (1, to_timestamp(0), to_timestamp(0))
      ON CONFLICT (id) DO NOTHING
    `
  );
}

module.exports = { seedDefaultUsers, seedSyncState };

