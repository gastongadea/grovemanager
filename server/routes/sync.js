const express = require('express');
const db = require('../db');

const router = express.Router();

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoDateLocal(date) {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysIso(iso, deltaDays) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return isoDateLocal(dt);
}

function parseSheetDateCell(dateString) {
  if (dateString == null) return null;
  const str = String(dateString).trim();
  if (!str) return null;

  // DD/M/YY o DD/MM/YYYY
  if (str.includes('/') && str.split('/').length === 3) {
    const parts = str.split('/');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${pad2(month)}-${pad2(day)}`;
  }

  // YYYY-MM-DD
  if (str.includes('-') && str.split('-').length === 3) return str;

  // Intento parsear Date
  const dt = new Date(str);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().split('T')[0];
}

function dateToSheetFormat(isoDate) {
  // match googleSheetsService: `${day}/${month}/${year.toString().slice(-2)}`
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d}/${m}/${String(y).slice(-2)}`;
}

function numberToColumnLetter(num) {
  // 1 -> A, 2 -> B, ...
  let result = '';
  let n = num;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

function normalizeInscripcionOption(val) {
  if (val == null) return '';
  const s = String(val).trim();
  if (!s) return '';
  const up = s.toUpperCase();
  if (up === 'NO') return 'N';
  // En la planilla puede venir numérico para Invitados/Plan: lo mantenemos como string.
  return s;
}

function normalizeMisa(val) {
  if (val == null) return '';
  const up = String(val).trim().toUpperCase();
  if (up === 'S' || up === 'N' || up === 'A') return up;
  return '';
}

function getProvidedSyncToken(req) {
  const auth = req.headers.authorization || '';
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }
  const headerToken = req.headers['x-sync-token'];
  if (headerToken) return String(headerToken).trim();
  return null;
}

function requireSyncAuth(req, res) {
  const expected = process.env.SYNC_TOKEN;
  if (!expected) {
    // Para desarrollo/local: si no se configuró token, no bloqueamos.
    // En producción, asegurate de setear SYNC_TOKEN.
    if (process.env.NODE_ENV !== 'production') return null;
    return res.status(500).json({ error: 'SYNC_TOKEN no configurado en el backend' });
  }
  const provided = getProvidedSyncToken(req);
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return null;
}

async function fetchSheetValues({ apiKey, sheetId, maxRows = 1000 }) {
  const timeoutMs = Number(process.env.SYNC_FETCH_TIMEOUT_MS || '15000');
  const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(t);
    }
  };

  // Primero intentar hoja "Data"
  const url1 = `${baseUrl}/${sheetId}/values/Data!A1:Z${maxRows}?key=${apiKey}`;
  let res = await fetchWithTimeout(url1).catch((e) => {
    throw new Error(`Timeout/Network error consultando Sheets API: ${e.message}`);
  });
  if (!res.ok) {
    // fallback: primera hoja o rango sin nombre
    const url2 = `${baseUrl}/${sheetId}/values/A1:Z${maxRows}?key=${apiKey}`;
    res = await fetchWithTimeout(url2).catch((e) => {
      throw new Error(`Timeout/Network error (fallback) consultando Sheets API: ${e.message}`);
    });
  }
  const json = await res.json();
  return json.values || [];
}

