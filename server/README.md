# Backend Grovemgr (API + SQLite)

Servidor que almacena inscripciones, Misa y cumpleaños en SQLite en lugar de Google Sheets.

## Uso

1. Instalar dependencias (en la raíz del repo): `npm install`
2. Iniciar el servidor: `npm run server` (puerto 3001 por defecto)
3. En el frontend, definir `REACT_APP_API_URL=http://localhost:3001` en `.env`
4. Arrancar la app: `npm start` — la web usará el backend en lugar de la planilla

## API

- `GET /api/health` — estado del servidor
- `GET /api/users` — lista de usuarios (iniciales)
- `POST /api/users` — crear/actualizar usuarios
- `GET /api/inscripciones?iniciales=XX&start=YYYY-MM-DD&end=YYYY-MM-DD`
- `POST /api/inscripciones` — lote: `{ changes: [{ fecha, comida, iniciales, opcion }], ensureDates?: string[] }`
- `GET /api/misa?dias=f1,f2,...`
- `PUT /api/misa` — `{ dia, valor }`
- `GET /api/cumpleanos?dias=30`
- `POST /api/cumpleanos` — `{ cumpleanos: [{ iniciales, fecha_nacimiento }] }`
- `GET /api/sheet-data?start=&end=` — datos en formato “planilla” (compatible con el front)
- `POST /api/dates/ensure` — `{ dates: string[] }` — asegura filas A/C para cada fecha

## Base de datos

Por defecto se crea `server/grovemgr.db`. Para otro path: `DB_PATH=/ruta/al/archivo.db npm run server`.
