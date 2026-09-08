import { cx } from "@/utils/cx";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({
  src,
  name,
  size = 40,
  online,
  ring,
  className,
}: {
  src?: string;
  name: string;
  size?: number;
  online?: boolean;
  ring?: boolean;
  className?: string;
}) {
  const dot = Math.max(9, Math.round(size * 0.28));
  // An empty string is not a URL — fall back to initials instead of a broken img.
  const photo = src || undefined;
  return (
    <span
      className={cx("relative inline-flex shrink-0 align-middle leading-none", className)}
      style={{ width: size, height: size }}
    >
      <span
        className={cx(
          "flex size-full items-center justify-center overflow-hidden rounded-full bg-surface-2 text-muted",
          ring && "ring-2 ring-accent ring-offset-2 ring-offset-canvas",
        )}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name} className="size-full object-cover" />
        ) : (
          <span className="font-semibold" style={{ fontSize: size * 0.38 }}>
            {initials(name)}
          </span>
        )}
      </span>
      {online !== undefined && (
        <span
          aria-hidden
          className={cx(
            "absolute bottom-0 right-0 rounded-full border-2 border-surface",
            online ? "bg-online" : "bg-faint",
          )}
          style={{ width: dot, height: dot }}
        />
      )}
    </span>
  );
}
