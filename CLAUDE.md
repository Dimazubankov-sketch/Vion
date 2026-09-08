# Voyzen — project notes for Claude

Messenger app styled like X (Twitter) + Telegram. Light-grey UI, Voyzen violet accent.

- Stack: Next.js 16 (App Router) + TS + Tailwind v4 (CSS-first `@theme` in `globals.css`,
  no `tailwind.config`) + `react-aria-components` + `@remixicon/react`.
- Dev server runs on port 3210 (`.claude/launch.json`).
- Design tokens live in `src/app/globals.css` (`--canvas`, `--surface`, `--ink`,
  `--muted`, `--accent`, …). Dark theme swaps them under `.dark`. Prefer these
  utilities (`bg-surface`, `text-ink`, `bg-accent`) over hard-coded colors.
- Auth, theme and settings are client contexts persisted to `localStorage`; no backend.
  Shared app state (posts, chats, liked history) lives in `src/lib/app-store.tsx`.
- UI strings go through `useT()` from `settings-context`; add new keys to the
  English dict in `src/lib/i18n.ts` first — other languages fall back to it.
- Layout is chosen in JS, not by `lg:` classes: `useIsDesktop()` from
  settings-context is true only when the viewport is wide AND the "Mobile view"
  switch is off. Branch on it instead of adding Tailwind breakpoints.
- Accounts live on the @voidops.ru domain in `src/lib/accounts.ts` (localStorage,
  SHA-256 password digest, no backend).
- The demo SMS verification code is `123456`.
- BoardUI Pro components are NOT installed (paid license + heavy internal deps);
  the equivalent UI is hand-built in the same style. Don't run `boardui add`.
- Data is mocked in `src/lib/mock-data.ts`. Avatars/photos come from pravatar/picsum.
