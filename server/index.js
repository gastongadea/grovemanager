const express = require('express');
const cors = require('cors');
const db = require('./db');
const usersRouter = require('./routes/users');
const inscripcionesRouter = require('./routes/inscripciones');
const misaRouter = require('./routes/misa');
const cumpleanosRouter = require('./routes/cumpleanos');
const sheetDataRouter = require('./routes/sheetData');
const datesRouter = require('./routes/dates');

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

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Seed inicial: si no hay usuarios, crear lista por defecto (opcional)
const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get();
if (userCount.n === 0) {
  const defaultUsers = [
    'MEP', 'GG', 'IJC', 'MMR', 'LMC', 'PAB', 'JBA', 'IC', 'ELF', 'FIG', 'AS', 'FAM', 'JOA', 'FMA', 'JPS', 'FEC', 'TA', 'GGP', 'H1', 'H2', 'Invitados', 'Plan'
  ];
  const stmt = db.prepare('INSERT INTO users (iniciales, orden) VALUES (?, ?)');
  defaultUsers.forEach((ini, i) => stmt.run(ini, i));
  console.log('Usuarios por defecto insertados:', defaultUsers.length);
}

app.listen(PORT, () => {
  console.log(`Backend Grovemgr escuchando en http://localhost:${PORT}`);
});
