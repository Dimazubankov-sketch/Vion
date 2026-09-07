"use client";

import { useMemo, useRef, useState } from "react";
import {
  RiArrowLeftLine,
  RiCameraLine,
  RiEditLine,
  RiImageAddLine,
  RiShareLine,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth, type VionUser } from "@/lib/auth-context";
import { fileToDataUrl } from "@/utils/image";
import { cx } from "@/utils/cx";

const RANGES = ["Weekly", "Monthly", "Yearly"] as const;
type Range = (typeof RANGES)[number];

/** Deterministic pseudo-random so the heatmap is stable across re-renders. */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const STATS = [
  { value: "12.4K", label: "Messages sent" },
  { value: "3,240", label: "Followers" },
  { value: "48 min", label: "Longest call" },
  { value: "62 days", label: "Top streak" },
];

export function Profile({ user, onBack }: { user: VionUser; onBack: () => void }) {
  const [range, setRange] = useState<Range>("Weekly");
  const { updateUser } = useAuth();
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined, field: "avatar" | "banner") => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file, field === "avatar" ? 480 : 1200);
      updateUser({ [field]: dataUrl });
    } catch {
      /* ignore unreadable files */
    }
  };

  const cells = useMemo(() => {
    const rand = seeded(range.length * 97 + 13);
    const cols = 34;
    const rows = 7;
    return Array.from({ length: rows * cols }, () => {
      const r = rand();
      if (r < 0.28) return 0;
      if (r < 0.5) return 1;
      if (r < 0.72) return 2;
      if (r < 0.9) return 3;
      return 4;
    });
  }, [range]);

  return (
    <div className="scroll-clean flex h-full flex-col overflow-y-auto pb-6">
      {/* Hidden pickers */}
      <input
        ref={avatarInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => pick(e.target.files?.[0], "avatar")}
      />
      <input
        ref={bannerInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => pick(e.target.files?.[0], "banner")}
      />

      {/* Banner */}
      <div className="relative h-40 w-full shrink-0 bg-gradient-to-br from-accent to-accent-strong">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.banner ?? "https://picsum.photos/id/1074/1200/400"}
          alt=""
          className="size-full object-cover opacity-90"
        />
        <button
          onClick={onBack}
          aria-label="Back"
          className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
        >
          <RiArrowLeftLine className="size-5" />
        </button>
        <button
          onClick={() => bannerInput.current?.click()}
          aria-label="Change cover photo"
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-black/50"
        >
          <RiImageAddLine className="size-4" />
          Cover
        </button>
      </div>

      {/* Header row */}
      <div className="px-5">
        <div className="-mt-10 flex items-end justify-between">
          <button
            onClick={() => avatarInput.current?.click()}
            aria-label="Change profile photo"
            className="group relative rounded-full border-4 border-surface"
          >
            <Avatar src={user.avatar} name={user.name} size={80} />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100">
              <RiCameraLine className="size-6 text-white" />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border-2 border-surface bg-accent text-white">
              <RiCameraLine className="size-3.5" />
            </span>
          </button>
          <div className="mb-1 flex gap-2">
            <OutlineButton icon={<RiShareLine className="size-4" />}>Share</OutlineButton>
            <OutlineButton icon={<RiEditLine className="size-4" />}>Edit</OutlineButton>
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-xl font-bold text-ink">{user.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">@{user.handle}</span>
            <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Pro
            </span>
          </div>
        </div>

        {/* Big metric */}
        <div className="mt-5">
          <p className="text-sm text-muted">Activity this year</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-bold text-ink">7,462</span>
            <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent">
              +14.8%
            </span>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-surface-2 p-3.5">
              <p className="text-lg font-bold text-ink">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Activity heatmap */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Activity</h2>
            <div className="flex gap-1 rounded-full bg-surface-2 p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cx(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    range === r ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto no-scrollbar">
            <div
              className="grid w-max gap-1"
              style={{ gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", gridAutoColumns: "1fr" }}
            >
              {cells.map((level, i) => (
                <span
                  key={i}
                  className="size-3 rounded-[3px]"
                  style={{
                    backgroundColor:
                      level === 0 ? "var(--surface-3)" : "var(--accent)",
                    opacity: level === 0 ? 1 : 0.25 + level * 0.19,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutlineButton({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink transition hover:bg-surface-3">
      {icon}
      {children}
    </button>
  );
}
