let audioCtx: AudioContext | null = null;
let ambientNode: AudioBufferSourceNode | null = null;
let ambientGain: GainNode | null = null;
let isMuted = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function createOscillator(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  startTime: number,
  duration: number,
  gain: number = 0.3
): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playClickSound(muted: boolean = false): void {
  if (muted) return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    // A satisfying dough thud: low thump + quick pitch drop
    createOscillator(ctx, "sine", 180, t, 0.08, 0.4);
    createOscillator(ctx, "sine", 120, t + 0.01, 0.12, 0.2);
    // small high tick
    createOscillator(ctx, "square", 800, t, 0.02, 0.06);
  } catch {
    // ignore
  }
}

export function playCoinSound(muted: boolean = false): void {
  if (muted) return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    createOscillator(ctx, "sine", 660, t, 0.08, 0.15);
    createOscillator(ctx, "sine", 880, t + 0.05, 0.08, 0.1);
  } catch {
    // ignore
  }
}

export function playPurchaseSound(muted: boolean = false): void {
  if (muted) return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    // Ascending chord: purchase fanfare
    [440, 550, 660, 880].forEach((freq, i) => {
      createOscillator(ctx, "sine", freq, t + i * 0.06, 0.2, 0.2);
    });
  } catch {
    // ignore
  }
}

export function playMilestoneSound(muted: boolean = false, type: "chime" | "fanfare" | "trumpet" = "fanfare"): void {
  if (muted) return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;

    if (type === "chime") {
      [523, 659, 784, 1047].forEach((f, i) => {
        createOscillator(ctx, "sine", f, t + i * 0.1, 0.4, 0.25);
      });
    } else if (type === "fanfare") {
      // Triumphant fanfare sequence
      const notes = [523, 659, 784, 1047, 784, 1047, 1175, 1047];
      notes.forEach((f, i) => {
        createOscillator(ctx, "sawtooth", f, t + i * 0.1, 0.15, 0.15);
        createOscillator(ctx, "sine", f * 1.5, t + i * 0.1, 0.15, 0.08);
      });
    } else if (type === "trumpet") {
      // Full celebration: big triumphant chord progression
      const progression = [
        [523, 659, 784],
        [587, 740, 880],
        [659, 830, 988],
        [784, 988, 1175],
      ];
      progression.forEach(([f1, f2, f3], i) => {
        createOscillator(ctx, "sawtooth", f1, t + i * 0.2, 0.3, 0.15);
        createOscillator(ctx, "sawtooth", f2, t + i * 0.2, 0.3, 0.12);
        createOscillator(ctx, "sawtooth", f3, t + i * 0.2, 0.3, 0.1);
      });
    }
  } catch {
    // ignore
  }
}

export function startAmbientSound(muted: boolean = false): void {
  if (muted) {
    isMuted = true;
    return;
  }
  isMuted = false;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    if (ambientNode) return; // Already running

    // Create looping ambient kitchen noise using noise generators
    const bufferSize = ctx.sampleRate * 4; // 4 second buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Kitchen ambient: low-frequency rumble + occasional sizzle sounds
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(0.04, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;

    ambientNode = ctx.createBufferSource();
    ambientNode.buffer = buffer;
    ambientNode.loop = true;
    ambientNode.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);
    ambientNode.start();
  } catch {
    // ignore
  }
}

export function stopAmbientSound(): void {
  try {
    if (ambientGain) {
      ambientGain.gain.setValueAtTime(ambientGain.gain.value, audioCtx!.currentTime);
      ambientGain.gain.exponentialRampToValueAtTime(0.001, audioCtx!.currentTime + 0.5);
    }
    setTimeout(() => {
      if (ambientNode) {
        ambientNode.stop();
        ambientNode = null;
      }
    }, 600);
  } catch {
    // ignore
  }
}

export function setMuted(muted: boolean): void {
  isMuted = muted;
  if (muted) {
    stopAmbientSound();
  } else {
    startAmbientSound(false);
  }
}

export function resumeAudio(): void {
  try {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  } catch {
    // ignore
  }
}
