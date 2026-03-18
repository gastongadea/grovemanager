/**
 * Google Apps Script para copiar los últimos N valores de una columna específica
 * Versión habilitada para web que puede recibir llamadas desde la app Limos
 * 
 * Uso: 
 * 1. Abrir Google Sheets
 * 2. Ir a Extensiones > Apps Script
 * 3. Pegar este código
 * 4. Desplegar como aplicación web
 * 5. Configurar la URL en la app Limos
 */

// Configuración por defecto
const DEFAULT_CONFIG = {
  SHEET_NAME: 'Data',
  VALUES_TO_COPY: 14
};

/**
 * Función principal que se ejecuta cuando se recibe una llamada web
 * Esta función debe llamarse 'doPost' para recibir llamadas POST
 */
function doPost(e) {
  try {
    // Verificar que se recibieron datos
    if (!e || !e.postData || !e.postData.contents) {
      return createErrorResponse('No se recibieron datos');
    }

    // Parsear los datos JSON recibidos
    const requestData = JSON.parse(e.postData.contents);
    console.log('Datos recibidos:', requestData);

    // Verificar que se especificó una acción
    if (!requestData.action) {
      return createErrorResponse('Acción no especificada');
    }

    // Ejecutar la acción correspondiente
    switch (requestData.action) {
      case 'copyLastValues':
        return handleCopyLastValues(requestData);
      
      case 'test':
        return createSuccessResponse('Conexión exitosa con Google Apps Script', {
          timestamp: new Date().toISOString(),
          config: DEFAULT_CONFIG
        });
      
      default:
        return createErrorResponse(`Acción no reconocida: ${requestData.action}`);
    }

  } catch (error) {
    console.error('Error en doPost:', error);
    return createErrorResponse(`Error interno: ${error.message}`);
  }
}

/**
 * Función para manejar la copia de últimos valores
 */
function handleCopyLastValues(requestData) {
  try {
    // Validar parámetros
    const initials = requestData.initials;
    const valuesToCopy = requestData.valuesToCopy || DEFAULT_CONFIG.VALUES_TO_COPY;

    if (!initials) {
      return createErrorResponse('Las iniciales son requeridas');
    }

    if (!valuesToCopy || isNaN(valuesToCopy) || valuesToCopy <= 0) {
      return createErrorResponse('La cantidad de valores debe ser un número mayor a 0');
    }

    console.log(`Ejecutando copia para ${initials}, ${valuesToCopy} valores`);

    // Ejecutar la copia
    const result = executeCopy(initials, valuesToCopy);

    return createSuccessResponse(
      `Se copiaron ${result.copiedValues} valores de ${initials} en las filas ${result.startRow}-${result.endRow}`,
      result
    );

  } catch (error) {
    console.error('Error en handleCopyLastValues:', error);
    return createErrorResponse(`Error al copiar valores: ${error.message}`);
  }
}

/**
 * Función que ejecuta la copia de valores
 */
