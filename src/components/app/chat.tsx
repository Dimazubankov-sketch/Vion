"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RiArrowLeftLine,
  RiAttachment2,
  RiCheckDoubleLine,
  RiDownload2Line,
  RiEmotionLine,
  RiFile3Line,
  RiMicLine,
  RiMoreLine,
  RiPencilLine,
  RiPhoneLine,
  RiSearchLine,
  RiSendPlane2Fill,
  RiVideoOnLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import {
  CHATS,
  chatAvatar,
  chatOnline,
  chatSubtitle,
  chatTitle,
  PEOPLE,
  type AudioAttachment,
  type Chat,
  type ChatMessage,
  type Person,
} from "@/lib/mock-data";
import { formatBytes } from "@/utils/image";
import { cx } from "@/utils/cx";
import { NewGroupDialog } from "./new-group-dialog";
import { VoiceMessage, VoiceRecorder } from "./voice";

/** Avatar for a chat row: one photo for DMs, a collage for groups. */
function ChatAvatar({ chat, size = 52 }: { chat: Chat; size?: number }) {
  const src = chatAvatar(chat);
  if (chat.kind === "direct" || src) {
    return (
      <Avatar src={src} name={chatTitle(chat)} size={size} online={chatOnline(chat)} />
    );
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
}: {
  onConversationChange?: (open: boolean) => void;
}) {
  const [chats, setChats] = useState<Chat[]>(CHATS);
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

  const appendToActive = (msg: ChatMessage) => {
    if (!active) return;
    setChats((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, msg] } : c)),
    );
  };

  const now = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendText = (text: string) =>
    appendToActive({ id: `s${Date.now()}`, from: "me", text, time: now(), read: false });

  const sendImages = (images: string[]) =>
    appendToActive({ id: `s${Date.now()}`, from: "me", images, time: now(), read: false });

  const sendFile = (file: { name: string; size: string; url?: string }) =>
    appendToActive({ id: `s${Date.now()}`, from: "me", file, time: now(), read: false });

  const sendAudio = (audio: AudioAttachment) =>
    appendToActive({ id: `s${Date.now()}`, from: "me", audio, time: now(), read: false });

  const createGroup = (name: string, members: Person[]) => {
    const chat: Chat = {
      id: `g${Date.now()}`,
      kind: "group",
      name,
      members,
      unread: 0,
      messages: [
        {
          id: "m0",
          from: "me",
          text: `You created the group “${name}”.`,
          time: now(),
          read: true,
        },
      ],
    };
    setChats((prev) => [chat, ...prev]);
    setNewGroup(false);
    setActiveId(chat.id);
  };

  if (active) {
    return (
      <Conversation
        chat={active}
        onBack={() => setActiveId(null)}
        onSendText={sendText}
        onSendImages={sendImages}
        onSendFile={sendFile}
        onSendAudio={sendAudio}
      />
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Search */}
      <div className="shrink-0 bg-surface px-4 pb-2 pt-1">
        <div className="flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2.5">
          <RiSearchLine className="size-5 shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="scroll-clean min-h-0 flex-1 overflow-y-auto">
        {filtered.map((chat) => {
          const last = chat.messages.at(-1);
          const preview =
            last?.text ||
            (last?.images?.length ? "📷 Photo" : last?.file ? `📎 ${last.file.name}` : last?.audio ? "🎤 Voice message" : "");
          const mine = last?.from === "me";
          return (
            <button
              key={chat.id}
              onClick={() => setActiveId(chat.id)}
              className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-surface-2/50"
            >
              <ChatAvatar chat={chat} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink">
                    {chatTitle(chat)}
                  </span>
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
          <p className="py-16 text-center text-sm text-faint">No chats found</p>
        )}
      </div>

      {/* New group */}
      <button
        onClick={() => setNewGroup(true)}
        aria-label="New group chat"
        className="absolute bottom-4 right-4 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-float transition hover:bg-accent-strong active:scale-95"
      >
        <RiPencilLine className="size-6" />
      </button>

      {newGroup && (
        <NewGroupDialog onClose={() => setNewGroup(false)} onCreate={createGroup} />
      )}
    </div>
  );
}

function Conversation({
  chat,
  onBack,
  onSendText,
  onSendImages,
  onSendFile,
  onSendAudio,
}: {
  chat: Chat;
  onBack: () => void;
  onSendText: (text: string) => void;
  onSendImages: (images: string[]) => void;
  onSendFile: (file: { name: string; size: string; url?: string }) => void;
  onSendAudio: (audio: AudioAttachment) => void;
}) {
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    onSendText(text);
    setDraft("");
  };

  const onFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const images = files.filter((f) => f.type.startsWith("image/"));
    const others = files.filter((f) => !f.type.startsWith("image/"));

    if (images.length > 0) onSendImages(images.map((f) => URL.createObjectURL(f)));
    others.forEach((f) =>
      onSendFile({ name: f.name, size: formatBytes(f.size), url: URL.createObjectURL(f) }),
    );
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Conversation header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-2 py-2.5">
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-3"
        >
          <RiArrowLeftLine className="size-5" />
        </button>
        <ChatAvatar chat={chat} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{chatTitle(chat)}</p>
          <p
            className={cx(
              "truncate text-xs",
              chat.kind === "direct" && chatOnline(chat) ? "text-online" : "text-muted",
            )}
          >
            {chatSubtitle(chat)}
          </p>
        </div>
        <HeaderIcon label="Video call"><RiVideoOnLine className="size-5" /></HeaderIcon>
        <HeaderIcon label="Voice call"><RiPhoneLine className="size-5" /></HeaderIcon>
        <HeaderIcon label="More"><RiMoreLine className="size-5" /></HeaderIcon>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="scroll-clean min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {chat.messages.map((m) => (
          <Bubble key={m.id} message={m} isGroup={chat.kind === "group"} />
        ))}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-line bg-surface p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />

        {recording ? (
          <VoiceRecorder
            onCancel={() => setRecording(false)}
            onSend={(audio) => {
              onSendAudio(audio);
              setRecording(false);
            }}
          />
        ) : (
          <div className="flex items-end gap-1.5 rounded-2xl bg-surface-2 px-2 py-1.5">
            <ComposerIcon label="Emoji"><RiEmotionLine className="size-5" /></ComposerIcon>
            <ComposerIcon label="Attach file" onClick={() => fileRef.current?.click()}>
              <RiAttachment2 className="size-5" />
            </ComposerIcon>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="Message…"
              className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-faint"
            />
            {draft.trim() ? (
              <button
                onClick={submit}
                aria-label="Send"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-strong"
              >
                <RiSendPlane2Fill className="size-5" />
              </button>
            ) : (
              <ComposerIcon label="Record voice message" onClick={() => setRecording(true)}>
                <RiMicLine className="size-5" />
              </ComposerIcon>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({ message, isGroup }: { message: ChatMessage; isGroup: boolean }) {
  const mine = message.from === "me";
  const hasImages = !!message.images?.length;
  const author = isGroup && !mine ? PEOPLE.find((p) => p.id === message.authorId) : undefined;
  const bare = hasImages || !!message.audio;

  return (
    <div className={cx("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[80%] overflow-hidden rounded-2xl text-[15px] leading-relaxed shadow-sm",
          hasImages ? "w-64 p-1" : bare ? "px-2.5 py-2" : "px-3.5 py-2",
          mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-surface-2 text-ink",
        )}
      >
        {author && (
          <p className="px-1 pb-0.5 text-xs font-semibold text-accent">{author.name}</p>
        )}

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
          {mine && (
            <RiCheckDoubleLine className={cx("size-3.5", message.read ? "" : "opacity-60")} />
          )}
        </div>
      </div>
    </div>
  );
}

function HeaderIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-accent"
    >
      {children}
    </button>
  );
}

function ComposerIcon({
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
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-surface-3 hover:text-accent"
    >
      {children}
    </button>
  );
}
