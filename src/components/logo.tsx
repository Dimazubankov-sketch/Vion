import { cx } from "@/utils/cx";

/**
 * Vion brand mark — a 7-blade pinwheel/asterisk. Recreated as inline SVG so it
 * scales crisply and inherits `currentColor` (blades) unless a fill is passed.
 * Drop the official PNG into /public and swap this out if you prefer the raster.
 */
export function VionMark({
  className,
  title = "Vion",
}: {
  className?: string;
  title?: string;
}) {
  const blades = Array.from({ length: 7 }, (_, i) => (i * 360) / 7);
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={cx("size-9", className)}
      fill="currentColor"
    >
      {blades.map((deg) => (
        <path
          key={deg}
          transform={`rotate(${deg} 50 50)`}
          d="M50 9
             C 53.5 25 58 33 55.5 43.5
             C 53.8 50 47.5 51 45 44.5
             C 42 35.5 46 24.5 50 9 Z"
        />
      ))}
    </svg>
  );
}

/** Mark inside a rounded violet tile — used as an app icon / auth logo. */
export function VionLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-2xl bg-accent text-white shadow-panel",
        className,
      )}
    >
      <VionMark className="size-3/5" />
    </span>
  );
}

/** Full lockup: violet mark + "VION" wordmark. */
export function VionWordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <VionMark className={cx("size-7 text-accent", markClassName)} />
      <span className="text-2xl font-extrabold tracking-tight text-ink">
        VION
      </span>
    </span>
  );
}
