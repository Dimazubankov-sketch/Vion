"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiCloseLine,
  RiMicLine,
  RiPauseFill,
  RiPlayFill,
  RiSendPlane2Fill,
} from "@remixicon/react";
import type { AudioAttachment } from "@/lib/mock-data";
import { cx } from "@/utils/cx";

const BARS = 48;

export function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Live voice recorder. The bars are driven by the real microphone signal via an
 * AnalyserNode — they move with actual speech, not a canned animation. Bar
 * heights are written straight to the DOM in a rAF loop so React doesn't
 * re-render 60 times a second.
 */
export function VoiceRecorder({
  onCancel,
  onSend,
}: {
  onCancel: () => void;
  onSend: (audio: AudioAttachment) => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const peaksRef = useRef<number[]>([]);
  const startedAtRef = useRef<number>(0);
  /** Set when the user hits send, so `onstop` knows to emit rather than drop. */
  const emitRef = useRef(false);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        // Recording
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          const duration = (Date.now() - startedAtRef.current) / 1000;
          if (emitRef.current && blob.size > 0) {
            onSend({
              url: URL.createObjectURL(blob),
              duration,
              peaks: peaksRef.current.slice(-BARS),
            });
          }
          cleanup();
        };
        startedAtRef.current = Date.now();
        recorder.start();
        setReady(true);

        // Live level metering
        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        let lastPeakAt = 0;

        const tick = () => {
          analyser.getByteFrequencyData(data);

          // Overall loudness, 0..1
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const level = Math.min(1, sum / data.length / 140);

          // Bars sample across the spectrum, scaled by loudness
          for (let i = 0; i < BARS; i++) {
            const bin = Math.floor((i / BARS) * data.length * 0.7);
            const v = data[bin] / 255;
            const height = 8 + Math.min(1, v * 1.4) * 92;
            const el = barsRef.current[i];
            if (el) el.style.height = `${height}%`;
          }

          const now = Date.now();
          if (now - lastPeakAt > 90) {
            lastPeakAt = now;
            peaksRef.current.push(level);
          }

          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) setError("Microphone access is blocked. Allow it in your browser to record.");
      }
    })();

    return () => {
      cancelled = true;
      if (recorderRef.current?.state === "recording") {
        emitRef.current = false;
        recorderRef.current.stop();
      }
      cleanup();
    };
  }, [cleanup, onSend]);

  // Timer
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [ready]);

  const send = () => {
    emitRef.current = true;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else onCancel();
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2.5">
        <RiMicLine className="size-5 shrink-0 text-danger" />
        <p className="flex-1 text-xs text-muted">{error}</p>
        <button
          onClick={onCancel}
          aria-label="Cancel"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-3"
        >
          <RiCloseLine className="size-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-2 py-1.5">
      <button
        onClick={onCancel}
        aria-label="Cancel recording"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-danger"
      >
        <RiCloseLine className="size-5" />
      </button>

      <span className="flex size-2 shrink-0 animate-pulse rounded-full bg-danger" aria-hidden />
      <span className="w-11 shrink-0 font-mono text-xs text-muted">{formatTime(seconds)}</span>

      {/* Live waveform */}
      <div className="flex h-8 flex-1 items-center justify-center gap-0.5 overflow-hidden">
        {Array.from({ length: BARS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className="w-0.5 shrink-0 rounded-full bg-accent/70 transition-[height] duration-75"
            style={{ height: "8%" }}
          />
        ))}
      </div>

      <button
        onClick={send}
        aria-label="Send voice message"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-strong"
      >
        <RiSendPlane2Fill className="size-5" />
      </button>
    </div>
  );
}

/** Playback bubble for a recorded voice message. */
export function VoiceMessage({
  audio,
  mine,
}: {
  audio: AudioAttachment;
  mine: boolean;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const peaks = audio.peaks.length > 0 ? audio.peaks : Array.from({ length: 28 }, () => 0.4);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  return (
    <div className="flex w-56 items-center gap-2.5">
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className={cx(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition",
          mine ? "bg-white/20 text-white hover:bg-white/30" : "bg-accent text-white hover:bg-accent-strong",
        )}
      >
        {playing ? <RiPauseFill className="size-5" /> : <RiPlayFill className="size-5" />}
      </button>

      <div className="flex h-8 flex-1 items-center gap-0.5">
        {peaks.map((p, i) => {
          const played = i / peaks.length <= progress;
          return (
            <div
              key={i}
              className={cx(
                "flex-1 rounded-full transition-opacity",
                mine ? "bg-white" : "bg-accent",
                played ? "opacity-100" : "opacity-35",
              )}
              style={{ height: `${Math.max(12, Math.min(1, p * 1.6) * 100)}%` }}
            />
          );
        })}
      </div>

      <span className={cx("shrink-0 font-mono text-[11px]", mine ? "text-white/80" : "text-muted")}>
        {formatTime(audio.duration)}
      </span>

      <audio
        ref={ref}
        src={audio.url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          // Recorded webm blobs often report Infinity for duration.
          const total = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : audio.duration;
          setProgress(total > 0 ? Math.min(1, el.currentTime / total) : 0);
        }}
      />
    </div>
  );
}
