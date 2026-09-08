"use client";

import { useCallback, useRef, useState } from "react";

const EDGE = 28;
/** Movement before we decide the gesture is a horizontal drag. */
const SLOP = 8;
/** How far across you have to get for the drawer to settle open. */
const SETTLE = 0.4;

/**
 * Edge-swipe gesture for the navigation drawer.
 *
 * Closed, it only arms when the finger starts near the left edge, so ordinary
 * taps and vertical scrolling are untouched. Open, a drag anywhere follows the
 * finger. `progress` is 0 (closed) to 1 (open) while dragging and null when the
 * drawer should just animate to its resting state.
 */
export function useEdgeSwipe({
  enabled,
  open,
  setOpen,
  width,
}: {
  enabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Drawer width in px — the distance a full swipe covers. */
  width: number;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    from: number;
    decided: boolean;
    tracking: boolean;
  } | null>(null);
  const latest = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      // The edge that matters is the app column's, not the window's — on a wide
      // screen showing the phone layout the column is centred, not flush left.
      const left = e.currentTarget.getBoundingClientRect().left;
      if (!open && e.clientX - left > EDGE) return;
      gesture.current = {
        x: e.clientX,
        y: e.clientY,
        from: open ? 1 : 0,
        decided: false,
        tracking: false,
      };
      latest.current = open ? 1 : 0;
    },
    [enabled, open],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const g = gesture.current;
      if (!g) return;

      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;

      if (!g.decided) {
        if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
        g.decided = true;
        // A mostly-vertical move is a scroll — let it go.
        g.tracking = Math.abs(dx) > Math.abs(dy);
        if (!g.tracking) {
          gesture.current = null;
          return;
        }
      }

      const next = Math.min(1, Math.max(0, g.from + dx / width));
      latest.current = next;
      setProgress(next);
    },
    [width],
  );

  const finish = useCallback(() => {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.tracking) {
      setProgress(null);
      return;
    }
    setOpen(latest.current > SETTLE);
    setProgress(null);
  }, [setOpen]);

  return {
    /** null while resting, 0..1 while the finger is down. */
    progress,
    dragging: progress !== null,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
    },
  };
}
