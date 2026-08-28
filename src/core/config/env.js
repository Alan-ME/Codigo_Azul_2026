// ─────────────────────────────────────────────────────────────
// src/core/config/env.js
// Carga y validación centralizada de variables de entorno.
// Soporta tanto DATABASE_URL (Railway/Render/Supabase) como variables individuales.
// ─────────────────────────────────────────────────────────────
import 'dotenv/config';

// 1. Si DATABASE_URL está definida, autocompletar variables individuales faltantes
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    process.env.DB_HOST = process.env.DB_HOST || url.hostname;
    process.env.DB_PORT = process.env.DB_PORT || url.port || '5432';
    process.env.DB_USER = process.env.DB_USER || decodeURIComponent(url.username);
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || decodeURIComponent(url.password);
    process.env.DB_NAME = process.env.DB_NAME || url.pathname.replace(/^\//, '');
  } catch (e) {
    console.warn('[ENV] Aviso al parsear DATABASE_URL:', e.message);
  }
}

// 2. Puerto por defecto si no está definido en el entorno
process.env.PORT = process.env.PORT || '3000';

const REQUIRED_VARS = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

// Verificar que todas las variables obligatorias estén presentes
const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[ENV] [ERROR] Variables de entorno faltantes: ${missing.join(', ')}`
  );
  console.error('[ENV] [HINT] Configure DATABASE_URL o las variables individuales (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).');
  process.exit(1);
}

/** Objeto de configuración inmutable (deep frozen). */
export const config = Object.freeze({
  port:        parseInt(process.env.PORT, 10),
  nodeEnv:     process.env.NODE_ENV || 'development',
  corsOrigin:  process.env.CORS_ORIGIN || 'http://localhost:3000',

  db: Object.freeze({
    host:      process.env.DB_HOST,
    port:      parseInt(process.env.DB_PORT, 10),
    database:  process.env.DB_NAME,
    user:      process.env.DB_USER,
    password:  process.env.DB_PASSWORD,
    connectionString: process.env.DATABASE_URL || null,
  }),

  jwt: Object.freeze({
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  }),
});
