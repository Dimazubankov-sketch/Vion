"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import { RiArrowDownSLine } from "@remixicon/react";
import * as Flags from "country-flag-icons/react/3x2";
import { getCountryDataList } from "countries-list";
import { cx } from "@/utils/cx";

type FlagComponent = ComponentType<{ title?: string; className?: string }>;
const FLAGS = Flags as unknown as Record<string, FlagComponent | undefined>;

export interface Country {
  iso2: string;
  name: string;
  dial: number;
}

/** Real ISO countries that ship a flag + a dial code, sorted by name. */
export const COUNTRIES: Country[] = getCountryDataList()
  .filter((c) => FLAGS[c.iso2] && c.phone.length > 0)
  .map((c) => ({ iso2: c.iso2, name: c.name, dial: c.phone[0] }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** A country flag as an SVG — Windows doesn't render flag emoji. */
export function Flag({ iso2, className }: { iso2: string; className?: string }) {
  const Component = FLAGS[iso2];
  if (!Component) return null;
  return <Component title={iso2} className={cx("h-3.5 w-5 shrink-0 rounded-[2px]", className)} />;
}

/** The country-code Select that sits in the input's leading addon slot. */
function CountryCodeSelect({
  iso2,
  onChange,
  isDisabled,
}: {
  iso2: string;
  onChange: (iso2: string) => void;
  isDisabled?: boolean;
}) {
  const dial = COUNTRIES.find((c) => c.iso2 === iso2)?.dial;

  return (
    <Select
      aria-label="Country code"
      selectedKey={iso2}
      onSelectionChange={(key) => onChange(String(key))}
      isDisabled={isDisabled}
    >
      <Button
        className={cx(
          "flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm text-ink outline-none transition",
          "hover:bg-surface-3 data-[focus-visible]:ring-2 data-[focus-visible]:ring-accent",
        )}
      >
        <Flag iso2={iso2} />
        <span className="tabular-nums">+{dial}</span>
        <RiArrowDownSLine className="size-4 text-faint" />
        <SelectValue className="hidden" />
      </Button>

      <Popover
        className={cx(
          "w-[260px] overflow-hidden rounded-xl border border-line bg-surface shadow-float",
          "entering:animate-fade-in",
        )}
      >
        <ListBox className="scroll-clean max-h-64 overflow-y-auto p-1 outline-none">
          {COUNTRIES.map((c) => (
            <ListBoxItem
              key={c.iso2}
              id={c.iso2}
              textValue={c.name}
              className={cx(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink outline-none",
                "data-[focused]:bg-surface-2 data-[selected]:bg-accent-soft data-[selected]:text-accent",
              )}
            >
              <Flag iso2={c.iso2} />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-faint tabular-nums">+{c.dial}</span>
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}

/**
 * Phone field: a country Select in the leading slot plus the national number.
 * `onChange` reports the full E.164-ish string, e.g. "+79991234567".
 */
export function PhoneInput({
  label,
  value,
  onChange,
  country = "RU",
  onCountryChange,
  placeholder = "(999) 000-0000",
  isDisabled,
  isInvalid = false,
  hint,
  className,
}: {
  label?: string;
  /** National digits only. */
  value: string;
  onChange: (national: string, full: string) => void;
  country?: string;
  onCountryChange?: (iso2: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  hint?: string;
  className?: string;
}) {
  const [internalCountry, setInternalCountry] = useState(country);
  const iso2 = onCountryChange ? country : internalCountry;
  const dial = useMemo(() => COUNTRIES.find((c) => c.iso2 === iso2)?.dial ?? 1, [iso2]);

  const setCountry = (next: string) => {
    if (onCountryChange) onCountryChange(next);
    else setInternalCountry(next);
    const nextDial = COUNTRIES.find((c) => c.iso2 === next)?.dial ?? 1;
    onChange(value, `+${nextDial}${value}`);
  };

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label className={cx("text-sm font-medium", isInvalid ? "text-danger" : "text-ink")}>
          {label}
        </label>
      )}
      <div
        className={cx(
          "flex h-11 items-center gap-1.5 rounded-xl border pl-2 pr-3.5 transition",
          isInvalid
            ? "border-danger bg-danger/5 ring-2 ring-danger/25"
            : "border-line bg-surface-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30",
          isDisabled && "opacity-60",
        )}
      >
        <CountryCodeSelect iso2={iso2} onChange={setCountry} isDisabled={isDisabled} />
        <span aria-hidden className="h-5 w-px bg-line" />
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          disabled={isDisabled}
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
            onChange(digits, `+${dial}${digits}`);
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>
      {hint && <p className={cx("text-xs", isInvalid ? "text-danger" : "text-faint")}>{hint}</p>}
    </div>
  );
}

const DIAL_CODES = new Set(COUNTRIES.map((c) => String(c.dial)));

/**
 * Pretty-print a stored E.164 number, e.g. "+79991234567" → "+7 9991234567".
 * Dial codes are 1–3 digits and not self-delimiting, so try the longest
 * prefix that is a real dial code rather than guessing a fixed width.
 */
export function formatPhone(full: string) {
  const digits = full.replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return full;

  for (let len = Math.min(3, digits.length - 1); len >= 1; len--) {
    const prefix = digits.slice(0, len);
    if (DIAL_CODES.has(prefix)) return `+${prefix} ${digits.slice(len)}`;
  }
  return full;
}
