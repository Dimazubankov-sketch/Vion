"use client";

import { RiCheckLine } from "@remixicon/react";
import type { Poll } from "@/lib/mock-data";
import { cx } from "@/utils/cx";

/** Segment colours, in order. First one is the brand accent. */
const SERIES = [
  "var(--accent)",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
];

export function totalVotes(poll: Poll) {
  return poll.options.reduce((n, o) => n + o.votes, 0);
}

function percent(votes: number, total: number) {
  return total === 0 ? 0 : Math.round((votes / total) * 100);
}

/**
 * A poll rendered as either a bar list or a donut. Before you vote the options
 * are buttons; afterwards they turn into the result chart.
 */
export function PollView({
  poll,
  onVote,
  compact = false,
}: {
  poll: Poll;
  onVote?: (optionId: string) => void;
  /** Preview mode inside the composer — no voting, no totals line. */
  compact?: boolean;
}) {
  const total = totalVotes(poll);
  const voted = !!poll.votedId;
  const leader = poll.options.reduce(
    (best, o) => (o.votes > best.votes ? o : best),
    poll.options[0],
  );

  if (!voted && !compact && poll.chart === "bars") {
    return (
      <div className="flex flex-col gap-2">
        {poll.options.map((o) => (
          <button
            key={o.id}
            onClick={() => onVote?.(o.id)}
            className="w-full rounded-xl border border-accent/40 px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-accent-soft"
          >
            {o.text}
          </button>
        ))}
        <TotalLine total={total} />
      </div>
    );
  }

  if (poll.chart === "donut") {
    return <Donut poll={poll} total={total} onVote={onVote} compact={compact} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {poll.options.map((o, i) => {
        const pct = percent(o.votes, total);
        const isLeader = o.id === leader?.id && total > 0;
        const picked = o.id === poll.votedId;
        return (
          <button
            key={o.id}
            onClick={compact ? undefined : () => onVote?.(o.id)}
            disabled={compact}
            className="relative w-full overflow-hidden rounded-xl bg-surface-2 px-3 py-2.5 text-left transition disabled:cursor-default"
          >
            {/* Filled portion */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-xl transition-[width] duration-500 ease-out"
              style={{
                width: `${pct}%`,
                backgroundColor: SERIES[i % SERIES.length],
                opacity: isLeader ? 0.24 : 0.14,
              }}
            />
            <span className="relative flex items-center gap-2">
              <span
                className={cx(
                  "min-w-0 flex-1 truncate text-sm",
                  isLeader ? "font-semibold text-ink" : "text-ink",
                )}
              >
                {o.text}
              </span>
              {picked && <RiCheckLine className="size-4 shrink-0 text-accent" />}
              <span className="shrink-0 text-sm tabular-nums text-muted">{pct}%</span>
            </span>
          </button>
        );
      })}
      {!compact && <TotalLine total={total} />}
    </div>
  );
}

function Donut({
  poll,
  total,
  onVote,
  compact,
}: {
  poll: Poll;
  total: number;
  onVote?: (optionId: string) => void;
  compact: boolean;
}) {
  const size = 132;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = poll.options.map((o, i) => {
    const fraction = total === 0 ? 0 : o.votes / total;
    const arc = { o, i, fraction, dash: fraction * circumference, offset };
    offset += fraction * circumference;
    return arc;
  });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative mx-auto shrink-0 sm:mx-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth={stroke}
          />
          {arcs.map(({ o, i, dash, offset: start }) => (
            <circle
              key={o.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={SERIES[i % SERIES.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-start}
              className="transition-all duration-500 ease-out"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-ink">{total}</span>
          <span className="text-[11px] text-muted">votes</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {poll.options.map((o, i) => {
          const picked = o.id === poll.votedId;
          return (
            <button
              key={o.id}
              onClick={compact ? undefined : () => onVote?.(o.id)}
              disabled={compact}
              className={cx(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition disabled:cursor-default",
                !compact && "hover:bg-surface-2",
              )}
            >
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: SERIES[i % SERIES.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{o.text}</span>
              {picked && <RiCheckLine className="size-4 shrink-0 text-accent" />}
              <span className="shrink-0 text-sm tabular-nums text-muted">
                {percent(o.votes, total)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TotalLine({ total }: { total: number }) {
  return (
    <p className="text-xs text-faint">
      {total.toLocaleString()} {total === 1 ? "vote" : "votes"}
    </p>
  );
}
