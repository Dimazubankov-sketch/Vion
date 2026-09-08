"use client";

import { RiCheckDoubleLine, RiDownload2Line, RiFile3Line } from "@remixicon/react";
import { useT } from "@/lib/settings-context";
import { PEOPLE, type ChatMessage } from "@/lib/mock-data";
import { linkify } from "@/utils/linkify";
import { cx } from "@/utils/cx";
import { VideoMessage, VoiceMessage } from "./voice";

/** Shell classes for a message bubble — shared by the live bubble and its floating clone. */
export function bubbleShellClass(message: ChatMessage, mine: boolean, selectMode?: boolean) {
  const hasImages = !!message.images?.length;
  const bare = hasImages || !!message.audio || !!message.video;
  return cx(
    "max-w-[80%] overflow-hidden rounded-2xl text-[15px] leading-relaxed shadow-sm",
    hasImages ? "w-64 p-1" : bare ? "px-2.5 py-2" : "px-3.5 py-2",
    mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-surface-2 text-ink",
    selectMode && "cursor-pointer",
  );
}

/**
 * A message bubble's contents — author label, attachments, text and the
 * time/read footer. Shared by the live bubble in the message list and the
 * frozen clone shown above the blur while its action menu is open, so both
 * stay pixel-identical. Pass `onOpenImages` to make images clickable (the
 * live bubble); omit it for a non-interactive preview (the floating clone).
 */
export function BubbleBody({
  message,
  mine,
  isGroup,
  onOpenImages,
}: {
  message: ChatMessage;
  mine: boolean;
  isGroup: boolean;
  onOpenImages?: (images: string[], index: number) => void;
}) {
  const t = useT();
  const hasImages = !!message.images?.length;
  const author = isGroup && !mine ? PEOPLE.find((p) => p.id === message.authorId) : undefined;
  const interactive = !!onOpenImages;

  return (
    <>
      {author && <p className="px-1 pb-0.5 text-xs font-semibold text-accent">{author.name}</p>}

      {message.forwardedFrom && (
        <p className={cx("px-1 pb-0.5 text-xs italic", mine ? "text-white/70" : "text-muted")}>
          {t("forwardedFrom")} {message.forwardedFrom}
        </p>
      )}

      {hasImages && (
        <div className="grid grid-cols-2 gap-1">
          {message.images!.slice(0, 4).map((src, i) => {
            const overflow = i === 3 && message.images!.length > 4 && (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 text-lg font-semibold text-white">
                +{message.images!.length - 4}
              </span>
            );
            if (!interactive) {
              return (
                <span key={`${src}-${i}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-28 w-full rounded-lg object-cover" />
                  {overflow}
                </span>
              );
            }
            return (
              <button
                key={`${src}-${i}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenImages!(message.images!, i);
                }}
                className="relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-28 w-full rounded-lg object-cover" />
                {overflow}
              </button>
            );
          })}
        </div>
      )}

      {message.audio && <VoiceMessage audio={message.audio} mine={mine} />}
      {message.video && <VideoMessage video={message.video} mine={mine} />}

      {message.file &&
        (interactive ? (
          <a
            href={message.file.url}
            download={message.file.name}
            onClick={(e) => e.stopPropagation()}
            className={cx("flex items-center gap-2.5 rounded-xl p-1.5 transition", mine ? "hover:bg-white/10" : "hover:bg-surface-3")}
          >
            <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-lg", mine ? "bg-white/20 text-white" : "bg-accent-soft text-accent")}>
              <RiFile3Line className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{message.file.name}</span>
              <span className={cx("block text-xs", mine ? "text-white/70" : "text-muted")}>{message.file.size}</span>
            </span>
            {message.file.url && <RiDownload2Line className={cx("size-4 shrink-0", mine ? "text-white/70" : "text-muted")} />}
          </a>
        ) : (
          <span className="flex items-center gap-2.5 rounded-xl p-1.5">
            <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-lg", mine ? "bg-white/20 text-white" : "bg-accent-soft text-accent")}>
              <RiFile3Line className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{message.file.name}</span>
              <span className={cx("block text-xs", mine ? "text-white/70" : "text-muted")}>{message.file.size}</span>
            </span>
          </span>
        ))}

      {message.text && (
        <p className={cx("whitespace-pre-wrap", hasImages && "px-2 py-1")}>{linkify(message.text, mine)}</p>
      )}

      <div className={cx("mt-0.5 flex items-center justify-end gap-1 text-[11px]", hasImages && "px-2 pb-1", mine ? "text-white/70" : "text-faint")}>
        {message.edited && <span className="italic">{t("edited")}</span>}
        {message.time}
        {mine && <RiCheckDoubleLine className={cx("size-3.5", message.read ? "" : "opacity-60")} />}
      </div>
    </>
  );
}
