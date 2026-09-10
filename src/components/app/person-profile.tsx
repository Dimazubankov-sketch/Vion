"use client";

import { useState } from "react";
import { RiArrowLeftLine, RiShareLine, RiVerifiedBadgeFill } from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { MediaViewer } from "@/components/ui/media-viewer";
import { useStore } from "@/lib/app-store";
import { useT } from "@/lib/settings-context";
import type { Person } from "@/lib/mock-data";
import { emailFor } from "@/lib/accounts";
import { cx } from "@/utils/cx";
import { PostCard, compact } from "./post-card";
import { ShareSheet } from "./share-sheet";

type ContentTab = "posts" | "reposts";

/** Read-only profile for another person, with their posts and reposts. */
export function PersonProfile({ person, onBack }: { person: Person; onBack: () => void }) {
  const t = useT();
  const { posts, isFollowing, toggleFollow } = useStore();
  const following = isFollowing(person.id);
  const [tab, setTab] = useState<ContentTab>("posts");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const mine = posts.filter((p) => p.author.handle === person.handle);
  const theirPosts = mine.filter((p) => !p.repostOf);
  const theirReposts = mine.filter((p) => p.repostOf);
  const shown = tab === "posts" ? theirPosts : theirReposts;

  return (
    <div className="scroll-clean flex h-full flex-col overflow-y-auto bg-canvas pb-6">
      {/* Banner */}
      <div className="relative h-40 w-full shrink-0 bg-gradient-to-br from-accent to-accent-strong">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.banner ?? "https://picsum.photos/id/1043/1200/400"}
          alt=""
          className="size-full object-cover"
        />
        <button
          onClick={onBack}
          aria-label={t("back")}
          className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
        >
          <RiArrowLeftLine className="size-5" />
        </button>
      </div>

      <div className="bg-surface px-5 pb-4">
        <div className="-mt-10 flex items-end justify-between">
          <button
            onClick={() => person.avatar && setAvatarOpen(true)}
            aria-label={person.name}
            className="inline-flex rounded-full border-4 border-surface transition hover:brightness-95 active:scale-95"
          >
            <Avatar src={person.avatar} name={person.name} size={80} online={person.online} />
          </button>

          <div className="mb-1 flex gap-2">
            <button
              onClick={() => setSharing(true)}
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink transition hover:bg-surface-3"
            >
              <RiShareLine className="size-4" />
              {t("share")}
            </button>
            <button
              onClick={() => toggleFollow(person.id)}
              className={cx(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                following
                  ? "border border-line bg-surface text-ink hover:bg-surface-3"
                  : "bg-accent text-white hover:bg-accent-strong",
              )}
            >
              {following ? t("unfollow") : t("follow")}
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold text-ink">{person.name}</h1>
            {person.verified && <RiVerifiedBadgeFill className="size-5 text-accent" />}
          </div>
          <span className="text-sm text-muted">{emailFor(person.handle)}</span>
        </div>

        {person.bio && (
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{person.bio}</p>
        )}

        <div className="mt-4 flex gap-5 text-sm text-muted">
          <span>
            <span className="font-bold text-ink">{compact(person.following ?? 0)}</span> {t("following")}
          </span>
          <span>
            <span className="font-bold text-ink">{compact(person.followers ?? 0)}</span> {t("followers")}
          </span>
        </div>
      </div>

      {/* Posts / Reposts tabs */}
      <div className="sticky top-0 z-10 flex bg-surface/95 backdrop-blur">
        {(["posts", "reposts"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cx(
              "relative flex-1 py-3 text-sm font-semibold transition",
              tab === key ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {t(key)}
            {tab === key && <span className="absolute inset-x-6 bottom-0 h-1 rounded-full bg-accent" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-3">
        {shown.length === 0 ? (
          <p className="py-14 text-center text-sm text-faint">
            {tab === "posts" ? t("noPosts") : t("noReposts")}
          </p>
        ) : (
          shown.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {avatarOpen && person.avatar && (
        <MediaViewer
          items={[{ src: person.avatar, kind: "image" }]}
          index={0}
          onIndex={() => {}}
          onClose={() => setAvatarOpen(false)}
        />
      )}
      {sharing && <ShareSheet handle={person.handle} name={person.name} onClose={() => setSharing(false)} />}
    </div>
  );
}
