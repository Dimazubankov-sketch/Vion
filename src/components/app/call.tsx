"use client";

import { useEffect, useRef, useState } from "react";
import {
  RiArrowLeftLine,
  RiGamepadLine,
  RiMicLine,
  RiMicOffLine,
  RiPhoneFill,
  RiVideoOffLine,
  RiVideoOnLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { useT } from "@/lib/settings-context";
import type { TranslationKey } from "@/lib/i18n";
import { cx } from "@/utils/cx";
import { FourInARow, RockPaperScissors, TicTacToe, TrueOrFalse } from "./games";

export type CallKind = "audio" | "video";

type GameId = "rps" | "ttt" | "four" | "tof";

const GAMES: { id: GameId; labelKey: TranslationKey; emoji: string }[] = [
  { id: "rps", labelKey: "rockPaperScissors", emoji: "✊" },
  { id: "ttt", labelKey: "ticTacToe", emoji: "❌" },
  { id: "four", labelKey: "fourInARow", emoji: "🔴" },
  { id: "tof", labelKey: "trueOrFalse", emoji: "🤔" },
];

function clock(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CallOverlay({
  name,
  avatar,
  kind,
  onEnd,
}: {
  name: string;
  avatar?: string;
  kind: CallKind;
  onEnd: () => void;
}) {
  const t = useT();
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(kind === "video");
  const [mediaBlocked, setMediaBlocked] = useState(false);
  const [game, setGame] = useState<GameId | null>(null);
  const [gamesOpen, setGamesOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Ring, then connect.
  useEffect(() => {
    const id = setTimeout(() => setConnected(true), 1800);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [connected]);

  // Local self-view. Falls back to the avatar when the camera is unavailable.
  useEffect(() => {
    let cancelled = false;
    if (kind !== "video" || !cameraOn) return;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        setMediaBlocked(false);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) setMediaBlocked(true);
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [kind, cameraOn]);

  // Mic toggle applies to the real track when we have one.
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((tr) => {
      tr.enabled = !muted;
    });
  }, [muted]);

  const showBoard = game !== null;

  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-canvas animate-fade-in">
      {/* Remote party */}
      <div
        className={cx(
          "relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-accent/25 to-canvas transition-all",
          showBoard ? "h-32 shrink-0" : "flex-1",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Avatar src={avatar} name={name} size={showBoard ? 56 : 112} />
          {!showBoard && (
            <>
              <p className="text-xl font-bold text-ink">{name}</p>
              <p className="text-sm text-muted">
                {connected ? clock(seconds) : t("calling")}
              </p>
            </>
          )}
        </div>

        {showBoard && (
          <div className="absolute right-4 top-4 text-right">
            <p className="text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs text-muted">{connected ? clock(seconds) : t("calling")}</p>
          </div>
        )}

        {/* Local self-view */}
        {kind === "video" && !showBoard && (
          <div className="absolute bottom-4 right-4 h-36 w-24 overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-panel">
            {cameraOn && !mediaBlocked ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full scale-x-[-1] object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center">
                <RiVideoOffLine className="size-5 text-faint" />
                <span className="text-[10px] leading-tight text-faint">
                  {mediaBlocked ? "Camera blocked" : t("cameraOff")}
                </span>
              </div>
            )}
          </div>
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
        <div className="border-t border-line bg-surface p-4 animate-pop-in">
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

        {kind === "video" && (
          <ControlButton
            label={cameraOn ? t("cameraOff") : t("cameraOn")}
            active={!cameraOn}
            onClick={() => setCameraOn((v) => !v)}
          >
            {cameraOn ? <RiVideoOnLine className="size-5" /> : <RiVideoOffLine className="size-5" />}
          </ControlButton>
        )}

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
          onClick={onEnd}
          aria-label={t("endCall")}
          className="flex size-14 items-center justify-center rounded-full bg-danger text-white transition hover:brightness-110 active:scale-95"
        >
          <RiPhoneFill className="size-6 rotate-[135deg]" />
        </button>
      </div>
    </div>
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
