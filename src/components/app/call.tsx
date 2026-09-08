"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiArrowLeftLine,
  RiCollapseDiagonalLine,
  RiExpandDiagonalLine,
  RiGamepadLine,
  RiMicLine,
  RiMicOffLine,
  RiPhoneFill,
  RiSubtractLine,
  RiSwap2Line,
  RiVideoOffLine,
  RiVideoOnLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { useT } from "@/lib/settings-context";
import type { TranslationKey } from "@/lib/i18n";
import { cx } from "@/utils/cx";
import { playConnect, playHangup, startDialTone, stopDialTone } from "@/utils/call-sounds";
import { FourInARow, RockPaperScissors, TicTacToe, TrueOrFalse } from "./games";

export type CallKind = "audio" | "video";

type GameId = "rps" | "ttt" | "four" | "tof";

const GAMES: { id: GameId; labelKey: TranslationKey; emoji: string }[] = [
  { id: "rps", labelKey: "rockPaperScissors", emoji: "✊" },
  { id: "ttt", labelKey: "ticTacToe", emoji: "❌" },
  { id: "four", labelKey: "fourInARow", emoji: "🔴" },
  { id: "tof", labelKey: "trueOrFalse", emoji: "🤔" },
];

export function clock(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** State the shell keeps so a call survives being minimised. */
export interface CallSession {
  name: string;
  avatar?: string;
  kind: CallKind;
  startedAt: number;
}

export function CallOverlay({
  session,
  onEnd,
  onMinimize,
}: {
  session: CallSession;
  onEnd: () => void;
  onMinimize: () => void;
}) {
  const { name, avatar, kind, startedAt } = session;
  const t = useT();

  const [connected, setConnected] = useState(Date.now() - startedAt > 1800);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(kind === "video");
  const [mediaBlocked, setMediaBlocked] = useState(false);
  const [game, setGame] = useState<GameId | null>(null);
  const [gamesOpen, setGamesOpen] = useState(false);
  /** Which feed fills the stage; the other one sits in the corner. */
  const [primary, setPrimary] = useState<"remote" | "local">("remote");
  const [fullscreen, setFullscreen] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const bigVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Ring, then connect.
  useEffect(() => {
    if (connected) return;
    const id = setTimeout(() => setConnected(true), Math.max(0, 1800 - (Date.now() - startedAt)));
    return () => clearTimeout(id);
  }, [connected, startedAt]);

  // Ringback while calling, a connect chirp once it picks up.
  useEffect(() => {
    if (connected) {
      playConnect();
      return;
    }
    startDialTone();
    return () => stopDialTone();
  }, [connected]);

  // The timer is derived from the session start, so minimising doesn't reset it.
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, (Date.now() - startedAt) / 1000 - 1.8));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [startedAt]);

  // Camera capture, with a graceful fallback when it's unavailable.
  useEffect(() => {
    let cancelled = false;
    if (!cameraOn) return;

    (async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          media.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = media;
        setMediaBlocked(false);
      } catch {
        if (!cancelled) setMediaBlocked(true);
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [cameraOn]);

  // Point whichever <video> is currently showing "me" at the stream.
  useEffect(() => {
    const target = primary === "local" ? bigVideoRef.current : pipVideoRef.current;
    if (target) target.srcObject = streamRef.current;
  }, [primary, cameraOn, mediaBlocked, game]);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((tr) => {
      tr.enabled = !muted;
    });
  }, [muted]);

  // Keep our flag in step with the browser's own fullscreen state.
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen();
    } catch {
      /* some browsers refuse without a stronger gesture */
    }
  }, []);

  const showBoard = game !== null;
  const selfLive = cameraOn && !mediaBlocked;

  const selfTile = (
    <div className="flex size-full flex-col items-center justify-center gap-1 bg-surface-2 p-2 text-center">
      <RiVideoOffLine className="size-5 text-faint" />
      <span className="text-[10px] leading-tight text-faint">
        {mediaBlocked ? "Camera blocked" : t("cameraOff")}
      </span>
    </div>
  );

  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-canvas animate-fade-in">
      {/* Stage */}
      <div
        ref={stageRef}
        className={cx(
          "relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-accent/25 to-canvas transition-all",
          showBoard ? "h-32 shrink-0" : "flex-1",
        )}
      >
        {primary === "local" && selfLive ? (
          <video ref={bigVideoRef} autoPlay playsInline muted className="size-full scale-x-[-1] object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Avatar src={avatar} name={name} size={showBoard ? 56 : 112} />
            {!showBoard && (
              <>
                <p className="text-xl font-bold text-ink">{name}</p>
                <p className="text-sm text-muted">{connected ? clock(seconds) : t("calling")}</p>
              </>
            )}
          </div>
        )}

        {showBoard && (
          <div className="absolute right-4 top-4 text-right">
            <p className="text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs text-muted">{connected ? clock(seconds) : t("calling")}</p>
          </div>
        )}

        {/* Stage controls */}
        {!showBoard && (
          <div className="absolute left-3 top-3 flex gap-2">
            <StageButton label={t("minimize")} onClick={onMinimize}>
              <RiSubtractLine className="size-5" />
            </StageButton>
            <StageButton
              label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? (
                <RiCollapseDiagonalLine className="size-5" />
              ) : (
                <RiExpandDiagonalLine className="size-5" />
              )}
            </StageButton>
            {selfLive && (
              <StageButton
                label={t("swapView")}
                onClick={() => setPrimary((p) => (p === "remote" ? "local" : "remote"))}
              >
                <RiSwap2Line className="size-5" />
              </StageButton>
            )}
          </div>
        )}

        {/* Picture-in-picture — tap to promote it to the stage */}
        {!showBoard && (
          <button
            onClick={() => setPrimary((p) => (p === "remote" ? "local" : "remote"))}
            aria-label={t("swapView")}
            className="absolute bottom-4 right-4 h-36 w-24 overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-panel transition hover:brightness-95"
          >
            {primary === "remote" ? (
              selfLive ? (
                <video ref={pipVideoRef} autoPlay playsInline muted className="size-full scale-x-[-1] object-cover" />
              ) : (
                selfTile
              )
            ) : (
              <div className="flex size-full items-center justify-center bg-surface-2">
                <Avatar src={avatar} name={name} size={56} />
              </div>
            )}
          </button>
        )}
      </div>

      {/* Game board */}
      {showBoard && (
        <div className="scroll-clean flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <button
            onClick={() => setGame(null)}
            className="mb-4 flex items-center gap-1.5 self-start text-sm font-medium text-muted transition hover:text-ink"
          >
            <RiArrowLeftLine className="size-4" />
            {t("backToGames")}
          </button>
          <div className="flex flex-1 items-center justify-center">
            {game === "rps" && <RockPaperScissors themName={name.split(" ")[0]} />}
            {game === "ttt" && <TicTacToe themName={name.split(" ")[0]} />}
            {game === "four" && <FourInARow themName={name.split(" ")[0]} />}
            {game === "tof" && <TrueOrFalse themName={name.split(" ")[0]} />}
          </div>
        </div>
      )}

      {/* Games sheet */}
      {gamesOpen && !showBoard && (
        <div className="border-t border-line bg-surface p-4 animate-slide-up-in">
          <p className="text-sm font-semibold text-ink">{t("playGame")}</p>
          <p className="mb-3 text-xs text-muted">{t("gamesSub")}</p>
          <div className="grid grid-cols-2 gap-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setGame(g.id);
                  setGamesOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:border-accent hover:bg-accent-soft"
              >
                <span className="text-lg">{g.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{t(g.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex shrink-0 items-center justify-center gap-3 border-t border-line bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <ControlButton
          label={muted ? t("unmute") : t("mute")}
          active={muted}
          onClick={() => setMuted((v) => !v)}
        >
          {muted ? <RiMicOffLine className="size-5" /> : <RiMicLine className="size-5" />}
        </ControlButton>

        {/* Always offered — an audio call can be upgraded to video mid-way. */}
        <ControlButton
          label={cameraOn ? t("cameraOff") : t("cameraOn")}
          active={cameraOn}
          onClick={() => {
            setCameraOn((v) => !v);
            setMediaBlocked(false);
            setPrimary("remote");
          }}
        >
          {cameraOn ? <RiVideoOnLine className="size-5" /> : <RiVideoOffLine className="size-5" />}
        </ControlButton>

        <ControlButton
          label={t("games")}
          active={gamesOpen || showBoard}
          onClick={() => {
            if (showBoard) setGame(null);
            else setGamesOpen((v) => !v);
          }}
        >
          <RiGamepadLine className="size-5" />
        </ControlButton>

        <button
          onClick={() => { playHangup(); onEnd(); }}
          aria-label={t("endCall")}
          className="flex size-14 items-center justify-center rounded-full bg-danger text-white transition hover:brightness-110 active:scale-95"
        >
          <RiPhoneFill className="size-6 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}

/** The compact bar shown while a call runs in the background. */
export function MinimizedCall({
  session,
  onRestore,
  onEnd,
}: {
  session: CallSession;
  onRestore: () => void;
  onEnd: () => void;
}) {
  const t = useT();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, (Date.now() - session.startedAt) / 1000 - 1.8));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [session.startedAt]);

  return (
    <div className="absolute inset-x-0 top-0 z-[55] flex items-center gap-3 border-b border-line bg-online/15 px-3 py-2 backdrop-blur animate-slide-up-in">
      <button
        onClick={onRestore}
        aria-label={t("returnToCall")}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar src={session.avatar} name={session.name} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{session.name}</span>
          <span className="block text-xs text-online">
            {t("ongoingCall")} · {clock(seconds)}
          </span>
        </span>
      </button>
      <button
        onClick={() => { playHangup(); onEnd(); }}
        aria-label={t("endCall")}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger text-white transition hover:brightness-110"
      >
        <RiPhoneFill className="size-4 rotate-[135deg]" />
      </button>
    </div>
  );
}

function StageButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55"
    >
      {children}
    </button>
  );
}

function ControlButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cx(
        "flex size-12 items-center justify-center rounded-full transition active:scale-95",
        active ? "bg-accent text-white" : "bg-surface-2 text-ink hover:bg-surface-3",
      )}
    >
      {children}
    </button>
  );
}
