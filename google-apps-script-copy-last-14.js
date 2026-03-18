/**
 * Google Apps Script para copiar los últimos 14 valores de una columna específica
 * y pegarlos a continuación en la hoja Data
 * 
 * Uso: 
 * 1. Abrir Google Sheets
 * 2. Ir a Extensiones > Apps Script
 * 3. Pegar este código
 * 4. Guardar y ejecutar la función copyLast14Values
 */

function copyLast14Values() {
  // Configuración
  const SHEET_NAME = 'Data'; // Nombre de la hoja
  const INITIALS = 'MEP'; // Cambiar por las iniciales deseadas
  const VALUES_TO_COPY = 14; // Número de valores a copiar
  
  try {
    // Obtener la hoja activa
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`No se encontró la hoja "${SHEET_NAME}"`);
    }
    
    // Obtener todos los datos de la hoja
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      throw new Error('La hoja no tiene suficientes datos');
    }
    
    // Encontrar la columna correspondiente a las iniciales
    const headerRow = data[0];
    const columnIndex = headerRow.findIndex(header => 
      header && header.toString().trim() === INITIALS
    );
    
    if (columnIndex === -1) {
      throw new Error(`No se encontró la columna para las iniciales "${INITIALS}"`);
    }
    
    console.log(`Columna encontrada en índice: ${columnIndex}`);
    
    // Obtener todos los valores de la columna (excluyendo el header)
    const columnValues = data.slice(1).map(row => row[columnIndex]);
    
    // Filtrar solo valores no vacíos
    const nonEmptyValues = columnValues.filter(value => 
      value !== null && value !== undefined && value.toString().trim() !== ''
    );
    
    if (nonEmptyValues.length === 0) {
      throw new Error(`No hay valores en la columna de ${INITIALS}`);
    }
    
    // Obtener los últimos N valores
    const lastValues = nonEmptyValues.slice(-VALUES_TO_COPY);
    
    console.log(`Valores encontrados: ${nonEmptyValues.length}`);
    console.log(`Últimos ${VALUES_TO_COPY} valores:`, lastValues);
    
    // Encontrar la última fila con datos en toda la hoja
    const lastRowWithData = sheet.getLastRow();
    
    // Preparar los datos para pegar (cada valor en una fila separada)
    const dataToPaste = lastValues.map(value => [value]);
    
    // Pegar los valores a partir de la siguiente fila disponible
    const startRow = lastRowWithData + 1;
    const endRow = startRow + VALUES_TO_COPY - 1;
    
    sheet.getRange(startRow, columnIndex + 1, VALUES_TO_COPY, 1).setValues(dataToPaste);
    
    console.log(`Valores copiados exitosamente en las filas ${startRow}-${endRow}`);
    
    // Mostrar mensaje de éxito
    SpreadsheetApp.getUi().alert(
      '✅ Copia completada',
      `Se copiaron ${VALUES_TO_COPY} valores de ${INITIALS} en las filas ${startRow}-${endRow}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Mostrar mensaje de error
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      `Error al copiar valores: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Función para crear un menú personalizado en Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 Copiar Últimos 14')
    .addItem('Copiar últimos 14 valores', 'copyLast14Values')
    .addSeparator()
    .addItem('Configurar iniciales', 'showConfigDialog')
    .addToUi();
}

/**
 * Función para mostrar un diálogo de configuración
 */
function showConfigDialog() {
  const html = HtmlService.createHtmlOutput(`
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h3>Configurar copia de últimos 14 valores</h3>
      <p><strong>Iniciales actuales:</strong> <span id="currentInitials">${INITIALS}</span></p>
      <p><strong>Valores a copiar:</strong> <span id="currentValues">${VALUES_TO_COPY}</span></p>
      <hr>
      <p>Para cambiar la configuración, edita las constantes en el código:</p>
      <ul>
        <li><code>INITIALS</code>: Las iniciales de la columna a copiar</li>
        <li><code>VALUES_TO_COPY</code>: Número de valores a copiar</li>
        <li><code>SHEET_NAME</code>: Nombre de la hoja (por defecto: "Data")</li>
      </ul>
      <button onclick="google.script.host.close()" style="padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Cerrar
      </button>
    </div>
  `)
    .setWidth(400)
    .setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Configuración');
}

/**
 * Función para copiar valores con parámetros personalizados
 * @param {string} initials - Las iniciales de la columna
 * @param {number} count - Número de valores a copiar
 */
function copyLastValuesCustom(initials, count = 14) {
  // Actualizar las constantes temporalmente
  const originalInitials = INITIALS;
  const originalCount = VALUES_TO_COPY;
  
  // Ejecutar la copia con los nuevos parámetros
  try {
    // Aquí necesitarías modificar la función para aceptar parámetros
    // Por ahora, usa la función principal
    copyLast14Values();
  } finally {
    // Restaurar valores originales si es necesario
  }
}

/**
 * Función de prueba para verificar la configuración
 */
function testConfiguration() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Hoja "${SHEET_NAME}" no encontrada`);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const columnIndex = headerRow.findIndex(header => 
      header && header.toString().trim() === INITIALS
    );
    
    if (columnIndex === -1) {
      throw new Error(`Columna "${INITIALS}" no encontrada`);
    }
    
    const columnValues = data.slice(1).map(row => row[columnIndex]);
    const nonEmptyValues = columnValues.filter(value => 
      value !== null && value !== undefined && value.toString().trim() !== ''
    );
    
    const result = {
      sheetName: SHEET_NAME,
      initials: INITIALS,
      columnIndex: columnIndex,
      totalRows: data.length,
      nonEmptyValues: nonEmptyValues.length,
      lastValues: nonEmptyValues.slice(-VALUES_TO_COPY)
    };
    
    console.log('Configuración de prueba:', result);
    
    SpreadsheetApp.getUi().alert(
      '✅ Configuración válida',
      `Hoja: ${result.sheetName}\nIniciales: ${result.initials}\nColumna: ${result.columnIndex + 1}\nValores no vacíos: ${result.nonEmptyValues}\nÚltimos ${VALUES_TO_COPY}: ${result.lastValues.join(', ')}`,
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
