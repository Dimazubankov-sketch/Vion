"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RiCheckLine, RiCloseLine, RiRefreshLine } from "@remixicon/react";
import { useT } from "@/lib/settings-context";
import { cx } from "@/utils/cx";

type Shape = "avatar" | "cover";

const OUTPUT: Record<Shape, { w: number; h: number }> = {
  avatar: { w: 512, h: 512 },
  cover: { w: 1200, h: 450 },
};

const MAX_ZOOM = 3;

/**
 * Full-screen native-style crop: a dark stage with the pick framed by a
 * dimmed mask (circular for avatars, rounded-wide for covers), one finger to
 * pan, two to pinch-zoom, and a reset button. Apply renders the visible
 * region to a canvas at the target output size.
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
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // The stage viewport, sized to fill the available screen space.
  const [box, setBox] = useState({ w: 375, h: 700 });
  useEffect(() => {
    const measure = () => setBox({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const vp = useMemo(() => {
    const stageW = Math.max(160, box.w - 48);
    const stageH = Math.max(160, box.h - 220);
    if (shape === "avatar") {
      const size = Math.min(stageW, stageH, 420);
      return { w: size, h: size };
    }
    const w = Math.min(stageW, 480);
    return { w, h: w * (OUTPUT.cover.h / OUTPUT.cover.w) };
  }, [box, shape]);

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
  }, [zoom, nat, vp.w, vp.h]);

  // One finger pans, two fingers pinch-zoom — tracked by pointer id so either
  // gesture can hand off to the other mid-touch without jumping.
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const pan = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: dist(a, b) || 1, zoom };
      pan.current = null;
    } else if (pointers.current.size === 1) {
      pan.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const ratio = dist(a, b) / pinch.current.dist;
      setZoom(Math.min(MAX_ZOOM, Math.max(1, pinch.current.zoom * ratio)));
      return;
    }
    if (pointers.current.size === 1 && pan.current) {
      setOffset(
        clamp({
          x: pan.current.ox + (e.clientX - pan.current.x),
          y: pan.current.oy + (e.clientY - pan.current.y),
        }),
      );
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      const [[, p]] = pointers.current;
      pan.current = { x: p.x, y: p.y, ox: offset.x, oy: offset.y };
      pinch.current = null;
    } else {
      pan.current = null;
      pinch.current = null;
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z - e.deltaY * 0.0015)));
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-2 py-3">
        <button
          onClick={onCancel}
          aria-label={t("cancel")}
          className="flex size-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
        >
          <RiCloseLine className="size-6" />
        </button>
        <span className="text-[15px] font-semibold text-white">{t("adjustPhoto")}</span>
        <button
          onClick={apply}
          disabled={!nat}
          aria-label={t("apply")}
          className="flex size-10 items-center justify-center rounded-full text-accent transition hover:bg-white/10 disabled:opacity-40"
        >
          <RiCheckLine className="size-6" />
        </button>
      </div>

      {/* Stage */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onWheel={onWheel}
          className={cx(
            "relative touch-none select-none overflow-hidden bg-white/5",
            shape === "avatar" ? "rounded-full" : "rounded-3xl",
          )}
          style={{ width: vp.w, height: vp.h, boxShadow: "0 0 0 9999px rgba(0,0,0,0.78)", cursor: "grab" }}
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
          <div className="pointer-events-none absolute inset-0 ring-1 ring-white/50 ring-inset" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <button
          onClick={reset}
          aria-label={t("reset")}
          title={t("reset")}
          className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
        >
          <RiRefreshLine className="size-6" />
        </button>
      </div>
    </div>
  );
}
