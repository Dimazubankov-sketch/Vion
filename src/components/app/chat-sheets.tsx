"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  RiChat1Line,
  RiCheckDoubleLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBin6Line,
  RiFlagLine,
  RiForbidLine,
  RiLinksLine,
  RiNotification3Line,
  RiNotificationOffLine,
  RiPencilLine,
  RiPushpin2Line,
  RiReplyLine,
  RiScreenshot2Line,
  RiShareForwardLine,
  RiSpam2Line,
  RiTimer2Line,
  RiUnpinLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { ToggleVisual } from "@/components/ui/toggle";
import { useStore } from "@/lib/app-store";
import { useT } from "@/lib/settings-context";
import { chatAvatar, chatTitle, type Chat, type ChatMessage } from "@/lib/mock-data";
import { BubbleBody, bubbleShellClass } from "./chat-bubble";
import { cx } from "@/utils/cx";

/**
 * Shell used by chat sheets. By default it's a bottom sheet on mobile (and
 * centred on wide screens); pass `center` to always open centred in the chat
 * screen instead of pinned to the bottom.
 */
function Sheet({
  title,
  onClose,
  center = false,
  children,
}: {
  title?: string;
  onClose: () => void;
  center?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("absolute inset-0 z-[70] flex justify-center", center ? "items-center p-4" : "items-end sm:items-center")}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "relative flex max-h-[88%] w-full flex-col overflow-hidden border border-line bg-surface shadow-float",
          center ? "max-w-sm rounded-3xl animate-pop-in" : "rounded-t-3xl animate-slide-up-in sm:m-4 sm:max-w-sm sm:rounded-3xl",
        )}
      >
        {title && (
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <h2 className="flex-1 text-base font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-3"
            >
              <RiCloseLine className="size-5" />
            </button>
          </div>
        )}
        <div className="scroll-clean min-h-0 overflow-y-auto p-2">{children}</div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  hint,
  onClick,
  danger,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface-2",
        danger ? "text-danger" : "text-ink",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      {children}
    </button>
  );
}

