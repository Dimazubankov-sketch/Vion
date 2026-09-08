"use client";

import { useState } from "react";
import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBin6Line,
  RiFlagLine,
  RiForbidLine,
  RiImage2Line,
  RiScreenshot2Line,
  RiShareForwardLine,
  RiSpam2Line,
  RiTimer2Line,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { ToggleVisual } from "@/components/ui/toggle";
import { useStore } from "@/lib/app-store";
import { useT } from "@/lib/settings-context";
import { chatAvatar, chatTitle, type Chat } from "@/lib/mock-data";
import { cx } from "@/utils/cx";

/** Bottom-sheet shell used by every chat sheet. */
function Sheet({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[88%] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-float animate-slide-up-in sm:m-4 sm:max-w-sm sm:rounded-3xl"
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
    <Sheet title={chatTitle(chat)} onClose={onClose}>
      <Row icon={<RiImage2Line className="size-5 text-muted" />} label={t("photoOrVideo")} hint="—" />

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
    <Sheet title={`${t("report")}: ${name}`} onClose={onClose}>
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
export function MessageMenu({
  canEdit,
  canForward,
  onClose,
  onCopy,
  onEdit,
  onForward,
  onSelect,
  onDelete,
}: {
  canEdit: boolean;
  canForward: boolean;
  onClose: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onForward: () => void;
  onSelect: () => void;
  onDelete: (scope: "me" | "everyone") => void;
}) {
  const t = useT();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Sheet onClose={onClose}>
      {!deleteOpen ? (
        <>
          {canEdit && <Row icon={<RiCheckLine className="size-5 text-muted" />} label={t("editMessage")} onClick={onEdit} />}
          <Row icon={<RiImage2Line className="size-5 text-muted" />} label={t("copyText")} onClick={onCopy} />
          {canForward && (
            <Row icon={<RiShareForwardLine className="size-5 text-muted" />} label={t("forwardMessage")} onClick={onForward} />
          )}
          <Row icon={<RiCheckLine className="size-5 text-muted" />} label={t("selectMessages")} onClick={onSelect} />
          <Row danger icon={<RiDeleteBin6Line className="size-5" />} label={t("deleteMessage")} onClick={() => setDeleteOpen(true)} />
        </>
      ) : (
        <>
          {canEdit && <Row danger label={t("deleteForEveryone")} onClick={() => onDelete("everyone")} />}
          <Row danger label={t("deleteForMe")} onClick={() => onDelete("me")} />
          <Row label={t("cancel")} onClick={() => setDeleteOpen(false)} />
        </>
      )}
    </Sheet>
  );
}
