// ─────────────────────────────────────────────────────────────
// scripts/seed.js
// Ejecutor del script de semillado de datos sintéticos.
// Uso: npm run db:seed
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../src/core/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_FILE = path.join(__dirname, '..', 'sql', '004_seed_data.sql');

const runSeed = async () => {
  console.log('[SEED] Insertando datos sinteticos de prueba...');

  try {
    const sql = fs.readFileSync(SEED_FILE, 'utf-8');
    await query(sql);

    const usersCount = await query('SELECT COUNT(*) FROM usuarios');
    const locationsCount = await query('SELECT COUNT(*) FROM ubicaciones');

    console.log(`[SEED] [OK] Usuarios registrados en BD: ${usersCount.rows[0].count}`);
    console.log(`[SEED] [OK] Ubicaciones registradas en BD: ${locationsCount.rows[0].count}`);
    console.log('[SEED] [SUCCESS] Semillado completado con exito.');
    process.exit(0);
  } catch (err) {
    console.error('[SEED] [ERROR] durante el semillado:', err.message);
    process.exit(1);
  }
};

runSeed();
