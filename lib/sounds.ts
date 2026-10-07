/** Tiny synthesized sound effects for lessons — no audio files to ship. */

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.12) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + start;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(gain, t + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export const sfx = {
  correct() {
    tone(660, 0, 0.14, "triangle");
    tone(990, 0.09, 0.22, "triangle");
  },
  wrong() {
    tone(220, 0, 0.18, "sawtooth", 0.06);
    tone(160, 0.12, 0.26, "sawtooth", 0.06);
  },
  tap() {
    tone(520, 0, 0.06, "sine", 0.05);
  },
  complete() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, "triangle", 0.1));
  },
  levelUp() {
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.35, "square", 0.05));
  },
};
