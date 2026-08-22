// ─────────────────────────────────────────────────────────────
// scripts/start-all.js
// Script universal para iniciar PostgreSQL, verificar la base de datos
// y arrancar el servidor backend con dashboard y app móvil integrados.
// ─────────────────────────────────────────────────────────────
import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { config } from '../src/core/config/env.js';

console.log('===========================================================');
console.log('   INICIANDO SISTEMA CODIGO AZUL — HOSPITAL MUNICIPAL     ');
console.log('===========================================================');

// 1. Iniciar PostgreSQL si está detenido en Windows
function verificarOIniciarPostgres() {
  console.log('[1/3] Verificando estado de PostgreSQL...');
  const pgCtlPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe';
  const pgDataPath = 'C:\\Program Files\\PostgreSQL\\18\\data';

  if (existsSync(pgCtlPath) && existsSync(pgDataPath)) {
    try {
      execSync(`"${pgCtlPath}" status -D "${pgDataPath}"`, { stdio: 'ignore' });
      console.log('      PostgreSQL ya se encuentra en ejecución.');
    } catch {
      console.log('      Iniciando servicio de PostgreSQL 18...');
      try {
        execSync(`"${pgCtlPath}" start -D "${pgDataPath}" -w`, { stdio: 'inherit' });
        console.log('      PostgreSQL iniciado correctamente.');
      } catch (err) {
        console.warn('      Aviso al iniciar pg_ctl:', err.message);
      }
    }
  } else {
    console.log('      PostgreSQL (ruta estándar de pg_ctl no encontrada, usando conexión TCP)...');
  }
}

// 2. Ejecutar Migraciones y Seeds si es necesario
function prepararBaseDeDatos() {
  console.log('[2/3] Verificando esquema y datos iniciales en PostgreSQL...');
  try {
    execSync('node scripts/migrate.js', { stdio: 'inherit' });
    execSync('node scripts/seed.js', { stdio: 'inherit' });
    console.log('      Base de datos lista con usuarios y ubicaciones.');
  } catch (err) {
    console.warn('      Aviso en migración/seed:', err.message);
  }
}

// 3. Arrancar Servidor Node.js
function arrancarServidor() {
  console.log('[3/3] Iniciando Servidor Backend y WebSockets en puerto ' + config.port + '...');
  
  const serverProcess = spawn('node', ['src/server.js'], {
    stdio: 'inherit',
    shell: true,
  });

  serverProcess.on('error', (err) => {
    console.error('Error al iniciar el servidor:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Servidor finalizado con código: ${code}`);
  });
}

// Ejecución secuencial
try {
  verificarOIniciarPostgres();
  prepararBaseDeDatos();
  arrancarServidor();
} catch (error) {
  console.error('Error general al iniciar el sistema:', error);
  process.exit(1);
}