async function callAppsScriptAction({ appsScriptUrl, sheetId, action, data }) {
  const timeoutMs = Number(process.env.SYNC_FETCH_TIMEOUT_MS || '15000');
  const params = new URLSearchParams({
    action,
    sheetId,
    data: JSON.stringify(data || {}),
  });
  const url = `${appsScriptUrl}?${params.toString()}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (e) {
    throw new Error(`Timeout/Network error llamando Apps Script: ${e.message}`);
  } finally {
    clearTimeout(t);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      status: res.status,
      error: text || `Respuesta no-JSON (HTTP ${res.status})`,
    };
  }
}

function buildUserColumnMap(headerRow) {
  // Col 0=A(reservada), 1=Fecha, 2=Comida, 3+=usuarios
  // Misa está en columna Z (index 25 => letra Z), por lo que usuario máximo queda antes.
  const userColumns = {};
  const maxCol = Math.max(headerRow.length, 26);
  for (let col = 3; col < Math.min(maxCol, headerRow.length); col++) {
    const cell = headerRow[col];
    const inicial = cell ? String(cell).trim() : '';
    if (!inicial) continue;
    userColumns[inicial.toUpperCase()] = {
      colIndex: col,
      letter: numberToColumnLetter(col + 1),
    };
  }
  return userColumns;
}

function buildRowMap(sheetData, targetDatesSet) {
  const rowMap = {};
  for (let r = 1; r < sheetData.length; r++) {
    const row = sheetData[r];
    if (!row || row.length < 3) continue;
    const fechaISO = parseSheetDateCell(row[1]);
    if (!fechaISO || !targetDatesSet.has(fechaISO)) continue;
    const tipo = row[2] ? String(row[2]).trim().toUpperCase() : '';
    if (tipo !== 'A' && tipo !== 'C') continue;
    rowMap[`${fechaISO}|${tipo}`] = {
      sheetRowNumber: r + 1, // A1 indexing
      rowData: row,
    };
  }
  return rowMap;
}

router.post('/to-sheet', async (req, res) => {
  const authError = requireSyncAuth(req, res);
  if (authError) return;

  try {
    const days = Number(req.body?.days || 30);
    if (!Number.isFinite(days) || days <= 0) {
      return res.status(400).json({ error: 'days inválido' });
    }

    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    const sheetId = process.env.REACT_APP_GOOGLE_SHEET_ID;
    const appsScriptUrl = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL;
    if (!apiKey || !sheetId || !appsScriptUrl) {
      return res.status(500).json({ error: 'Faltan variables Google Sheets/APPS en el backend' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startIso = isoDateLocal(today);
    const endIso = addDaysIso(startIso, days - 1);
    const targetDates = new Set();
    for (let i = 0; i < days; i++) targetDates.add(addDaysIso(startIso, i));

    const syncRes = await db.query('SELECT last_sheet_push_at FROM sync_state WHERE id = 1');
    const lastPushAt = syncRes.rows[0]?.last_sheet_push_at || new Date(0);

    const changedInsRes = await db.query(
      `
        SELECT fecha, comida, iniciales, opcion, updated_at
        FROM inscripciones
        WHERE fecha >= $1 AND fecha <= $2
          AND updated_at > $3
      `,
      [startIso, endIso, lastPushAt]
    );
    const changedMisaRes = await db.query(
      `
        SELECT fecha, valor, updated_at
        FROM misa
        WHERE fecha >= $1 AND fecha <= $2
          AND updated_at > $3
      `,
      [startIso, endIso, lastPushAt]
    );

    if (changedInsRes.rows.length === 0 && changedMisaRes.rows.length === 0) {
      return res.json({ success: true, pushed: 0, message: 'Nada cambió para empujar' });
    }

    // Leer planilla (para ubicar filas/columnas)
    let sheetData = await fetchSheetValues({ apiKey, sheetId });
    const headerRow = sheetData[0] || [];
    const userColumns = buildUserColumnMap(headerRow);
    const maxCol = Math.max(headerRow.length, 26);

    let rowMap = buildRowMap(sheetData, targetDates);

    // Asegurar existencia de filas fecha+tipo
    const missingKeys = new Set();
    for (const ins of changedInsRes.rows) {
      const key = `${ins.fecha}|${ins.comida}`;
      if (!rowMap[key]) missingKeys.add(key);
    }
    // Misa vive en fila de tipo A
    for (const m of changedMisaRes.rows) {
      const key = `${m.fecha}|A`;
      if (!rowMap[key]) missingKeys.add(key);
    }

    if (missingKeys.size > 0) {
      const createTargets = [...missingKeys].map(k => {
        const [fecha, tipo] = k.split('|');
        return { fecha, tipo };
      });

      // Crear fila por fila (si falta)
      for (const t of createTargets) {
        const dateFormatted = dateToSheetFormat(t.fecha);
        const rowData = ['', dateFormatted, t.tipo];
        // rellenar desde col 3 (D) hasta maxCol
        const blanksToAdd = Math.max(0, maxCol - 3);
        for (let i = 0; i < blanksToAdd; i++) rowData.push('');

        await callAppsScriptAction({
          appsScriptUrl,
          sheetId,
          action: 'createRow',
          data: { sheetName: 'Data', rowData },
        });
      }

      // Refetch para recomputar rowMap
      sheetData = await fetchSheetValues({ apiKey, sheetId });
      rowMap = buildRowMap(sheetData, targetDates);
    }

    const updates = [];
    const errors = [];

    // Inscripciones
    for (const ins of changedInsRes.rows) {
      const inicialUpper = String(ins.iniciales).trim().toUpperCase();
      const userCol = userColumns[inicialUpper];
      const rowKey = `${ins.fecha}|${ins.comida}`;
      const rowInfo = rowMap[rowKey];
      if (!userCol) {
        errors.push(`Usuario no encontrado en header: ${ins.iniciales}`);
        continue;
      }
      if (!rowInfo) {
        errors.push(`Fila no encontrada para ${ins.fecha} tipo ${ins.comida}`);
        continue;
      }
      const range = `${userCol.letter}${rowInfo.sheetRowNumber}`;
      updates.push({ range, value: ins.opcion ?? '' });
    }

    // Misa (columna Z en fila de almuerzo A)
    const misaColumnLetter = numberToColumnLetter(26); // Z
    for (const m of changedMisaRes.rows) {
      const rowKey = `${m.fecha}|A`;
      const rowInfo = rowMap[rowKey];
      if (!rowInfo) continue;
      const range = `${misaColumnLetter}${rowInfo.sheetRowNumber}`;
      updates.push({ range, value: normalizeMisa(m.valor) });
    }

    if (updates.length === 0) {
      return res.json({ success: true, pushed: 0, errors });
    }

    const writeRes = await callAppsScriptAction({
      appsScriptUrl,
      sheetId,
      action: 'updateCells',
      data: { sheetName: 'Data', updates },
    });

    // Registrar push time
    await db.query('UPDATE sync_state SET last_sheet_push_at = now() WHERE id = 1');

    return res.json({ success: true, pushed: updates.length, errors, writeRes });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/from-sheet', async (req, res) => {
  const authError = requireSyncAuth(req, res);
  if (authError) return;

  try {
    const days = Number(req.body?.days || 30);
    if (!Number.isFinite(days) || days <= 0) {
      return res.status(400).json({ error: 'days inválido' });
    }

    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    const sheetId = process.env.REACT_APP_GOOGLE_SHEET_ID;
    if (!apiKey || !sheetId) {
      return res.status(500).json({ error: 'Faltan variables REACT_APP_GOOGLE_API_KEY / REACT_APP_GOOGLE_SHEET_ID' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startIso = isoDateLocal(today);
    const endIso = addDaysIso(startIso, days - 1);
    const targetDates = new Set();
    for (let i = 0; i < days; i++) targetDates.add(addDaysIso(startIso, i));

    const syncRes = await db.query('SELECT last_sheet_push_at FROM sync_state WHERE id = 1');
    const lastPushAt = syncRes.rows[0]?.last_sheet_push_at || new Date(0);

    // Traer estado actual en BD
    const existingInsRes = await db.query(
      `
        SELECT fecha, comida, iniciales, opcion, updated_at
        FROM inscripciones
        WHERE fecha >= $1 AND fecha <= $2
      `,
      [startIso, endIso]
    );
    const existingInsMap = {};
    existingInsRes.rows.forEach(r => {
      const key = `${r.fecha}|${r.comida}|${String(r.iniciales).trim().toUpperCase()}`;
      existingInsMap[key] = r;
    });

    const existingMisaRes = await db.query(
      `
        SELECT fecha, valor, updated_at
        FROM misa
        WHERE fecha >= $1 AND fecha <= $2
      `,
      [startIso, endIso]
    );
    const existingMisaMap = {};
    existingMisaRes.rows.forEach(r => {
      existingMisaMap[r.fecha] = r;
    });

    // Leer planilla (Sheets API)
    const sheetData = await fetchSheetValues({ apiKey, sheetId });
    const headerRow = sheetData[0] || [];
    const maxCol = Math.max(headerRow.length, 26);

    // Construir lista de usuarios desde header
    const userInitsByCol = {};
    for (let col = 3; col < Math.min(maxCol, headerRow.length); col++) {
      const cell = headerRow[col];
      const ini = cell ? String(cell).trim() : '';
      if (!ini) continue;
      userInitsByCol[col] = ini.toUpperCase();
    }

    const updatesIns = [];
    const updatesMisa = [];

    for (let r = 1; r < sheetData.length; r++) {
      const row = sheetData[r];
      if (!row || row.length < 3) continue;
      const fechaISO = parseSheetDateCell(row[1]);
      if (!fechaISO || !targetDates.has(fechaISO)) continue;
      const tipo = row[2] ? String(row[2]).trim().toUpperCase() : '';
      if (tipo !== 'A' && tipo !== 'C') continue;

      for (let col = 3; col < Math.min(maxCol, headerRow.length); col++) {
        const iniUpper = userInitsByCol[col];
        if (!iniUpper) continue;
        const raw = row[col] ?? '';
        const sheetVal = normalizeInscripcionOption(raw);

        const key = `${fechaISO}|${tipo}|${iniUpper}`;
        const bd = existingInsMap[key];
        if (bd && bd.updated_at && bd.updated_at > lastPushAt) {
          // app gana si fue más reciente que el último push al sheet
          continue;
        }

        if (!bd) {
          // Si BD no tiene registro, no creamos entradas vacías.
          if (sheetVal === '') continue;
          updatesIns.push({ fecha: fechaISO, comida: tipo, iniciales: iniUpper, opcion: sheetVal });
        } else {
          const bdVal = normalizeInscripcionOption(bd.opcion);
          if (bdVal === sheetVal) continue;
          updatesIns.push({ fecha: fechaISO, comida: tipo, iniciales: iniUpper, opcion: sheetVal });
        }
      }

      // Misa (solo en tipo A)
      if (tipo === 'A') {
        const misaRaw = row[25] ?? '';
        const misaVal = normalizeMisa(misaRaw);
        const bdMisa = existingMisaMap[fechaISO];

        if (bdMisa && bdMisa.updated_at && bdMisa.updated_at > lastPushAt) {
          continue;
        }

        if (!bdMisa) {
          if (misaVal === '') continue;
          updatesMisa.push({ fecha: fechaISO, valor: misaVal });
        } else {
          const bdVal = normalizeMisa(bdMisa.valor);
          if (bdVal === misaVal) continue;
          updatesMisa.push({ fecha: fechaISO, valor: misaVal });
        }
      }
    }

    // Persistir cambios
    for (const u of updatesIns) {
      await db.query(
        `
          INSERT INTO inscripciones (fecha, comida, iniciales, opcion)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (fecha, comida, iniciales)
          DO UPDATE SET opcion = EXCLUDED.opcion, updated_at = now()
        `,
        [u.fecha, u.comida, u.iniciales, u.opcion]
      );
    }

    for (const m of updatesMisa) {
      await db.query(
        `
          INSERT INTO misa (fecha, valor)
          VALUES ($1, $2)
          ON CONFLICT (fecha)
          DO UPDATE SET valor = EXCLUDED.valor, updated_at = now()
        `,
        [m.fecha, m.valor]
      );
    }

    await db.query('UPDATE sync_state SET last_sheet_pull_at = now() WHERE id = 1');

    return res.json({
      success: true,
      updatedInscripciones: updatesIns.length,
      updatedMisa: updatesMisa.length,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

