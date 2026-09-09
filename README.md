# StudyFinder — Campus Study Group Platform

A full-stack social study platform for college campuses: students discover and create study groups by subject/topic, run threaded discussions, chat in real time, share resources, get a peer-study assistant, and stay in sync through notifications — all behind a curated, WhatsApp-informed design system ("Forest & Bone").

**Live environment:** Supabase (Postgres + auth + storage + Edge Functions) for the backend, React + Vite for the frontend.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Design system](#design-system)
- [Database & schema](#database--schema)
- [Getting started](#getting-started)
  - [1. Frontend](#1-frontend)
  - [2. Supabase](#2-supabase)
- [Edge Functions](#edge-functions)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Known issues & notes](#known-issues--notes)
- [Security & RLS](#security--rls)

---

## Features

**Auth & profile**
- Email/password sign-up, login, forgot/reset password (Supabase Auth).
- Profile with full name, avatar (Supabase Storage), college name, quick stats (groups, sessions, doubts resolved).

**Study groups**
- Browse and filter groups by department, subject, and topic (chips + pickers).
- Create a group with title, description, subject/topic, session date/time, max participants, Google Meet link, and privacy (`public` / `approval_required` / `private`).
- Join groups (direct, or request + approve when `approval_required`), leave, edit, delete. Group detail shows members, meet link, and related posts.

**Discussions (Q&A)**
- Create posts typed by category (doubt, discussion, resource, announcement…), tagged with subject/topic.
- Comments with pin/unpin (creators only), like posts, bookmark posts, report posts/comments for moderation.

**Resources**
- Upload and browse study resources (PDF, notes) tied to subjects, with category filters.

**Chat**
- One-to-one and group chat conversations (Supabase Realtime), unread badges, member presence/typing in group chats.

**Study assistant**
- Chat UI backed by a Supabase Edge Function (`study-assistant`) that answers study-strategy questions via the Anthropic API, with a built-in offline fallback when no API key is configured.

**Notifications**
- Real-time notifications (group joins, new members, mentions, comments) with an unread badge in the nav and read-state persistence.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + TypeScript, Vite, React Router |
| Styling | Tailwind CSS v4 (semantic tokens, automatic dark mode) |
| Icons | lucide-react |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| AI | Anthropic SDK (inside the `study-assistant` Edge Function) |
| Lint | Oxlint (`oxlint`) |
| SQL migrations | Supabase CLI (`supabase db push`) |

---

## Repository layout

```
.
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx             # Route table (public, /app)
│   │   ├── components/
│   │   │   ├── layout/         # AppLayout (sidebar nav, notifications)
│   │   │   ├── shared/         # ListItem, FilterChips, SubjectTopicPicker, GlobalSearch
│   │   │   └── ui/             # Button, Badge, Avatar, Field/Input/Textarea/Select,
│   │   │                       #   Modal, EmptyState, Spinner, Toast, Card
│   │   ├── context/            # AuthContext, theme context
│   │   ├── lib/                # Types shared across the app
│   │   ├── pages/
│   │   │   ├── public/         # Landing, Login, Signup, forgotten/reset password
│   │   │   └── app/            # Dashboard, Groups, GroupDetail, CreateGroup,
│   │   │                       #   Discussions, PostDetail, Resources,
│   │   │                       #   StudyAssistant, ChatHub, Notifications, Profile
│   │   ├── services/           # Supabase data-layer (one file per domain)
│   │   ├── utils/              # formatDate/timeAgo helpers
│   │   └── styles/             # Tailwind entry + design tokens
│   └── pubilc/                 # favicon, icons.svg sprite
└── supabase/
    ├── config.toml             # Supabase project config
    ├── migrations/             # 0001 … 0014, ordered SQL migrations
    └── functions/
        ├── _shared/cors.ts
        └── study-assistant/    # Edge Function (Anthropic + offline fallback)
```

Routes (`client/src/App.tsx`): `/` (landing), `/login`, `/signup`, `/forgot-password`; authenticated under `/app`: `profile`, `groups`, `groups/new`, `groups/:id`, `discussions`, `posts/:id`, `resources`, `notifications`, `chat`, `chat/:conversationId`, `assistant`.

---

## Design system

"Forest & Bone" — compact, academic, WhatsApp-informed:

- **Semantic color tokens only.** No raw hex/white/black in components: `bg-background`, `bg-surface`, `bg-surface-muted`, `bg-surface-strong`, `bg-primary`, `bg-primary-soft`, `text-foreground`, `text-muted`, `border-border`, `border-border-strong`, `text-danger-fg`, `bg-danger-soft`. Dark mode is automatic via the tokens.
- **Compact rows over giant cards.** List rows follow `[Avatar] Title · subtitle/meta · right (time/badge)`.
- **Headings.** Page title `text-xl font-semibold`; section headers `text-sm font-medium uppercase tracking-wide text-muted`.
- **Meta/time** use monospace micro-labels: `font-mono text-xs` / `text-[10px] text-muted`.
- **Unread badges** are small `rounded-full bg-primary text-white` counts (`9+` cap) — WhatsApp style.
- Empty states are small and contextual (title + one-liner + single action).

See `client/DESIGN.md` and `client/DESIGN-BRIEF.md` for the full rationale and per-page guidance.

---

## Database & schema

The whole schema lives as versioned SQL migrations in `supabase/migrations/`:

| Migration | Purpose |
| --- | --- |
| `0001` | Initial schema: profiles, departments, subjects, topics, study groups, posts, comments, chat, notifications, resources |
| `0002` | Row-level security (RLS) policies for the core tables |
| `0003` | Seed academics: departments, subjects, topics |
| `0004` | Notifications + storage buckets |
| `0005` | Profile college-name field |
| `0006` | Engagement & safety: likes, bookmarks, reports |
| `0007` | Notification preferences |
| `0008` | Join-path hardening |
| `0009` | Chat: conversations, messages, members with presence |
| `0010` | Extra academics (additional departments/subjects/topics) |
| `0011` | Seed demo users, groups, posts, comments, resources |
| `0012` | Fix RLS recursion in `can_view_study_group(id, uuid)` |
| `0013` | Make all demo groups `public` |
| `0014` | `create_study_group` SECURITY DEFINER RPC |

**Postgres roles:** `anon` (public pages & login), `authenticated` (signed-in users), with RLS policies per table. A column-level README for each table's policies is in the migration files.

---

## Getting started

### 1. Frontend

```bash
cd client
npm install
cp .env.example .env    # then fill in the two vars below
npm run dev             # http://localhost:5173
```

`.env` (never committed):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-publishable-anon-key>
```

**Typecheck / lint / build:**

```bash
npx tsc -b        # typecheck
npm run lint      # oxlint
npm run build     # tsc -b && vite build (outputs client/dist)
```

### 2. Supabase

Install the Supabase CLI, then link and apply migrations to your project:

```bash
npm install -g supabase
cd supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push        # applies 0001 … 0014 in order
```

Then deploy the study-assistant Edge Function (optional but recommended):

```bash
supabase functions deploy study-assistant
```

The function requires an `ANTHROPIC_API_KEY` secret for live AI answers; without it, it falls back to a bundled offline reply set:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Auth providers and the email allow-list must be configured in the Supabase dashboard → **Authentication**.

---

## Edge Functions

### `study-assistant`
A peer-tutor chat endpoint. `POST /functions/v1/study-assistant` with a message history; system prompt constrains it to study strategy (concise, warm, <160 words, no markdown headers). Uses the Anthropic SDK and includes a hard-coded offline fallback so the feature works before any API key is set.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build locally |
| `supabase db push` | Apply SQL migrations to the linked project |
| `supabase functions deploy study-assistant` | Deploy the assistant Edge Function |

---

## Deployment

**Vercel (recommended for the frontend):**

1. Import the repo from GitHub.
2. **Root Directory:** `client`
3. Build command: `npm run build` — Output directory: `dist`
4. Add environment variables (same as `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. (Optional) per-branch deployments via the Vercel GitHub integration.

**Supabase** is already deployed — migrations are applied on the linked project; the assistant function is deployed as documented above.

---

## Known issues & notes

- **RLS 42501 on the transaction pooler:** a direct `INSERT` into `study_groups` fails with *"new row violates row-level security policy"* on PostgREST/transaction-pooler connections even when `creator_id = auth.uid()` is true (the same query succeeds on the session pooler). The app sidesteps this by creating groups through the `create_study_group` SECURITY DEFINER RPC (migration `0014`) — the same pattern the join path already used. Keep write paths that must be bulletproof behind SECURITY DEFINER RPCs.
- The transaction pooler can also silently drop `SET LOCAL` variables; prefer SECURITY DEFINER functions that read `auth.uid()` directly from `request.jwt.claims`.
- Realtime channels suffix every listener with a unique id so two tabs never collide on one channel.
- `comment_count` on posts is normalized before rendering in `services/posts.ts`.

---

## Security & RLS

- `anon` is limited to public read (subjects/topics, public groups, public posts) and auth endpoints.
- `authenticated` reads/writes are scoped per-table by RLS policies (owner-only updates/deletes, membership-gated reads via `can_view_study_group(id, uuid)`, comment posting only inside groups, etc.).
- All secrets (`VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`) are environment variables — never hardcoded or committed (see `.gitignore`).
- Reports from `anon`/`authenticated` are insert-only; moderation tooling is server-side.