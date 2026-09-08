/* eslint-disable @next/next/no-img-element */
import { cx } from "@/utils/cx";

/**
 * Path to the official Voyzen mark (public/voyzen-logo.png).
 *
 * Plain <img> tags don't get Next's basePath applied automatically, so the
 * GitHub Pages subfolder has to be prefixed by hand.
 */
export const VOYZEN_LOGO_SRC = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/voyzen-logo.png`;

/** Voyzen brand mark — the official logo asset. */
export function VoyzenMark({
  className,
  title = "Voyzen",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <img
      src={VOYZEN_LOGO_SRC}
      alt={title}
      className={cx("size-9 object-contain select-none", className)}
      draggable={false}
    />
  );
}

/** Mark inside a soft rounded tile — used as an app icon / auth logo. */
export function VoyzenLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-2xl border border-line bg-surface shadow-panel",
        className,
      )}
    >
      <VoyzenMark className="size-4/5" />
    </span>
  );
}

/** Full lockup: mark + "VOYZEN" wordmark. */
export function VoyzenWordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <VoyzenMark className={cx("size-7", markClassName)} />
      <span className="text-2xl font-extrabold tracking-tight text-ink">
        VOYZEN
      </span>
    </span>
  );
}
