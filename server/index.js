require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');
const usersRouter = require('./routes/users');
const inscripcionesRouter = require('./routes/inscripciones');
const misaRouter = require('./routes/misa');
const cumpleanosRouter = require('./routes/cumpleanos');
const sheetDataRouter = require('./routes/sheetData');
const datesRouter = require('./routes/dates');
const { migrate } = require('./migrate');
const { seedDefaultUsers, seedSyncState } = require('./seed');
const syncRouter = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/inscripciones', inscripcionesRouter);
app.use('/api/misa', misaRouter);
app.use('/api/cumpleanos', cumpleanosRouter);
app.use('/api/sheet-data', sheetDataRouter);
app.use('/api/dates', datesRouter);
app.use('/api/sync', syncRouter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

async function start() {
  await migrate(db);
  await seedDefaultUsers(db);
  await seedSyncState(db);

  app.listen(PORT, () => {
    console.log(`Backend Grovemgr escuchando en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Error iniciando backend:', err);
  process.exit(1);
});
