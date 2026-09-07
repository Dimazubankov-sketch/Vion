"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/utils/cx";

export interface InputOtpProps {
  /** How many boxes. Defaults to 6. */
  length?: number;
  /** Insert a gap after every N boxes, e.g. 3 renders "000 000". */
  groupEvery?: number;
  /** Controlled value. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Fires once the last box is filled. */
  onComplete?: (value: string) => void;
  isInvalid?: boolean;
  isDisabled?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
  className?: string;
}

/**
 * One-time-code field: a row of single-character boxes backed by real inputs,
 * with arrow-key navigation, backspace that steps back, and paste support.
 */
export function InputOtp({
  length = 6,
  groupEvery,
  value: valueProp,
  defaultValue = "",
  onChange,
  onComplete,
  isInvalid = false,
  isDisabled = false,
  autoFocus = true,
  className,
  ...rest
}: InputOtpProps) {
  const [internal, setInternal] = useState(defaultValue.slice(0, length));
  const value = (valueProp ?? internal).slice(0, length);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const completed = useRef(false);

  useEffect(() => {
    if (autoFocus && !isDisabled) refs.current[0]?.focus();
  }, [autoFocus, isDisabled]);

  const commit = (next: string) => {
    const clipped = next.slice(0, length);
    if (valueProp === undefined) setInternal(clipped);
    onChange?.(clipped);

    if (clipped.length === length && !completed.current) {
      completed.current = true;
      onComplete?.(clipped);
    }
    if (clipped.length < length) completed.current = false;
  };

  const focusAt = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;

    // The value is always a gap-free prefix, so a click past the end writes at
    // the end rather than leaving a hole. Pasting fills forward from `at`.
    const at = Math.min(index, value.length);
    const chars = value.split("");
    for (let i = 0; i < digits.length && at + i < length; i++) {
      chars[at + i] = digits[i];
    }
    commit(chars.join("").slice(0, length));
    focusAt(at + digits.length);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      // Truncate rather than splice, so digits never shift left under the caret.
      if (value[index]) {
        commit(value.slice(0, index));
      } else if (index > 0) {
        commit(value.slice(0, index - 1));
        focusAt(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  return (
    <div
      role="group"
      aria-label={rest["aria-label"]}
      aria-invalid={isInvalid || undefined}
      className={cx("flex items-center gap-2", className)}
    >
      {Array.from({ length }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={length}
            disabled={isDisabled}
            value={value[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            aria-label={`${rest["aria-label"] ?? "Code"} ${i + 1}`}
            className={cx(
              "size-12 rounded-xl border bg-surface-2 text-center text-lg font-semibold text-ink outline-none transition",
              "focus:border-accent focus:ring-2 focus:ring-accent/30",
              isInvalid ? "border-danger text-danger" : "border-line",
              isDisabled && "cursor-not-allowed opacity-50",
            )}
          />
          {groupEvery && (i + 1) % groupEvery === 0 && i !== length - 1 && (
            <span aria-hidden className="mx-0.5 h-px w-2 bg-line" />
          )}
        </div>
      ))}
    </div>
  );
}
