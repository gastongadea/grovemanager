# 📋 Instrucciones para Google Apps Script - Copiar Últimos 14 Valores

## 🚀 Instalación y Configuración

### Paso 1: Abrir Google Apps Script
1. Abre tu Google Sheets
2. Ve a **Extensiones** > **Apps Script**
3. Se abrirá una nueva pestaña con el editor de código

### Paso 2: Pegar el Código
1. **Elimina** todo el código existente en el editor
2. **Copia** uno de los scripts (básico o avanzado)
3. **Pega** el código en el editor
4. **Guarda** el proyecto (Ctrl+S o Cmd+S)

### Paso 3: Configurar las Iniciales
En el código, cambia la constante `INITIALS` por las iniciales que quieres usar:

```javascript
const INITIALS = 'MEP'; // Cambiar por MEP, PGG, LMC, etc.
```

### Paso 4: Ejecutar por Primera Vez
1. Haz clic en **Ejecutar** (botón de play ▶️)
2. Autoriza el script cuando te lo solicite Google
3. Cierra la pestaña de Apps Script

## 📱 Uso del Script

### Opción 1: Script Básico
Después de la instalación, verás un nuevo menú en Google Sheets:
- **🔄 Copiar Últimos 14** > **Copiar últimos 14 valores**

### Opción 2: Script Avanzado
El script avanzado te da más opciones:
- **🔄 Copiar Últimos Valores** > **Copiar últimos valores (selección)**
- **🔄 Copiar Últimos Valores** > **Copiar últimos 14 (MEP)**
- **🔄 Copiar Últimos Valores** > **Copiar últimos 14 (PGG)**
- **🔄 Copiar Últimos Valores** > **Copiar últimos 14 (LMC)**

## 🔧 Funcionalidades

### ✨ Características Principales
- **Copia automática**: Encuentra automáticamente la columna de las iniciales
- **Filtrado inteligente**: Solo copia valores no vacíos
- **Posicionamiento automático**: Pega los valores después de la última fila con datos
- **Validación**: Verifica que las iniciales existan antes de copiar
- **Mensajes informativos**: Te muestra exactamente qué se copió y dónde

### 📊 Cómo Funciona
1. **Busca la columna**: Encuentra la columna que corresponde a las iniciales especificadas
2. **Filtra valores**: Solo considera valores no vacíos (no celdas en blanco)
3. **Toma los últimos N**: Copia los últimos 14 valores (o la cantidad que especifiques)
4. **Pega automáticamente**: Los coloca en las siguientes filas disponibles de la misma columna

## 🎯 Casos de Uso

### 📅 Para Comidas de Arboleda
- **Copia patrones**: Si alguien tiene un patrón de comidas que se repite
- **Extensión de datos**: Para extender la planilla con datos históricos
- **Backup de patrones**: Para guardar patrones de comidas antes de hacer cambios

### 🔄 Ejemplo Práctico
Si MEP tiene estos valores en las últimas 14 filas:
```
S, R, N, S, S, R, N, S, S, R, N, S, S, R
```

El script los copiará y los pegará en las siguientes 14 filas, manteniendo el patrón.

## ⚙️ Personalización

### 🔢 Cambiar Cantidad de Valores
En el script básico, modifica:
```javascript
const VALUES_TO_COPY = 14; // Cambiar por 7, 21, 30, etc.
```

### 📝 Cambiar Nombre de Hoja
Si tu hoja no se llama "Data":
```javascript
const SHEET_NAME = 'Data'; // Cambiar por el nombre de tu hoja
```

### 🎨 Agregar Más Iniciales
En el script avanzado, puedes agregar más funciones rápidas:
```javascript
function copyLast14NUEVAS() {
  executeCopy(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME),
    'NUEVAS',
    14,
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DEFAULT_CONFIG.SHEET_NAME).getDataRange().getValues()
  );
}
```

## 🚨 Solución de Problemas

### ❌ Error: "No se encontró la hoja"
- Verifica que el nombre de la hoja en `SHEET_NAME` coincida exactamente
- Los nombres son sensibles a mayúsculas/minúsculas

### ❌ Error: "No se encontró la columna para las iniciales"
- Verifica que las iniciales en `INITIALS` existan en la primera fila
- Asegúrate de que no haya espacios extra

### ❌ Error: "No hay valores en la columna"
- La columna existe pero está completamente vacía
- Verifica que haya datos en la columna

### ❌ Error de permisos
- Ejecuta el script por primera vez y autoriza todos los permisos
- Cierra y vuelve a abrir Google Sheets

## 📋 Estructura de Datos Esperada

Tu hoja debe tener esta estructura:
```
| Fecha | Tipo | MEP | PGG | LMC | ... |
|-------|------|-----|-----|-----|-----|
| 01/01 | A    | S   | R   | N   | ... |
| 01/01 | C    | S   | N   | S   | ... |
| 02/01 | A    | R   | S   | R   | ... |
| ...   | ...  | ... | ... | ... | ... |
```

## 🔍 Debugging y Logs

### 📝 Ver Logs
1. En Google Apps Script, ve a **Ejecuciones**
2. Haz clic en la ejecución más reciente
3. Revisa los logs para ver qué está pasando

### 🧪 Función de Prueba
Usa la función `testConfiguration()` para verificar que todo esté configurado correctamente.

## 📞 Soporte

### 🆘 Si algo no funciona
1. Verifica que el código esté copiado completamente
2. Asegúrate de que las constantes estén configuradas correctamente
3. Ejecuta la función de prueba
4. Revisa los logs de ejecución

### 🔄 Actualizaciones
- El script se ejecuta cada vez que lo llamas
- No necesitas reiniciar nada después de hacer cambios
- Solo guarda el código y vuelve a Google Sheets

---

**¡Listo!** Ahora tienes un script poderoso que puede copiar automáticamente los últimos valores de cualquier columna de iniciales en tu planilla de comidas. 🎉
