"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowUpLine,
  RiCheckDoubleLine,
  RiCloseLine,
  RiDownload2Line,
  RiFile3Line,
  RiFileTextLine,
  RiImageLine,
  RiLock2Line,
  RiMicLine,
  RiMoreLine,
  RiPencilLine,
  RiPhoneLine,
  RiSearchLine,
  RiSendPlane2Fill,
  RiVideoOnLine,
  RiVidiconLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { useStore } from "@/lib/app-store";
import { useIsDesktop, useSound, useT } from "@/lib/settings-context";
import {
  chatAvatar,
  chatOnline,
  chatTitle,
  PEOPLE,
  type Chat,
  type ChatMessage,
  type Person,
} from "@/lib/mock-data";
import { formatBytes } from "@/utils/image";
import { cx } from "@/utils/cx";
import { NewGroupDialog } from "./new-group-dialog";
import {
  LevelMeter,
  VideoMessage,
  VoiceMessage,
  formatTime,
  useMediaRecorder,
  type RecordKind,
  type RecordingResult,
} from "./voice";
import type { CallKind } from "./call";

/** Avatar for a chat row: one photo for DMs, a collage for groups. */
export function ChatAvatar({ chat, size = 52 }: { chat: Chat; size?: number }) {
  const src = chatAvatar(chat);
  if (chat.kind === "direct" || src) {
    return <Avatar src={src} name={chatTitle(chat)} size={size} online={chatOnline(chat)} />;
  }
  const members = (chat.members ?? []).slice(0, 4);
  return (
    <span
      className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-full bg-surface-2"
      style={{ width: size, height: size }}
    >
      {members.map((m) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={m.id} src={m.avatar} alt="" className="size-full object-cover" />
      ))}
    </span>
  );
}

