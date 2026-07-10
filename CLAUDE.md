# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server with HMR (http://localhost:5174)
npm run build    # Type-check (tsc -b) then production build (vite build)
npm run lint     # Run ESLint across the project
npm run preview  # Preview the production build locally
```

There is **no test runner configured** — no Vitest/Jest, no `test` script. Do not
assume tests exist; add the tooling first if tests are requested.

## Environment (WSL) — read before running npm

This project lives on a Linux filesystem under WSL. `node` and `npm` MUST resolve to
the **Linux** binaries, not the Windows executables exposed via `/mnt/c`. The default
login shell here resolves `npm` to Windows npm, which corrupts `node_modules` (EPERM /
EISDIR on symlinks) and makes Husky hooks fail with "UNC paths are not supported".

Before any npm/git-hook command, put the nvm Node on PATH:

```bash
export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"
```

(`nvm` itself does not auto-load in the login shell.) Verify with `which node && which npm`.
Commits must be made from a shell where Linux Node is on PATH, otherwise the pre-commit
hook cannot run.

## Architecture

Single-page **admin dashboard** for the Ekiten AI FAQ system. React 19 + TypeScript 6 +
Vite 8. The codebase is early-stage scaffolding: most `src/*` directories are empty
(kept in git via `.gitkeep`) and represent the intended layer-based layout
(`pages`, `components/{common,ui}`, `hooks`, `services`, `store`, `theme`, `router`,
`layouts`, `types`, `enums`, `constants`, `utils`).

Key decisions already made:

- **State management: Zustand only.** A `contexts/` directory was deliberately removed —
  do not reintroduce React Context as a global-state mechanism. Global/shared state goes
  in `src/store/` as Zustand stores.

## Path alias

`@/` maps to `src/`. Configured in **two** places that must stay in sync:

- [vite.config.ts](vite.config.ts) — `resolve.alias` via `fileURLToPath(new URL('./src', import.meta.url))`
- [tsconfig.app.json](tsconfig.app.json) — `compilerOptions.paths` (`"@/*": ["./src/*"]`)

Do **not** add `baseUrl` — it is deprecated in TypeScript 6; with `moduleResolution:
"bundler"`, `paths` resolves relative to the tsconfig file without it.

TypeScript uses project references: [tsconfig.json](tsconfig.json) points to
`tsconfig.app.json` (app/browser code) and `tsconfig.node.json` (Vite config).

## Code quality (enforced on commit)

Husky `pre-commit` runs `lint-staged`:

- `*.{js,jsx,ts,tsx}` → `eslint --fix` then `prettier --write`
- `*.json`, `*.{css,scss,sass,less}` → `prettier --write`

ESLint flat config lives in [eslint.config.js](eslint.config.js); `eslint-config-prettier`
is intentionally last in `extends` to disable formatting rules that conflict with
Prettier. Prettier style: no semicolons, single quotes, trailing commas, LF line endings
(`.gitattributes` normalizes to LF).
