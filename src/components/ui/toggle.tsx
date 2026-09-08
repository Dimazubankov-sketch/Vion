"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/utils/cx";

/**
 * A switch whose thumb travels with a double-bounce (overshoot, swing back,
 * settle). Looks identical to a plain pill toggle at rest; the motion is added
 * via the `.t-toggle` keyframes. `is-init` is set on first interaction so the
 * animation doesn't play on mount.
 */
export function Toggle({
  on,
  onChange,
  label,
  className,
}: {
  on: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  className?: string;
}) {
  const [init, setInit] = useState(false);
  // Track width 44 (w-11), thumb 20 (size-5), 2px inset each side → 20px travel.
  const travel = 20;
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.style.setProperty("--toggle-travel", `${travel}px`);
  }, []);

  return (
    <button
      ref={ref}
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-on={on}
      onClick={() => {
        setInit(true);
        onChange(!on);
      }}
      className={cx(
        "t-toggle relative h-6 w-11 shrink-0 rounded-full transition-colors",
        init && "is-init",
        on ? "bg-accent" : "bg-surface-3",
        className,
      )}
    >
      <span
        className="t-toggle-thumb absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow"
        style={{ transform: `translateX(${on ? travel : 0}px)` }}
      />
    </button>
  );
}

/**
 * Visual-only toggle for rows that already handle their own click (so we don't
 * nest a button in a button). Same bounce animation, rendered as a span.
 */
export function ToggleVisual({
  on,
  size = "md",
  className,
}: {
  on: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const [init, setInit] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const dims =
    size === "sm"
      ? { track: "h-5 w-9", thumb: "size-4", travel: 16 }
      : { track: "h-6 w-11", thumb: "size-5", travel: 20 };

  useEffect(() => {
    if (ref.current) ref.current.style.setProperty("--toggle-travel", `${dims.travel}px`);
    const id = requestAnimationFrame(() => setInit(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      ref={ref}
      data-on={on}
      className={cx(
        "t-toggle relative shrink-0 rounded-full transition-colors",
        dims.track,
        init && "is-init",
        on ? "bg-accent" : "bg-surface-3",
        className,
      )}
    >
      <span
        className={cx("t-toggle-thumb absolute left-0.5 top-0.5 rounded-full bg-white shadow", dims.thumb)}
        style={{ transform: `translateX(${on ? dims.travel : 0}px)` }}
      />
    </span>
  );
}
