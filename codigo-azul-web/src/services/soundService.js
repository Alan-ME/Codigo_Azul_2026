// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/services/soundService.js
// Sirena Web Audio API con control de silencio y reactivación.
// ─────────────────────────────────────────────────────────────

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let modulationTimer = null;
let estaSilenciado = false;

function ensureContext() {
  if (audioCtx) return audioCtx;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error('Web Audio API no soportada por el navegador.');
  }
  audioCtx = new AudioContextCtor();
  return audioCtx;
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
    } catch {
      // AudioContext bloqueado hasta interacción de usuario
    }
  },

  stop() {
    if (modulationTimer) {
      clearInterval(modulationTimer);
      modulationTimer = null;
    }
    if (oscillator) {
      try {
        oscillator.stop();
      } catch {
        // Ignorar
      }
      try {
        oscillator.disconnect();
      } catch {
        // Ignorar
      }
      oscillator = null;
    }
    if (gainNode) {
      try {
        gainNode.disconnect();
      } catch {
        // Ignorar
      }
      gainNode = null;
    }
  },

  silenciar() {
    estaSilenciado = true;
    this.stop();
  },

  reactivar() {
    estaSilenciado = false;
    this.start().catch(() => {});
  },

  isSilenciado() {
    return estaSilenciado;
  },

  isPlaying() {
    return !!oscillator;
  },
};
