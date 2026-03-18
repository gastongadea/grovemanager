/**
 * Servicio para interactuar con Google Apps Script desde la app Limos
 * Permite disparar scripts de Google Apps Script pasando parámetros
 */

class GoogleAppsScriptService {
  constructor() {
    this.baseUrl = null;
    this.isConfigured = false;
  }

  /**
   * Configura el servicio con la URL del script desplegado
   * @param {string} scriptUrl - URL del script desplegado en Google Apps Script
   */
  configure(scriptUrl) {
    if (!scriptUrl || typeof scriptUrl !== 'string') {
      throw new Error('URL del script es requerida');
    }
    
    this.baseUrl = scriptUrl;
    this.isConfigured = true;
    console.log('Google Apps Script Service configurado:', this.baseUrl);
  }

  /**
   * Verifica si el servicio está configurado
   * @returns {boolean}
   */
  isServiceConfigured() {
    return this.isConfigured && !!this.baseUrl;
  }

  /**
   * Ejecuta el script para copiar los últimos 14 valores de una columna
   * @param {string} initials - Las iniciales del usuario (ej: 'MEP', 'PGG')
   * @param {number} valuesToCopy - Cantidad de valores a copiar (por defecto: 14)
   * @returns {Promise<Object>} - Resultado de la ejecución
   */
  /**
 * Prueba la conexión con el script
 * @returns {Promise<Object>} - Resultado de la prueba
 */
async testConnection() {
  if (!this.isServiceConfigured()) {
    throw new Error('Servicio no configurado');
  }

  try {
    // Usar GET en lugar de POST para evitar problemas de CORS
    const response = await fetch(this.baseUrl + '?action=test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: 'Conexión exitosa con Google Apps Script',
      data: result
    };

  } catch (error) {
    console.error('Error probando conexión:', error);
    throw new Error(`Error de conexión: ${error.message}`);
  }
}

/**
 * Ejecuta el script para copiar los últimos N valores de una columna
 * @param {string} initials - Las iniciales del usuario (ej: 'MEP', 'PGG')
 * @param {number} valuesToCopy - Cantidad de valores a copiar (por defecto: 14)
 * @returns {Promise<Object>} - Resultado de la ejecución
 */
async copyLastValues(initials, valuesToCopy = 14) {
  if (!this.isServiceConfigured()) {
    throw new Error('Servicio no configurado. Configura la URL del script primero.');
  }

  if (!initials || typeof initials !== 'string') {
    throw new Error('Las iniciales son requeridas');
  }

  if (!valuesToCopy || isNaN(valuesToCopy) || valuesToCopy <= 0) {
    throw new Error('La cantidad de valores debe ser un número mayor a 0');
  }

  try {
    console.log(`Ejecutando script para ${initials}, copiando ${valuesToCopy} valores...`);
    
    // Usar GET con parámetros en la URL
    const url = new URL(this.baseUrl);
    url.searchParams.set('action', 'copyLastValues');
    url.searchParams.set('initials', initials.toUpperCase());
    url.searchParams.set('valuesToCopy', valuesToCopy.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('Script ejecutado exitosamente:', result);
      return {
        success: true,
        message: result.message || 'Script ejecutado correctamente',
        data: result.data
      };
    } else {
      throw new Error(result.error || 'Error desconocido en el script');
    }

  } catch (error) {
    console.error('Error ejecutando Google Apps Script:', error);
    throw new Error(`Error ejecutando script: ${error.message}`);
  }
}
  /**
   * Ejecuta el script para copiar los últimos 14 valores (función rápida)
   * @param {string} initials - Las iniciales del usuario
   * @returns {Promise<Object>} - Resultado de la ejecución
   */
  async copyLast14Values(initials) {
    return this.copyLastValues(initials, 14);
  }

  /**
   * Ejecuta el script para copiar los últimos 7 valores
   * @param {string} initials - Las iniciales del usuario
   * @returns {Promise<Object>} - Resultado de la ejecución
   */
  async copyLast7Values(initials) {
    return this.copyLastValues(initials, 7);
  }

  /**
   * Ejecuta el script para copiar los últimos 21 valores
   * @param {string} initials - Las iniciales del usuario
   * @returns {Promise<Object>} - Resultado de la ejecución
   */
  async copyLast21Values(initials) {
    return this.copyLastValues(initials, 21);
  }

  

  /**
   * Obtiene información sobre el script configurado
   * @returns {Object} - Información de configuración
   */
  getConfiguration() {
    return {
      isConfigured: this.isServiceConfigured(),
      baseUrl: this.baseUrl,
      availableActions: [
        'copyLastValues',
        'copyLast7Values', 
        'copyLast14Values',
        'copyLast21Values',
        'testConnection'
      ]
    };
  }
}

// Exportar una instancia singleton
const googleAppsScriptService = new GoogleAppsScriptService();
export default googleAppsScriptService;
