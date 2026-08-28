// ─────────────────────────────────────────────────────────────
// scripts/stop-all.js
// Script universal para detener los servidores y procesos de Código Azul.
// Libera el puerto configurado (3000) y detiene los procesos Node asociados.
// ─────────────────────────────────────────────────────────────
import { execSync } from 'node:child_process';
import { config } from '../src/core/config/env.js';

console.log('===========================================================');
console.log('   DETENIENDO SERVICIOS DE CODIGO AZUL                    ');
console.log('===========================================================');

const PORT = config.port || 3000;

export function liberarPuerto(puerto) {
  console.log(`[*] Verificando procesos en el puerto ${puerto}...`);
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${puerto}`, { encoding: 'utf-8' });
      const lineas = output.trim().split('\n');
      const pids = new Set();

      lineas.forEach((linea) => {
        const partes = linea.trim().split(/\s+/);
        if (partes.length >= 5) {
          const pid = partes[partes.length - 1];
          if (pid && pid !== '0' && /^\d+$/.test(pid)) {
            pids.add(pid);
          }
        }
      });

      if (pids.size > 0) {
        pids.forEach((pid) => {
          try {
            console.log(`    Terminando proceso PID ${pid}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
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
  } catch {
    console.log(`    No se detectaron procesos ocupando el puerto ${puerto}.`);
  }
}

try {
  liberarPuerto(PORT);
  console.log('===========================================================');
  console.log('   TODOS LOS SERVICIOS FUERON DETENIDOS SATISFACTORIAMENTE ');
  console.log('===========================================================');
} catch (error) {
  console.error('Error al detener los servicios:', error.message);
  process.exit(1);
}
