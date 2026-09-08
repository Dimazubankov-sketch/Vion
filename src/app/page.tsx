"use client";

import { useAuth } from "@/lib/auth-context";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AppShell } from "@/components/app/app-shell";
import { VoyzenMark } from "@/components/logo";

export default function Home() {
  const { user, ready } = useAuth();

  // Avoid a flash before we know whether a session exists.
  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <VoyzenMark className="size-10 animate-pulse text-accent" />
      </div>
    );
  }

  return user ? <AppShell /> : <AuthScreen />;
}
