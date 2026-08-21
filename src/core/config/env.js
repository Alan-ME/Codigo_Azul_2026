// ─────────────────────────────────────────────────────────────
// src/core/config/env.js
// Carga y validación centralizada de variables de entorno.
// ─────────────────────────────────────────────────────────────
import 'dotenv/config';

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

// Verificar que todas las variables obligatorias estén presentes.
const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[ENV] [ERROR] Variables de entorno faltantes: ${missing.join(', ')}`
  );
  console.error('[ENV] [HINT] Copie .env.example a .env y complete los valores requeridos.');
  process.exit(1);
}

/** Objeto de configuración tipado y congelado. */
export const config = Object.freeze({
  port:        parseInt(process.env.PORT, 10),
  nodeEnv:     process.env.NODE_ENV || 'development',
  corsOrigin:  process.env.CORS_ORIGIN || 'http://localhost:3000',

  db: {
    host:      process.env.DB_HOST,
    port:      parseInt(process.env.DB_PORT, 10),
    database:  process.env.DB_NAME,
    user:      process.env.DB_USER,
    password:  process.env.DB_PASSWORD,
  },

  jwt: {
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
});
