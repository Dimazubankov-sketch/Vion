"use client";

import { RiArrowLeftLine, RiHeart3Line } from "@remixicon/react";
import { useStore } from "@/lib/app-store";
import { useT } from "@/lib/settings-context";
import { PostCard } from "./post-card";

/** Everything the signed-in user has liked, newest first. */
export function History({ onBack }: { onBack: () => void }) {
  const { likedPosts } = useStore();
  const t = useT();

  return (
    <div className="scroll-clean flex h-full flex-col overflow-y-auto bg-canvas">
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-line bg-surface/90 px-2 py-2.5 backdrop-blur">
        <button
          onClick={onBack}
          aria-label={t("back")}
          className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-3"
        >
          <RiArrowLeftLine className="size-5" />
        </button>
        <h1 className="text-base font-bold text-ink">{t("historyTitle")}</h1>
        <span className="ml-auto pr-2 text-sm text-muted">{likedPosts.length}</span>
      </header>

      {likedPosts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-surface-2 text-faint">
            <RiHeart3Line className="size-7" />
          </span>
          <p className="text-sm text-muted">{t("historyEmpty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-3">
          {likedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
