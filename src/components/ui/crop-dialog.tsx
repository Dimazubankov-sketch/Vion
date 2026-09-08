"use client";

import { useEffect, useRef, useState } from "react";
import { RiCloseLine, RiZoomInLine } from "@remixicon/react";
import { useT } from "@/lib/settings-context";
import { cx } from "@/utils/cx";

type Shape = "avatar" | "cover";

const VIEWPORT: Record<Shape, { w: number; h: number }> = {
  avatar: { w: 264, h: 264 },
  cover: { w: 320, h: 120 },
};
const OUTPUT: Record<Shape, { w: number; h: number }> = {
  avatar: { w: 512, h: 512 },
  cover: { w: 1200, h: 450 },
};

/**
 * Position-and-zoom crop. The picked image is shown inside a fixed viewport;
 * drag to move, use the slider to zoom, and Apply renders the visible region to
 * a canvas at the target size. Avatars crop square, covers crop wide.
 */
export function CropDialog({
  src,
  shape,
  onCancel,
  onApply,
}: {
  src: string;
  shape: Shape;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}) {
  const t = useT();
  const vp = VIEWPORT[shape];
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imgRef.current = image;
      setNat({ w: image.naturalWidth, h: image.naturalHeight });
    };
    image.src = src;
  }, [src]);

  const base = nat ? Math.max(vp.w / nat.w, vp.h / nat.h) : 1;
  const scale = base * zoom;
  const dispW = nat ? nat.w * scale : vp.w;
  const dispH = nat ? nat.h * scale : vp.h;

  // Keep the image covering the viewport at all times.
  const clamp = (o: { x: number; y: number }) => {
    const maxX = Math.max(0, (dispW - vp.w) / 2);
    const maxY = Math.max(0, (dispH - vp.h) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, o.x)),
      y: Math.min(maxY, Math.max(-maxY, o.y)),
    };
  };

  useEffect(() => {
    setOffset((o) => clamp(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, nat]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset(
      clamp({
        x: drag.current.ox + (e.clientX - drag.current.x),
        y: drag.current.oy + (e.clientY - drag.current.y),
      }),
    );
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const apply = () => {
    const image = imgRef.current;
    if (!image || !nat) return;
    const out = OUTPUT[shape];
    const canvas = document.createElement("canvas");
    canvas.width = out.w;
    canvas.height = out.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = out.w / vp.w;
    const dw = dispW * ratio;
    const dh = dispH * ratio;
    const dx = ((vp.w - dispW) / 2 + offset.x) * ratio;
    const dy = ((vp.h - dispH) / 2 + offset.y) * ratio;
    ctx.drawImage(image, 0, 0, nat.w, nat.h, dx, dy, dw, dh);
    onApply(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-4 shadow-float animate-pop-in">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="flex-1 text-base font-semibold text-ink">{t("adjustPhoto")}</h2>
          <button
            onClick={onCancel}
            aria-label={t("close")}
            className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-3"
          >
            <RiCloseLine className="size-5" />
          </button>
        </div>

        {/* Crop viewport */}
        <div className="flex justify-center">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={cx(
              "relative touch-none select-none overflow-hidden bg-surface-2",
              shape === "avatar" ? "rounded-full" : "rounded-2xl",
            )}
            style={{ width: vp.w, height: vp.h, cursor: "grab" }}
          >
            {nat && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                style={{
                  width: dispW,
                  height: dispH,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            )}
            {/* Framing overlay */}
            <div className="pointer-events-none absolute inset-0 ring-2 ring-white/60 ring-inset" />
          </div>
        </div>

        {/* Zoom */}
        <div className="mt-4 flex items-center gap-3">
          <RiZoomInLine className="size-5 shrink-0 text-muted" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label={t("zoomLabel")}
            className="h-1.5 flex-1 cursor-pointer accent-[var(--accent)]"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl border border-line bg-surface text-sm font-medium text-ink transition hover:bg-surface-3"
          >
            {t("cancel")}
          </button>
          <button
            onClick={apply}
            disabled={!nat}
            className="h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50"
          >
            {t("apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
