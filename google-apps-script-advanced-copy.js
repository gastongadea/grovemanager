/**
 * Google Apps Script Avanzado para copiar los últimos N valores de una columna específica
 * Versión mejorada con interfaz de usuario dinámica
 */

// Configuración por defecto
const DEFAULT_CONFIG = {
  SHEET_NAME: 'Data',
  VALUES_TO_COPY: 14,
  DEFAULT_INITIALS: 'MEP'
};

/**
 * Función principal mejorada que permite seleccionar iniciales dinámicamente
 */
function copyLastValuesAdvanced() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME);
    if (!sheet) {
      throw new Error(`No se encontró la hoja "${DEFAULT_CONFIG.SHEET_NAME}"`);
    }
    
    // Obtener todas las columnas disponibles (iniciales)
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const availableInitials = headerRow.filter(header => 
      header && header.toString().trim() !== '' && 
      header.toString().trim() !== 'Fecha' && 
      header.toString().trim() !== 'Tipo'
    );
    
    // Crear interfaz de selección
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt(
      '🔄 Copiar Últimos Valores',
      `Selecciona las iniciales de la columna a copiar:\n\nColumnas disponibles:\n${availableInitials.join(', ')}\n\nIngresa las iniciales:`,
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response.getSelectedButton() === ui.ButtonSet.OK) {
      const selectedInitials = response.getResponseText().trim().toUpperCase();
      
      if (!selectedInitials) {
        throw new Error('No se ingresaron iniciales');
      }
      
      if (!availableInitials.includes(selectedInitials)) {
        throw new Error(`Las iniciales "${selectedInitials}" no están disponibles`);
      }
      
      // Preguntar cuántos valores copiar
      const countResponse = ui.prompt(
        '📊 Cantidad de Valores',
        `¿Cuántos valores quieres copiar? (por defecto: ${DEFAULT_CONFIG.VALUES_TO_COPY})`,
        ui.ButtonSet.OK_CANCEL
      );
      
      let valuesToCopy = DEFAULT_CONFIG.VALUES_TO_COPY;
      if (countResponse.getSelectedButton() === ui.ButtonSet.OK) {
        const countInput = countResponse.getResponseText().trim();
        if (countInput && !isNaN(countInput)) {
          valuesToCopy = parseInt(countInput);
          if (valuesToCopy <= 0) {
            throw new Error('La cantidad debe ser mayor a 0');
          }
        }
      }
      
      // Ejecutar la copia
      executeCopy(sheet, selectedInitials, valuesToCopy, data);
      
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      `Error al copiar valores: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Función que ejecuta la copia de valores
 */
function executeCopy(sheet, initials, valuesToCopy, data) {
  try {
    // Encontrar la columna correspondiente a las iniciales
    const headerRow = data[0];
    const columnIndex = headerRow.findIndex(header => 
      header && header.toString().trim() === initials
    );
    
    if (columnIndex === -1) {
      throw new Error(`No se encontró la columna para las iniciales "${initials}"`);
    }
    
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
    
    // Mostrar mensaje de éxito
    SpreadsheetApp.getUi().alert(
      '✅ Copia completada',
      `Se copiaron ${actualValuesToCopy} valores de ${initials} en las filas ${startRow}-${endRow}\n\nValores copiados:\n${lastValues.join(', ')}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    throw error;
  }
}

/**
 * Función para crear un menú personalizado en Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 Copiar Últimos Valores')
    .addItem('Copiar últimos valores (selección)', 'copyLastValuesAdvanced')
    .addSeparator()
    .addItem('Copiar últimos 14 (MEP)', 'copyLast14MEP')
    .addItem('Copiar últimos 14 (PGG)', 'copyLast14PGG')
    .addItem('Copiar últimos 14 (LMC)', 'copyLast14LMC')
    .addSeparator()
    .addItem('Configuración', 'showAdvancedConfigDialog')
    .addItem('Probar configuración', 'testAdvancedConfiguration')
    .addToUi();
}

/**
 * Funciones rápidas para iniciales específicas
 */
