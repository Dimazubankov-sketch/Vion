"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RiArrowLeftLine,
  RiAttachment2,
  RiCheckDoubleLine,
  RiEmotionLine,
  RiMicLine,
  RiMoreLine,
  RiPhoneLine,
  RiSearchLine,
  RiSendPlane2Fill,
  RiVideoOnLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { CHATS, type Chat, type ChatMessage } from "@/lib/mock-data";
import { cx } from "@/utils/cx";

export function ChatView({ onConversationChange }: { onConversationChange?: (open: boolean) => void }) {
  const [chats, setChats] = useState<Chat[]>(CHATS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const active = chats.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    onConversationChange?.(active !== null);
  }, [active, onConversationChange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.person.name.toLowerCase().includes(q) ||
        c.messages.at(-1)?.text?.toLowerCase().includes(q),
    );
  }, [chats, query]);

  const send = (text: string) => {
    if (!active) return;
    const msg: ChatMessage = {
      id: `s${Date.now()}`,
      from: "me",
      text,
      time: "now",
      read: false,
    };
    setChats((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, msg] } : c)),
    );
  };

  if (active) {
    return <Conversation chat={active} onBack={() => setActiveId(null)} onSend={send} />;
  }

  return (
    <div className="flex flex-col">
      {/* Search */}
      <div className="sticky top-0 z-10 bg-surface/90 px-4 pb-2 pt-1 backdrop-blur">
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
      <div className="flex flex-col">
        {filtered.map((chat) => {
          const last = chat.messages.at(-1);
          const preview = last?.text || (last?.images?.length ? "📷 Photo" : "");
          const mine = last?.from === "me";
          return (
            <button
              key={chat.id}
              onClick={() => setActiveId(chat.id)}
              className="flex items-center gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-surface-2/50"
            >
              <Avatar src={chat.person.avatar} name={chat.person.name} size={52} online={chat.person.online} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{chat.person.name}</span>
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
    </div>
  );
}

function Conversation({
  chat,
  onBack,
  onSend,
}: {
  chat: Chat;
  onBack: () => void;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Conversation header */}
      <header className="flex items-center gap-2 border-b border-line bg-surface px-2 py-2.5">
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-3"
        >
          <RiArrowLeftLine className="size-5" />
        </button>
        <Avatar src={chat.person.avatar} name={chat.person.name} size={40} online={chat.person.online} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{chat.person.name}</p>
          <p className="text-xs text-online">{chat.person.online ? "Online" : "last seen recently"}</p>
        </div>
        <HeaderIcon label="Video call"><RiVideoOnLine className="size-5" /></HeaderIcon>
        <HeaderIcon label="Voice call"><RiPhoneLine className="size-5" /></HeaderIcon>
        <HeaderIcon label="More"><RiMoreLine className="size-5" /></HeaderIcon>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="scroll-clean flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {chat.messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-line bg-surface p-2.5">
        <div className="flex items-end gap-1.5 rounded-2xl bg-surface-2 px-2 py-1.5">
          <ComposerIcon label="Emoji"><RiEmotionLine className="size-5" /></ComposerIcon>
          <ComposerIcon label="Attach"><RiAttachment2 className="size-5" /></ComposerIcon>
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
            <ComposerIcon label="Voice message"><RiMicLine className="size-5" /></ComposerIcon>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.from === "me";
  const hasImages = message.images && message.images.length > 0;

  return (
    <div className={cx("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[78%] overflow-hidden rounded-2xl text-[15px] leading-relaxed shadow-sm",
          hasImages ? "w-64 p-1" : "px-3.5 py-2",
          mine
            ? "rounded-br-md bg-accent text-white"
            : "rounded-bl-md bg-surface-2 text-ink",
        )}
      >
        {hasImages && (
          <div className="grid grid-cols-2 gap-1">
            {message.images!.slice(0, 4).map((src, i) => (
              <div key={src} className="relative">
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
        {message.text && <p className={cx("whitespace-pre-wrap", hasImages && "px-2 py-1")}>{message.text}</p>}
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

function HeaderIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-accent"
    >
      {children}
    </button>
  );
}

function ComposerIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-surface-3 hover:text-accent"
    >
      {children}
    </button>
  );
}
