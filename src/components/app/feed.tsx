"use client";

import { useState } from "react";
import {
  RiChat1Line,
  RiHeart3Fill,
  RiHeart3Line,
  RiMoreLine,
  RiRepeat2Line,
  RiShareForwardLine,
  RiVerifiedBadgeFill,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { POSTS, type Post } from "@/lib/mock-data";
import { cx } from "@/utils/cx";

function count(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>(POSTS);

  const toggleLike = (id: string) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
          : p,
      ),
    );

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLike={() => toggleLike(post.id)} />
      ))}
      <p className="py-10 text-center text-sm text-faint">You&apos;re all caught up ✨</p>
    </div>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: () => void }) {
  return (
    <article className="border-b border-line px-4 py-3.5 transition hover:bg-surface-2/40">
      <div className="flex gap-3">
        <Avatar src={post.author.avatar} name={post.author.name} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="truncate font-semibold text-ink">{post.author.name}</span>
            <RiVerifiedBadgeFill className="size-4 shrink-0 text-accent" />
            <span className="truncate text-muted">@{post.author.handle}</span>
            <span className="text-faint">· {post.time}</span>
            <button className="ml-auto rounded-full p-1 text-faint hover:bg-surface-3 hover:text-muted">
              <RiMoreLine className="size-4" />
            </button>
          </div>

          <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {post.text}
          </p>

          {post.images && post.images.length > 0 && (
            <div
              className={cx(
                "mt-3 grid gap-1 overflow-hidden rounded-2xl border border-line",
                post.images.length > 1 ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              {post.images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="h-44 w-full object-cover" />
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between pr-6 text-faint">
            <Action icon={<RiChat1Line className="size-[18px]" />} label={count(post.replies)} hover="hover:text-accent" />
            <Action icon={<RiRepeat2Line className="size-[18px]" />} label={count(post.reposts)} hover="hover:text-online" />
            <button
              onClick={onLike}
              className={cx(
                "group flex items-center gap-1.5 text-sm transition hover:text-danger",
                post.liked && "text-danger",
              )}
            >
              {post.liked ? (
                <RiHeart3Fill className="size-[18px]" />
              ) : (
                <RiHeart3Line className="size-[18px]" />
              )}
              {count(post.likes)}
            </button>
            <Action icon={<RiShareForwardLine className="size-[18px]" />} label="" hover="hover:text-accent" />
          </div>
        </div>
      </div>
    </article>
  );
}

function Action({ icon, label, hover }: { icon: React.ReactNode; label: string; hover: string }) {
  return (
    <button className={cx("flex items-center gap-1.5 text-sm transition", hover)}>
      {icon}
      {label}
    </button>
  );
}
