# Vion — project notes for Claude

Messenger app styled like X (Twitter) + Telegram. Light-grey UI, Vion violet accent.

- Stack: Next.js 16 (App Router) + TS + Tailwind v4 (CSS-first `@theme` in `globals.css`,
  no `tailwind.config`) + `react-aria-components` + `@remixicon/react`.
- Dev server runs on port 3210 (`.claude/launch.json`).
- Design tokens live in `src/app/globals.css` (`--canvas`, `--surface`, `--ink`,
  `--muted`, `--accent`, …). Dark theme swaps them under `.dark`. Prefer these
  utilities (`bg-surface`, `text-ink`, `bg-accent`) over hard-coded colors.
- Auth + theme are client contexts persisted to `localStorage`; no backend.
- BoardUI Pro components are NOT installed (paid license + heavy internal deps);
  the equivalent UI is hand-built in the same style. Don't run `boardui add`.
- Data is mocked in `src/lib/mock-data.ts`. Avatars/photos come from pravatar/picsum.
