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

const PORT = config.port || 3000;

// 0. Liberar puerto si estaba ocupado
function liberarPuertoSiOcupado() {
  console.log(`[0/3] Verificando disponibilidad del puerto ${PORT}...`);
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8' });
      const lineas = output.trim().split('\n');
      const pids = new Set();

      lineas.forEach((linea) => {
        const partes = linea.trim().split(/\s+/);
        if (partes.length >= 5 && (partes[1].endsWith(`:${PORT}`) || partes[1].includes(`:${PORT}`))) {
          const pid = partes[partes.length - 1];
          if (pid && pid !== '0') pids.add(pid);
        }
      });

      if (pids.size > 0) {
        pids.forEach((pid) => {
          try {
            console.log(`      Liberando proceso anterior en puerto ${PORT} (PID ${pid})...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch {
            // Ignorar
          }
        });
      }
    }
  } catch {
    // Puerto libre
  }
}

// 1. Iniciar PostgreSQL si está detenido en Windows
function verificarOIniciarPostgres() {
  console.log('[1/3] Verificando estado de PostgreSQL...');
  try {
    const netstatOutput = execSync(`netstat -ano | findstr :${config.db.port || 5432}`, { stdio: 'pipe' }).toString();
    if (netstatOutput.includes('LISTENING')) {
      console.log('      PostgreSQL ya se encuentra en ejecución (servicio activo).');
      return;
    }
  } catch {
    // Puerto no abierto todavía
  }

  const pgCtlPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe';
  const pgDataPath = 'C:\\Program Files\\PostgreSQL\\18\\data';

  if (existsSync(pgCtlPath) && existsSync(pgDataPath)) {
    console.log('      Iniciando servicio de PostgreSQL 18...');
    try {
      execSync(`"${pgCtlPath}" start -D "${pgDataPath}" -w`, { stdio: 'inherit' });
      console.log('      PostgreSQL iniciado correctamente.');
    } catch (err) {
      console.warn('      Aviso al iniciar pg_ctl:', err.message);
    }
  } else {
    console.log('      PostgreSQL (usando conexión TCP)...');
  }
}

// 2. Ejecutar Migraciones, Seeds y verificar Frontend
function prepararBaseDeDatos() {
  console.log('[2/3] Verificando esquema, datos iniciales y frontend...');
  try {
    execSync('node scripts/migrate.js', { stdio: 'inherit' });
    execSync('node scripts/seed.js', { stdio: 'inherit' });
    console.log('      Base de datos lista con usuarios y ubicaciones.');
  } catch (err) {
    console.warn('      Aviso en migración/seed:', err.message);
  }

  const distPath = 'client/dist';
  if (!existsSync(distPath)) {
    console.log('      Compilando frontend React...');
    try {
      execSync('npm run build:web', { stdio: 'inherit' });
      console.log('      Frontend compilado con éxito.');
    } catch (err) {
      console.warn('      Aviso al compilar frontend:', err.message);
    }
  }
}

// 3. Arrancar Servidor Node.js
function arrancarServidor() {
  console.log('[3/3] Iniciando Servidor Backend y WebSockets en puerto ' + PORT + '...');

  const serverProcess = spawn('node', ['src/server.js'], {
    stdio: 'inherit',
    shell: false,
  });

  const cleanup = () => {
    try {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    } catch (_) {}
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  serverProcess.on('error', (err) => {
    console.error('Error al iniciar el servidor:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Servidor finalizado con código: ${code}`);
    process.exit(code || 0);
  });
}

// Ejecución secuencial
try {
  liberarPuertoSiOcupado();
  verificarOIniciarPostgres();
  prepararBaseDeDatos();
  arrancarServidor();
} catch (error) {
  console.error('Error general al iniciar el sistema:', error);
  process.exit(1);
}
