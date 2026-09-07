"use client";

import { motion } from "motion/react";
import { VionMark } from "@/components/logo";
import { cx } from "@/utils/cx";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  /** Show the Vion mark in the middle of the rings. */
  showMark?: boolean;
}

const sizeConfig = {
  sm: {
    container: "size-20",
    titleClass: "text-sm/tight font-medium",
    subtitleClass: "text-xs/relaxed",
    spacing: "space-y-2",
    maxWidth: "max-w-48",
    mark: "size-7",
  },
  md: {
    container: "size-32",
    titleClass: "text-base/snug font-medium",
    subtitleClass: "text-sm/relaxed",
    spacing: "space-y-3",
    maxWidth: "max-w-56",
    mark: "size-11",
  },
  lg: {
    container: "size-40",
    titleClass: "text-lg/tight font-semibold",
    subtitleClass: "text-base/relaxed",
    spacing: "space-y-4",
    maxWidth: "max-w-64",
    mark: "size-14",
  },
};

/** One rotating conic ring, masked to a thin band. */
function Ring({
  from,
  gradient,
  maskInner,
  maskOuter,
  opacity,
  duration,
  reverse = false,
  ease = "linear",
  darkOnly = false,
}: {
  from: number;
  gradient: string;
  maskInner: number;
  maskOuter: number;
  opacity: number;
  duration: number;
  reverse?: boolean;
  ease?: "linear" | number[];
  darkOnly?: boolean;
}) {
  const mask = `radial-gradient(circle at 50% 50%, transparent ${maskInner}%, black ${
    maskInner + 2
  }%, black ${maskOuter}%, transparent ${maskOuter + 2}%)`;

  return (
    <motion.div
      animate={{ rotate: reverse ? [0, -360] : [0, 360] }}
      className={cx("absolute inset-0 rounded-full", darkOnly && "hidden dark:block")}
      style={{
        background: `conic-gradient(from ${from}deg, ${gradient})`,
        mask,
        WebkitMask: mask,
        opacity,
      }}
      transition={{
        duration,
        repeat: Number.POSITIVE_INFINITY,
        ease: ease as never,
      }}
    />
  );
}

export default function Loader({
  title = "Configuring your account...",
  subtitle = "Please wait while we prepare everything for you",
  size = "md",
  showMark = true,
  className,
  ...props
}: LoaderProps) {
  const config = sizeConfig[size];
  const soft: number[] = [0.4, 0, 0.6, 1];

  const light = "rgb(108, 92, 255)";
  const dark = "rgb(160, 148, 255)";

  return (
    <div
      className={cx("flex flex-col items-center justify-center gap-8 p-8", className)}
      {...props}
    >
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        className={cx("relative", config.container)}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: soft as never }}
      >
        {/* Light-theme rings */}
        <Ring
          from={0}
          gradient={`transparent 0deg, ${light} 90deg, transparent 180deg`}
          maskInner={35}
          maskOuter={39}
          opacity={0.8}
          duration={3}
        />
        <Ring
          from={0}
          gradient={`transparent 0deg, ${light} 120deg, rgba(108, 92, 255, 0.5) 240deg, transparent 360deg`}
          maskInner={42}
          maskOuter={48}
          opacity={0.9}
          duration={2.5}
          ease={soft}
        />
        <Ring
          from={180}
          gradient={`transparent 0deg, rgba(108, 92, 255, 0.6) 45deg, transparent 90deg`}
          maskInner={52}
          maskOuter={56}
          opacity={0.35}
          duration={4}
          reverse
          ease={soft}
        />
        <Ring
          from={270}
          gradient={`transparent 0deg, rgba(108, 92, 255, 0.4) 20deg, transparent 40deg`}
          maskInner={61}
          maskOuter={63}
          opacity={0.5}
          duration={3.5}
        />

        {/* Dark-theme variants */}
        <Ring
          darkOnly
          from={0}
          gradient={`transparent 0deg, ${dark} 90deg, transparent 180deg`}
          maskInner={35}
          maskOuter={39}
          opacity={0.8}
          duration={3}
        />
        <Ring
          darkOnly
          from={0}
          gradient={`transparent 0deg, ${dark} 120deg, rgba(160, 148, 255, 0.5) 240deg, transparent 360deg`}
          maskInner={42}
          maskOuter={48}
          opacity={0.9}
          duration={2.5}
          ease={soft}
        />
        <Ring
          darkOnly
          from={180}
          gradient={`transparent 0deg, rgba(160, 148, 255, 0.6) 45deg, transparent 90deg`}
          maskInner={52}
          maskOuter={56}
          opacity={0.35}
          duration={4}
          reverse
          ease={soft}
        />
        <Ring
          darkOnly
          from={270}
          gradient={`transparent 0deg, rgba(160, 148, 255, 0.4) 20deg, transparent 40deg`}
          maskInner={61}
          maskOuter={63}
          opacity={0.5}
          duration={3.5}
        />

        {/* Brand mark, breathing in the empty middle */}
        {showMark && (
          <motion.div
            animate={{ opacity: [0.95, 0.6, 0.95], scale: [1, 0.96, 1] }}
            className="absolute inset-0 flex items-center justify-center"
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: soft as never }}
          >
            <VionMark className={config.mark} />
          </motion.div>
        )}
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cx("text-center", config.spacing, config.maxWidth)}
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.4, duration: 1, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className={cx(
            config.titleClass,
            "font-medium leading-[1.15] tracking-[-0.02em] text-ink antialiased",
          )}
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.span
            animate={{ opacity: [0.9, 0.7, 0.9] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: soft as never }}
          >
            {title}
          </motion.span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className={cx(
            config.subtitleClass,
            "font-normal leading-[1.45] tracking-[-0.01em] text-muted antialiased",
          )}
          initial={{ opacity: 0, y: 8 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.span
            animate={{ opacity: [0.85, 0.55, 0.85] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: soft as never }}
          >
            {subtitle}
          </motion.span>
        </motion.p>
      </motion.div>
    </div>
  );
}
