// ─────────────────────────────────────────────────────────────
// src/core/config/env.js
// Carga y validación centralizada de variables de entorno.
// Soporta DATABASE_URL (Railway/Render/Supabase) o variables individuales.
// ─────────────────────────────────────────────────────────────
import 'dotenv/config';

// 1. Defaults seguros para servidor
process.env.PORT = process.env.PORT || '3000';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'codigo_azul_jwt_super_secret_key_onetp_2026';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// 2. Si DATABASE_URL está definida, autocompletar variables individuales si se pueden parsear
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    process.env.DB_HOST = process.env.DB_HOST || url.hostname;
    process.env.DB_PORT = process.env.DB_PORT || url.port || '5432';
    process.env.DB_USER = process.env.DB_USER || decodeURIComponent(url.username || '');
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || decodeURIComponent(url.password || '');
    process.env.DB_NAME = process.env.DB_NAME || url.pathname.replace(/^\//, '') || 'postgres';
  } catch (_) {
    // Si no es un formato URL estándar, pg.Pool usará DATABASE_URL directamente como connectionString
  }
}

// 3. Validar si existe al menos un método de conexión a Base de Datos
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasIndividualDbVars = Boolean(
  process.env.DB_HOST &&
  process.env.DB_NAME &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD
);

if (!hasDatabaseUrl && !hasIndividualDbVars) {
  console.error('[ENV] [ERROR] No se configuraron las credenciales de la Base de Datos PostgreSQL.');
  console.error('[ENV] [HINT] Agregue la variable DATABASE_URL en su panel de despliegue (Render / Railway / Docker).');
  console.error('[ENV] [HINT] Ejemplo: DATABASE_URL=postgresql://postgres:password@host:5432/postgres');
  process.exit(1);
}

/** Objeto de configuración inmutable (deep frozen). */
export const config = Object.freeze({
  port:        parseInt(process.env.PORT, 10),
  nodeEnv:     process.env.NODE_ENV,
  corsOrigin:  process.env.CORS_ORIGIN || 'http://localhost:3000',

  db: Object.freeze({
    host:      process.env.DB_HOST || 'localhost',
    port:      parseInt(process.env.DB_PORT || '5432', 10),
    database:  process.env.DB_NAME || 'postgres',
    user:      process.env.DB_USER || 'postgres',
    password:  process.env.DB_PASSWORD || '',
    connectionString: process.env.DATABASE_URL || null,
  }),

  jwt: Object.freeze({
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  }),
});
