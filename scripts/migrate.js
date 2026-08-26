// ─────────────────────────────────────────────────────────────
// scripts/migrate.js
// Ejecutor de migraciones DDL secuenciales sobre PostgreSQL.
// Uso: npm run db:migrate
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../src/core/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_DIR = path.join(__dirname, '..', 'sql');

const MIGRATION_FILES = [
  '001_create_enums.sql',
  '002_create_tables.sql',
  '003_create_triggers.sql',
  '005_create_fcm_tokens.sql',
];

const runMigrations = async () => {
  console.log('[MIGRATE] Iniciando ejecucion de migraciones DDL...');

  for (const file of MIGRATION_FILES) {
    const filePath = path.join(SQL_DIR, file);
    console.log(`[MIGRATE] Ejecutando: ${file}...`);

    try {
      const sql = fs.readFileSync(filePath, 'utf-8');
      await query(sql);
      console.log(`[MIGRATE] [OK]: ${file}`);
    } catch (err) {
      console.error(`[MIGRATE] [ERROR] en archivo ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log('[MIGRATE] [SUCCESS] Todas las migraciones fueron ejecutadas con exito.');
  process.exit(0);
};

runMigrations();
