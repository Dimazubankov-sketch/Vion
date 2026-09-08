"use client";

import { useState } from "react";
import { AuthCard, type AuthMode } from "./auth-card";
import Loader from "@/components/ui/loader";
import { VoyzenLogoMark, VoyzenWordmark } from "@/components/logo";
import { useT } from "@/lib/settings-context";
import { cx } from "@/utils/cx";

export function AuthScreen() {
  const [pending, setPending] = useState<AuthMode | null>(null);
  const t = useT();

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-canvas px-4 py-10">
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
          logo={<VoyzenLogoMark className="size-14" />}
          onPendingChange={(isPending, mode) => setPending(isPending ? mode : null)}
        />
        <p className="text-xs text-faint">© {new Date().getFullYear()} Voyzen. Demo build.</p>
      </div>
    </main>
  );
}
