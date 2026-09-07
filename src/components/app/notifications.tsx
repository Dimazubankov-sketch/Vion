"use client";

import {
  RiAtLine,
  RiChat1Line,
  RiHeart3Fill,
  RiRepeat2Line,
  RiUserFollowFill,
} from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { NOTIFICATIONS, type NotificationKind } from "@/lib/mock-data";
import { cx } from "@/utils/cx";

const KIND: Record<NotificationKind, { icon: React.ReactNode; tint: string }> = {
  like: { icon: <RiHeart3Fill className="size-4" />, tint: "bg-danger/15 text-danger" },
  follow: { icon: <RiUserFollowFill className="size-4" />, tint: "bg-accent/15 text-accent" },
  reply: { icon: <RiChat1Line className="size-4" />, tint: "bg-accent/15 text-accent" },
  repost: { icon: <RiRepeat2Line className="size-4" />, tint: "bg-online/15 text-online" },
  mention: { icon: <RiAtLine className="size-4" />, tint: "bg-accent/15 text-accent" },
};

export function Notifications() {
  return (
    <div className="flex flex-col">
      {NOTIFICATIONS.map((n) => {
        const meta = KIND[n.kind];
        return (
          <div
            key={n.id}
            className={cx(
              "flex items-start gap-3 border-b border-line px-4 py-3.5 transition hover:bg-surface-2/40",
              n.unread && "bg-accent-soft/40",
            )}
          >
            <span
              className={cx(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                meta.tint,
              )}
            >
              {meta.icon}
            </span>
            <Avatar src={n.actor.avatar} name={n.actor.name} size={38} />
            <div className="min-w-0 flex-1 pt-0.5 text-sm">
              <p className="text-ink">
                <span className="font-semibold">{n.actor.name}</span>{" "}
                <span className="text-muted">{n.text}</span>
              </p>
              <p className="mt-0.5 text-xs text-faint">{n.time}</p>
            </div>
            {n.unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" />}
          </div>
        );
      })}
    </div>
  );
}
