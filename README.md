# Noteflow

A modern note-taking app — glassmorphism UI, gradient accents, and dark mode —
built with React, TypeScript and Vite, with a Supabase backend (Postgres + Auth).

## Features

- ✍️ Create, edit, pin and delete notes with **debounced autosave**
- 🔍 Instant client-side search across titles and content
- 🔐 Email/password + Google / GitHub OAuth sign-in — each user sees only their own notes (RLS)
- 👤 Profile & account management (display name, avatar, email, password)
- 🌗 Light / dark theme with system detection, persisted to `localStorage`
- ⌨️ Keyboard shortcuts: `Ctrl/⌘+N` new note, `Ctrl/⌘+K` focus search
- 📱 Responsive two-pane layout (list ⇄ editor on mobile)

## Tech Stack

| Area             | Technology                       |
| ---------------- | -------------------------------- |
| Framework        | React 19                         |
| Language         | TypeScript 6                     |
| Build tool       | Vite 8                           |
| Styling          | Tailwind CSS 4                   |
| UI components    | shadcn/ui (Radix)                |
| State management | Zustand 5                        |
| Backend          | Supabase (Postgres + Auth + RLS) |
| Notifications    | Sonner                           |
| Linting          | ESLint 10                        |
| Formatting       | Prettier                         |
| Git hooks        | Husky + lint-staged              |

## Requirements

- **Node.js** `>= 20.19` (Node 22 LTS recommended — required by Vite 8)
- **npm** `>= 10` (bundled with Node)
- **Git** (required for the Husky pre-commit hooks)
- A **Supabase** project (free tier is fine)

## Installation

```bash
# 1. Install dependencies (also sets up Husky Git hooks via the "prepare" script)
npm install

# 2. Configure Supabase (see the section below)
cp .env.example .env.local   # then fill in the real values

# 3. Start the development server
npm run dev
```

The app will be available at the URL printed by Vite (default: `http://localhost:5174`).

## Supabase backend

Notes are stored per-user in Supabase, protected by Row Level Security so the app
only ever reads or writes notes belonging to the signed-in user.

### 1. Create a project & env vars

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
3. Put them in `.env.local` (never committed — ignored via `*.local`):

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
   ```

Restart `npm run dev` after editing env vars (Vite only reads them at startup).

### 2. Run the migration

Open the **SQL Editor** in the Supabase dashboard and run
[`supabase/migrations/0001_init_notes.sql`](supabase/migrations/0001_init_notes.sql).
It creates the `notes` table, an `updated_at` trigger, and RLS policies so each
user can only access their own rows.

### 3. Auth

Email/password sign-up is used. For local testing you can disable
**Confirm email** under **Authentication → Providers → Email** so new accounts can
sign in immediately; otherwise users must confirm via the emailed link first.

Optional **Google / GitHub OAuth** is also wired up. Enable the providers under
**Authentication → Providers** and set the callback / redirect URLs — see
[DEPLOY.md § 2.1](DEPLOY.md#21-đăng-nhập-oauth-google--github--nếu-dùng) for the
exact steps. Without enabling them, the OAuth buttons will error.

## Available Scripts

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR             |
| `npm run build`   | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally           |
| `npm run lint`    | Run ESLint across the project                  |

## Project Structure

```
my-note/
├── supabase/
│   └── migrations/           # SQL schema (notes table + RLS + triggers)
├── src/
│   ├── components/
│   │   ├── common/           # App components: Sidebar, Editor, NoteListItem,
│   │   │                     #   EmptyState, UserMenu, UserDialogs
│   │   └── ui/               # shadcn/ui primitives (button, dialog, ...)
│   ├── hooks/                # Custom hooks (useTheme)
│   ├── layouts/              # AppLayout (two-pane shell)
│   ├── lib/                  # utils (cn helper)
│   ├── pages/                # Route-level views (Login)
│   ├── services/             # Supabase client + notes CRUD
│   ├── store/                # Zustand stores (auth, notes)
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Utility functions (timeAgo)
│   ├── App.tsx               # Root: auth gate + toaster
│   ├── main.tsx              # App entry point
│   ├── index.css             # Tailwind theme + global styles
│   └── vite-env.d.ts         # Typed import.meta.env
├── index.html                # HTML entry point
└── vite.config.ts            # Vite configuration
```

Key modules:

- `src/services/supabase.ts` — Supabase client
- `src/services/notes.ts` — notes CRUD (row ↔ `Note` mapping)
- `src/store/auth.ts` — session/auth state + profile updates
- `src/store/notes.ts` — notes state with debounced autosave

## Path Alias

Imports can use the `@/` alias, which maps to the `src/` directory:

```ts
import { Button } from '@/components/ui/button'
import { useNotes } from '@/store/notes'
```

> The alias is configured in **two** places that must stay in sync:
> `vite.config.ts` (`resolve.alias`) and `tsconfig.app.json` (`compilerOptions.paths`).

## State management

Global/shared state lives in **Zustand** stores under `src/store/`. React Context
is intentionally not used as a global-state mechanism.

## Code Quality

A Husky **pre-commit** hook runs `lint-staged` on staged files:

- `*.{js,jsx,ts,tsx}` → `eslint --fix` then `prettier --write`
- `*.json`, `*.{css,scss,sass,less}` → `prettier --write`

Commits that fail linting are blocked until the issues are resolved.

> **WSL note:** this project lives on the Linux filesystem. Make sure `node`/`npm`
> resolve to the **Linux** binaries (not the Windows ones under `/mnt/c`), otherwise
> `node_modules` and the Husky hooks break. See `CLAUDE.md` for details.
