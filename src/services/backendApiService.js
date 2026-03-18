/**
 * Servicio que replica la interfaz de googleSheetsService pero usa el backend (API + BD)
 * en lugar de Google Sheets. Se usa cuando REACT_APP_API_URL está definido.
 */
import envLoader from '../config/envLoader';

class BackendApiService {
  constructor() {
    this.baseUrl = envLoader.getEnvVar('REACT_APP_API_URL') || process.env.REACT_APP_API_URL || '';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000;
    this.lastError = null;
    this.connectionStatus = 'unknown';
    this.maxRows = 1000;
  }

  isConfigured() {
    const ok = !!this.baseUrl;
    return { read: ok, write: ok };
  }

  async _fetch(path, options = {}) {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text}`);
    }
    return res.json();
  }

  async testConnection() {
    try {
      const data = await this._fetch('/api/health');
      this.connectionStatus = 'connected';
      this.lastError = null;
      return { connected: true, ...data };
    } catch (error) {
      this.connectionStatus = 'error';
      this.lastError = error.message;
      throw error;
    }
  }

  async testGoogleAppsScript() {
    return this.testConnection();
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      lastError: this.lastError,
      configured: this.isConfigured(),
    };
  }

  clearCache() {
    this.cache.clear();
  }

  static COL_MISA = 25;

  async getUsers() {
    try {
      const list = await this._fetch('/api/users');
      return Array.isArray(list) ? list : [];
    } catch (error) {
      this.connectionStatus = 'error';
      this.lastError = error.message;
      console.error('Error al obtener usuarios:', error);
      return [];
    }
  }

  async getSheetData(forceRefresh = false) {
    try {
      const cacheKey = 'sheetData';
      const cached = this.cache.get(cacheKey);
      if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      const data = await this._fetch('/api/sheet-data');
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      this.connectionStatus = 'connected';
      this.lastError = null;
      return data;
    } catch (error) {
      this.connectionStatus = 'error';
      this.lastError = error.message;
      throw error;
    }
  }

  async getSheetDataForDates(startDate, endDate, forceRefresh = false) {
    try {
      const cacheKey = `sheetData_${startDate}_${endDate}`;
      const cached = this.cache.get(cacheKey);
      if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      const data = await this._fetch(`/api/sheet-data?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error getSheetDataForDates:', error);
      throw error;
    }
  }

  parseDate(dateString) {
    if (!dateString) return null;
    const str = dateString.toString().trim();
    if (str.includes('/') && str.split('/').length === 3) {
      const [day, month, year] = str.split('/');
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (str.includes('-') && str.split('-').length === 3) return str;
    return null;
  }

  findRowByDateAndType(sheetData, targetDate, comidaType) {
    if (!sheetData || sheetData.length < 2) return null;
    const [year, month, day] = targetDate.split('-').map(Number);
    const targetDateFormatted = `${day}/${month}/${year.toString().slice(-2)}`;
    for (let row = 1; row < sheetData.length; row++) {
      const rowData = sheetData[row];
      if (!rowData || rowData.length < 3) continue;
      const fechaCell = rowData[1];
      const tipoCell = rowData[2];
      if (!fechaCell || !tipoCell) continue;
      const fechaCellStr = fechaCell.toString().trim();
      const tipo = tipoCell.toString().trim().toUpperCase();
      if (fechaCellStr === targetDateFormatted && tipo === comidaType) {
        return { row, data: rowData, fecha: targetDate, tipo };
      }
    }
    return null;
  }

  findUserColumn(sheetData, iniciales) {
    if (!sheetData || sheetData.length < 1) return null;
    const headerRow = sheetData[0];
    for (let col = 3; col < headerRow.length; col++) {
      const userCell = headerRow[col];
      if (userCell && userCell.toString().toUpperCase() === iniciales.toUpperCase()) {
        return {
          col,
          letter: this.numberToColumnLetter(col + 1),
          iniciales: userCell.toString(),
        };
      }
    }
    return null;
  }

  numberToColumnLetter(num) {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  async ensureDatesExist(dias) {
    try {
      await this._fetch('/api/dates/ensure', {
        method: 'POST',
        body: JSON.stringify({ dates: dias }),
      });
      return true;
    } catch (error) {
      console.error('Error ensureDatesExist:', error);
      throw error;
    }
  }

  async getUserInscripciones(iniciales, dias) {
    try {
      await this.ensureDatesExist(dias);
      if (!dias.length) return {};
      const startDate = dias[0];
      const endDate = dias[dias.length - 1];
      const byDate = await this._fetch(
        `/api/inscripciones?iniciales=${encodeURIComponent(iniciales)}&start=${startDate}&end=${endDate}`
      );
      const result = {};
      dias.forEach(dia => {
        result[dia] = byDate[dia] || { Almuerzo: '', Cena: '' };
      });
      return result;
    } catch (error) {
      console.error('Error getUserInscripciones:', error);
      return {};
    }
  }

  async saveInscripcionesBatch(inscripciones) {
    if (!inscripciones || inscripciones.length === 0) {
      return { success: true, count: 0, errors: [] };
    }
    const fechasUnicas = [...new Set(inscripciones.map(i => i.fecha))];
    try {
      const body = {
        ensureDates: fechasUnicas,
        changes: inscripciones.map(ins => ({
          fecha: ins.fecha,
          comida: ins.comida,
          iniciales: ins.iniciales,
          opcion: ins.opcion ?? '',
        })),
      };
      const result = await this._fetch('/api/inscripciones', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      this.clearCache();
      return {
        success: result.success !== false,
        count: result.count || 0,
        errors: result.errors || [],
      };
    } catch (error) {
      return { success: false, count: 0, errors: [error.message] };
    }
  }

  async getMisaInscripciones(dias) {
    try {
      if (!dias || !dias.length) return {};
      const q = dias.join(',');
      const result = await this._fetch(`/api/misa?dias=${encodeURIComponent(q)}`);
      return result;
    } catch (error) {
      console.error('Error getMisaInscripciones:', error);
      return {};
    }
  }

  async saveMisaInscripcion(dia, valor) {
    try {
      await this._fetch('/api/misa', {
        method: 'PUT',
        body: JSON.stringify({ dia, valor }),
      });
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error saveMisaInscripcion:', error);
      throw error;
    }
  }

  async getProximosCumpleanos(dias = 30) {
    try {
      const list = await this._fetch(`/api/cumpleanos?dias=${dias}`);
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.warn('Error getProximosCumpleanos:', error);
      return [];
    }
  }

  async getSheetInfo() {
    return {
      title: 'Grovemgr (Backend)',
      sheetId: 'backend',
      sheets: [{ title: 'Data', sheetId: 0 }],
    };
  }

  async ensureSheetStructure() {
    return true;
  }

  async updateCell() {
    throw new Error('Backend no usa updateCell; usar saveInscripcionesBatch');
  }

  async saveInscripcion(inscripcion) {
    return this.saveInscripcionesBatch([inscripcion]);
  }

  async getAvailableDates() {
    const sheetData = await this.getSheetData();
    if (!sheetData || sheetData.length < 2) return [];
    const dates = new Set();
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row && row.length > 1 && row[1]) dates.add(row[1]);
    }
    return Array.from(dates).sort();
  }
}

const instance = new BackendApiService();
export default instance;
