"use client";

import { useState } from "react";
import { AuthCard, type AuthMode } from "./auth-card";
import Loader from "@/components/ui/loader";
import { VionLogoMark, VionWordmark } from "@/components/logo";
import { cx } from "@/utils/cx";

export function AuthScreen() {
  const [pending, setPending] = useState<AuthMode | null>(null);

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
          title={pending === "signup" ? "Configuring your account..." : "Signing you in..."}
          subtitle="Please wait while we prepare everything for you"
        />
      )}

      <div
        className={cx(
          "relative flex w-full max-w-md flex-col items-center gap-6 animate-pop-in",
          pending && "hidden",
        )}
      >
        <VionWordmark />
        <AuthCard
          centered
          logo={<VionLogoMark className="size-14" />}
          title="Sign in to Vion"
          description="One place for your feed, your people, and your chats."
          onPendingChange={(isPending, mode) => setPending(isPending ? mode : null)}
        />
        <p className="text-xs text-faint">© {new Date().getFullYear()} Vion. Demo build.</p>
      </div>
    </main>
  );
}
