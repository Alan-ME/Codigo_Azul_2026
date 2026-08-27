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

  // Migraciones DDL idempotentes para bases de datos preexistentes
  try {
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resultado_clinico') THEN
          CREATE TYPE resultado_clinico AS ENUM (
            'ROSC_EXITOSO',
            'DESFIBRILACION_EFECTIVA',
            'TRASLADO_UTI',
            'FALLECIDO_DOA',
            'FALSA_ALARMA'
          );
        END IF;
      END $$;

      ALTER TABLE ubicaciones
        ADD COLUMN IF NOT EXISTS tiene_carro_paro BOOLEAN NOT NULL DEFAULT false;

      ALTER TABLE incidentes
        ADD COLUMN IF NOT EXISTS resultado_clinico resultado_clinico;
    `);
    console.log('[MIGRATE] [OK]: DDL idempotente (tiene_carro_paro, resultado_clinico) verificado.');
  } catch (err) {
    console.error('[MIGRATE] [ERROR] en DDL idempotente:', err.message);
    process.exit(1);
  }

  console.log('[MIGRATE] [SUCCESS] Todas las migraciones fueron ejecutadas con exito.');
  process.exit(0);
};

runMigrations();
