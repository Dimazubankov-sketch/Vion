"use client";

import { useCallback, useState } from "react";
import {
  RiChat3Fill,
  RiChat3Line,
  RiHome5Fill,
  RiHome5Line,
  RiMenuLine,
  RiNotification3Fill,
  RiNotification3Line,
  RiQuillPenLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { VionWordmark } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { CHATS, NOTIFICATIONS } from "@/lib/mock-data";
import { cx } from "@/utils/cx";
import { Feed } from "./feed";
import { Notifications } from "./notifications";
import { ChatView } from "./chat";
import { Sidebar } from "./sidebar";
import { Profile } from "./profile";

export type AppTab = "home" | "notifications" | "chat";

const unreadChats = CHATS.reduce((n, c) => n + c.unread, 0);
const unreadNotifs = NOTIFICATIONS.filter((n) => n.unread).length;

const NAV: {
  key: AppTab;
  label: string;
  line: React.ComponentType<{ className?: string }>;
  fill: React.ComponentType<{ className?: string }>;
  badge?: number;
}[] = [
  { key: "home", label: "Home", line: RiHome5Line, fill: RiHome5Fill },
  { key: "notifications", label: "Notifications", line: RiNotification3Line, fill: RiNotification3Fill, badge: unreadNotifs },
  { key: "chat", label: "Messages", line: RiChat3Line, fill: RiChat3Fill, badge: unreadChats },
];

const TITLES: Record<AppTab, string> = {
  home: "Home",
  notifications: "Notifications",
  chat: "Messages",
};

export function AppShell() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<AppTab>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);

  const onConversationChange = useCallback((open: boolean) => setConversationOpen(open), []);

  if (!user) return null;

  const showChrome = !conversationOpen;

  return (
    <div className="flex min-h-dvh w-full justify-center bg-canvas">
      <div className="relative flex h-dvh w-full max-w-[460px] flex-col overflow-hidden bg-surface shadow-panel sm:my-0 sm:border-x sm:border-line">
        {/* Header */}
        {showChrome && (
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="shrink-0 rounded-full transition hover:opacity-80"
            >
              <Avatar src={user.avatar} name={user.name} size={36} online />
            </button>

            {tab === "home" ? (
              <VionWordmark markClassName="size-6" className="[&_span]:text-xl" />
            ) : (
              <h1 className="text-base font-bold text-ink">{TITLES[tab]}</h1>
            )}

            <div className="ml-auto flex items-center gap-1">
              {tab === "home" && (
                <button
                  aria-label="Compose"
                  className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-accent"
                >
                  <RiQuillPenLine className="size-5" />
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Menu"
                className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-accent"
              >
                <RiMenuLine className="size-5" />
              </button>
            </div>
          </header>
        )}

        {/* Content */}
        <main className={cx("min-h-0 flex-1", tab === "chat" ? "flex flex-col" : "scroll-clean overflow-y-auto")}>
          {tab === "home" && <Feed />}
          {tab === "notifications" && <Notifications />}
          {tab === "chat" && <ChatView onConversationChange={onConversationChange} />}
        </main>

        {/* Bottom nav */}
        {showChrome && (
          <nav className="flex h-16 shrink-0 items-center justify-around border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)]">
            {NAV.map((item) => {
              const active = tab === item.key;
              const Icon = active ? item.fill : item.line;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5"
                >
                  <span className="relative">
                    <Icon className={cx("size-6 transition", active ? "text-accent" : "text-faint")} />
                    {item.badge ? (
                      <span className="absolute -right-2 -top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={cx("text-[11px] font-medium transition", active ? "text-accent" : "text-faint")}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Sidebar drawer */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          tab={tab}
          onNavigate={setTab}
          onOpenProfile={() => setProfileOpen(true)}
          onSignOut={signOut}
          unread={{ notifications: unreadNotifs, chat: unreadChats }}
        />

        {/* Profile overlay */}
        {profileOpen && (
          <div className="absolute inset-0 z-50 bg-surface animate-slide-in-left">
            <Profile user={user} onBack={() => setProfileOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
