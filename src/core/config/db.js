// ─────────────────────────────────────────────────────────────
// src/core/config/db.js
// Pool de conexiones PostgreSQL con helpers para queries
// simples y transacciones manuales (BEGIN / COMMIT / ROLLBACK).
// ─────────────────────────────────────────────────────────────
import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

const poolConfig = config.db.connectionString
  ? {
      connectionString: config.db.connectionString,
      ssl: (process.env.DB_SSL === 'true' || !config.db.connectionString.includes('localhost'))
        ? { rejectUnauthorized: false }
        : false,
    }
  : {
      host:     config.db.host,
      port:     config.db.port,
      database: config.db.database,
      user:     config.db.user,
      password: config.db.password,
      ssl:      (process.env.DB_SSL === 'true' || config.db.host !== 'localhost')
        ? { rejectUnauthorized: false }
        : false,
    };

/** Pool global de conexiones. */
const pool = new Pool({
  ...poolConfig,
  // Pool tuning: conexiones suficientes para el MVP hospitalario y resiliencia en la nube
  max:                     20,
  idleTimeoutMillis:       30_000,
  connectionTimeoutMillis: 15_000,
});

// Log de conexión inicial al arrancar.
pool.on('error', (err) => {
  console.error('[DB] [ERROR] Error inesperado en el pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta un query simple contra el pool.
 * @param {string} text  - SQL parametrizado ($1, $2…).
 * @param {any[]}  params - Valores para los placeholders.
 * @returns {Promise<pg.QueryResult>}
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Obtiene un cliente individual del pool para transacciones manuales.
 * @returns {Promise<pg.PoolClient>}
 */
export const getClient = () => pool.connect();

/**
 * Verifica la conexión a la base de datos con reintentos automáticos para bases de datos en la nube.
 * @param {number} retries - Cantidad de intentos (default 4).
 * @param {number} delayMs - Espera entre intentos (default 3000ms).
 * @returns {Promise<boolean>}
 */
export const testConnection = async (retries = 4, delayMs = 3000) => {
  for (let intento = 1; intento <= retries; intento++) {
    try {
      const result = await pool.query('SELECT NOW() AS server_time');
      console.log(
        `[DB] [OK] PostgreSQL conectado exitosamente — Servidor DB: ${result.rows[0].server_time}`
      );
      return true;
    } catch (err) {
      console.warn(`[DB] [WARN] Intento de conexión ${intento}/${retries} falló (${err.message})...`);
      if (intento < retries) {
        console.log(`[DB] [INFO] Reintentando conexión en ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error('[DB] [ERROR] No se pudo conectar a PostgreSQL tras varios reintentos:', err.message);
      }
    }
  }
  return false;
};

/**
 * Cierra ordenadamente el pool de conexiones.
 * @returns {Promise<void>}
 */
export const closePool = () => pool.end();

export default pool;
