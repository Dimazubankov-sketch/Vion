"use client";

import { useEffect, useState, type ReactNode } from "react";
import { RiErrorWarningLine } from "@remixicon/react";
import { cx } from "@/utils/cx";

export interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  /** Static text pinned to the right inside the field, e.g. an email domain. */
  suffix?: ReactNode;
  /** Static content pinned to the left inside the field. */
  leadingAddon?: ReactNode;
  onEnter?: () => void;
  className?: string;
}

/**
 * Text field with the four states from the BoardUI Input spec: default, filled,
 * disabled and invalid. Invalid repaints the field, hint and label, and shakes
 * once each time the error is (re)raised.
 */
export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  autoComplete,
  isInvalid = false,
  isDisabled = false,
  suffix,
  leadingAddon,
  onEnter,
  className,
}: InputProps) {
  // Re-run the shake whenever the field flips back into an invalid state.
  const [shakeKey, setShakeKey] = useState(0);
  useEffect(() => {
    if (isInvalid) setShakeKey((k) => k + 1);
  }, [isInvalid]);

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          className={cx(
            "text-sm font-medium",
            isInvalid ? "text-danger" : isDisabled ? "text-faint" : "text-ink",
          )}
        >
          {label}
        </label>
      )}

      <div
        key={shakeKey}
        className={cx(
          "flex h-11 items-center gap-2 rounded-xl border px-3.5 transition",
          isInvalid
            ? "border-danger bg-danger/5 ring-2 ring-danger/25"
            : "border-line bg-surface-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30",
          isDisabled && "cursor-not-allowed opacity-60",
          isInvalid && "animate-shake",
        )}
      >
        {leadingAddon}
        <input
          type={type}
          value={value}
          disabled={isDisabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={isInvalid || undefined}
          className={cx(
            "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint",
            isInvalid ? "text-danger" : "text-ink",
            isDisabled && "cursor-not-allowed",
          )}
        />
        {suffix && (
          <span className={cx("shrink-0 text-sm", isInvalid ? "text-danger/80" : "text-muted")}>
            {suffix}
          </span>
        )}
        {isInvalid && <RiErrorWarningLine className="size-5 shrink-0 text-danger" />}
      </div>

      {hint && (
        <p className={cx("text-xs", isInvalid ? "text-danger" : "text-faint")}>{hint}</p>
      )}
    </div>
  );
}
