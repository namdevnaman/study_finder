# StudyFinder Redesign — Page Brief (for subagents)

Context you must NOT touch:
- `src/App.tsx`, `src/main.tsx`, `src/context/*`, `src/services/*`, `src/lib/*`, `src/utils/*`, `src/components/layout/AppLayout.tsx`, `src/components/ui/*`, `src/components/shared/ListItem.tsx`, `src/components/shared/FilterChips.tsx`, `src/components/shared/GlobalSearch.tsx`
- Supabase/DB, auth, routes, API signatures.

You redesign ONE page file. Read it fully first, plus its service and types. Keep ALL existing data, queries, logic, handlers, auth checks. Change ONLY the presentation layer (JSX/classes/layout) — you may reorganize markup, add small local subcomponents, and add local state for UI-only concerns (e.g., active filter chip) but never data logic.

## Design language (Forest & Bone, academic, WhatsApp-informed)
- Semantic color classes ONLY: `bg-background`, `bg-surface`, `bg-surface-muted`, `bg-surface-strong`, `text-foreground`, `text-muted`, `text-muted/80`, `border-border`, `border-border-strong`, `bg-primary text-primary-soft-text`, `bg-primary-soft text-primary`, `decoration-accent`, `text-danger-fg`, `bg-danger-soft`.
- Dark mode is automatic via semantic tokens. NEVER hardcode white/black/gray hex.
- Compact lists, not giant cards. Row pattern: `[Avatar] Title | subtitle / meta | right (time/badge)`. Reuse `Avatar`, `Badge`, `EmptyState`, `Button`, `ListItem`/`UnreadBadge` (src/components/shared/ListItem.tsx), `FilterChips` (src/components/shared/FilterChips.tsx).
- Headings: page title `text-xl font-semibold`, section `text-sm font-medium uppercase tracking-wide text-muted`. No oversized titles.
- Cards only where containers are genuinely needed; prefer flat rows separated by `border-b border-border`.
- Mono labels for meta/time: `font-mono text-xs text-muted`.
- Empty states: small, contextual (title + one-liner + single action), not huge.
- Responsive: mobile list rows; on `sm`+ allow two-column grids where density allows, but DON'T invent a sidebar.
- No motion/react imports. No gradients. No em-dashes. No exclamation marks. Sentence case.
- Accessibility: aria-labels on icon-only controls, focus-visible handled globally.

## Whatsapp-style unread/context badges
- Use small `rounded-full bg-primary text-white` count bubbles (min-w-5 h-5, text-xs, px-1.5, `9+` cap).
- Timestamps: `font-mono text-[10px] text-muted`.

Output: the rewritten file only. Do NOT run build/lint; report what you changed in 3-5 lines.