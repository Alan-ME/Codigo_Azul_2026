// ─────────────────────────────────────────────────────────────
// scripts/stop-all.js
// Script universal para detener los servidores y procesos de Código Azul.
// Libera los puertos (3000, 5173, 4173) y detiene los procesos asociados.
// ─────────────────────────────────────────────────────────────
import { execSync } from 'node:child_process';
import { config } from '../src/core/config/env.js';

console.log('===========================================================');
console.log('   DETENIENDO SERVICIOS DE CODIGO AZUL                    ');
console.log('===========================================================');

const PORT = config.port || 3000;
const PUERTOS = [PORT, 5173, 4173];

export function liberarPuerto(puerto) {
  console.log(`[*] Verificando procesos en el puerto ${puerto}...`);
  try {
    if (process.platform === 'win32') {
      let output = '';
      try {
        output = execSync(`netstat -ano | findstr :${puerto}`, { encoding: 'utf-8' });
      } catch {
        console.log(`    El puerto ${puerto} ya se encuentra libre.`);
        return;
      }

      const lineas = output.trim().split('\n');
      const pids = new Set();

      lineas.forEach((linea) => {
        const partes = linea.trim().split(/\s+/);
        if (partes.length >= 5) {
          const localAddr = partes[1];
          if (localAddr.endsWith(`:${puerto}`) || localAddr.includes(`:${puerto}`)) {
            const pid = partes[partes.length - 1];
            if (pid && pid !== '0' && /^\d+$/.test(pid) && Number(pid) !== process.pid) {
              pids.add(pid);
            }
          }
        }
      });

      if (pids.size > 0) {
        pids.forEach((pid) => {
          try {
            console.log(`    Terminando proceso PID ${pid} (árbol completo)...`);
            execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
          } catch {
            // proceso ya terminado
          }
        });
        console.log(`    Puerto ${puerto} liberado con éxito.`);
      } else {
        console.log(`    El puerto ${puerto} ya se encuentra libre.`);
      }
    } else {
      execSync(`lsof -ti :${puerto} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
      console.log(`    Puerto ${puerto} liberado.`);
    }
  } catch (err) {
    console.log(`    Aviso en puerto ${puerto}: ${err.message}`);
  }
}

try {
  PUERTOS.forEach((p) => liberarPuerto(p));
  console.log('===========================================================');
  console.log('   TODOS LOS SERVICIOS FUERON DETENIDOS SATISFACTORIAMENTE ');
  console.log('===========================================================');
} catch (error) {
  console.error('Error al detener los servicios:', error.message);
  process.exit(1);
}
