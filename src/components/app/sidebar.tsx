"use client";

import {
  RiChat3Line,
  RiCloseLine,
  RiCustomerServiceLine,
  RiHistoryLine,
  RiHome5Line,
  RiLogoutBoxRLine,
  RiMoonLine,
  RiNotification3Line,
  RiSettings4Line,
  RiSunLine,
  RiUserSmileLine,
} from "@remixicon/react";
import { Switch } from "react-aria-components";
import { Avatar } from "@/components/ui/avatar";
import { VionWordmark } from "@/components/logo";
import type { VionUser } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useT } from "@/lib/settings-context";
import type { TranslationKey } from "@/lib/i18n";
import { cx } from "@/utils/cx";
import type { AppTab } from "./app-shell";

type RowKey = AppTab | "profile" | "history";

interface Row {
  key: RowKey;
  labelKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar({
  variant = "drawer",
  open = true,
  onClose,
  user,
  tab,
  onNavigate,
  onOpenProfile,
  onOpenHistory,
  onOpenSettings,
  onSignOut,
  unread,
}: {
  /** "drawer" slides in over the app; "static" is the permanent desktop rail. */
  variant?: "drawer" | "static";
  open?: boolean;
  onClose?: () => void;
  user: VionUser;
  tab: AppTab;
  onNavigate: (tab: AppTab) => void;
  onOpenProfile: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  unread: { notifications: number; chat: number };
}) {
  const { theme, toggle } = useTheme();
  const t = useT();

  const rows: Row[] = [
    { key: "home", labelKey: "home", icon: RiHome5Line },
    { key: "notifications", labelKey: "notifications", icon: RiNotification3Line, badge: unread.notifications },
    { key: "chat", labelKey: "messages", icon: RiChat3Line, badge: unread.chat },
    { key: "history", labelKey: "history", icon: RiHistoryLine },
    { key: "profile", labelKey: "profile", icon: RiUserSmileLine },
  ];

  const go = (key: RowKey) => {
    if (key === "profile") onOpenProfile();
    else if (key === "history") onOpenHistory();
    else onNavigate(key);
    onClose?.();
  };

  const panel = (
    <aside
      className={cx(
        "flex h-full flex-col justify-between bg-surface p-4",
        variant === "drawer"
          ? "w-[82%] max-w-[300px] shadow-float animate-slide-in-left"
          : "w-[280px] shrink-0 border-r border-line",
      )}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex items-center justify-between">
          <VionWordmark markClassName="size-6" className="[&_span]:text-xl" />
          {variant === "drawer" && (
            <button
              onClick={onClose}
              aria-label={t("close")}
              className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-3"
            >
              <RiCloseLine className="size-5" />
            </button>
          )}
        </div>

        {/* User card → profile */}
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

        <nav className="flex flex-col gap-1">
          {rows.map((row) => {
            const selected = row.key !== "profile" && row.key !== "history" && row.key === tab;
            const Icon = row.icon;
            return (
              <button
                key={row.key}
                onClick={() => go(row.key)}
                aria-current={selected ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                  selected ? "bg-accent text-white shadow-panel" : "text-ink hover:bg-surface-2",
                )}
              >
                <Icon className={cx("size-5 shrink-0", selected ? "text-white" : "text-muted")} />
                <span className="flex-1">{t(row.labelKey)}</span>
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

      <div className="flex flex-col gap-1">
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
          <span className="flex-1">{t("darkMode")}</span>
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

        <SecondaryRow icon={RiCustomerServiceLine} label={t("support")} />
        <SecondaryRow
          icon={RiSettings4Line}
          label={t("settings")}
          onClick={() => {
            onOpenSettings();
            onClose?.();
          }}
        />
        <button
          onClick={() => {
            onClose?.();
            onSignOut();
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger transition hover:bg-danger/10"
        >
          <RiLogoutBoxRLine className="size-5" />
          {t("signOut")}
        </button>
      </div>
    </aside>
  );

  if (variant === "static") return panel;
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 lg:hidden">
      <button
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/35 animate-fade-in"
      />
      <div className="absolute inset-y-0 left-0">{panel}</div>
    </div>
  );
}

function SecondaryRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-surface-2"
    >
      <Icon className="size-5 text-muted" />
      {label}
    </button>
  );
}
