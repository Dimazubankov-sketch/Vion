"use client";

import { AuthCard } from "./auth-card";
import { VionLogoMark, VionWordmark } from "@/components/logo";

export function AuthScreen() {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      {/* Soft brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-accent/15 blur-[120px]"
      />
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 animate-pop-in">
        <VionWordmark />
        <AuthCard
          centered
          logo={<VionLogoMark className="size-14" />}
          title="Sign in to Vion"
          description="One place for your feed, your people, and your chats."
        />
        <p className="text-xs text-faint">© {new Date().getFullYear()} Vion. Demo build.</p>
      </div>
    </main>
  );
}