function copyLast14MEP() {
  executeCopy(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME),
    'MEP',
    14,
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME).getDataRange().getValues()
  );
}

function copyLast14PGG() {
  executeCopy(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME),
    'PGG',
    14,
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME).getDataRange().getValues()
  );
}

function copyLast14LMC() {
  executeCopy(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME),
    'LMC',
    14,
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME).getDataRange().getValues()
  );
}

/**
 * Función para mostrar un diálogo de configuración avanzado
 */
function showAdvancedConfigDialog() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME);
  const data = sheet ? sheet.getDataRange().getValues() : [];
  const headerRow = data.length > 0 ? data[0] : [];
  const availableInitials = headerRow.filter(header => 
    header && header.toString().trim() !== '' && 
    header.toString().trim() !== 'Fecha' && 
    header.toString().trim() !== 'Tipo'
  );
  
  const html = HtmlService.createHtmlOutput(`
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h3>🔄 Configuración Avanzada</h3>
      
      <div style="margin-bottom: 20px;">
        <h4>Configuración Actual:</h4>
        <p><strong>Hoja:</strong> ${DEFAULT_CONFIG.SHEET_NAME}</p>
        <p><strong>Valores por defecto:</strong> ${DEFAULT_CONFIG.VALUES_TO_COPY}</p>
        <p><strong>Iniciales por defecto:</strong> ${DEFAULT_CONFIG.DEFAULT_INITIALS}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4>Columnas Disponibles:</h4>
        <div style="max-height: 150px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
          ${availableInitials.map(init => `<span style="display: inline-block; margin: 2px; padding: 4px 8px; background: #e3f2fd; border-radius: 4px;">${init}</span>`).join('')}
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4>Uso:</h4>
        <ul>
          <li><strong>Copiar últimos valores (selección):</strong> Te permite elegir las iniciales y cantidad</li>
          <li><strong>Funciones rápidas:</strong> Copian directamente los últimos 14 valores de las iniciales especificadas</li>
          <li><strong>Configuración:</strong> Ver la configuración actual y columnas disponibles</li>
        </ul>
      </div>
      
      <button onclick="google.script.host.close()" style="padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Cerrar
      </button>
    </div>
  `)
    .setWidth(500)
    .setHeight(400);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Configuración Avanzada');
}

/**
 * Función de prueba para verificar la configuración avanzada
 */
function testAdvancedConfiguration() {
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
      defaultValuesToCopy: DEFAULT_CONFIG.VALUES_TO_COPY,
      defaultInitials: DEFAULT_CONFIG.DEFAULT_INITIALS
    };
    
    console.log('Configuración avanzada de prueba:', result);
    
    SpreadsheetApp.getUi().alert(
      '✅ Configuración válida',
      `Hoja: ${result.sheetName}\nTotal de filas: ${result.totalRows}\nColumnas disponibles: ${result.availableColumns}\nIniciales: ${result.availableInitials.join(', ')}\n\nValores por defecto: ${result.defaultValuesToCopy}\nIniciales por defecto: ${result.defaultInitials}`,
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
 * Función para copiar valores con validación adicional
 */
function copyLastValuesWithValidation(initials, valuesToCopy = 14) {
  try {
    // Validar parámetros
    if (!initials || typeof initials !== 'string') {
      throw new Error('Las iniciales deben ser una cadena válida');
    }
    
    if (!valuesToCopy || isNaN(valuesToCopy) || valuesToCopy <= 0) {
      throw new Error('La cantidad de valores debe ser un número mayor a 0');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME);
    if (!sheet) {
      throw new Error(`No se encontró la hoja "${DEFAULT_CONFIG.SHEET_NAME}"`);
    }
    
    const data = sheet.getDataRange().getValues();
    executeCopy(sheet, initials.toUpperCase(), valuesToCopy, data);
    
  } catch (error) {
    throw error;
  }
}
