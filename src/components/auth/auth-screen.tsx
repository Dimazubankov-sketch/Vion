"use client";

import { useState } from "react";
import { RiArrowLeftLine } from "@remixicon/react";
import { AuthCard, type AuthMode } from "./auth-card";
import Loader from "@/components/ui/loader";
import { VoyzenLogoMark, VoyzenWordmark } from "@/components/logo";
import { useT } from "@/lib/settings-context";
import { cx } from "@/utils/cx";

/**
 * The full auth screen. `onBack` turns it into an "add account" flow shown over
 * the app — a back arrow in the top-left cancels without signing out.
 */
export function AuthScreen({ mode, onBack }: { mode?: AuthMode; onBack?: () => void }) {
  const [pending, setPending] = useState<AuthMode | null>(null);
  const t = useT();

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      {onBack && !pending && (
        <button
          onClick={onBack}
          aria-label={t("back")}
          className="absolute left-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-surface text-muted shadow-panel transition hover:text-ink"
        >
          <RiArrowLeftLine className="size-5" />
        </button>
      )}
      {/* Soft brand glow — hidden while the loader owns the screen */}
      {!pending && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-accent/15 blur-[120px]"
        />
      )}

      {pending && (
        <Loader
          size="lg"
          title={pending === "signup" ? t("configuring") : t("signingIn")}
          subtitle={t("pleaseWait")}
        />
      )}

      <div
        className={cx(
          "relative flex w-full max-w-md flex-col items-center gap-6 animate-pop-in",
          pending && "hidden",
        )}
      >
        <VoyzenWordmark />
        <AuthCard
          centered
          mode={mode}
          logo={<VoyzenLogoMark className="size-14" />}
          onPendingChange={(isPending, m) => setPending(isPending ? m : null)}
        />
        <p className="text-xs text-faint">© {new Date().getFullYear()} Voyzen. Demo build.</p>
      </div>
    </main>
  );
}
