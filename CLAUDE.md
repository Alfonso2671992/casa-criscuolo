# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment

Requires Node 22 via nvm:
```bash
source "$HOME/.nvm/nvm.sh" && nvm use 22
```

## Commands

```bash
npm run dev          # Vite dev server on localhost:5173
npm run build        # Production build (Cloudflare adapter)
npm run preview      # Preview production build on localhost:4173
npm run check        # svelte-check (TypeScript + Svelte diagnostics)
npm test             # Vitest unit tests (run once)
npm run test:watch   # Vitest in watch mode
npx playwright test --config=e2e/playwright.config.ts  # E2E tests (requires built app)
```

Run a single unit test file:
```bash
npx vitest run src/lib/group-acquisti.test.ts
```

## Architecture

SvelteKit 5 app (Svelte runes syntax) deployed on Cloudflare Pages. Two users track shared expenses, shopping lists, home items, and measurements with real-time sync.

### Data flow

- **Reads**: Firebase Realtime DB → client SDK listeners (`firebase-client.ts`) → Svelte writable stores (`stores.ts`) → reactive UI
- **Writes**: UI → `authFetch()` (attaches Firebase Auth JWT) → SvelteKit API endpoint → Firebase REST API via OAuth2 JWT → Realtime DB → all clients update via listeners
- **Photos**: compressed to JPEG data URL client-side → stored inline in Firebase DB under `ROOT/photos/<refKey>`

### Server-side Firebase (Cloudflare-compatible)

`src/lib/server/firebase-admin.ts` does **not** use the `firebase-admin` npm package (incompatible with edge runtime). Instead it:
1. Reads `FIREBASE_SERVICE_ACCOUNT` env var (service account JSON)
2. Builds and signs an RS256 JWT using Web Crypto API
3. Exchanges the JWT for an OAuth2 access token from Google
4. Makes authenticated REST calls to the Firebase Realtime DB REST API

Token is cached in-memory with 60s expiry buffer.

### Key modules

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | `Expense`, `WishItem`, `Misura`, `AcquistoItem`, `ModalState` |
| `src/lib/constants.ts` | `CATS`, `CASA_CATS`, `ACQUISTO_CATS`, `MONTHS`, `DAYS`, `ROOT` |
| `src/lib/firebase-client.ts` | Firebase SDK init, auth helpers, realtime listeners, `authFetch`, photo cache |
| `src/lib/stores.ts` | Svelte stores + localStorage cache helpers (`cc_` prefix), derived stats |
| `src/lib/utils.ts` | `esc()`, `safeUrl()`, `snap2arr()`, date helpers, `trapFocus`, `scrollLock`, `compressImg` |
| `src/lib/group-acquisti.ts` | `groupAcquisti()` — pure function grouping shopping items by category with active count |
| `src/lib/server/firebase-admin.ts` | Firebase REST API writes (edge-compatible) |
| `src/lib/server/api-utils.ts` | `apiHandler()` wrapper + `ApiError` for all API routes |

### API routes

All routes are POST-only, authenticated via `Authorization: Bearer <firebase-id-token>` in `apiHandler()`:

- `POST /api/exp` — add expense; `POST /api/exp/[id]` — PATCH or DELETE
- `POST /api/wish` — add wish item; `POST /api/wish/[id]` — PATCH or DELETE
- `POST /api/mis` — add misura; `POST /api/mis/[id]` — DELETE
- `POST /api/acquisto` — add acquisto item; `POST /api/acquisto/[id]` — PATCH or DELETE
- `POST /api/photo/[id]` — save photo for an item

### Firebase database

- **Project**: `casa-criscuolo`
- **Root path**: `casa_criscuolo/` → sub-paths `exp`, `wish`, `mis`, `acquisti`, `photos`
- **Client config**: hardcoded in `firebase-client.ts` (public Firebase keys, by design)
- **Auth**: Email/Password via Firebase Auth

### Vitest mocks

`vitest.config.ts` aliases `$app` → `src/__mocks__/app` and `$env/dynamic/private` → `src/__mocks__/env/dynamic/private` so unit tests run outside SvelteKit context.

## Conventions

- **UI labels**: Italian (`Spese`, `Da acquistare`, `Casa`, `Misure`)
- **localStorage keys**: prefixed `cc_` (`cc_e`, `cc_w`, `cc_m`, `cc_a`, `cc_n`, `cc_budget`, `cc_dark`)
- **Changelog**: update `CHANGELOG.md` (Keep a Changelog format) before every commit — sections: `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Docs`
- **Commits**: short, English
- **Branches**: `develop` for work in progress, `main` for production (auto-deploys to Cloudflare Pages)
- **GitHub remote**: credentials in `~/.git-credentials-casa`

## Deployment

Cloudflare Pages via `@sveltejs/adapter-cloudflare`. Required secret: `FIREBASE_SERVICE_ACCOUNT` (service account JSON on one line). Build output: `.svelte-kit/cloudflare`.

Local dev uses `.dev.vars` (same format as Cloudflare secrets) — copy from `.dev.vars.example`.
