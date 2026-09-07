"use client";

import { useMemo, useState } from "react";
import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useStore } from "@/lib/app-store";
import { useT } from "@/lib/settings-context";
import { PostCard } from "./post-card";

export function Feed() {
  const { posts } = useStore();
  const t = useT();
  const [query, setQuery] = useState("");

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
    <div className="flex flex-col bg-canvas">
      {/* Search */}
      <div className="sticky top-0 z-10 border-b border-line bg-canvas/90 px-3 py-3 backdrop-blur">
        <div className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-2.5 shadow-panel">
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

      <div className="flex flex-col gap-3 p-3">
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
  );
}
