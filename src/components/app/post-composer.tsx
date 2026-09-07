"use client";

import { useRef, useState } from "react";
import { RiCloseLine, RiImageAddLine } from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useStore } from "@/lib/app-store";
import { useT } from "@/lib/settings-context";

const LIMIT = 500;

/** Compose and publish a post. */
export function PostComposerDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { addPost } = useStore();
  const t = useT();
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const publish = () => {
    if (!text.trim() && images.length === 0) return;
    addPost(text.trim(), images.length ? images : undefined);
    onClose();
  };

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 4 - images.length)
      .map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...picked]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="absolute inset-0 z-[55] flex items-end justify-center sm:items-center">
      <button
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("newPost")}
        className="relative flex max-h-[92%] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-float animate-pop-in sm:m-4 sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-3"
          >
            <RiCloseLine className="size-5" />
          </button>
          <h2 className="flex-1 text-base font-semibold text-ink">{t("newPost")}</h2>
          <button
            onClick={publish}
            disabled={!text.trim() && images.length === 0}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("publish")}
          </button>
        </div>

        <div className="scroll-clean min-h-0 flex-1 overflow-y-auto p-4">
          <div className="flex gap-3">
            <Avatar src={user?.avatar} name={user?.name ?? "You"} size={44} />
            <textarea
              autoFocus
              value={text}
              maxLength={LIMIT}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={t("whatsHappening")}
              className="min-h-28 flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
            />
          </div>

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {images.map((src, i) => (
                <div key={src} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-32 w-full rounded-xl object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={t("close")}
                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                  >
                    <RiCloseLine className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={images.length >= 4}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft disabled:opacity-40"
          >
            <RiImageAddLine className="size-5" />
            {t("addPhoto")}
          </button>
          <span className="ml-auto text-xs text-faint">
            {text.length}/{LIMIT}
          </span>
        </div>
      </div>
    </div>
  );
}
