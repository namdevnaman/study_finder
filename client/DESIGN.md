# Study Finder — UI Redesign Contract (v2 "Forest & Bone")

This is the binding design brief for restyling the app. Everything visual ships from these rules.
Architecture, logic, data, routes, RLS, component props, and exported APIs are OFF LIMITS. Restyle markup only.

## 1. Identity

Warm editorial campus product. Calm, craftful, confident. One accent family (forest green), amber reserved for tiny semantic highlights (attended, streaks, "new", likes). No purple. No cool-gray overlap.

## 2. Tokens (Tailwind utility classes — use these, never raw hex)

| Purpose | Classes |
|---|---|
| Page background | `bg-background` (bone-50) |
| Card surface | `bg-surface`, text above it `text-foreground` |
| Muted surface / hovers | `bg-surface-muted`, `bg-surface-strong` |
| Borders | `border-border`, stronger `border-border-strong`, hover `hover:border-forest-200` |
| Ink text | `text-foreground` (`#1c241f`), secondary `text-muted`, tertiary `text-muted-fg` |
| Primary (forest) fills | `bg-primary`, `bg-primary-hover`, `bg-primary-active`, `text-primary`, `text-on-primary` |
| Primary soft | `bg-primary-soft`, `text-primary-soft-text` |
| Accent (amber, sparing) | `bg-accent`, `bg-accent-soft`, `text-accent`, `text-amber-700` |
| Danger | `bg-danger`, `bg-danger-soft`, `text-danger-fg`, `hover:bg-danger-600` |
| On dark forest panels | `bg-forest-900/800`, text `text-bone-50`, `text-bone-50/80`, `text-bone-50/60` |

**Deprecated → new** (must fix everywhere you see them):
`bg-brand-*`/`text-brand-*`/`border-brand-*` → forest/primary equivalents
`bg-grow-50/grow-500/grow-600` → `bg-accent-soft` / `bg-accent` / `bg-forest-600`
`bg-coral-500/600`, `text-coral-600` → `text-amber-700` / danger soft for destructive
`bg-ink-700` → `bg-ink-800` is fine; `bg-ink-900` only for overlays (`bg-ink-900/50` scrim)
`bg-paper` → `bg-background`

## 3. Type

- Family is `Outfit` (auto via `--font-display`/`--font-body`). Use `font-display` explicitly for headings if needed.
- `font-mono` (JetBrains Mono) for: meta labels, dates/times, counts, small caps. Tablet pattern: `font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-muted`.
- Mono text must use `tabular-nums` behaviour (automatic with `font-mono`).
- Headings: tight `tracking-tight`, generous size (`text-2xl` page titles, `text-lg` card titles), semibold, sentence case.
- Body: `text-sm`/`text-[15px]` `leading-relaxed` `text-muted`, max `max-w-prose`/`max-w-md`.
- Copy: sentence case everywhere. No exclamation marks anywhere in UI copy. No em-dashes (" — "); use commas or parentheses. No AI clichés ("Elevate", "Seamless", "Unleash"). Plain specific language.

## 4. Shape

- Containers/cards: `rounded-xl` (20px). Interactive (buttons, inputs, icon chips): `rounded-lg` (10px). Chips/badges/avatars: `rounded-full`.
- Do not add arbitrary rounded values. A 44px icon chip is `rounded-lg`, not `rounded-xl`.
- Elevation: rely on `shadow-card`, `shadow-card-hover`, `shadow-dialog` tokens only. Never inline black shadows.
- No gradients. No neon glows. A subtle `bg-gradient-to-t from-forest-950/80` overlay is allowed only on top of photos.

## 5. Components (use the existing primitives, do not reimplement)

- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-accent`, `.btn-danger`, sizes `.btn-sm/md/lg`. Use the `<Button variant size>` component, not raw classes, in React files.
- Badges: `<Badge variant>` (`primary | accent | neutral | danger | outline`).
- Cards: `.card` (+ `.card-hover`), or `<Card>`/`<CardHeader>`/`<CardBody>`/`<CardFooter>`/`<CardTitle>`/`<SectionHeading>`.
- Inputs: styles live in CSS (`.input`, `.label`, `.hint`, `.field-error`) — reuse as-is.
- Empty states: `<EmptyState>` (dashed `border-border-strong` panel). Loading: `<PageSpinner>`/`<Skeleton>`.
- Toasts/modals: existing `Toast` + `Modal` — no changes.
- Icons: `lucide-react` stays (project dependency). Keep consistent `h-4`/`h-5` sizing, strokeWidth default. No new icon libs.

## 6. Layout & spacing

- 4/8px rhythm. Section paddings `p-4/p-6` etc. App content max-width stays `max-w-5xl`.
- Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280`. Keep existing responsive structure.
- Cards in a row: keep feature lists / actions bottom-aligned and consistent vertical rhythm across siblings.
- Keep existing DOM order and semantic tags (`<nav>`, `<main>`, `<section>`, `<li>`).

## 7. Motion

- CSS transitions are fine (`transition-colors/transform duration-150`, ease token is in CSS). Prefer `transform`/`opacity`.
- Do NOT add `motion/react` to app pages. Landing already owns all motion.
- Cards hover: keep `card-hover` lift. Buttons already have press states via `.btn-*` CSS.
- No `window.addEventListener('scroll')`, no custom scroll-driven JS.

## 8. Non-negotiables

- Change class strings, tone, spacing, copy polish ONLY. Never touch: state logic, fetch calls, RLS, routes, props, exports, TS types, key names.
- Preserve all imports you don't remove; remove unused ones (oxlint `no-unused-vars` is errors).
- Do not introduce new dependencies.
- After editing, run from `/Volumes/Kura/workshop /client`: `npx tsc -b` then `npm run lint`; both must pass (0 errors; pre-existing 13 React Compiler warnings are fine to remain).
- Report back: files changed + any token you thought was missing.