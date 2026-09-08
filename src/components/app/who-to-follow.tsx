"use client";

import { RiVerifiedBadgeFill } from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { useStore, PEOPLE } from "@/lib/app-store";
import { useProfileNav } from "@/lib/profile-nav";
import { useT } from "@/lib/settings-context";
import { emailFor } from "@/lib/accounts";
import { cx } from "@/utils/cx";

/**
 * Follow suggestions, shown in the Following feed when you don't follow anyone
 * yet. Cards mirror the "Who to read" pattern: cover, overlapping avatar, name,
 * identifier, bio and a Follow button.
 */
export function WhoToFollow() {
  const t = useT();
  const { isFollowing, toggleFollow } = useStore();
  const { openPerson } = useProfileNav();

  const suggestions = PEOPLE.filter((p) => !isFollowing(p.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="px-1">
        <h2 className="text-lg font-bold text-ink">{t("whoToFollow")}</h2>
        <p className="text-sm text-muted">{t("whoToFollowSub")}</p>
      </div>

      {suggestions.map((p) => {
        const following = isFollowing(p.id);
        return (
          <article key={p.id} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-panel">
            <button onClick={() => openPerson(p)} className="block h-20 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.banner ?? "https://picsum.photos/id/1043/1200/400"} alt="" className="size-full object-cover" />
            </button>
            <div className="px-4 pb-4">
              <div className="-mt-7 flex items-end justify-between">
                <button onClick={() => openPerson(p)} className="inline-flex rounded-full border-4 border-surface">
                  <Avatar src={p.avatar} name={p.name} size={56} online={p.online} />
                </button>
                <button
                  onClick={() => toggleFollow(p.id)}
                  className={cx(
                    "mb-1 rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-95",
                    following ? "border border-line bg-surface text-ink hover:bg-surface-3" : "bg-accent text-white hover:bg-accent-strong",
                  )}
                >
                  {following ? t("unfollow") : t("follow")}
                </button>
              </div>
              <button onClick={() => openPerson(p)} className="mt-2 block text-left">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-ink">{p.name}</span>
                  {p.verified && <RiVerifiedBadgeFill className="size-4 text-accent" />}
                </span>
                <span className="text-sm text-muted">{emailFor(p.handle)}</span>
              </button>
              {p.bio && <p className="mt-1.5 line-clamp-2 text-sm text-ink">{p.bio}</p>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
