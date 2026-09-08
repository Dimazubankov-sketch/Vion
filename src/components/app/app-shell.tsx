"use client";

import { useCallback, useMemo, useState } from "react";
import {
  RiChat3Fill,
  RiChat3Line,
  RiHome5Fill,
  RiHome5Line,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useStore } from "@/lib/app-store";
import { useIsDesktop, useT } from "@/lib/settings-context";
import { useEdgeSwipe } from "@/lib/use-edge-swipe";
import type { TranslationKey } from "@/lib/i18n";
import { cx } from "@/utils/cx";
import { Feed } from "./feed";
import { ChatView } from "./chat";
import { DRAWER_WIDTH, SidebarDrawer, SidebarRail } from "./sidebar";
import { Profile } from "./profile";
import { History } from "./history";
import { Settings } from "./settings";
import { CallOverlay, MinimizedCall, type CallKind, type CallSession } from "./call";

export type AppTab = "home" | "chat";
type Overlay = "profile" | "history" | "settings" | null;

const NAV: {
  key: AppTab;
  labelKey: TranslationKey;
  line: React.ComponentType<{ className?: string }>;
  fill: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "home", labelKey: "home", line: RiHome5Line, fill: RiHome5Fill },
  { key: "chat", labelKey: "messages", line: RiChat3Line, fill: RiChat3Fill },
];

export function AppShell() {
  const { user, signOut } = useAuth();
  const { chats } = useStore();
  const t = useT();
  const isDesktop = useIsDesktop();

  const [tab, setTab] = useState<AppTab>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [call, setCall] = useState<CallSession | null>(null);
  const [callMinimized, setCallMinimized] = useState(false);

  const onConversationChange = useCallback((open: boolean) => setConversationOpen(open), []);

  const startCall = useCallback(
    (name: string, avatar: string | undefined, kind: CallKind) => {
      setCall({ name, avatar, kind, startedAt: Date.now() });
      setCallMinimized(false);
    },
    [],
  );

  const unreadChats = useMemo(() => chats.reduce((n, c) => n + c.unread, 0), [chats]);

  // Swipe from the left edge opens the drawer; a drag closes it again.
  const swipe = useEdgeSwipe({
    enabled: !isDesktop && !overlay && !conversationOpen && !(call && !callMinimized),
    open: sidebarOpen,
    setOpen: setSidebarOpen,
    width: DRAWER_WIDTH,
  });

  if (!user) return null;

  const sidebarProps = {
    user,
    tab,
    onNavigate: (next: AppTab) => {
      setTab(next);
      setOverlay(null);
    },
    onOpenProfile: () => setOverlay("profile"),
    onOpenHistory: () => setOverlay("history"),
    onOpenSettings: () => setOverlay("settings"),
    onSignOut: signOut,
    unread: { chat: unreadChats },
  };

  const avatarButton = !isDesktop ? (
    <button
      onClick={() => setSidebarOpen(true)}
      aria-label="Open menu"
      className="shrink-0 rounded-full transition hover:opacity-80"
    >
      <Avatar src={user.avatar} name={user.name} size={36} online />
    </button>
  ) : undefined;

  const showChrome = !conversationOpen || isDesktop;

  return (
    <div className="flex h-dvh w-full justify-center bg-canvas">
      {isDesktop && (
        <div className="h-dvh">
          <SidebarRail
            {...sidebarProps}
            collapsed={railCollapsed}
            onToggleCollapsed={() => setRailCollapsed((v) => !v)}
          />
        </div>
      )}

      <div
        {...swipe.handlers}
        className={cx(
          "relative flex h-dvh w-full flex-col overflow-hidden bg-surface touch-pan-y",
          isDesktop
            ? "max-w-[1000px] flex-1"
            : "max-w-[460px] shadow-panel sm:border-x sm:border-line",
        )}
      >
        {/* Home has no header — the feed's search bar is the header. */}
        {tab !== "home" && showChrome && (
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-3">
            {avatarButton}
            <h1 className="text-base font-bold text-ink">{t("messages")}</h1>
          </header>
        )}

        <main className={cx("min-h-0 flex-1", tab === "chat" ? "flex flex-col" : "")}>
          {tab === "home" && <Feed leading={avatarButton} />}
          {tab === "chat" && (
            <ChatView onConversationChange={onConversationChange} onStartCall={startCall} />
          )}
        </main>

        {/* Bottom nav — mobile only */}
        {!isDesktop && showChrome && (
          <nav className="flex h-16 shrink-0 items-center justify-around border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)]">
            {NAV.map((item) => {
              const active = tab === item.key;
              const Icon = active ? item.fill : item.line;
              const badge = item.key === "chat" ? unreadChats : 0;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setTab(item.key);
                    setOverlay(null);
                  }}
                  aria-current={active ? "page" : undefined}
                  aria-label={t(item.labelKey)}
                  className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5"
                >
                  <span className="relative">
                    <Icon className={cx("size-6 transition", active ? "text-accent" : "text-faint")} />
                    {badge > 0 && (
                      <span className="absolute -right-2 -top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                        {badge}
                      </span>
                    )}
                  </span>
                  <span className={cx("text-[11px] font-medium transition", active ? "text-accent" : "text-faint")}>
                    {t(item.labelKey)}
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Mobile drawer */}
        {!isDesktop && (
          <SidebarDrawer
            {...sidebarProps}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            progress={swipe.progress}
            dragging={swipe.dragging}
          />
        )}

        {/* Full-surface overlays */}
        {overlay === "profile" && (
          <div className="absolute inset-0 z-50 bg-surface animate-slide-in-left">
            <Profile user={user} onBack={() => setOverlay(null)} />
          </div>
        )}
        {overlay === "history" && (
          <div className="absolute inset-0 z-50 bg-surface animate-slide-in-left">
            <History onBack={() => setOverlay(null)} />
          </div>
        )}
        {overlay === "settings" && (
          <div className="absolute inset-0 z-50 bg-surface animate-slide-in-left">
            <Settings onBack={() => setOverlay(null)} />
          </div>
        )}

        {/* A minimised call keeps running while the rest of the app stays usable */}
        {call && callMinimized && (
          <MinimizedCall
            session={call}
            onRestore={() => setCallMinimized(false)}
            onEnd={() => setCall(null)}
          />
        )}
        {call && !callMinimized && (
          <CallOverlay
            session={call}
            onEnd={() => setCall(null)}
            onMinimize={() => setCallMinimized(true)}
          />
        )}
      </div>
    </div>
  );
}
