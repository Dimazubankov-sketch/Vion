/**
 * Synthesised call sounds (no audio assets to ship). A single AudioContext,
 * created on first use — calls always begin from a click, so the browser's
 * autoplay policy lets it resume.
 */

let ctx: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One tone with a soft attack/release so it never clicks. */
function tone(freq: number, start: number, duration: number, peak = 0.16) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain).connect(c.destination);
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.04);
  gain.gain.setValueAtTime(peak, t0 + Math.max(0.05, duration - 0.06));
  gain.gain.linearRampToValueAtTime(0, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Ringback ("гудки") while the other side is being called. */
export function startDialTone() {
  stopDialTone();
  const ring = () => tone(425, 0, 0.8, 0.12);
  ring();
  ringTimer = setInterval(ring, 2000);
}

export function stopDialTone() {
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
}

/** Rising two-note chirp when the call connects. */
export function playConnect() {
  stopDialTone();
  tone(587.33, 0, 0.12, 0.18); // D5
  tone(880, 0.12, 0.16, 0.18); // A5
}

/** Falling two-note chirp when the call ends. */
export function playHangup() {
  stopDialTone();
  tone(440, 0, 0.14, 0.18); // A4
  tone(330, 0.14, 0.22, 0.18); // E4
}
