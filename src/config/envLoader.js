// Loader de variables de entorno
// Intenta cargar las variables de diferentes maneras

let envVars = {};

// Método 1: process.env (React estándar)
try {
  console.log('🔍 Intentando leer variables de process.env...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('REACT_APP_GOOGLE_API_KEY:', process.env.REACT_APP_GOOGLE_API_KEY ? '✅ Configurada' : '❌ No configurada');
  console.log('REACT_APP_GOOGLE_SHEET_ID:', process.env.REACT_APP_GOOGLE_SHEET_ID ? '✅ Configurado' : '❌ No configurado');
  console.log('REACT_APP_GOOGLE_APPS_SCRIPT_URL:', process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL ? '✅ Configurada' : '❌ No configurada');
  
  envVars = {
    REACT_APP_GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY,
    REACT_APP_GOOGLE_SHEET_ID: process.env.REACT_APP_GOOGLE_SHEET_ID,
    REACT_APP_GOOGLE_APPS_SCRIPT_URL: process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL,
    REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL,
    REACT_APP_GOOGLE_PRIVATE_KEY: process.env.REACT_APP_GOOGLE_PRIVATE_KEY,
    REACT_APP_APP_NAME: process.env.REACT_APP_APP_NAME,
    REACT_APP_VERSION: process.env.REACT_APP_VERSION,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
} catch (error) {
  console.warn('Error leyendo process.env:', error);
}

// Método 2: Intentar leer desde window (fallback)
if (!envVars.REACT_APP_GOOGLE_API_KEY && typeof window !== 'undefined') {
  try {
    // Intentar leer desde meta tags si existen
    const apiKeyMeta = document.querySelector('meta[name="google-api-key"]');
    const sheetIdMeta = document.querySelector('meta[name="google-sheet-id"]');
    
    if (apiKeyMeta) {
      envVars.REACT_APP_GOOGLE_API_KEY = apiKeyMeta.getAttribute('content');
    }
    if (sheetIdMeta) {
      envVars.REACT_APP_GOOGLE_SHEET_ID = sheetIdMeta.getAttribute('content');
    }
  } catch (error) {
    console.warn('Error leyendo meta tags:', error);
  }
}

// Método 3: Valores hardcodeados para desarrollo (solo para testing)
if (process.env.NODE_ENV === 'development' && !envVars.REACT_APP_GOOGLE_API_KEY) {
  console.warn('⚠️ Variables de entorno no encontradas. Usando valores de prueba...');
  
  // Solo para desarrollo - REMOVER EN PRODUCCIÓN
  envVars.REACT_APP_GOOGLE_API_KEY = 'AIzaSyDgOo8w4Y-YBLmD_w4R0tscQ60JMZXs7xc';
  envVars.REACT_APP_GOOGLE_SHEET_ID = '1WrFLSer4NyYDjmuPqvyhagsWfoAr1NkgY7HQyHjF7a8';
  envVars.REACT_APP_GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_-K4jZQBuH8gsNMDjPZX-lCzRnhadpBwKLv5MdBcoAUfFH5vrKjIdjYWsZgTgvPOl/exec';
}

// Función para obtener una variable específica
export const getEnvVar = (key, defaultValue = null) => {
  return envVars[key] || defaultValue;
};

// Función para verificar si está configurado
export const isConfigured = () => {
  return !!(envVars.REACT_APP_GOOGLE_API_KEY && envVars.REACT_APP_GOOGLE_SHEET_ID);
};

// Función para obtener estado de configuración
export const getConfigStatus = () => {
  return {
    apiKey: !!envVars.REACT_APP_GOOGLE_API_KEY,
    sheetId: !!envVars.REACT_APP_GOOGLE_SHEET_ID,
    configured: isConfigured(),
    nodeEnv: envVars.NODE_ENV,
    apiKeyPreview: envVars.REACT_APP_GOOGLE_API_KEY ? 
      `${envVars.REACT_APP_GOOGLE_API_KEY.substring(0, 10)}...${envVars.REACT_APP_GOOGLE_API_KEY.substring(envVars.REACT_APP_GOOGLE_API_KEY.length - 4)}` : 
      null,
    sheetIdPreview: envVars.REACT_APP_GOOGLE_SHEET_ID ? 
      `${envVars.REACT_APP_GOOGLE_SHEET_ID.substring(0, 10)}...${envVars.REACT_APP_GOOGLE_SHEET_ID.substring(envVars.REACT_APP_GOOGLE_SHEET_ID.length - 4)}` : 
      null,
    allVars: envVars
  };
};

// Debug: mostrar información
export const debug = () => {
  console.log('=== ENV LOADER DEBUG ===');
  console.log('Variables cargadas:', envVars);
  console.log('Configurado:', isConfigured());
  console.log('Estado:', getConfigStatus());
};

// Ejecutar debug automáticamente en desarrollo
if (process.env.NODE_ENV === 'development') {
  debug();
}

const envLoader = {
  getEnvVar,
  isConfigured,
  getConfigStatus,
  debug,
  vars: envVars
};

export default envLoader; 