function executeCopy(initials, valuesToCopy) {
  try {
    // Obtener la hoja
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME);
    if (!sheet) {
      throw new Error(`No se encontró la hoja "${DEFAULT_CONFIG.SHEET_NAME}"`);
    }

    // Obtener todos los datos
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      throw new Error('La hoja no tiene suficientes datos');
    }

    // Encontrar la columna correspondiente a las iniciales
    const headerRow = data[0];
    const columnIndex = headerRow.findIndex(header => 
      header && header.toString().trim() === initials
    );

    if (columnIndex === -1) {
      throw new Error(`No se encontró la columna para las iniciales "${initials}"`);
    }

    console.log(`Columna encontrada en índice: ${columnIndex}`);

    // Obtener todos los valores de la columna (excluyendo el header)
    const columnValues = data.slice(1).map(row => row[columnIndex]);

    // Filtrar solo valores no vacíos
    const nonEmptyValues = columnValues.filter(value => 
      value !== null && value !== undefined && value.toString().trim() !== ''
    );

    if (nonEmptyValues.length === 0) {
      throw new Error(`No hay valores en la columna de ${initials}`);
    }

    // Ajustar la cantidad si hay menos valores disponibles
    const actualValuesToCopy = Math.min(valuesToCopy, nonEmptyValues.length);

    // Obtener los últimos N valores
    const lastValues = nonEmptyValues.slice(-actualValuesToCopy);

    console.log(`Valores encontrados: ${nonEmptyValues.length}`);
    console.log(`Copiando últimos ${actualValuesToCopy} valores:`, lastValues);

    // Encontrar la última fila con datos en toda la hoja
    const lastRowWithData = sheet.getLastRow();

    // Preparar los datos para pegar (cada valor en una fila separada)
    const dataToPaste = lastValues.map(value => [value]);

    // Pegar los valores a partir de la siguiente fila disponible
    const startRow = lastRowWithData + 1;
    const endRow = startRow + actualValuesToCopy - 1;

    sheet.getRange(startRow, columnIndex + 1, actualValuesToCopy, 1).setValues(dataToPaste);

    console.log(`Valores copiados exitosamente en las filas ${startRow}-${endRow}`);

    return {
      initials: initials,
      valuesToCopy: valuesToCopy,
      copiedValues: actualValuesToCopy,
      startRow: startRow,
      endRow: endRow,
      copiedData: lastValues,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Función para crear una respuesta de éxito
 */
function createSuccessResponse(message, data = null) {
  const response = {
    success: true,
    message: message,
    timestamp: new Date().toISOString()
  };

  if (data) {
    response.data = data;
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Función para crear una respuesta de error
 */
function createErrorResponse(errorMessage) {
  const response = {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString()
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Función para crear un menú personalizado en Google Sheets (para uso manual)
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 Copiar Últimos Valores')
    .addItem('Copiar últimos 14 valores (MEP)', () => executeCopy('MEP', 14))
    .addItem('Copiar últimos 14 valores (PGG)', () => executeCopy('PGG', 14))
    .addItem('Copiar últimos 14 valores (LMC)', () => executeCopy('LMC', 14))
    .addSeparator()
    .addItem('Copiar últimos 7 valores (MEP)', () => executeCopy('MEP', 7))
    .addItem('Copiar últimos 7 valores (PGG)', () => executeCopy('PGG', 7))
    .addItem('Copiar últimos 7 valores (LMC)', () => executeCopy('LMC', 7))
    .addSeparator()
    .addItem('Configuración', 'showConfigDialog')
    .addItem('Probar configuración', 'testConfiguration')
    .addToUi();
}

/**
 * Función para mostrar un diálogo de configuración
 */
function showConfigDialog() {
  const html = HtmlService.createHtmlOutput(`
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h3>🔄 Configuración del Script</h3>
      
      <div style="margin-bottom: 20px;">
        <h4>Configuración Actual:</h4>
        <p><strong>Hoja:</strong> ${DEFAULT_CONFIG.SHEET_NAME}</p>
        <p><strong>Valores por defecto:</strong> ${DEFAULT_CONFIG.VALUES_TO_COPY}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4>Uso desde la App Limos:</h4>
        <p>1. Despliega este script como aplicación web</p>
        <p>2. Copia la URL del despliegue</p>
        <p>3. Configura la URL en la app Limos</p>
        <p>4. Usa el botón "Copiar Últimos 14" desde la app</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4>Funciones Disponibles:</h4>
        <ul>
          <li><strong>copyLastValues:</strong> Copia N valores de iniciales específicas</li>
          <li><strong>test:</strong> Prueba la conexión</li>
        </ul>
      </div>
      
      <button onclick="google.script.host.close()" style="padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Cerrar
      </button>
    </div>
  `)
    .setWidth(500)
    .setHeight(400);

  SpreadsheetApp.getUi().showModalDialog(html, 'Configuración del Script');
}

/**
 * Función de prueba para verificar la configuración
 */
function testConfiguration() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME);
    if (!sheet) {
      throw new Error(`Hoja "${DEFAULT_CONFIG.SHEET_NAME}" no encontrada`);
    }

    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const availableInitials = headerRow.filter(header => 
      header && header.toString().trim() !== '' && 
      header.toString().trim() !== 'Fecha' && 
      header.toString().trim() !== 'Tipo'
    );

    const result = {
      sheetName: DEFAULT_CONFIG.SHEET_NAME,
      totalRows: data.length,
      availableColumns: availableInitials.length,
      availableInitials: availableInitials,
      defaultValuesToCopy: DEFAULT_CONFIG.VALUES_TO_COPY
    };

    console.log('Configuración de prueba:', result);

    SpreadsheetApp.getUi().alert(
      '✅ Configuración válida',
      `Hoja: ${result.sheetName}\nTotal de filas: ${result.totalRows}\nColumnas disponibles: ${result.availableColumns}\nIniciales: ${result.availableInitials.join(', ')}\n\nValores por defecto: ${result.defaultValuesToCopy}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Error de configuración',
      error.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Función para probar la funcionalidad web
 */
function testWebFunctionality() {
  try {
    // Simular una llamada POST
    const mockEvent = {
      postData: {
        contents: JSON.stringify({
          action: 'copyLastValues',
          initials: 'MEP',
          valuesToCopy: 7
        })
      }
    };

    const result = doPost(mockEvent);
    console.log('Resultado de prueba web:', result);

  } catch (error) {
    console.error('Error en prueba web:', error);
  }
}
