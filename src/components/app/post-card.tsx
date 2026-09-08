"use client";

import { useMemo, useRef, useState } from "react";
import {
  RiAddLine,
  RiChat1Line,
  RiCloseLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFile3Line,
  RiFileTextLine,
  RiFlagLine,
  RiHeart3Fill,
  RiHeart3Line,
  RiImageLine,
  RiLink,
  RiMoreLine,
  RiRepeat2Line,
  RiSendPlane2Fill,
  RiShareForwardLine,
  RiVerifiedBadgeFill,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { MediaViewer } from "@/components/ui/media-viewer";
import { useAuth } from "@/lib/auth-context";
import { useStore } from "@/lib/app-store";
import { useProfileNav } from "@/lib/profile-nav";
import { useT } from "@/lib/settings-context";
import { PEOPLE, type Post, type PostComment } from "@/lib/mock-data";
import { formatBytes } from "@/utils/image";
import { linkify } from "@/utils/linkify";
import { cx } from "@/utils/cx";
import { uid } from "@/utils/uid";
import { PollView } from "./poll-chart";
import { PostComposerDialog } from "./post-composer";

export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

type SortOrder = "new" | "top";

function countComments(comments: PostComment[]): number {
  return comments.reduce((n, c) => n + 1 + countComments(c.replies ?? []), 0);
}

/** Open a person's profile from a name/avatar, if we know that person. */
function usePersonOpener() {
  const { openPerson } = useProfileNav();
  return (handle: string) => {
    const person = PEOPLE.find((p) => p.handle === handle);
    if (person) openPerson(person);
  };
}

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { toggleLike, addComment, toggleCommentLike, votePoll, hidePost } = useStore();
  const t = useT();
  const openPerson = usePersonOpener();
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<SortOrder>("top");
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);

  const isMe = post.author.handle === user?.handle;
  const total = countComments(post.comments);

  const sorted = useMemo(() => {
    const list = [...post.comments];
    if (sort === "new") list.sort((a, b) => b.createdAt - a.createdAt);
    else list.sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);
    return list;
  }, [post.comments, sort]);

  const makeComment = (draft: CommentDraft): PostComment => ({
    id: uid("c"),
    author: { id: "me", name: user?.name ?? "You", handle: user?.handle ?? "you", avatar: user?.avatar ?? "" },
    text: draft.text,
    time: "now",
    createdAt: Date.now(),
    likes: 0,
    images: draft.images.length ? draft.images : undefined,
    file: draft.file,
    link: draft.link,
  });

  const submitComment = (draft: CommentDraft) => {
    addComment(post.id, makeComment(draft), replyTo?.id);
    setReplyTo(null);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-panel">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <button onClick={() => !isMe && openPerson(post.author.handle)} className="shrink-0" aria-label={post.author.name}>
          <Avatar src={post.author.avatar} name={post.author.name} size={44} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[15px] leading-tight text-ink">
            <button onClick={() => !isMe && openPerson(post.author.handle)} className="truncate font-semibold hover:underline">
              {post.author.name}
            </button>
            {post.author.verified && <RiVerifiedBadgeFill className="size-4 shrink-0 text-accent" />}
            {post.location && (
              <>
                <span className="text-muted"> is at </span>
                <span className="font-semibold text-accent">{post.location}</span>
              </>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted">{post.time}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-surface-3 hover:text-muted"
          >
            <RiMoreLine className="size-5" />
          </button>
          {menuOpen && <PostMenu post={post} onClose={() => setMenuOpen(false)} onHide={() => hidePost(post.id)} />}
        </div>
      </div>

      {/* Body */}
      {post.text && (
        <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-relaxed text-ink">{linkify(post.text, false)}</p>
      )}

      {post.images && post.images.length > 0 && (
        <div className={cx("grid gap-2 px-4 pb-3", post.images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {post.images.map((src, i) => (
            <button key={src} onClick={() => setViewer(i)} className="overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-48 w-full object-cover transition hover:brightness-95" />
            </button>
          ))}
        </div>
      )}

      {post.poll && (
        <div className="px-4 pb-3">
          <PollView poll={post.poll} onVote={(optionId) => votePoll(post.id, optionId)} />
        </div>
      )}

      {/* Quoted repost */}
      {post.repostOf && (
        <div className="px-4 pb-3">
          <QuotedPost post={post.repostOf} onOpen={() => openPerson(post.repostOf!.author.handle)} />
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
        <span className="text-sm text-muted">+ {compact(post.likes)} {t("likes")}</span>
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
          onClick={() => toggleLike(post.id)}
          icon={post.liked ? <RiHeart3Fill className="size-5" /> : <RiHeart3Line className="size-5" />}
          label={t("like")}
        />
        <ActionButton active={open} onClick={() => setOpen((v) => !v)} icon={<RiChat1Line className="size-5" />} label={`${total} ${t("comments")}`} />
        <ActionButton
          active={post.reposted}
          activeClass="text-online"
          onClick={() => setReposting(true)}
          icon={<RiRepeat2Line className="size-5" />}
          label={`${post.shares} ${t("shares")}`}
        />
      </div>

      {/* Comments */}
      {open && (
        <div className="border-t border-line bg-surface-2/50 p-4 animate-fade-in">
          {post.comments.length > 0 && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{total} {t("comments")}</span>
              <div className="flex gap-0.5 rounded-full bg-surface p-0.5">
                {(["top", "new"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSort(key)}
                    className={cx("rounded-full px-3 py-1 text-xs font-medium transition", sort === key ? "bg-accent text-white" : "text-muted hover:text-ink")}
                  >
                    {key === "top" ? t("sortTop") : t("sortNew")}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {sorted.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                sort={sort}
                onReply={(comment) => setReplyTo(comment)}
                onLike={(id) => toggleCommentLike(post.id, id)}
                onOpenPerson={openPerson}
              />
            ))}
            {post.comments.length === 0 && <p className="text-center text-sm text-faint">{t("noComments")}</p>}
          </div>

          {/* Single composer at the bottom, with a reply indicator */}
          <div className="mt-3">
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-surface px-3 py-1.5">
                <span className="flex-1 truncate text-xs text-muted">
                  {t("replyingTo")} <span className="font-medium text-ink">{replyTo.author.name}</span>
                </span>
                <button onClick={() => setReplyTo(null)} aria-label={t("cancel")} className="text-muted">
                  <RiCloseLine className="size-4" />
                </button>
              </div>
            )}
            <CommentComposer
              key={replyTo?.id ?? "root"}
              autoFocus={!!replyTo}
              placeholder={replyTo ? `${t("reply")} ${replyTo.author.name}...` : t("writeComment")}
              onSubmit={submitComment}
            />
          </div>
        </div>
      )}

      {reposting && <PostComposerDialog repostOf={post} onClose={() => setReposting(false)} />}

      {viewer !== null && post.images && (
        <MediaViewer
          items={post.images.map((src) => ({ src, kind: "image" as const }))}
          index={viewer}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
        />
      )}
    </article>
  );
}

/** The post "..." dropdown: share, report, not interested. */
function PostMenu({ post, onClose, onHide }: { post: Post; onClose: () => void; onHide: () => void }) {
  const t = useT();
  const [reported, setReported] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = () => {
    const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(onClose, 900);
  };

  return (
    <>
      <button aria-label={t("close")} onClick={onClose} className="fixed inset-0 z-30 cursor-default" />
      <div className="absolute right-0 top-9 z-40 w-52 overflow-hidden rounded-2xl border border-line bg-surface shadow-float animate-pop-in">
        {reported ? (
          <p className="px-3.5 py-4 text-center text-sm text-muted">{t("reportThanks")}</p>
        ) : copied ? (
          <p className="px-3.5 py-4 text-center text-sm text-muted">{t("linkCopied")}</p>
        ) : (
          <>
            <MenuRow icon={<RiShareForwardLine className="size-5" />} label={t("copyLink")} onClick={share} />
            <MenuRow icon={<RiEyeOffLine className="size-5" />} label={t("notInterested")} onClick={() => { onHide(); onClose(); }} />
            <MenuRow danger icon={<RiFlagLine className="size-5" />} label={t("reportPost")} onClick={() => setReported(true)} />
          </>
        )}
      </div>
    </>
  );
}

function MenuRow({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cx("flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium transition hover:bg-surface-2", danger ? "text-danger" : "text-ink")}
    >
      <span className={danger ? "" : "text-muted"}>{icon}</span>
      {label}
    </button>
  );
}

/** A quoted (embedded) post inside a repost. */
function QuotedPost({ post, onOpen }: { post: Post; onOpen: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="flex items-center gap-2 px-3 pt-3">
        <Avatar src={post.author.avatar} name={post.author.name} size={24} />
        <button onClick={onOpen} className="truncate text-sm font-semibold text-ink hover:underline">
          {post.author.name}
        </button>
        {post.author.verified && <RiVerifiedBadgeFill className="size-3.5 text-accent" />}
        <span className="truncate text-xs text-muted">@{post.author.handle}</span>
      </div>
      {post.text && <p className="line-clamp-3 px-3 py-2 text-sm text-ink">{post.text}</p>}
      {post.images && post.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.images[0]} alt="" className="h-40 w-full object-cover" />
      )}
    </div>
  );
}

function CommentRow({
  comment,
  sort,
  onReply,
  onLike,
  onOpenPerson,
  depth = 0,
}: {
  comment: PostComment;
  sort: SortOrder;
  onReply: (comment: PostComment) => void;
  onLike: (id: string) => void;
  onOpenPerson: (handle: string) => void;
  depth?: number;
}) {
  const t = useT();
  const replies = useMemo(() => {
    const list = [...(comment.replies ?? [])];
    if (sort === "new") list.sort((a, b) => b.createdAt - a.createdAt);
    else list.sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);
    return list;
  }, [comment.replies, sort]);

  return (
    <div className="flex gap-2.5">
      <button onClick={() => onOpenPerson(comment.author.handle)} aria-label={comment.author.name} className="shrink-0">
        <Avatar src={comment.author.avatar} name={comment.author.name} size={depth ? 26 : 32} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md bg-surface px-3 py-2">
          <button onClick={() => onOpenPerson(comment.author.handle)} className="text-sm font-semibold text-ink hover:underline">
            {comment.author.name}
          </button>
          {comment.text && <p className="whitespace-pre-wrap text-sm text-ink">{linkify(comment.text, false)}</p>}

          {comment.images && comment.images.length > 0 && (
            <div className={cx("mt-2 grid gap-1.5", comment.images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {comment.images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="h-28 w-full rounded-lg object-cover" />
              ))}
            </div>
          )}

          {comment.file && (
            <a href={comment.file.url} download={comment.file.name} className="mt-2 flex items-center gap-2 rounded-lg bg-surface-2 p-2 transition hover:bg-surface-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                <RiFile3Line className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-ink">{comment.file.name}</span>
                <span className="block text-[11px] text-muted">{comment.file.size}</span>
              </span>
            </a>
          )}

          {comment.link && (
            <a href={comment.link} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1.5 truncate text-xs font-medium text-accent hover:underline">
              <RiExternalLinkLine className="size-3.5 shrink-0" />
              {comment.link}
            </a>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 pl-1">
          <span className="text-xs text-faint">{comment.time}</span>
          <button
            onClick={() => onLike(comment.id)}
            className={cx("flex items-center gap-1 text-xs font-medium transition", comment.liked ? "text-danger" : "text-muted hover:text-danger")}
          >
            {comment.liked ? <RiHeart3Fill className="size-3.5" /> : <RiHeart3Line className="size-3.5" />}
            {comment.likes > 0 ? compact(comment.likes) : ""}
          </button>
          <button onClick={() => onReply(comment)} className="text-xs font-medium text-muted transition hover:text-accent">
            {t("reply")}
          </button>
        </div>

        {replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-l border-line pl-3">
            {replies.map((r) => (
              <CommentRow key={r.id} comment={r} sort={sort} onReply={onReply} onLike={onLike} onOpenPerson={onOpenPerson} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export interface CommentDraft {
  text: string;
  images: string[];
  file?: { name: string; size: string; url?: string };
  link?: string;
}

/** Comment box with a "+" menu for photos, files and links. No leading avatar. */
function CommentComposer({
  placeholder,
  onSubmit,
  autoFocus = false,
}: {
  placeholder: string;
  onSubmit: (draft: CommentDraft) => void;
  autoFocus?: boolean;
}) {
  const t = useT();
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [file, setFile] = useState<CommentDraft["file"]>();
  const [link, setLink] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const acceptRef = useRef("");

  const canSend = !!(text.trim() || images.length || file || link.trim());

  const submit = () => {
    if (!canSend) return;
    onSubmit({ text: text.trim(), images, file, link: link.trim() || undefined });
    setText("");
    setImages([]);
    setFile(undefined);
    setLink("");
    setLinkOpen(false);
  };

  const pick = (accept: string) => {
    acceptRef.current = accept;
    setMenuOpen(false);
    requestAnimationFrame(() => fileRef.current?.click());
  };

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const picked = Array.from(list);
    const imgs = picked.filter((f) => f.type.startsWith("image/"));
    const other = picked.find((f) => !f.type.startsWith("image/"));
    if (imgs.length) setImages((prev) => [...prev, ...imgs.map((f) => URL.createObjectURL(f))]);
    if (other) setFile({ name: other.name, size: formatBytes(other.size), url: URL.createObjectURL(other) });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <input ref={fileRef} type="file" multiple hidden accept={acceptRef.current || undefined} onChange={(e) => onFiles(e.target.files)} />

      {(images.length > 0 || file) && (
        <div className="flex flex-wrap items-center gap-2">
          {images.map((src, i) => (
            <span key={src} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-14 rounded-lg object-cover" />
              <button onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} aria-label={t("close")} className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white">
                <RiCloseLine className="size-3" />
              </button>
            </span>
          ))}
          {file && (
            <span className="flex items-center gap-1.5 rounded-lg bg-surface px-2 py-1.5 text-xs text-ink">
              <RiFile3Line className="size-3.5 text-accent" />
              <span className="max-w-32 truncate">{file.name}</span>
              <button onClick={() => setFile(undefined)} aria-label={t("close")}>
                <RiCloseLine className="size-3.5 text-muted" />
              </button>
            </span>
          )}
        </div>
      )}

      {linkOpen && (
        <div className="flex items-center gap-2">
          <RiLink className="size-4 shrink-0 text-accent" />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="min-w-0 flex-1 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-faint" />
          <button onClick={() => { setLink(""); setLinkOpen(false); }} aria-label={t("close")} className="text-muted">
            <RiCloseLine className="size-4" />
          </button>
        </div>
      )}

      <div className="relative flex items-center gap-1 rounded-full bg-surface px-2 py-1.5">
        {menuOpen && (
          <>
            <button aria-label={t("close")} onClick={() => setMenuOpen(false)} className="fixed inset-0 z-10 cursor-default" />
            <div className="absolute bottom-full left-0 z-20 mb-2 w-52 overflow-hidden rounded-2xl border border-line bg-surface shadow-float animate-pop-in">
              <MenuRow icon={<RiImageLine className="size-5" />} label={t("photoOrVideo")} onClick={() => pick("image/*,video/*")} />
              <MenuRow icon={<RiFileTextLine className="size-5" />} label={t("document")} onClick={() => pick("")} />
              <MenuRow icon={<RiLink className="size-5" />} label={t("link")} onClick={() => { setLinkOpen(true); setMenuOpen(false); }} />
            </div>
          </>
        )}

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={t("photoOrVideo")}
          className={cx("flex size-7 shrink-0 items-center justify-center rounded-full transition", menuOpen ? "bg-accent text-white" : "text-muted hover:bg-surface-3 hover:text-accent")}
        >
          <RiAddLine className="size-4" />
        </button>

        <input
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />

        <button onClick={submit} aria-label="Post comment" disabled={!canSend} className="flex size-7 shrink-0 items-center justify-center rounded-full text-accent transition hover:bg-accent-soft disabled:opacity-40">
          <RiSendPlane2Fill className="size-4" />
        </button>
      </div>
    </div>
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
      className={cx("flex items-center justify-center gap-2 py-3 text-sm font-medium transition hover:bg-surface-2", active ? activeClass : "text-muted")}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
