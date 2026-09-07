"use client";

import { useState } from "react";
import {
  RiChat1Line,
  RiEyeLine,
  RiHeart3Fill,
  RiHeart3Line,
  RiMoreLine,
  RiSendPlane2Fill,
  RiShareForwardLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { POSTS, type Post, type PostComment } from "@/lib/mock-data";
import { cx } from "@/utils/cx";

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>(POSTS);

  const toggleLike = (id: string) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
      ),
    );

  const addComment = (id: string, comment: PostComment) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, comments: [...p.comments, comment] } : p)),
    );

  return (
    <div className="flex flex-col gap-3 bg-canvas p-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => toggleLike(post.id)}
          onComment={(c) => addComment(post.id, c)}
        />
      ))}
      <p className="py-8 text-center text-sm text-faint">You&apos;re all caught up ✨</p>
    </div>
  );
}

function PostCard({
  post,
  onLike,
  onComment,
}: {
  post: Post;
  onLike: () => void;
  onComment: (c: PostComment) => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const submit = () => {
    const text = draft.trim();
    if (!text || !user) return;
    onComment({
      id: `c${Date.now()}`,
      author: {
        id: "me",
        name: user.name,
        handle: user.handle,
        avatar: user.avatar ?? "",
      },
      text,
      time: "now",
    });
    setDraft("");
    setOpen(true);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-panel">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar src={post.author.avatar} name={post.author.name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-tight text-ink">
            <span className="font-semibold">{post.author.name}</span>
            {post.location && (
              <>
                <span className="text-muted"> is at </span>
                <span className="font-semibold text-accent">{post.location}</span>
              </>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted">{post.time}</p>
        </div>
        <button
          aria-label="More"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-surface-3 hover:text-muted"
        >
          <RiMoreLine className="size-5" />
        </button>
      </div>

      {/* Body */}
      <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-relaxed text-ink">
        {post.text}
      </p>

      {post.images && post.images.length > 0 && (
        <div
          className={cx(
            "grid gap-2 px-4 pb-3",
            post.images.length > 1 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {post.images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="h-48 w-full rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      {/* Likers + views */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {post.likers.length > 0 && (
          <div className="flex -space-x-2">
            {post.likers.slice(0, 4).map((p) => (
              <span key={p.id} className="rounded-full ring-2 ring-surface">
                <Avatar src={p.avatar} name={p.name} size={24} />
              </span>
            ))}
          </div>
        )}
        <span className="text-sm text-muted">+ {compact(post.likes)} Likes</span>
        <span className="ml-auto flex items-center gap-1 text-sm text-muted">
          <RiEyeLine className="size-4" />
          {compact(post.views)}
        </span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 border-t border-line">
        <ActionButton
          active={post.liked}
          activeClass="text-danger"
          onClick={onLike}
          icon={post.liked ? <RiHeart3Fill className="size-5" /> : <RiHeart3Line className="size-5" />}
          label="Like"
        />
        <ActionButton
          active={open}
          onClick={() => setOpen((v) => !v)}
          icon={<RiChat1Line className="size-5" />}
          label={`${post.comments.length} Comments`}
        />
        <ActionButton
          icon={<RiShareForwardLine className="size-5" />}
          label={`${post.shares} Shares`}
        />
      </div>

      {/* Comments */}
      {open && (
        <div className="border-t border-line bg-surface-2/50 p-4 animate-fade-in">
          <div className="flex flex-col gap-3">
            {post.comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <Avatar src={c.author.avatar} name={c.author.name} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl rounded-tl-md bg-surface px-3 py-2">
                    <p className="text-sm font-semibold text-ink">{c.author.name}</p>
                    <p className="text-sm text-ink">{c.text}</p>
                  </div>
                  <p className="mt-1 pl-1 text-xs text-faint">{c.time}</p>
                </div>
              </div>
            ))}
            {post.comments.length === 0 && (
              <p className="text-center text-sm text-faint">No comments yet — say something.</p>
            )}
          </div>

          {/* New comment */}
          <div className="mt-3 flex items-center gap-2">
            <Avatar src={user?.avatar} name={user?.name ?? "You"} size={32} />
            <div className="flex flex-1 items-center gap-1 rounded-full bg-surface px-3 py-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Write a comment…"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
              <button
                onClick={submit}
                aria-label="Post comment"
                disabled={!draft.trim()}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-accent transition hover:bg-accent-soft disabled:opacity-40"
              >
                <RiSendPlane2Fill className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  active,
  activeClass = "text-accent",
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex items-center justify-center gap-2 py-3 text-sm font-medium transition hover:bg-surface-2",
        active ? activeClass : "text-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
