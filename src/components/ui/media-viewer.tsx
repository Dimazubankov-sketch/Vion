"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiDownload2Line } from "@remixicon/react";
import { useT } from "@/lib/settings-context";
import { cx } from "@/utils/cx";

export interface MediaItem {
  src: string;
  kind?: "image" | "video";
}

/**
 * Fullscreen media lightbox. Opens over everything (portalled to the body),
 * supports multiple items with prev/next, and offers a download.
 */
export function MediaViewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: MediaItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = items[index];
  const many = items.length > 1;

  const go = (delta: number) => onIndex((index + delta + items.length) % items.length);

  // Horizontal swipe to move between items (touch/drag). A short move that
  // doesn't cross the threshold is treated as a tap and closes the viewer.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
    setDragX(0);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!swipe.current || !many) return;
    setDragX(e.clientX - swipe.current.x);
  };
  const onPointerUp = (e: React.PointerEvent): boolean => {
    const start = swipe.current;
    swipe.current = null;
    setDragX(0);
    if (!start) return false;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (many && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
      return true; // consumed as a swipe, not a tap
    }
    return false;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && many) go(-1);
      if (e.key === "ArrowRight" && many) go(1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, many]);

  if (!mounted || !current) return null;

  const download = async () => {
    try {
      const res = await fetch(current.src, { mode: "cors" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = current.src.split("/").pop()?.split("?")[0] || "voyzen-media";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      // Cross-origin without CORS: fall back to opening it in a new tab.
      window.open(current.src, "_blank", "noopener,noreferrer");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-fade-in">
      <div className="flex items-center justify-between p-3">
        <span className="text-sm text-white/70">{many ? `${index + 1} / ${items.length}` : ""}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={download}
            aria-label={t("download")}
            title={t("download")}
            className="flex size-10 items-center justify-center rounded-full text-white transition hover:bg-white/15"
          >
            <RiDownload2Line className="size-5" />
          </button>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="flex size-10 items-center justify-center rounded-full text-white transition hover:bg-white/15"
          >
            <RiCloseLine className="size-6" />
          </button>
        </div>
      </div>

      <button
        aria-label={t("close")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => {
          if (!onPointerUp(e)) onClose();
        }}
        onPointerCancel={() => {
          swipe.current = null;
          setDragX(0);
        }}
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-3 pb-6"
      >
        {current.kind === "video" ? (
          <video
            src={current.src}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg"
            style={{ transform: `translateX(${dragX}px)` }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.src}
            alt=""
            draggable={false}
            className="max-h-full max-w-full rounded-lg object-contain"
            style={{ transform: `translateX(${dragX}px)` }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </button>

      {many && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <RiArrowLeftSLine className="size-7" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next"
            className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <RiArrowRightSLine className="size-7" />
          </button>

          <div className="flex items-center justify-center gap-1.5 pb-4">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => onIndex(i)}
                aria-label={`${i + 1}`}
                className={cx(
                  "size-2 rounded-full transition",
                  i === index ? "bg-white" : "bg-white/40",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
