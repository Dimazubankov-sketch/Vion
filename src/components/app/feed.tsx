"use client";

import { useMemo, useState, type ReactNode } from "react";
import { RiAddLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useStore } from "@/lib/app-store";
import { useT } from "@/lib/settings-context";
import { PostCard } from "./post-card";
import { PostComposerDialog } from "./post-composer";

/**
 * The feed owns the top of the screen: there is no separate app header here,
 * the search field is the header. `leading` is where the shell drops the
 * avatar/menu button on small screens.
 */
export function Feed({ leading }: { leading?: ReactNode }) {
  const { posts } = useStore();
  const t = useT();
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.text.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        p.author.handle.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q),
    );
  }, [posts, query]);

  return (
    <div className="relative h-full">
      <div className="scroll-clean h-full overflow-y-auto bg-canvas">
        {/* Search doubles as the header */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-canvas/90 px-3 py-3 backdrop-blur">
          {leading}
          <div className="flex flex-1 items-center gap-2 rounded-full bg-surface px-3.5 py-2.5 shadow-panel">
            <RiSearchLine className="size-5 shrink-0 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPosts")}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label={t("close")}
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted transition hover:text-ink"
              >
                <RiCloseLine className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-3 pb-24">
          {shown.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {shown.length === 0 ? (
            <p className="py-16 text-center text-sm text-faint">{t("nothingFound")}</p>
          ) : (
            <p className="py-8 text-center text-sm text-faint">{t("allCaughtUp")}</p>
          )}
        </div>
      </div>

      {/* Publish straight from the feed */}
      <button
        onClick={() => setComposing(true)}
        aria-label={t("newPost")}
        className="absolute bottom-5 right-5 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-float transition hover:bg-accent-strong active:scale-95"
      >
        <RiAddLine className="size-7" />
      </button>

      {composing && <PostComposerDialog onClose={() => setComposing(false)} />}
    </div>
  );
}
