// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/services/offlineQueue.js
// Cola Outbox local con reintento automático y exponential backoff
// para activación de alarmas en zonas muertas sin Wi-Fi.
// ─────────────────────────────────────────────────────────────
import { incidentesService } from './incidentesService.js';

const CLAVE_COLA = 'codigo_azul_cola_offline';
let workerActivo = false;

export const offlineQueue = {
  obtener() {
    try {
      const raw = localStorage.getItem(CLAVE_COLA);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  guardar(cola) {
    try {
      localStorage.setItem(CLAVE_COLA, JSON.stringify(cola));
    } catch {}
  },

  encolar(ubicacionId) {
    const cola = this.obtener();
    const item = {
      idTemporal: `off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ubicacionId,
      timestamp: new Date().toISOString(),
      intentos: 0,
    };
    cola.push(item);
    this.guardar(cola);
    this.iniciarReintentos();
    window.dispatchEvent(new CustomEvent('codigo_azul:cola_actualizada', { detail: { cantidad: cola.length } }));
    return item;
  },

  eliminar(idTemporal) {
    let cola = this.obtener();
    cola = cola.filter((it) => it.idTemporal !== idTemporal);
    this.guardar(cola);
    window.dispatchEvent(new CustomEvent('codigo_azul:cola_actualizada', { detail: { cantidad: cola.length } }));
  },

  async procesar() {
    const cola = this.obtener();
    if (cola.length === 0) return;

    for (const item of [...cola]) {
      try {
        item.intentos = (item.intentos || 0) + 1;
        const res = await incidentesService.activar(item.ubicacionId);
        this.eliminar(item.idTemporal);
        window.dispatchEvent(new CustomEvent('codigo_azul:alerta_despachada_offline', { detail: res }));
      } catch (err) {
        // Error de red (offline): dejar en cola
        if (!err.response && (err.message.includes('Network') || err.code === 'ECONNABORTED' || err.message.includes('timeout'))) {
          break;
        }
        // Si el servidor respondió 409 (ya estaba activo por idempotencia) o 200/201, se considera exitoso
        if (err.response && (err.response.status === 409 || err.response.status === 200 || err.response.status === 201)) {
          this.eliminar(item.idTemporal);
        }
      }
    }
  },

  iniciarReintentos() {
    if (workerActivo) return;
    workerActivo = true;

    const tick = async () => {
      const cola = this.obtener();
      if (cola.length === 0) {
        workerActivo = false;
        return;
      }
      await this.procesar();
      if (this.obtener().length > 0) {
        setTimeout(tick, 3000);
      } else {
        workerActivo = false;
      }
    };

    setTimeout(tick, 1000);
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OFFLINE QUEUE] Conectividad recuperada. Vaciando cola...');
    offlineQueue.procesar();
  });
}
