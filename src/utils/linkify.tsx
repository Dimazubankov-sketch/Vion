import { Fragment, type ReactNode } from "react";

// URLs (with or without protocol) and phone numbers. Kept deliberately simple.
const URL_RE = /((?:https?:\/\/|www\.)[^\s]+)/gi;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;

interface Part {
  type: "text" | "url" | "phone";
  value: string;
}

/** Split a string into plain, url and phone segments. */
function tokenize(text: string): Part[] {
  const parts: Part[] = [];
  let rest = text;

  // First pass: pull out URLs, then scan the gaps for phone numbers.
  let lastIndex = 0;
  const withUrls: Part[] = [];
  for (const match of rest.matchAll(URL_RE)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) withUrls.push({ type: "text", value: rest.slice(lastIndex, idx) });
    withUrls.push({ type: "url", value: match[0] });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < rest.length) withUrls.push({ type: "text", value: rest.slice(lastIndex) });

  for (const part of withUrls) {
    if (part.type !== "text") {
      parts.push(part);
      continue;
    }
    let li = 0;
    for (const match of part.value.matchAll(PHONE_RE)) {
      const idx = match.index ?? 0;
      // A phone-like run needs enough digits to be a real number.
      const digits = match[0].replace(/\D/g, "");
      if (digits.length < 7) continue;
      if (idx > li) parts.push({ type: "text", value: part.value.slice(li, idx) });
      parts.push({ type: "phone", value: match[0] });
      li = idx + match[0].length;
    }
    if (li < part.value.length) parts.push({ type: "text", value: part.value.slice(li) });
  }

  return parts;
}

/**
 * Render text with clickable links and phone numbers. Real anchors give the
 * browser its own long-press / right-click menus (open, copy, call, add
 * contact), which is exactly the OS behaviour we want.
 */
export function linkify(text: string, mine: boolean): ReactNode {
  const parts = tokenize(text);
  if (parts.every((p) => p.type === "text")) return text;

  const linkClass = mine ? "underline decoration-white/60 underline-offset-2" : "text-accent underline underline-offset-2";

  return parts.map((p, i) => {
    if (p.type === "url") {
      const href = p.value.startsWith("http") ? p.value : `https://${p.value}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={linkClass}
        >
          {p.value}
        </a>
      );
    }
    if (p.type === "phone") {
      return (
        <a
          key={i}
          href={`tel:${p.value.replace(/[^\d+]/g, "")}`}
          onClick={(e) => e.stopPropagation()}
          className={linkClass}
        >
          {p.value}
        </a>
      );
    }
    return <Fragment key={i}>{p.value}</Fragment>;
  });
}
