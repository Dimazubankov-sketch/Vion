"use client";

import { useRef } from "react";
import { cx } from "@/utils/cx";

const PARTICLES = 8;

/**
 * Heart like button with a spring pop and an 8-dot particle burst. Sticker
 * only — no "like" label. `count` is optional (shown beside the heart).
 */
export function LikeButton({
  liked,
  onToggle,
  count,
  size = 20,
  className,
  activeClass = "text-danger",
  idleClass = "text-muted",
  "aria-label": ariaLabel = "Like",
}: {
  liked: boolean;
  onToggle: () => void;
  count?: number;
  size?: number;
  className?: string;
  activeClass?: string;
  idleClass?: string;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handle = () => {
    const willLike = !liked;
    onToggle();
    if (!willLike) return;
    const root = ref.current;
    if (!root) return;
    // Give each dot an organic vector before firing the burst.
    root.querySelectorAll<HTMLElement>(".t-like-particles i").forEach((dot, i) => {
      const angle = (i / PARTICLES) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = 16 + Math.random() * 12;
      dot.style.setProperty("--px", `${Math.cos(angle) * dist}px`);
      dot.style.setProperty("--py", `${Math.sin(angle) * dist}px`);
      dot.style.setProperty("--pdur", `${520 + Math.random() * 220}ms`);
      dot.style.setProperty("--pdelay", `${Math.random() * 40}ms`);
      dot.style.setProperty("--p-end-scale", `${0.3 + Math.random() * 0.5}`);
      dot.style.setProperty("--psize", `${0.7 + Math.random() * 0.9}`);
    });
    root.classList.remove("is-bursting");
    void root.offsetWidth; // restart the animation
    root.classList.add("is-bursting");
    window.setTimeout(() => root.classList.remove("is-bursting"), 800);
  };

  return (
    <button
      ref={ref}
      type="button"
      data-liked={liked}
      aria-label={ariaLabel}
      aria-pressed={liked}
      onClick={handle}
      className={cx("t-like flex items-center gap-1.5 transition", liked ? activeClass : idleClass, className)}
    >
      <span className="t-like-icon">
        <svg className="t-like-heart" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path d="M12 20.5 4.2 12.8a4.6 4.6 0 0 1 6.5-6.5l1.3 1.3 1.3-1.3a4.6 4.6 0 0 1 6.5 6.5L12 20.5Z" />
        </svg>
      </span>
      <span className="t-like-particles" aria-hidden>
        {Array.from({ length: PARTICLES }).map((_, i) => (
          <i key={i} />
        ))}
      </span>
      {count !== undefined && count > 0 && <span className="text-sm font-medium tabular-nums">{count}</span>}
    </button>
  );
}
