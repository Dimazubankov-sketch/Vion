"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RiCheckLine, RiFileCopyLine, RiShareLine } from "@remixicon/react";
import { useT } from "@/lib/settings-context";
import { emailFor } from "@/lib/accounts";

/**
 * "Share profile" sheet: shows the profile link and copies it to the clipboard.
 * The link is a hash on the current page so it works from the static build.
 */
export function ShareSheet({ handle, name, onClose }: { handle: string; name: string; onClose: () => void }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}#user-${handle}`
      : `#user-${handle}`;

  const copy = () => {
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(onClose, 900);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[88] flex items-end justify-center sm:items-center">
      <button aria-label={t("close")} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm overflow-hidden rounded-t-3xl border border-line bg-surface p-5 shadow-float animate-slide-up-in sm:m-4 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center gap-2">
          <RiShareLine className="size-5 text-accent" />
          <h2 className="text-base font-semibold text-ink">{t("shareProfile")}</h2>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-muted">{emailFor(handle)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-xs text-muted">{link}</span>
        </div>

        <button
          onClick={copy}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          {copied ? <RiCheckLine className="size-5" /> : <RiFileCopyLine className="size-5" />}
          {copied ? t("linkCopied") : t("copyLink")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
