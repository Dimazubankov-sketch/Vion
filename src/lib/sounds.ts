/**
 * Original UI sounds, synthesised with the Web Audio API.
 *
 * Nothing is sampled or downloaded — every cue is a few oscillators shaped by
 * a gain envelope, so there are no audio files to ship and no third-party
 * audio licensing involved.
 */

export type SoundName =
  | "tap"
  | "toggle"
  | "sent"
  | "received"
  | "recordStart"
  | "recordStop"
  | "callStart"
  | "callEnd"
  | "gameWin"
  | "gameLose"
  | "error"
  | "success";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    // Browsers start the context suspended until a gesture unlocks it.
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Note {
  /** Hz at the start of the note. */
  freq: number;
  /** Optional glide target. */
  to?: number;
  /** Seconds from the cue's start. */
  at?: number;
  /** Seconds. */
  dur?: number;
  type?: OscillatorType;
  gain?: number;
}

function play(notes: Note[]) {
  const context = audio();
  if (!context) return;

  const now = context.currentTime;
  for (const note of notes) {
    const { freq, to, at = 0, dur = 0.12, type = "sine", gain = 0.06 } = note;
    const start = now + at;
    const end = start + dur;

    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), end);

    // Quick attack, smooth decay — avoids clicks at both ends.
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.015, dur / 3));
    amp.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(amp).connect(context.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

const CUES: Record<SoundName, () => void> = {
  tap: () => play([{ freq: 620, dur: 0.05, gain: 0.03, type: "triangle" }]),
  toggle: () => play([{ freq: 480, to: 700, dur: 0.07, gain: 0.035, type: "triangle" }]),

  sent: () => play([{ freq: 660, to: 990, dur: 0.11, type: "sine" }]),
  received: () =>
    play([
      { freq: 880, dur: 0.09 },
      { freq: 660, at: 0.08, dur: 0.12 },
    ]),

  recordStart: () => play([{ freq: 420, to: 720, dur: 0.1, type: "triangle" }]),
  recordStop: () => play([{ freq: 720, to: 380, dur: 0.12, type: "triangle" }]),

  callStart: () =>
    play([
      { freq: 523, dur: 0.1 },
      { freq: 659, at: 0.09, dur: 0.1 },
      { freq: 784, at: 0.18, dur: 0.16 },
    ]),
  callEnd: () =>
    play([
      { freq: 587, dur: 0.11 },
      { freq: 392, at: 0.1, dur: 0.2 },
    ]),

  gameWin: () =>
    play([
      { freq: 523, dur: 0.09 },
      { freq: 659, at: 0.08, dur: 0.09 },
      { freq: 784, at: 0.16, dur: 0.09 },
      { freq: 1047, at: 0.24, dur: 0.2 },
    ]),
  gameLose: () =>
    play([
      { freq: 440, dur: 0.12, type: "triangle" },
      { freq: 330, at: 0.11, dur: 0.12, type: "triangle" },
      { freq: 247, at: 0.22, dur: 0.22, type: "triangle" },
    ]),

  error: () =>
    play([
      { freq: 180, dur: 0.09, type: "sawtooth", gain: 0.045 },
      { freq: 150, at: 0.11, dur: 0.14, type: "sawtooth", gain: 0.045 },
    ]),
  success: () =>
    play([
      { freq: 784, dur: 0.09 },
      { freq: 1047, at: 0.08, dur: 0.18 },
    ]),
};

/** Fire a cue. Silently does nothing when audio is unavailable. */
export function playSound(name: SoundName) {
  try {
    CUES[name]?.();
  } catch {
    /* audio is a nicety, never a failure */
  }
}
