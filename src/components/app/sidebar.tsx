"use client";

import {
  RiChat3Line,
  RiCloseLine,
  RiCustomerServiceLine,
  RiHistoryLine,
  RiHome5Line,
  RiLogoutBoxRLine,
  RiMoonLine,
  RiSearchLine,
  RiSettings4Line,
  RiSidebarFoldLine,
  RiSidebarUnfoldLine,
  RiSunLine,
  RiUserSmileLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { ToggleVisual } from "@/components/ui/toggle";
import { emailFor } from "@/lib/accounts";
import { VoyzenMark, VoyzenWordmark } from "@/components/logo";
import type { VoyzenUser } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useT } from "@/lib/settings-context";
import type { TranslationKey } from "@/lib/i18n";
import { cx } from "@/utils/cx";
import type { AppTab } from "./app-shell";

/** Drawer width in px — shared with the swipe gesture so the drag maps 1:1. */
export const DRAWER_WIDTH = 320;

type RowKey = AppTab | "profile" | "history";

interface Row {
  key: RowKey;
  labelKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SidebarProps {
  user: VoyzenUser;
  tab: AppTab;
  onNavigate: (tab: AppTab) => void;
  onOpenProfile: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  unread: { chat: number };
}

/** The panel itself — shared by the desktop rail and the mobile drawer. */
function Panel({
  user,
  tab,
  onNavigate,
  onOpenProfile,
  onOpenHistory,
  onOpenSettings,
  onSignOut,
  unread,
  collapsed = false,
  onToggleCollapsed,
  onClose,
  variant,
}: SidebarProps & {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onClose?: () => void;
  variant: "drawer" | "static";
}) {
  const { theme, toggle } = useTheme();
  const t = useT();

  const rows: Row[] = [
    { key: "home", labelKey: "home", icon: RiHome5Line },
    { key: "search", labelKey: "searchTab", icon: RiSearchLine },
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

  return (
    <aside
      className={cx(
        "flex h-full flex-col justify-between bg-surface transition-[width] duration-300 ease-in-out",
        variant === "static" && "shrink-0 border-r border-line",
        collapsed ? "w-[76px] px-3 py-4" : "p-4",
        variant === "drawer" && "w-full shadow-float",
      )}
      style={variant === "static" && !collapsed ? { width: DRAWER_WIDTH } : undefined}
    >
      <div className="flex min-h-0 flex-col gap-4">
        {/* Brand + collapse / close */}
        <div
          className={cx(
            "flex items-center",
            collapsed ? "flex-col gap-3" : "justify-between",
          )}
        >
          {collapsed ? <VoyzenMark className="size-8" /> : <VoyzenWordmark markClassName="size-9" />}

          {variant === "drawer" ? (
            <button
              onClick={onClose}
              aria-label={t("close")}
              className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-3"
            >
              <RiCloseLine className="size-5" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapsed}
              aria-label={collapsed ? t("expand2") : t("collapse")}
              title={collapsed ? t("expand2") : t("collapse")}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-ink"
            >
              {collapsed ? (
                <RiSidebarUnfoldLine className="size-5" />
              ) : (
                <RiSidebarFoldLine className="size-5" />
              )}
            </button>
          )}
        </div>

        {/* User card → profile */}
        <button
          onClick={() => go("profile")}
          title={collapsed ? user.name : undefined}
          className={cx(
            "flex items-center rounded-2xl bg-surface-2 text-left transition hover:bg-surface-3",
            collapsed ? "justify-center p-2" : "gap-3 p-3",
          )}
        >
          <Avatar src={user.avatar} name={user.name} size={44} online />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{emailFor(user.handle)}</p>
            </div>
          )}
        </button>

        <nav className="flex flex-col gap-1">
          {rows.map((row) => {
            const selected = row.key === tab;
            const Icon = row.icon;
            return (
              <button
                key={row.key}
                onClick={() => go(row.key)}
                aria-current={selected ? "page" : undefined}
                title={collapsed ? t(row.labelKey) : undefined}
                className={cx(
                  "relative flex items-center rounded-xl text-left text-sm font-medium transition",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  selected ? "bg-accent text-white shadow-panel" : "text-ink hover:bg-surface-2",
                )}
              >
                <Icon className={cx("size-5 shrink-0", selected ? "text-white" : "text-muted")} />
                {!collapsed && <span className="flex-1">{t(row.labelKey)}</span>}
                {row.badge ? (
                  <span
                    className={cx(
                      "flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                      collapsed && "absolute -right-0.5 -top-0.5 min-w-4 px-1 text-[10px]",
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
        <button
          onClick={toggle}
          role="switch"
          aria-checked={theme === "dark"}
          title={collapsed ? t("darkMode") : undefined}
          className={cx(
            "flex cursor-pointer items-center rounded-xl text-sm font-medium text-ink transition hover:bg-surface-2",
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
          )}
        >
          {theme === "dark" ? (
            <RiMoonLine className="size-5 shrink-0 text-muted" />
          ) : (
            <RiSunLine className="size-5 shrink-0 text-muted" />
          )}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{t("darkMode")}</span>
              <ToggleVisual on={theme === "dark"} size="sm" />
            </>
          )}
        </button>

        <SecondaryRow icon={RiCustomerServiceLine} label={t("support")} collapsed={collapsed} />
        <SecondaryRow
          icon={RiSettings4Line}
          label={t("settings")}
          collapsed={collapsed}
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
          title={collapsed ? t("signOut") : undefined}
          className={cx(
            "flex items-center rounded-xl text-left text-sm font-medium text-danger transition hover:bg-danger/10",
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
          )}
        >
          <RiLogoutBoxRLine className="size-5 shrink-0" />
          {!collapsed && t("signOut")}
        </button>
      </div>
    </aside>
  );
}

/** The permanent desktop rail, collapsible down to icons. */
export function SidebarRail({
  collapsed,
  onToggleCollapsed,
  ...props
}: SidebarProps & { collapsed: boolean; onToggleCollapsed: () => void }) {
  return (
    <Panel
      {...props}
      variant="static"
      collapsed={collapsed}
      onToggleCollapsed={onToggleCollapsed}
    />
  );
}

/**
 * The mobile drawer. `progress` (0..1) is supplied while a swipe is in flight;
 * resting, it follows `open` and animates there.
 */
export function SidebarDrawer({
  open,
  onClose,
  progress,
  dragging,
  ...props
}: SidebarProps & {
  open: boolean;
  onClose: () => void;
  progress: number | null;
  dragging: boolean;
}) {
  const t = useT();
  const p = progress ?? (open ? 1 : 0);
  if (p <= 0) return null;

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div className="absolute inset-0 z-40">
      <button
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        style={{
          opacity: p,
          transition: dragging ? "none" : `opacity 280ms ${ease}`,
        }}
      />
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: DRAWER_WIDTH,
          maxWidth: "88%",
          transform: `translateX(${(p - 1) * 100}%)`,
          transition: dragging ? "none" : `transform 280ms ${ease}`,
        }}
      >
        <Panel {...props} variant="drawer" onClose={onClose} />
      </div>
    </div>
  );
}

function SecondaryRow({
  icon: Icon,
  label,
  onClick,
  collapsed,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cx(
        "flex items-center rounded-xl text-left text-sm font-medium text-ink transition hover:bg-surface-2",
        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
      )}
    >
      <Icon className="size-5 shrink-0 text-muted" />
      {!collapsed && label}
    </button>
  );
}
