"use client";

import { RiCheckDoubleLine, RiCheckLine, RiDownload2Line, RiFile3Line } from "@remixicon/react";
import { useT } from "@/lib/settings-context";
import { PEOPLE, type ChatMessage } from "@/lib/mock-data";
import { linkify } from "@/utils/linkify";
import { cx } from "@/utils/cx";
import { VideoMessage, VoiceMessage } from "./voice";

/** Shell classes for a message bubble — shared by the live bubble and its floating clone. */
export function bubbleShellClass(message: ChatMessage, mine: boolean, selectMode?: boolean) {
  const hasImages = !!message.images?.length;
  const hasOther = !!(message.text || message.audio || message.video || message.file || message.replyTo);
  const imagesOnly = hasImages && !hasOther;
  return cx(
    "max-w-[80%] overflow-hidden text-[15px] leading-relaxed",
    imagesOnly
      ? // Photos with no chrome — just the image(s).
        "w-64 rounded-2xl"
      : cx(
          "rounded-2xl shadow-sm",
          hasImages ? "w-64 p-1" : message.audio || message.video ? "px-2.5 py-2" : "px-3.5 py-2",
          mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-surface-2 text-ink",
        ),
    selectMode && "cursor-pointer",
  );
}

/**
 * A message bubble's contents. Shared by the live bubble and the frozen clone
 * in the action menu, so both look identical. In select mode each photo becomes
 * individually selectable; otherwise images open the viewer.
 */
export function BubbleBody({
  message,
  mine,
  isGroup,
  onOpenImages,
  selectMode = false,
  selectedKeys,
  onToggleKey,
}: {
  message: ChatMessage;
  mine: boolean;
  isGroup: boolean;
  onOpenImages?: (images: string[], index: number) => void;
  selectMode?: boolean;
  selectedKeys?: Set<string>;
  onToggleKey?: (key: string) => void;
}) {
  const t = useT();
  const images = message.images ?? [];
  const hasImages = images.length > 0;
  const imagesOnly = hasImages && !message.text && !message.file && !message.audio && !message.video && !message.replyTo;
  const author = isGroup && !mine ? PEOPLE.find((p) => p.id === message.authorId) : undefined;

  // In select mode every photo is shown so each can be ticked; otherwise the
  // grid caps at four with a "+N" tile that opens the viewer.
  const shown = selectMode ? images : images.slice(0, 4);
  const single = images.length === 1;

  return (
    <>
      {author && <p className="px-1 pb-0.5 text-xs font-semibold text-accent">{author.name}</p>}

      {message.replyTo && (
        <div className={cx("mb-1 flex gap-1.5 rounded-lg px-2 py-1", mine ? "bg-white/15" : "bg-surface-3")}>
          <span className="w-0.5 shrink-0 rounded-full bg-current opacity-60" />
          <span className="min-w-0">
            {message.replyTo.author && <span className="block text-xs font-semibold">{message.replyTo.author}</span>}
            <span className="block truncate text-xs opacity-80">{message.replyTo.text}</span>
          </span>
        </div>
      )}

      {message.forwardedFrom && (
        <p className={cx("px-1 pb-0.5 text-xs italic", mine ? "text-white/70" : "text-muted")}>
          {t("forwardedFrom")} {message.forwardedFrom}
        </p>
      )}

      {hasImages && (
        <div className={cx("grid gap-1", single ? "grid-cols-1" : "grid-cols-2")}>
          {shown.map((src, i) => {
            const key = `${message.id}:${i}`;
            const checked = !!selectedKeys?.has(key);
            const isLast = !selectMode && i === 3 && images.length > 4;
            const inner = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className={cx("w-full rounded-lg object-cover", single ? "h-60" : "h-28")}
                />
                {isLast && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 text-lg font-semibold text-white">
                    +{images.length - 4}
                  </span>
                )}
                {selectMode && (
                  <span
                    className={cx(
                      "absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full border-2",
                      checked ? "border-white bg-accent text-white" : "border-white/90 bg-black/30",
                    )}
                  >
                    {checked && <RiCheckLine className="size-3.5" />}
                  </span>
                )}
              </>
            );
            if (!onOpenImages && !selectMode) {
              return (
                <span key={key} className="relative">
                  {inner}
                </span>
              );
            }
            return (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectMode) onToggleKey?.(key);
                  else onOpenImages?.(images, i);
                }}
                className={cx("relative", checked && "opacity-90 ring-2 ring-accent ring-offset-1 ring-offset-surface")}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}

      {message.audio && <VoiceMessage audio={message.audio} mine={mine} />}
      {message.video && <VideoMessage video={message.video} mine={mine} />}

      {message.file &&
        (onOpenImages || selectMode === false ? (
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

      {(message.text || message.file || (hasImages && !message.audio && !message.video)) && (
        <div
          className={cx(
            "mt-0.5 flex items-center justify-end gap-1 text-[11px]",
            hasImages && (imagesOnly ? "px-1 pt-0.5" : "px-2 pb-1"),
            imagesOnly ? "text-faint" : mine ? "text-white/70" : "text-faint",
          )}
        >
          {message.edited && <span className="italic">{t("edited")}</span>}
          {message.time}
          {mine && <RiCheckDoubleLine className={cx("size-3.5", message.read ? "" : (imagesOnly ? "text-faint" : "opacity-60"))} />}
        </div>
      )}
    </>
  );
}