const DISAPPEAR_OPTIONS = [0, 30, 300, 3600, 86400];
function disappearLabel(seconds: number, off: string) {
  if (seconds === 0) return off;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${seconds / 60}m`;
  if (seconds < 86400) return `${seconds / 3600}h`;
  return `${seconds / 86400}d`;
}

/** The chat "..." menu: media settings, blocks, report, clear/delete. */
export function ChatMoreSheet({
  chat,
  onClose,
  onCleared,
}: {
  chat: Chat;
  onClose: () => void;
  onCleared: () => void;
}) {
  const t = useT();
  const { chatSettings, setChatSetting, isBlocked, toggleBlock, clearHistory } = useStore();
  const settings = chatSettings(chat.id);
  const blocked = isBlocked(chat.id);
  const [disappearOpen, setDisappearOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "clear">(null);
  const [report, setReport] = useState(false);

  if (report) {
    return <ReportSheet name={chatTitle(chat)} onClose={() => setReport(false)} onDone={onClose} />;
  }

  return (
    <Sheet title={chatTitle(chat)} onClose={onClose} center>
      <Row
        icon={<RiTimer2Line className="size-5 text-muted" />}
        label={t("disappearing")}
        onClick={() => setDisappearOpen((v) => !v)}
      >
        <span className="text-sm text-muted">
          {settings.disappearing === 0 ? t("disappearingOff") : disappearLabel(settings.disappearing, t("disappearingOff"))}
        </span>
      </Row>
      {disappearOpen && (
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          {DISAPPEAR_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setChatSetting(chat.id, "disappearing", s);
                setDisappearOpen(false);
              }}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                settings.disappearing === s ? "bg-accent text-white" : "bg-surface-2 text-ink hover:bg-surface-3",
              )}
            >
              {disappearLabel(s, t("disappearingOff"))}
            </button>
          ))}
        </div>
      )}

      <Row
        icon={<RiScreenshot2Line className="size-5 text-muted" />}
        label={t("blockScreenshots")}
        onClick={() => setChatSetting(chat.id, "screenshots", !settings.screenshots)}
      >
        <ToggleVisual on={settings.screenshots} />
      </Row>
      <Row
        icon={<RiShareForwardLine className="size-5 text-muted" />}
        label={t("blockForwarding")}
        onClick={() => setChatSetting(chat.id, "forwarding", !settings.forwarding)}
      >
        <ToggleVisual on={settings.forwarding} />
      </Row>

      <div className="my-1 h-px bg-line" />

      <Row
        danger
        icon={<RiForbidLine className="size-5" />}
        label={blocked ? t("unblockUser") : t("blockUser")}
        onClick={() => {
          toggleBlock(chat.id);
          onClose();
        }}
      />
      <Row danger icon={<RiSpam2Line className="size-5" />} label={t("blacklist")} onClick={() => { toggleBlock(chat.id); onClose(); }} />
      <Row danger icon={<RiFlagLine className="size-5" />} label={t("reportUser")} onClick={() => setReport(true)} />
      <Row
        danger
        icon={<RiDeleteBin6Line className="size-5" />}
        label={t("clearHistory")}
        onClick={() => setConfirm("clear")}
      />

      {confirm === "clear" && (
        <ConfirmSheet
          message={t("clearHistoryQ")}
          confirmLabel={t("clearHistory")}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            clearHistory(chat.id);
            setConfirm(null);
            onCleared();
          }}
        />
      )}
    </Sheet>
  );
}

export function ReportSheet({
  name,
  onClose,
  onDone,
}: {
  name: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const t = useT();
  const [sent, setSent] = useState(false);

  return (
    <Sheet title={`${t("report")}: ${name}`} onClose={onClose} center>
      {sent ? (
        <p className="px-3 py-6 text-center text-sm text-muted">{t("reportThanks")}</p>
      ) : (
        <>
          {[t("reportReasonSpam"), t("reportReasonAbuse"), t("reportReasonOther")].map((reason) => (
            <Row key={reason} label={reason} onClick={() => { setSent(true); setTimeout(() => (onDone ?? onClose)(), 1200); }} />
          ))}
        </>
      )}
    </Sheet>
  );
}

export function ConfirmSheet({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center p-4">
      <button aria-label={t("close")} onClick={onCancel} className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div className="relative w-full max-w-xs rounded-2xl border border-line bg-surface p-4 shadow-float animate-pop-in">
        <p className="text-center text-sm text-ink">{message}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="h-10 flex-1 rounded-xl border border-line bg-surface text-sm font-medium text-ink transition hover:bg-surface-3"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="h-10 flex-1 rounded-xl bg-danger text-sm font-semibold text-white transition hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pick a chat to forward a message into. */
export function ForwardPicker({
  chats,
  excludeId,
  onClose,
  onPick,
}: {
  chats: Chat[];
  excludeId?: string;
  onClose: () => void;
  onPick: (chatId: string) => void;
}) {
  const t = useT();
  return (
    <Sheet title={t("forwardTo")} onClose={onClose}>
      {chats
        .filter((c) => c.id !== excludeId)
        .map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2"
          >
            <Avatar src={chatAvatar(c)} name={chatTitle(c)} size={40} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{chatTitle(c)}</span>
          </button>
        ))}
    </Sheet>
  );
}

/** The per-message action menu (delete / edit / forward / copy / select). */
/**
 * The per-message action menu. Instead of a bottom sheet, this opens right
 * under the long-pressed message: the backdrop blurs the whole chat while a
 * frozen, sharp clone of that one message floats above the blur next to the
 * menu, so it reads as "everything but this message and the menu is blurred".
 */
export function MessageActionMenu({
  message,
  rect,
  mine,
  isGroup,
  canEdit,
  canForward,
  elementCount,
  pinned,
  onClose,
  onReply,
  onCopy,
  onCopyLink,
  onPin,
  onEdit,
  onForward,
  onSelect,
  onSelectAll,
  onDelete,
}: {
  message: ChatMessage;
  rect: DOMRect;
  mine: boolean;
  isGroup: boolean;
  canEdit: boolean;
  canForward: boolean;
  elementCount: number;
  pinned: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy?: () => void;
  onCopyLink: () => void;
  onPin: () => void;
  onEdit: () => void;
  onForward: () => void;
  onSelect: () => void;
  onSelectAll: () => void;
  onDelete: (scope: "me" | "everyone") => void;
}) {
  void onCopy;
  const t = useT();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; ready: boolean }>({
    top: rect.bottom + 8,
    left: rect.left,
    ready: false,
  });

  // Measure the menu once it's rendered, then flip above / clamp to the
  // viewport so it never spills off-screen regardless of where the message sits.
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const menuRect = el.getBoundingClientRect();
    const margin = 12;
    let top = rect.bottom + 8;
    if (top + menuRect.height > window.innerHeight - margin) {
      top = rect.top - 8 - menuRect.height;
    }
    top = Math.max(margin, Math.min(top, window.innerHeight - menuRect.height - margin));
    let left = mine ? rect.right - menuRect.width : rect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - menuRect.width - margin));
    setPos({ top, left, ready: true });
    // `mounted` flips true on the render that first attaches menuRef inside the
    // portal — it has to be a dependency or this effect never re-measures.
  }, [rect, mine, deleteOpen, mounted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[85]">
      <button
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/10 backdrop-blur-md animate-fade-in"
      />

      {/* A sharp, frozen clone of the pressed message — it sits above the
          blurred backdrop so it (and the menu) read as un-blurred. */}
      <div
        className={cx("pointer-events-none fixed", bubbleShellClass(message, mine))}
        style={{ top: rect.top, left: rect.left, width: rect.width }}
      >
        <BubbleBody message={message} mine={mine} isGroup={isGroup} />
      </div>

      <div
        ref={menuRef}
        role="menu"
        style={{ top: pos.top, left: pos.left, transformOrigin: mine ? "top right" : "top left" }}
        className={cx(
          "fixed w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-float transition duration-150",
          pos.ready ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        {!deleteOpen ? (
          <>
            <Row icon={<RiReplyLine className="size-5 text-muted" />} label={t("reply")} onClick={onReply} />
            {canEdit && <Row icon={<RiPencilLine className="size-5 text-muted" />} label={t("editMessage")} onClick={onEdit} />}
            <Row
              icon={pinned ? <RiUnpinLine className="size-5 text-muted" /> : <RiPushpin2Line className="size-5 text-muted" />}
              label={pinned ? t("unpinMessage") : t("pinMessage")}
              onClick={onPin}
            />
            <Row icon={<RiLinksLine className="size-5 text-muted" />} label={t("copyLink")} onClick={onCopyLink} />
            {canForward && (
              <Row icon={<RiShareForwardLine className="size-5 text-muted" />} label={t("forwardMessage")} onClick={onForward} />
            )}
            <Row danger icon={<RiDeleteBin6Line className="size-5" />} label={t("deleteMessage")} onClick={() => setDeleteOpen(true)} />

            <div className="my-1 h-px bg-line" />

            <Row icon={<RiCheckLine className="size-5 text-muted" />} label={t("selectMessages")} onClick={onSelect} />
            {elementCount > 1 && (
              <Row
                icon={<RiCheckDoubleLine className="size-5 text-muted" />}
                label={`${t("selectAll")} ${elementCount}`}
                onClick={onSelectAll}
              />
            )}
          </>
        ) : (
          <>
            {canEdit && <Row danger label={t("deleteForEveryone")} onClick={() => onDelete("everyone")} />}
            <Row danger label={t("deleteForMe")} onClick={() => onDelete("me")} />
            <Row label={t("cancel")} onClick={() => setDeleteOpen(false)} />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * The chat-list context menu (long-press / right-click a chat): mark unread,
 * pin, mute, delete. Positioned under the row over a blurred backdrop.
 */
export function ChatListMenu({
  chat,
  rect,
  onClose,
  onPin,
  onMute,
  onMarkUnread,
  onDelete,
}: {
  chat: Chat;
  rect: DOMRect;
  onClose: () => void;
  onPin: () => void;
  onMute: () => void;
  onMarkUnread: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [confirm, setConfirm] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: rect.bottom + 6, left: rect.left + 12, ready: false });
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 12;
    let top = rect.bottom + 6;
    if (top + r.height > window.innerHeight - margin) top = rect.top - 6 - r.height;
    top = Math.max(margin, Math.min(top, window.innerHeight - r.height - margin));
    const left = Math.max(margin, Math.min(rect.left + 12, window.innerWidth - r.width - margin));
    setPos({ top, left, ready: true });
  }, [rect, mounted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[85]">
      <button aria-label={t("close")} onClick={onClose} className="absolute inset-0 cursor-default bg-black/10 backdrop-blur-md animate-fade-in" />
      <div
        ref={menuRef}
        role="menu"
        style={{ top: pos.top, left: pos.left }}
        className={cx(
          "fixed w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-float transition duration-150",
          pos.ready ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        {confirm ? (
          <div className="p-3">
            <p className="px-1 py-2 text-center text-sm text-ink">{t("deleteChatQ")}</p>
            <div className="mt-1 flex gap-2">
              <button onClick={() => setConfirm(false)} className="h-9 flex-1 rounded-xl border border-line text-sm font-medium text-ink transition hover:bg-surface-3">
                {t("cancel")}
              </button>
              <button onClick={onDelete} className="h-9 flex-1 rounded-xl bg-danger text-sm font-semibold text-white transition hover:brightness-110">
                {t("deleteChat")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <Row icon={<RiChat1Line className="size-5 text-muted" />} label={t("markUnread")} onClick={onMarkUnread} />
            <Row
              icon={chat.pinned ? <RiUnpinLine className="size-5 text-muted" /> : <RiPushpin2Line className="size-5 text-muted" />}
              label={chat.pinned ? t("unpinChat") : t("pinChat")}
              onClick={onPin}
            />
            <Row
              icon={chat.muted ? <RiNotification3Line className="size-5 text-muted" /> : <RiNotificationOffLine className="size-5 text-muted" />}
              label={chat.muted ? t("enableNotifications") : t("disableNotifications")}
              onClick={onMute}
            />
            <Row danger icon={<RiDeleteBin6Line className="size-5" />} label={t("deleteChat")} onClick={() => setConfirm(true)} />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
