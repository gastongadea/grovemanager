/**
 * Punto único de acceso a datos: usa backend (BD) si REACT_APP_API_URL está definido,
 * si no usa Google Sheets como hasta ahora.
 */
import envLoader from '../config/envLoader';
import googleSheetsService from './googleSheetsService';
import backendApiService from './backendApiService';

function getDataService() {
  const apiUrl = envLoader.getEnvVar('REACT_APP_API_URL') || process.env.REACT_APP_API_URL;
  if (apiUrl && apiUrl.trim()) {
    return backendApiService;
  }
  return googleSheetsService;
}

const dataService = getDataService();
export default dataService;
