// Sirena de pánico basada en Web Audio API (sin dependencias externas).
// prime() debe invocarse desde un gesto del usuario para desbloquear el
// AudioContext; start()/stop() controlan la alarma continua.

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let modulationTimer = null;

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
    const ctx = ensureContext();
    if (ctx.state === 'suspended') await ctx.resume();
  },

  async start() {
    if (oscillator) return;
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
  },

  stop() {
    if (modulationTimer) {
      clearInterval(modulationTimer);
      modulationTimer = null;
    }
    if (oscillator) {
      try { oscillator.stop(); } catch { /* nodo ya detenido */ }
      oscillator.disconnect();
      oscillator = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
  },
};
