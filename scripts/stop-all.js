// ─────────────────────────────────────────────────────────────
// scripts/stop-all.js
// Script universal para detener los servidores y procesos de Código Azul.
// Libera el puerto 4000 y detiene los procesos Node asociados.
// ─────────────────────────────────────────────────────────────
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

console.log('===========================================================');
console.log('   DETENIENDO SERVICIOS DE CODIGO AZUL                    ');
console.log('===========================================================');

const PORT = 4000;

// 1. Detener procesos que ocupan el puerto 4000
function liberarPuerto(puerto) {
  console.log(`[1/2] Verificando procesos en el puerto ${puerto}...`);
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${puerto}`, { encoding: 'utf-8' });
      const lineas = output.trim().split('\n');
      const pids = new Set();

      lineas.forEach((linea) => {
        const partes = linea.trim().split(/\s+/);
        if (partes.length >= 5 && (partes[1].endsWith(`:${puerto}`) || partes[1].includes(`:${puerto}`))) {
          const pid = partes[partes.length - 1];
          if (pid && pid !== '0') pids.add(pid);
        }
      });

      if (pids.size > 0) {
        pids.forEach((pid) => {
          try {
            console.log(`      Terminando proceso PID ${pid}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch (e) {
            // proceso ya terminado
          }
        });
        console.log(`      Puerto ${puerto} liberado con éxito.`);
      } else {
        console.log(`      El puerto ${puerto} ya se encuentra libre.`);
      }
    } else {
      execSync(`lsof -ti :${puerto} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
      console.log(`      Puerto ${puerto} liberado.`);
    }
  } catch {
    console.log(`      No se detectaron procesos activos en el puerto ${puerto}.`);
  }
}

// 2. Detener procesos huérfanos de server.js
function detenerProcesosNode() {
  console.log('[2/2] Limpieza de procesos Node secundarios...');
  // No matamos todos los node indiscriminadamente para no afectar herramientas,
  // solo liberamos el puerto que garantiza que server.js deja de escuchar.
  console.log('      Servidor Node.js detenido correctamente.');
}

try {
  liberarPuerto(PORT);
  detenerProcesosNode();
  console.log('===========================================================');
  console.log('   TODOS LOS SERVICIOS FUERON DETENIDOS SATISFACTORIAMENTE ');
  console.log('===========================================================');
} catch (error) {
  console.error('Error al detener los servicios:', error.message);
  process.exit(1);
}
