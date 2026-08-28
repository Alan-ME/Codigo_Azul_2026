// ─────────────────────────────────────────────────────────────
// client/src/services/soundService.js
// Sirena Web Audio API con control de silencio, WakeLock y vibración háptica.
// ─────────────────────────────────────────────────────────────

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let modulationTimer = null;
let estaSilenciado = false;
let wakeLockSentinel = null;

function ensureContext() {
  if (audioCtx) return audioCtx;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error('Web Audio API no soportada por el navegador.');
  }
  audioCtx = new AudioContextCtor();
  return audioCtx;
}

// Auto-desbloquear AudioContext en la primera interacción del usuario en la pantalla
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = ensureContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch { }
    ['click', 'touchstart', 'pointerdown', 'keydown'].forEach((evt) => {
      window.removeEventListener(evt, unlockAudio);
    });
  };
  ['click', 'touchstart', 'pointerdown', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { once: true, passive: true });
  });
}

export const soundService = {
  async prime() {
    try {
      const ctx = ensureContext();
      if (ctx.state === 'suspended') await ctx.resume();
    } catch {
      // Ignorar restricciones de autoplay
    }
  },

  async start() {
    if (estaSilenciado) return;
    if (oscillator) return;

    try {
      const ctx = ensureContext();
      if (ctx.state === 'suspended') await ctx.resume();

      oscillator = ctx.createOscillator();
      gainNode = ctx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.22, ctx.currentTime);

      oscillator.connect(gainNode).connect(ctx.destination);
      oscillator.start();

      let alta = true;
      modulationTimer = setInterval(() => {
        if (!oscillator || !audioCtx) return;
        oscillator.frequency.setValueAtTime(alta ? 660 : 880, audioCtx.currentTime);
        alta = !alta;
      }, 380);

      // Activar WakeLock para mantener la pantalla encendida durante la emergencia
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then((lock) => {
          wakeLockSentinel = lock;
        }).catch(() => { });
      }

      // Vibración háptica de emergencia en celulares
      try {
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
          navigator.vibrate([400, 200, 400, 200, 600]);
        }
      } catch { }
    } catch {
      // AudioContext bloqueado hasta interacción de usuario
    }
  },

  stop() {
    if (modulationTimer) {
      clearInterval(modulationTimer);
      modulationTimer = null;
    }
    if (gainNode) {
      try {
        if (audioCtx) {
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        }
        gainNode.disconnect();
      } catch { }
      gainNode = null;
    }
    if (oscillator) {
      try {
        oscillator.stop(0);
      } catch { }
      try {
        oscillator.disconnect();
      } catch { }
      oscillator = null;
    }
    if (audioCtx && audioCtx.state === 'running') {
      try {
        audioCtx.suspend().catch(() => { });
      } catch { }
    }

    // Liberar WakeLock de pantalla
    if (wakeLockSentinel) {
      try {
        wakeLockSentinel.release();
      } catch { }
      wakeLockSentinel = null;
    }

    // Detener vibración de forma segura
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
      }
    } catch { }
  },

  silenciar() {
    estaSilenciado = true;
    this.stop();
  },

  reactivar() {
    estaSilenciado = false;
    this.start().catch(() => { });
  },

  isSilenciado() {
    return estaSilenciado;
  },

  isPlaying() {
    return !!oscillator;
  },
};
