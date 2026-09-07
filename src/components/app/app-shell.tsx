"use client";

import { useCallback, useMemo, useState } from "react";
import {
  RiChat3Fill,
  RiChat3Line,
  RiHome5Fill,
  RiHome5Line,
  RiNotification3Fill,
  RiNotification3Line,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { VionWordmark } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { useStore } from "@/lib/app-store";
import { useT } from "@/lib/settings-context";
import { NOTIFICATIONS } from "@/lib/mock-data";
import type { TranslationKey } from "@/lib/i18n";
import { cx } from "@/utils/cx";
import { Feed } from "./feed";
import { Notifications } from "./notifications";
import { ChatView } from "./chat";
import { Sidebar } from "./sidebar";
import { Profile } from "./profile";
import { History } from "./history";
import { Settings } from "./settings";
import { CallOverlay, type CallKind } from "./call";

export type AppTab = "home" | "notifications" | "chat";
type Overlay = "profile" | "history" | "settings" | null;

const NAV: {
  key: AppTab;
  labelKey: TranslationKey;
  line: React.ComponentType<{ className?: string }>;
  fill: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "home", labelKey: "home", line: RiHome5Line, fill: RiHome5Fill },
  { key: "notifications", labelKey: "notifications", line: RiNotification3Line, fill: RiNotification3Fill },
  { key: "chat", labelKey: "messages", line: RiChat3Line, fill: RiChat3Fill },
];

const TITLES: Record<AppTab, TranslationKey> = {
  home: "home",
  notifications: "notifications",
  chat: "messages",
};

export function AppShell() {
  const { user, signOut } = useAuth();
  const { chats } = useStore();
  const t = useT();

  const [tab, setTab] = useState<AppTab>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [call, setCall] = useState<{ name: string; avatar?: string; kind: CallKind } | null>(null);

  const onConversationChange = useCallback((open: boolean) => setConversationOpen(open), []);
  const startCall = useCallback(
    (name: string, avatar: string | undefined, kind: CallKind) => setCall({ name, avatar, kind }),
    [],
  );

  const unread = useMemo(
    () => ({
      chat: chats.reduce((n, c) => n + c.unread, 0),
      notifications: NOTIFICATIONS.filter((n) => n.unread).length,
    }),
    [chats],
  );

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
    unread,
  };

  return (
    <div className="flex h-dvh w-full justify-center bg-canvas">
      {/* Permanent rail on desktop */}
      <div className="hidden h-dvh lg:block">
        <Sidebar variant="static" {...sidebarProps} />
      </div>

      {/* App surface */}
      <div
        className={cx(
          "relative flex h-dvh w-full max-w-[460px] flex-col overflow-hidden bg-surface shadow-panel",
          "sm:border-x sm:border-line lg:max-w-[1000px] lg:flex-1 lg:border-l-0 lg:shadow-none",
        )}
      >
        {/* Header */}
        <header
          className={cx(
            "h-14 shrink-0 items-center gap-3 border-b border-line px-3",
            conversationOpen ? "hidden lg:flex" : "flex",
          )}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="shrink-0 rounded-full transition hover:opacity-80 lg:hidden"
          >
            <Avatar src={user.avatar} name={user.name} size={36} online />
          </button>

          {tab === "home" ? (
            <VionWordmark markClassName="size-6" className="[&_span]:text-xl" />
          ) : (
            <h1 className="text-base font-bold text-ink">{t(TITLES[tab])}</h1>
          )}
        </header>

        {/* Content */}
        <main
          className={cx(
            "min-h-0 flex-1",
            tab === "chat" ? "flex flex-col" : "scroll-clean overflow-y-auto",
          )}
        >
          {tab === "home" && <Feed />}
          {tab === "notifications" && <Notifications />}
          {tab === "chat" && (
            <ChatView onConversationChange={onConversationChange} onStartCall={startCall} />
          )}
        </main>

        {/* Bottom nav — mobile only */}
        <nav
          className={cx(
            "h-16 shrink-0 items-center justify-around border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)] lg:hidden",
            conversationOpen ? "hidden" : "flex",
          )}
        >
          {NAV.map((item) => {
            const active = tab === item.key;
            const Icon = active ? item.fill : item.line;
            const badge = item.key === "chat" ? unread.chat : item.key === "notifications" ? unread.notifications : 0;
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

        {/* Mobile drawer */}
        <Sidebar
          variant="drawer"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          {...sidebarProps}
        />

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

        {call && (
          <CallOverlay
            name={call.name}
            avatar={call.avatar}
            kind={call.kind}
            onEnd={() => setCall(null)}
          />
        )}
      </div>
    </div>
  );
}
