// Sound chime generator using Web Audio API with shared unlocked AudioContext
let globalAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!globalAudioCtx || globalAudioCtx.state === "closed") {
    globalAudioCtx = new AudioContextClass();
  }
  if (globalAudioCtx.state === "suspended") {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

// Unlock audio on any initial user touch/click
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
}

export function playNewOrderSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const playChimeSequence = (offset: number) => {
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + offset + start);
        gain.gain.setValueAtTime(0.7, ctx.currentTime + offset + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset + start);
        osc.stop(ctx.currentTime + offset + start + duration);
      };

      // Upbeat 3-note melodic POS chime (D5 -> F#5 -> A5)
      playTone(587.33, 0.0, 0.20);
      playTone(739.99, 0.12, 0.20);
      playTone(880.00, 0.24, 0.40);
    };

    // Double POS chime sequence (Ding-Ding-Ding ... Ding-Ding-Ding)
    playChimeSequence(0.0);
    playChimeSequence(0.55);

    // Vibrate device if supported (Android / mobile)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([300, 100, 300, 100, 300]);
      } catch (err) {}
    }
  } catch (e) {
    console.error("Audio chime error:", e);
  }
}
