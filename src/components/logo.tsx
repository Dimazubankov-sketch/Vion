/* eslint-disable @next/next/no-img-element */
import { cx } from "@/utils/cx";

/**
 * Path to the official Vion mark (public/vion-logo.png).
 *
 * Plain <img> tags don't get Next's basePath applied automatically, so the
 * GitHub Pages subfolder has to be prefixed by hand.
 */
export const VION_LOGO_SRC = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/vion-logo.png`;

/** Vion brand mark — the official logo asset. */
export function VionMark({
  className,
  title = "Vion",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <img
      src={VION_LOGO_SRC}
      alt={title}
      className={cx("size-9 object-contain select-none", className)}
      draggable={false}
    />
  );
}

/** Mark inside a soft rounded tile — used as an app icon / auth logo. */
export function VionLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-2xl border border-line bg-surface shadow-panel",
        className,
      )}
    >
      <VionMark className="size-4/5" />
    </span>
  );
}

/** Full lockup: mark + "VION" wordmark. */
export function VionWordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <VionMark className={cx("size-7", markClassName)} />
      <span className="text-2xl font-extrabold tracking-tight text-ink">
        VION
      </span>
    </span>
  );
}