export function ChatView({
  onConversationChange,
  onStartCall,
}: {
  onConversationChange?: (open: boolean) => void;
  onStartCall?: (name: string, avatar: string | undefined, kind: CallKind) => void;
}) {
  const t = useT();
  const isDesktop = useIsDesktop();
  const { chats, appendMessage, createGroup } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [newGroup, setNewGroup] = useState(false);

  const active = chats.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    onConversationChange?.(active !== null);
  }, [active, onConversationChange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        chatTitle(c).toLowerCase().includes(q) ||
        c.messages.at(-1)?.text?.toLowerCase().includes(q),
    );
  }, [chats, query]);

  const send = (partial: Omit<ChatMessage, "id" | "from" | "time">) => {
    if (!active) return;
    appendMessage(active.id, {
      id: `s${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
      from: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      ...partial,
    });
  };

  const onCreateGroup = (name: string, members: Person[]) => {
    const chat = createGroup(name, members);
    setNewGroup(false);
    setActiveId(chat.id);
  };

  return (
    <div className="relative flex h-full">
      {/* Chat list — full width on mobile, a fixed rail on desktop */}
      <div
        className={cx(
          "relative min-h-0 flex-col",
          isDesktop
            ? "flex w-[340px] shrink-0 border-r border-line"
            : active
              ? "hidden"
              : "flex w-full",
        )}
      >
        <div className="shrink-0 bg-surface px-4 pb-2 pt-1">
          <div className="flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2.5">
            <RiSearchLine className="size-5 shrink-0 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchChats")}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            />
          </div>
        </div>

        <div className="scroll-clean min-h-0 flex-1 overflow-y-auto">
          {filtered.map((chat) => {
            const last = chat.messages.at(-1);
            const preview =
              last?.text ||
              (last?.images?.length
                ? `📷 ${t("photo")}`
                : last?.file
                  ? `📎 ${last.file.name}`
                  : last?.audio
                    ? `🎤 ${t("voiceMessage")}`
                    : last?.video
                      ? `📹 ${t("videoMessage")}`
                      : "");
            const mine = last?.from === "me";
            return (
              <button
                key={chat.id}
                onClick={() => setActiveId(chat.id)}
                className={cx(
                  "flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-surface-2/50",
                  isDesktop && activeId === chat.id && "bg-surface-2",
                )}
              >
                <ChatAvatar chat={chat} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{chatTitle(chat)}</span>
                    <span className="shrink-0 text-xs text-faint">{last?.time}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {mine && <RiCheckDoubleLine className="size-4 shrink-0 text-accent" />}
                    <span className="truncate text-sm text-muted">{preview}</span>
                    {chat.unread > 0 && (
                      <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-faint">{t("noChats")}</p>
          )}
        </div>

        <button
          onClick={() => setNewGroup(true)}
          aria-label={t("newGroup")}
          className="absolute bottom-4 right-4 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-float transition hover:bg-accent-strong active:scale-95"
        >
          <RiPencilLine className="size-6" />
        </button>
      </div>

      {/* Conversation */}
      <div className={cx("min-w-0 flex-1", active || isDesktop ? "flex" : "hidden")}>
        {active ? (
          <Conversation
            key={active.id}
            chat={active}
            onBack={() => setActiveId(null)}
            onSend={send}
            onStartCall={onStartCall}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <span className="text-4xl">💬</span>
            <p className="text-sm text-muted">{t("messages")}</p>
          </div>
        )}
      </div>

      {newGroup && <NewGroupDialog onClose={() => setNewGroup(false)} onCreate={onCreateGroup} />}
    </div>
  );
}

function Conversation({
  chat,
  onBack,
  onSend,
  onStartCall,
}: {
  chat: Chat;
  onBack: () => void;
  onSend: (partial: Omit<ChatMessage, "id" | "from" | "time">) => void;
  onStartCall?: (name: string, avatar: string | undefined, kind: CallKind) => void;
}) {
  const t = useT();
  const isDesktop = useIsDesktop();
  const sound = useSound();
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const acceptRef = useRef<string>("");

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [chat.messages.length]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend({ text });
    setDraft("");
    sound("sent");
  };

  const openPicker = (accept: string) => {
    acceptRef.current = accept;
    setAttachOpen(false);
    requestAnimationFrame(() => fileRef.current?.click());
  };

  const onFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const images = files.filter((f) => f.type.startsWith("image/"));
    const others = files.filter((f) => !f.type.startsWith("image/"));

    if (images.length > 0) onSend({ images: images.map((f) => URL.createObjectURL(f)) });
    others.forEach((f) =>
      onSend({ file: { name: f.name, size: formatBytes(f.size), url: URL.createObjectURL(f) } }),
    );
    if (files.length) sound("sent");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onRecorded = useCallback(
    (result: RecordingResult) => {
      if (result.kind === "video") {
        onSend({ video: { url: result.url, duration: result.duration } });
      } else {
        onSend({ audio: { url: result.url, duration: result.duration, peaks: result.peaks } });
      }
      sound("sent");
    },
    [onSend, sound],
  );

  const subtitle =
    chat.kind === "group"
      ? `${(chat.members?.length ?? 0) + 1} ${t("members")}`
      : chatOnline(chat)
        ? t("online")
        : t("lastSeen");

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-2 py-2.5">
        {!isDesktop && (
          <button
            onClick={onBack}
            aria-label={t("back")}
            className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-3"
          >
            <RiArrowLeftLine className="size-5" />
          </button>
        )}
        <ChatAvatar chat={chat} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{chatTitle(chat)}</p>
          <p
            className={cx(
              "truncate text-xs",
              chat.kind === "direct" && chatOnline(chat) ? "text-online" : "text-muted",
            )}
          >
            {subtitle}
          </p>
        </div>
        <HeaderIcon
          label={t("videoCall")}
          onClick={() => onStartCall?.(chatTitle(chat), chatAvatar(chat), "video")}
        >
          <RiVideoOnLine className="size-5" />
        </HeaderIcon>
        <HeaderIcon
          label={t("voiceCall")}
          onClick={() => onStartCall?.(chatTitle(chat), chatAvatar(chat), "audio")}
        >
          <RiPhoneLine className="size-5" />
        </HeaderIcon>
        <HeaderIcon label="More"><RiMoreLine className="size-5" /></HeaderIcon>
      </header>

      <div ref={scrollRef} className="scroll-clean min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {chat.messages.map((m) => (
          <Bubble key={m.id} message={m} isGroup={chat.kind === "group"} />
        ))}
      </div>

      <div className="relative shrink-0 border-t border-line bg-surface p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          accept={acceptRef.current || undefined}
          onChange={(e) => onFiles(e.target.files)}
        />

        {attachOpen && (
          <>
            <button
              aria-label={t("close")}
              onClick={() => setAttachOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute bottom-full left-3 z-20 mb-2 w-52 overflow-hidden rounded-2xl border border-line bg-surface shadow-float animate-pop-in">
              <AttachOption
                icon={<RiImageLine className="size-5" />}
                label={t("photoOrVideo")}
                onClick={() => openPicker("image/*,video/*")}
              />
              <AttachOption
                icon={<RiFileTextLine className="size-5" />}
                label={t("document")}
                onClick={() => openPicker("")}
              />
            </div>
          </>
        )}

        <Composer
          draft={draft}
          onDraft={setDraft}
          onSubmit={submit}
          onAttach={() => setAttachOpen((v) => !v)}
          attachOpen={attachOpen}
          onRecorded={onRecorded}
        />
      </div>
    </div>
  );
}

/**
 * Message box with a press-and-hold recorder.
 *
 * A tap on the record button switches between voice and video message; holding
 * it records, and sliding up past the threshold locks the recording so you can
 * let go and keep talking.
 */
function Composer({
  draft,
  onDraft,
  onSubmit,
  onAttach,
  attachOpen,
  onRecorded,
}: {
  draft: string;
  onDraft: (v: string) => void;
  onSubmit: () => void;
  onAttach: () => void;
  attachOpen: boolean;
  onRecorded: (result: RecordingResult) => void;
}) {
  const t = useT();
  const sound = useSound();
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { recording, seconds, error, stream, start, stop, cancel, setError } =
    useMediaRecorder(barsRef);

  const [mode, setMode] = useState<RecordKind>("audio");
  const [locked, setLocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const press = useRef<{ y: number; started: boolean } | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);

  const finish = useCallback(
    async (send: boolean) => {
      setLocked(false);
      if (!send) {
        await cancel();
        sound("recordStop");
        return;
      }
      const result = await stop();
      sound("recordStop");
      // Ignore accidental taps that produced a fraction of a second.
      if (result && result.duration >= 0.6) onRecorded(result);
    },
    [cancel, onRecorded, sound, stop],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (recording) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = { y: e.clientY, started: false };
    holdTimer.current = setTimeout(async () => {
      if (!press.current) return;
      press.current.started = true;
      sound("recordStart");
      const ok = await start(mode);
      if (!ok) press.current = null;
    }, 220);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!press.current?.started || locked) return;
    if (press.current.y - e.clientY > 60) setLocked(true);
  };

  const endPress = (send: boolean) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    const current = press.current;
    press.current = null;
    if (!current) return;

    if (!current.started) {
      // A quick tap flips between voice and video messages.
      setMode((m) => (m === "audio" ? "video" : "audio"));
      sound("toggle");
      return;
    }
    if (locked) return; // keeps running until the user hits send or cancel
    void finish(send);
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2.5">
        <RiMicLine className="size-5 shrink-0 text-danger" />
        <p className="flex-1 text-xs text-muted">{error}</p>
        <button
          onClick={() => setError(null)}
          aria-label={t("close")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-3"
        >
          <RiCloseLine className="size-5" />
        </button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex flex-col gap-2">
        {mode === "video" && (
          <div className="flex justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="size-32 scale-x-[-1] rounded-full object-cover ring-2 ring-accent"
            />
          </div>
        )}

        <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-2 py-1.5">
          <button
            onClick={() => void finish(false)}
            aria-label={t("cancel")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-danger"
          >
            <RiCloseLine className="size-5" />
          </button>

          <span className="flex size-2 shrink-0 animate-pulse rounded-full bg-danger" aria-hidden />
          <span className="w-11 shrink-0 font-mono text-xs text-muted">{formatTime(seconds)}</span>

          <LevelMeter barsRef={barsRef} />

          {locked ? (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent">
              <RiLock2Line className="size-4" />
              {t("locked")}
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 text-xs text-faint">
              <RiArrowUpLine className="size-4 animate-bounce" />
            </span>
          )}

          <button
            onClick={() => void finish(true)}
            aria-label="Send"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-strong"
          >
            <RiSendPlane2Fill className="size-5" />
          </button>
        </div>

        {!locked && (
          <p className="text-center text-[11px] text-faint">{t("holdToRecord")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1.5 rounded-2xl bg-surface-2 px-2 py-1.5">
      <ComposerIcon label={t("photoOrVideo")} onClick={onAttach} active={attachOpen}>
        <RiAddLine className="size-5" />
      </ComposerIcon>
      <textarea
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={1}
        placeholder={t("message")}
        className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-faint"
      />
      {draft.trim() ? (
        <button
          onClick={onSubmit}
          aria-label="Send"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-strong"
        >
          <RiSendPlane2Fill className="size-5" />
        </button>
      ) : (
        <button
          type="button"
          aria-label={mode === "audio" ? t("toVideoMode") : t("toVoiceMode")}
          title={t("holdToRecord")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => endPress(true)}
          onPointerCancel={() => endPress(false)}
          className="flex size-9 shrink-0 touch-none select-none items-center justify-center rounded-full text-faint transition hover:bg-surface-3 hover:text-accent active:scale-110 active:text-accent"
        >
          {mode === "audio" ? <RiMicLine className="size-5" /> : <RiVidiconLine className="size-5" />}
        </button>
      )}
    </div>
  );
}

function AttachOption({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm font-medium text-ink transition hover:bg-surface-2"
    >
      <span className="text-accent">{icon}</span>
      {label}
    </button>
  );
}

function Bubble({ message, isGroup }: { message: ChatMessage; isGroup: boolean }) {
  const mine = message.from === "me";
  const hasImages = !!message.images?.length;
  const author = isGroup && !mine ? PEOPLE.find((p) => p.id === message.authorId) : undefined;
  const bare = hasImages || !!message.audio || !!message.video;

  return (
    <div className={cx("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[80%] overflow-hidden rounded-2xl text-[15px] leading-relaxed shadow-sm",
          hasImages ? "w-64 p-1" : bare ? "px-2.5 py-2" : "px-3.5 py-2",
          mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-surface-2 text-ink",
        )}
      >
        {author && <p className="px-1 pb-0.5 text-xs font-semibold text-accent">{author.name}</p>}

        {hasImages && (
          <div className="grid grid-cols-2 gap-1">
            {message.images!.slice(0, 4).map((src, i) => (
              <div key={`${src}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-28 w-full rounded-lg object-cover" />
                {i === 3 && message.images!.length > 4 && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 text-lg font-semibold text-white">
                    +{message.images!.length - 4}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {message.audio && <VoiceMessage audio={message.audio} mine={mine} />}
        {message.video && <VideoMessage video={message.video} mine={mine} />}

        {message.file && (
          <a
            href={message.file.url}
            download={message.file.name}
            className={cx(
              "flex items-center gap-2.5 rounded-xl p-1.5 transition",
              mine ? "hover:bg-white/10" : "hover:bg-surface-3",
            )}
          >
            <span
              className={cx(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                mine ? "bg-white/20 text-white" : "bg-accent-soft text-accent",
              )}
            >
              <RiFile3Line className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{message.file.name}</span>
              <span className={cx("block text-xs", mine ? "text-white/70" : "text-muted")}>
                {message.file.size}
              </span>
            </span>
            {message.file.url && (
              <RiDownload2Line className={cx("size-4 shrink-0", mine ? "text-white/70" : "text-muted")} />
            )}
          </a>
        )}

        {message.text && (
          <p className={cx("whitespace-pre-wrap", hasImages && "px-2 py-1")}>{message.text}</p>
        )}

        <div
          className={cx(
            "mt-0.5 flex items-center justify-end gap-1 text-[11px]",
            hasImages && "px-2 pb-1",
            mine ? "text-white/70" : "text-faint",
          )}
        >
          {message.time}
          {mine && <RiCheckDoubleLine className={cx("size-3.5", message.read ? "" : "opacity-60")} />}
        </div>
      </div>
    </div>
  );
}

function HeaderIcon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-accent"
    >
      {children}
    </button>
  );
}

function ComposerIcon({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cx(
        "flex size-9 shrink-0 items-center justify-center rounded-full transition",
        active ? "bg-accent text-white" : "text-faint hover:bg-surface-3 hover:text-accent",
      )}
    >
      {children}
    </button>
  );
}
