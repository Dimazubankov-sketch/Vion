"use client";

import {
  RiChat3Line,
  RiCloseLine,
  RiCustomerServiceLine,
  RiHome5Line,
  RiLogoutBoxRLine,
  RiMoonLine,
  RiNotification3Line,
  RiSearchLine,
  RiSettings4Line,
  RiSunLine,
  RiUserSmileLine,
} from "@remixicon/react";
import { Switch } from "react-aria-components";
import { Avatar } from "@/components/ui/avatar";
import { VionWordmark } from "@/components/logo";
import type { VionUser } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { cx } from "@/utils/cx";
import type { AppTab } from "./app-shell";

interface Row {
  key: AppTab | "profile";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar({
  open,
  onClose,
  user,
  tab,
  onNavigate,
  onOpenProfile,
  onSignOut,
  unread,
}: {
  open: boolean;
  onClose: () => void;
  user: VionUser;
  tab: AppTab;
  onNavigate: (tab: AppTab) => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  unread: { notifications: number; chat: number };
}) {
  const { theme, toggle } = useTheme();

  const rows: Row[] = [
    { key: "home", label: "Home", icon: RiHome5Line },
    { key: "notifications", label: "Notifications", icon: RiNotification3Line, badge: unread.notifications },
    { key: "chat", label: "Messages", icon: RiChat3Line, badge: unread.chat },
    { key: "profile", label: "Profile", icon: RiUserSmileLine },
  ];

  if (!open) return null;

  const go = (key: Row["key"]) => {
    if (key === "profile") onOpenProfile();
    else onNavigate(key);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-40">
      {/* Backdrop */}
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 animate-fade-in"
      />

      {/* Panel */}
      <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col justify-between bg-surface p-4 shadow-float animate-slide-in-left">
        <div className="flex min-h-0 flex-col gap-4">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <VionWordmark markClassName="size-6" className="[&_span]:text-xl" />
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-3"
            >
              <RiCloseLine className="size-5" />
            </button>
          </div>

          {/* User card → opens profile */}
          <button
            onClick={() => go("profile")}
            className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left transition hover:bg-surface-3"
          >
            <Avatar src={user.avatar} name={user.name} size={44} online />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">@{user.handle}</p>
            </div>
          </button>

          {/* Quick search */}
          <div className="flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2.5">
            <RiSearchLine className="size-5 shrink-0 text-faint" />
            <input
              placeholder="Quick search…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            />
          </div>

          {/* Primary nav */}
          <nav className="flex flex-col gap-1">
            {rows.map((row) => {
              const selected = row.key !== "profile" && row.key === tab;
              const Icon = row.icon;
              return (
                <button
                  key={row.key}
                  onClick={() => go(row.key)}
                  aria-current={selected ? "page" : undefined}
                  className={cx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                    selected
                      ? "bg-accent text-white shadow-panel"
                      : "text-ink hover:bg-surface-2",
                  )}
                >
                  <Icon className={cx("size-5 shrink-0", selected ? "text-white" : "text-muted")} />
                  <span className="flex-1">{row.label}</span>
                  {row.badge ? (
                    <span
                      className={cx(
                        "flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                        selected ? "bg-white/25 text-white" : "bg-accent text-white",
                      )}
                    >
                      {row.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-1">
          {/* Theme toggle */}
          <Switch
            isSelected={theme === "dark"}
            onChange={toggle}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-2"
          >
            {theme === "dark" ? (
              <RiMoonLine className="size-5 text-muted" />
            ) : (
              <RiSunLine className="size-5 text-muted" />
            )}
            <span className="flex-1">Dark mode</span>
            <span
              className={cx(
                "relative h-5 w-9 rounded-full transition",
                theme === "dark" ? "bg-accent" : "bg-surface-3",
              )}
            >
              <span
                className={cx(
                  "absolute top-0.5 size-4 rounded-full bg-white shadow transition",
                  theme === "dark" ? "left-[18px]" : "left-0.5",
                )}
              />
            </span>
          </Switch>

          <SecondaryRow icon={RiCustomerServiceLine} label="Support" />
          <SecondaryRow icon={RiSettings4Line} label="Settings" />
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger transition hover:bg-danger/10"
          >
            <RiLogoutBoxRLine className="size-5" />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

function SecondaryRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-surface-2">
      <Icon className="size-5 text-muted" />
      {label}
    </button>
  );
}
