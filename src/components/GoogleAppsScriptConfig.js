import React, { useState, useEffect } from 'react';
import googleAppsScriptService from '../services/googleAppsScriptService';

const GoogleAppsScriptConfig = ({ isOpen, onClose }) => {
  const [scriptUrl, setScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [configStatus, setConfigStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Cargar configuración actual
      const config = googleAppsScriptService.getConfiguration();
      if (config.isConfigured) {
        setScriptUrl(config.baseUrl);
        setConfigStatus('✅ Configurado');
      } else {
        setConfigStatus('❌ No configurado');
      }
    }
  }, [isOpen]);

  const handleSaveConfig = async () => {
    if (!scriptUrl.trim()) {
      setConfigStatus('❌ URL requerida');
      return;
    }

    setIsLoading(true);
    try {
      googleAppsScriptService.configure(scriptUrl.trim());
      setConfigStatus('✅ Configurado');
      
      // Probar la conexión automáticamente
      await testConnection();
      
    } catch (error) {
      console.error('Error configurando Google Apps Script:', error);
      setConfigStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!googleAppsScriptService.isServiceConfigured()) {
      setTestResult({ success: false, error: 'Servicio no configurado' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await googleAppsScriptService.testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCopy = async () => {
    if (!googleAppsScriptService.isServiceConfigured()) {
      setTestResult({ success: false, error: 'Servicio no configurado' });
      return;
    }

    setIsLoading(true);
    try {
      // Probar con iniciales de ejemplo
      const result = await googleAppsScriptService.copyLastValues('MEP', 3);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#2c1810' }}>
            ⚙️ Configuración Google Apps Script
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Configura la URL del script de Google Apps Script para poder copiar los últimos valores desde la app.
          </p>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              URL del Script:
            </label>
            <input
              type="url"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e8d5c4',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontWeight: 'bold' }}>Estado: </span>
            <span style={{ 
              color: configStatus.includes('✅') ? '#4caf50' : 
                     configStatus.includes('❌') ? '#f44336' : '#666'
            }}>
              {configStatus}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSaveConfig}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </button>

            <button
              onClick={testConnection}
              disabled={isLoading || !googleAppsScriptService.isServiceConfigured()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (isLoading || !googleAppsScriptService.isServiceConfigured()) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: (isLoading || !googleAppsScriptService.isServiceConfigured()) ? 0.6 : 1
              }}
            >
              Probar Conexión
            </button>

            <button
              onClick={handleTestCopy}
              disabled={isLoading || !googleAppsScriptService.isServiceConfigured()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (isLoading || !googleAppsScriptService.isServiceConfigured()) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: (isLoading || !googleAppsScriptService.isServiceConfigured()) ? 0.6 : 1
              }}
            >
              Probar Copia
            </button>
          </div>
        </div>

        {testResult && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: testResult.success ? '#e8f5e8' : '#ffebee',
            border: `2px solid ${testResult.success ? '#4caf50' : '#f44336'}`,
            marginBottom: '16px'
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0',
              color: testResult.success ? '#2e7d32' : '#c62828'
            }}>
              {testResult.success ? '✅ Prueba Exitosa' : '❌ Error en Prueba'}
            </h4>
            <p style={{ 
              margin: 0,
              color: testResult.success ? '#2e7d32' : '#c62828'
            }}>
              {testResult.success ? testResult.message : testResult.error}
            </p>
            {testResult.data && (
              <pre style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#2c1810' }}>
            📋 Instrucciones de Configuración
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
            <li>Ve a tu Google Sheets</li>
            <li>Extensiones → Apps Script</li>
            <li>Pega el código del script</li>
            <li>Despliega → Nueva implementación</li>
            <li>Selecciona "Aplicación web"</li>
            <li>Copia la URL del despliegue</li>
            <li>Pégala en el campo de arriba</li>
            <li>Guarda y prueba la conexión</li>
          </ol>
        </div>

        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>
            🔧 Funcionalidades Disponibles
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
            <li><strong>Copiar Últimos 14:</strong> Copia los últimos 14 valores de una columna</li>
            <li><strong>Copiar Últimos 7:</strong> Copia los últimos 7 valores de una columna</li>
            <li><strong>Copiar Últimos 21:</strong> Copia los últimos 21 valores de una columna</li>
            <li><strong>Selección Dinámica:</strong> Permite especificar la cantidad de valores</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 32px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleAppsScriptConfig;
