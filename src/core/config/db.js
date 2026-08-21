// ─────────────────────────────────────────────────────────────
// src/core/config/db.js
// Pool de conexiones PostgreSQL con helpers para queries
// simples y transacciones manuales (BEGIN / COMMIT / ROLLBACK).
// ─────────────────────────────────────────────────────────────
import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

/** Pool global de conexiones. */
const pool = new Pool({
  host:     config.db.host,
  port:     config.db.port,
  database: config.db.database,
  user:     config.db.user,
  password: config.db.password,

  // Pool tuning: conexiones suficientes para el MVP hospitalario.
  max:                20,
  idleTimeoutMillis:  30_000,
  connectionTimeoutMillis: 5_000,
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
 * USO:
 *   const client = await getClient();
 *   try {
 *     await client.query('BEGIN');
 *     // ... queries ...
 *     await client.query('COMMIT');
 *   } catch (err) {
 *     await client.query('ROLLBACK');
 *     throw err;
 *   } finally {
 *     client.release();
 *   }
 * @returns {Promise<pg.PoolClient>}
 */
export const getClient = () => pool.connect();

/**
 * Verifica la conexión a la base de datos.
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() AS server_time');
    console.log(
      `[DB] [OK] PostgreSQL conectado — ${config.db.host}:${config.db.port}/${config.db.database} — ${result.rows[0].server_time}`
    );
    return true;
  } catch (err) {
    console.error('[DB] [ERROR] No se pudo conectar a PostgreSQL:', err.message);
    return false;
  }
};

export default pool;
