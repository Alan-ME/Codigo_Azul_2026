/**
 * Alarma sonora crítica.
 *
 * En web se genera con Web Audio API (dos tonos alternados para dar la sensación
 * de sirena hospitalaria) y se combina con Wake Lock para mantener la pantalla
 * encendida como pide la Fase 3.
 *
 * En React Native el mismo servicio se implementa con Notifee (sonido continuo
 * en un canal Importance.HIGH) y expo-keep-awake.
 */
class SonidoCritico {
  constructor() {
    this.ctx = null;
    this.oscilador = null;
    this.ganancia = null;
    this.wakeLock = null;
    this.temporizadorTono = null;
    this.sonando = false;
    this.frecuencias = [880, 660];
    this.indice = 0;
  }

  _asegurarCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  /**
   * Prepara el AudioContext sin emitir sonido, aprovechando un gesto del
   * usuario. Necesario porque la política de autoplay bloquea audio si el
   * contexto se crea fuera de un gesto.
   */
  despertar() {
    try { this._asegurarCtx(); } catch { /* silencioso */ }
  }

  async iniciar() {
    if (this.sonando) return;
    const ctx = this._asegurarCtx();

    this.ganancia = ctx.createGain();
    this.ganancia.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.ganancia.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.05);
    this.ganancia.connect(ctx.destination);

    this.oscilador = ctx.createOscillator();
    this.oscilador.type = "square";
    this.oscilador.frequency.value = this.frecuencias[0];
    this.oscilador.connect(this.ganancia);
    this.oscilador.start();

    this.indice = 0;
    this.temporizadorTono = setInterval(() => {
      if (!this.oscilador) return;
      this.indice = (this.indice + 1) % this.frecuencias.length;
      this.oscilador.frequency.setValueAtTime(
        this.frecuencias[this.indice],
        this.ctx.currentTime,
      );
    }, 400);

    this.sonando = true;
    await this._tomarWakeLock();
  }

  detener() {
    if (!this.sonando) return;
    clearInterval(this.temporizadorTono);
    this.temporizadorTono = null;

    if (this.ganancia && this.ctx) {
      const ahora = this.ctx.currentTime;
      this.ganancia.gain.cancelScheduledValues(ahora);
      this.ganancia.gain.setValueAtTime(this.ganancia.gain.value, ahora);
      this.ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.06);
    }
    if (this.oscilador) {
      try { this.oscilador.stop(this.ctx.currentTime + 0.08); } catch {}
      this.oscilador = null;
    }
    this.sonando = false;
    this._liberarWakeLock();
  }

  async _tomarWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
      this.wakeLock = await navigator.wakeLock.request("screen");
      this.wakeLock.addEventListener?.("release", () => (this.wakeLock = null));
    } catch {
      this.wakeLock = null;
    }
  }

  _liberarWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release?.().catch(() => {});
      this.wakeLock = null;
    }
  }
}

export const Sonido = new SonidoCritico();
