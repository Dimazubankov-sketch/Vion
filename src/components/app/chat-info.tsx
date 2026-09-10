"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  RiArrowLeftLine,
  RiExternalLinkLine,
  RiFile3Line,
  RiMusic2Line,
  RiPhoneLine,
  RiUserSmileLine,
  RiVideoOnLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { MediaViewer, type MediaItem } from "@/components/ui/media-viewer";
import { useT } from "@/lib/settings-context";
import { emailFor } from "@/lib/accounts";
import {
  chatAvatar,
  chatOnline,
  chatTitle,
  type Chat,
  type FileAttachment,
  type Person,
} from "@/lib/mock-data";
import { cx } from "@/utils/cx";
import { ChatAvatar } from "./chat";
import { VoiceMessage } from "./voice";
import type { CallKind } from "./call";

type LibTab = "media" | "files" | "music" | "voice" | "links";

const MUSIC_RE = /\.(mp3|wav|m4a|flac|ogg|aac)$/i;
const URL_RE = /(https?:\/\/[^\s]+)/g;

/**
 * Telegram-style info window for a chat: header, quick actions, the members of
 * a group (or a link to a person's profile), and a working shared-media library.
 */
export function ChatInfo({
  chat,
  onBack,
  onOpenPerson,
  onStartCall,
}: {
  chat: Chat;
  onBack: () => void;
  onOpenPerson?: (person: Person) => void;
  onStartCall?: (name: string, avatar: string | undefined, kind: CallKind) => void;
}) {
  const t = useT();
  const [tab, setTab] = useState<LibTab>("media");
  const [viewer, setViewer] = useState<{ items: MediaItem[]; index: number } | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onBack();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onBack]);

  const person = chat.kind === "direct" ? chat.person : undefined;
  const avatar = chatAvatar(chat);

  // Pull the library straight out of the message history — no placeholders.
  const lib = useMemo(() => {
    const media: MediaItem[] = [];
    const files: FileAttachment[] = [];
    const music: FileAttachment[] = [];
    const voice: { url: string; duration: number; peaks: number[] }[] = [];
    const links: string[] = [];
    for (const m of chat.messages) {
      m.images?.forEach((src) => media.push({ src, kind: "image" }));
      if (m.video) media.push({ src: m.video.url, kind: "video" });
      if (m.audio) voice.push(m.audio);
      if (m.file) (MUSIC_RE.test(m.file.name) ? music : files).push(m.file);
      if (m.text) links.push(...(m.text.match(URL_RE) ?? []));
    }
    return { media, files, music, voice, links };
  }, [chat.messages]);

  const members = chat.members ?? [];
  const subtitle =
    chat.kind === "group"
      ? `${members.length + 1} ${t("members")}`
      : chatOnline(chat)
        ? t("online")
        : t("lastSeen");

  const tabs: { key: LibTab; label: string; count: number }[] = [
    { key: "media", label: t("tabMedia"), count: lib.media.length },
    { key: "files", label: t("tabFiles"), count: lib.files.length },
    { key: "music", label: t("tabMusic"), count: lib.music.length },
    { key: "voice", label: t("tabVoice"), count: lib.voice.length },
    { key: "links", label: t("tabLinks"), count: lib.links.length },
  ];

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[75] flex justify-center bg-black/30 animate-fade-in">
      <button aria-label={t("close")} onClick={onBack} className="absolute inset-0 cursor-default" />
      <div className="scroll-clean relative flex h-full w-full max-w-[600px] flex-col overflow-y-auto bg-surface shadow-float animate-slide-in-left">
        {/* Header */}
        <header className="sticky top-0 z-20 flex shrink-0 items-center gap-2 border-b border-line bg-surface px-2 py-2.5">
          <button
            onClick={onBack}
            aria-label={t("back")}
            className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-3"
          >
            <RiArrowLeftLine className="size-5" />
          </button>
          <h2 className="text-base font-bold text-ink">{t("menu")}</h2>
        </header>

        {/* Identity */}
        <div className="flex flex-col items-center gap-2 px-5 py-5">
          <button
            onClick={() => avatar && setAvatarOpen(true)}
            aria-label={chatTitle(chat)}
            className="rounded-full transition hover:brightness-95 active:scale-95"
          >
            <ChatAvatar chat={chat} size={96} />
          </button>
          <p className="text-lg font-bold text-ink">{chatTitle(chat)}</p>
          <p className={cx("text-sm", chat.kind === "direct" && chatOnline(chat) ? "text-online" : "text-muted")}>
            {subtitle}
          </p>

          {/* Quick actions */}
          <div className="mt-2 flex gap-2">
            {person && onOpenPerson && (
              <ActionPill icon={<RiUserSmileLine className="size-5" />} label={t("openProfile")} onClick={() => onOpenPerson(person)} />
            )}
            <ActionPill
              icon={<RiPhoneLine className="size-5" />}
              label={t("voiceCall")}
              onClick={() => onStartCall?.(chatTitle(chat), avatar, "audio")}
            />
            <ActionPill
              icon={<RiVideoOnLine className="size-5" />}
              label={t("videoCall")}
              onClick={() => onStartCall?.(chatTitle(chat), avatar, "video")}
            />
          </div>
        </div>

        {/* Direct: username row */}
        {person && (
          <button
            onClick={() => onOpenPerson?.(person)}
            className="mx-4 mb-2 flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-left transition hover:bg-surface-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{t("openProfile")}</p>
              <p className="truncate text-sm font-medium text-accent">{emailFor(person.handle)}</p>
            </div>
            <RiUserSmileLine className="size-5 shrink-0 text-muted" />
          </button>
        )}

        {/* Shared media library — sits right after identity in both chat kinds, so
            the tabs land in the same place whether or not there's a member list. */}
        <div className="flex gap-1 overflow-x-auto border-y border-line bg-surface px-3 py-2">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={cx(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition",
                tab === tb.key ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-ink",
              )}
            >
              {tb.label}
              {tb.count > 0 && <span className="ml-1 opacity-70">{tb.count}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 p-3">
          {tab === "media" &&
            (lib.media.length === 0 ? (
              <Empty />
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {lib.media.map((item, i) => (
                  <button
                    key={`${item.src}-${i}`}
                    onClick={() => setViewer({ items: lib.media, index: i })}
                    className="relative aspect-square overflow-hidden rounded-lg bg-surface-2"
                  >
                    {item.kind === "video" ? (
                      <video src={item.src} className="size-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.src} alt="" className="size-full object-cover transition hover:brightness-95" />
                    )}
                    {item.kind === "video" && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] text-white">▶</span>
                    )}
                  </button>
                ))}
              </div>
            ))}

          {(tab === "files" || tab === "music") &&
            ((tab === "files" ? lib.files : lib.music).length === 0 ? (
              <Empty />
            ) : (
              <div className="flex flex-col gap-1">
                {(tab === "files" ? lib.files : lib.music).map((f, i) => (
                  <a
                    key={`${f.name}-${i}`}
                    href={f.url}
                    download={f.name}
                    className={cx("flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface-2", !f.url && "pointer-events-none")}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      {tab === "music" ? <RiMusic2Line className="size-5" /> : <RiFile3Line className="size-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{f.name}</span>
                      <span className="block text-xs text-muted">{f.size}</span>
                    </span>
                  </a>
                ))}
              </div>
            ))}

          {tab === "voice" &&
            (lib.voice.length === 0 ? (
              <Empty />
            ) : (
              <div className="flex flex-col gap-2">
                {lib.voice.map((a, i) => (
                  <div key={i} className="rounded-2xl bg-surface-2 px-3 py-2">
                    <VoiceMessage audio={a} mine={false} />
                  </div>
                ))}
              </div>
            ))}

          {tab === "links" &&
            (lib.links.length === 0 ? (
              <Empty />
            ) : (
              <div className="flex flex-col gap-1">
                {lib.links.map((url, i) => (
                  <a
                    key={`${url}-${i}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition hover:bg-surface-2"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <RiExternalLinkLine className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-accent">{url}</span>
                  </a>
                ))}
              </div>
            ))}
        </div>

        {/* Group: members */}
        {chat.kind === "group" && (
          <div className="px-4 pb-4">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {t("participants")} · {members.length + 1}
            </p>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  <RiUserSmileLine className="size-5" />
                </span>
                <span className="text-sm font-semibold text-ink">You</span>
              </div>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onOpenPerson?.(m)}
                  className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-surface-2/50"
                >
                  <Avatar src={m.avatar} name={m.name} size={40} online={m.online} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                    <p className="truncate text-xs text-muted">{emailFor(m.handle)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {viewer && (
        <MediaViewer
          items={viewer.items}
          index={viewer.index}
          onIndex={(i) => setViewer((v) => (v ? { ...v, index: i } : v))}
          onClose={() => setViewer(null)}
        />
      )}
      {avatarOpen && avatar && (
        <MediaViewer items={[{ src: avatar, kind: "image" }]} index={0} onIndex={() => {}} onClose={() => setAvatarOpen(false)} />
      )}
    </div>,
    document.body,
  );
}

function ActionPill({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl bg-surface-2 px-4 py-2.5 text-accent transition hover:bg-surface-3"
    >
      {icon}
      <span className="text-[11px] font-medium text-muted">{label}</span>
    </button>
  );
}

function Empty() {
  const t = useT();
  return <p className="py-14 text-center text-sm text-faint">{t("emptySection")}</p>;
}
