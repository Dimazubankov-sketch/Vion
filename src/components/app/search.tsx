"use client";

import { useMemo, useState } from "react";
import { RiCloseLine, RiHashtag, RiSearchLine, RiVerifiedBadgeFill } from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { useStore, PEOPLE } from "@/lib/app-store";
import { useProfileNav } from "@/lib/profile-nav";
import { useT } from "@/lib/settings-context";
import { emailFor } from "@/lib/accounts";
import { cx } from "@/utils/cx";
import { PostCard, compact } from "./post-card";

type Filter = "all" | "people" | "posts" | "tags";

/** In-app search across people, posts and tags, with a filter row. */
export function Search({ leading }: { leading?: React.ReactNode }) {
  const { posts } = useStore();
  const { openPerson } = useProfileNav();
  const t = useT();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const q = query.trim().toLowerCase();

  const people = useMemo(
    () => (q ? PEOPLE.filter((p) => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)) : []),
    [q],
  );

  const tags = useMemo(() => {
    const all = new Map<string, number>();
    for (const p of posts) for (const tag of p.tags ?? []) all.set(tag, (all.get(tag) ?? 0) + 1);
    const entries = [...all.entries()];
    const filtered = q ? entries.filter(([tag]) => tag.includes(q.replace(/^#/, ""))) : entries;
    return filtered.sort((a, b) => b[1] - a[1]);
  }, [posts, q]);

  const matchedPosts = useMemo(() => {
    if (!q) return [];
    const bare = q.replace(/^#/, "");
    return posts.filter(
      (p) =>
        p.text.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        p.author.handle.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        (p.tags ?? []).some((tag) => tag.includes(bare)),
    );
  }, [posts, q]);

  const showPeople = (filter === "all" || filter === "people") && people.length > 0;
  const showTags = (filter === "all" || filter === "tags") && tags.length > 0;
  const showPosts = (filter === "all" || filter === "posts") && matchedPosts.length > 0;
  const empty = q && !showPeople && !showTags && !showPosts;

  const filters: Filter[] = ["all", "people", "posts", "tags"];
  const filterLabel: Record<Filter, string> = {
    all: t("filterAll"),
    people: t("filterPeople"),
    posts: t("filterPosts"),
    tags: t("filterTags"),
  };

  return (
    <div className="scroll-clean h-full overflow-y-auto bg-canvas">
      {/* Search field */}
      <div className="sticky top-0 z-10 border-b border-line bg-canvas/90 px-3 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          {leading}
          <div className="flex flex-1 items-center gap-2 rounded-full bg-surface px-3.5 py-2.5 shadow-panel">
            <RiSearchLine className="size-5 shrink-0 text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchEverything")}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label={t("close")} className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted transition hover:text-ink">
                <RiCloseLine className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cx(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                filter === f ? "bg-accent text-white" : "bg-surface text-muted hover:text-ink",
              )}
            >
              {filterLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {!q ? (
        <div className="p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("filterTags")}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(([tag, n]) => (
              <button
                key={tag}
                onClick={() => { setQuery(`#${tag}`); setFilter("posts"); }}
                className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-ink shadow-panel transition hover:bg-surface-3"
              >
                <RiHashtag className="size-4 text-accent" />
                {tag}
                <span className="text-xs text-faint">{n}</span>
              </button>
            ))}
          </div>
        </div>
      ) : empty ? (
        <p className="py-16 text-center text-sm text-faint">{t("nothingFound")}</p>
      ) : (
        <div className="flex flex-col gap-4 p-3 pb-24">
          {showPeople && (
            <section>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("filterPeople")}</h2>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                {people.map((p) => (
                  <button key={p.id} onClick={() => openPerson(p)} className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-surface-2/50">
                    <Avatar src={p.avatar} name={p.name} size={44} online={p.online} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-semibold text-ink">
                        {p.name}
                        {p.verified && <RiVerifiedBadgeFill className="size-3.5 text-accent" />}
                      </p>
                      <p className="truncate text-xs text-muted">{emailFor(p.handle)} · {compact(p.followers ?? 0)} {t("followers")}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {showTags && (
            <section>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("filterTags")}</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map(([tag, n]) => (
                  <button key={tag} onClick={() => { setQuery(`#${tag}`); setFilter("posts"); }} className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-ink shadow-panel transition hover:bg-surface-3">
                    <RiHashtag className="size-4 text-accent" />
                    {tag}
                    <span className="text-xs text-faint">{n}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {showPosts && (
            <section className="flex flex-col gap-3">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("filterPosts")}</h2>
              {matchedPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
