# Casa Criscuolo / Falabella — Agent Guide

## What this is

A SvelteKit 5 app for two people to track shared expenses, shopping lists, home items, and measurements. Firebase Realtime Database for realtime sync, Firebase Auth (Google), Firebase Admin SDK for server-side writes (uses REST API — compatible with Cloudflare edge runtime), Cloudflare Pages deployment.

## Project structure

```
src/
  lib/
    components/     → Svelte 5 components (runes syntax)
    server/         → firebase-admin.ts (Firebase REST API — OAuth2 JWT from service account)
    __mocks__/
      app/          → vitest mock for $app/environment
    constants.ts    → CATS, CASA_CATS, MONTHS, DAYS, ROOT
    firebase-client.ts → client SDK init + realtime listeners
    stores.ts       → Svelte writable stores + cache helpers
    group-acquisti.ts → groupAcquisti() pure function (raggruppa acquisti per categoria con activeCount)
    types.ts        → Expense, WishItem, Misura, etc.
    utils.ts        → esc(), safeUrl(), date helpers, snap2arr
  routes/
    +page.svelte    → main app with 4 tabbed sections
    +layout.svelte  → header, tab bar, onboarding gate
    api/
      exp/          → POST /[id] (PATCH, DELETE)
      wish/         → POST /[id] (PATCH, DELETE)
      mis/          → POST /[id] (DELETE)
static/             → manifest.json, icons
wrangler.jsonc      → Cloudflare Pages config
```

## Data flow

- **Reads**: Client Firebase SDK realtime listeners → Svelte stores → reactive UI
- **Writes**: Client → SvelteKit API endpoint → Firebase REST API (OAuth2 JWT) → Realtime DB → all clients via listener
- **Photos**: Client → data URL (inline in JSON payload) → stored in DB

## Dev commands

```powershell
npm run dev      # Vite dev server on localhost:5173
npm run build    # Production build + Cloudflare adapter
npm run preview  # Preview production build locally
npm run check    # svelte-check (TypeScript verification)
npm test         # Vitest unit tests
npm run test:watch  # Vitest watch mode
```

## Firebase

- **Project**: `casa-criscuolo`
- **Database URL**: `https://casa-criscuolo-default-rtdb.europe-west1.firebasedatabase.app`
- **Root path**: `casa_criscuolo/` → sub-collections `exp`, `wish`, `mis`
- **Client config**: hardcoded in `src/lib/firebase-client.ts` (public by design)
- **Admin**: `firebase-admin` lazily initialized from `FIREBASE_SERVICE_ACCOUNT` env var (uses REST API — compatible with Cloudflare edge runtime)
- **Auth**: Google Sign-In via Firebase Auth (client + token verification on server)

## Repo conventions

- **Branch**: `main` primary
- **Commits**: short, English
- **UI labels**: Italian (`Spese`, `Da acquistare`, `Misure`)
- **localStorage keys**: prefixed `cc_`
- **Changelog**: update `CHANGELOG.md` (Keep a Changelog format) before every commit — group under `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Docs`

## Deployment

Cloudflare Pages via `@sveltejs/adapter-cloudflare`. Set `FIREBASE_SERVICE_ACCOUNT` as a Cloudflare Pages secret. Build command: `npm run build`. Output dir: `.svelte-kit/cloudflare`.

## Constraints

- Firebase Admin SDK requires `FIREBASE_SERVICE_ACCOUNT` env var (service account JSON) — fails at runtime if unset
- `firebase-admin` npm package not used — project uses REST API directly with OAuth2 JWT

## Session notes (12/05/2026)

This project was originally set up on another PC (Windows). It was cloned/configured on this Linux PC.
To work on this project, use Node 22 via nvm:
```bash
source "$HOME/.nvm/nvm.sh" && nvm use 22
```

### Current state

- **Branch**: `develop` (lavoro in corso), `main` (produzione)
- **GitHub**: `https://github.com/Alfonso2671992/casa-criscuolo.git`
- **Cloudflare Pages**: già connesso (`casa-criscuolo.pages.dev`), deploy auto da `main` e `develop`
- **Firebase**: connesso (client SDK + admin REST API). `.dev.vars` contiene il service account su una riga. Il secret è già impostato su Cloudflare Pages.
- **Tests**: 109 unit (6 files), 4 e2e — tutti passati
- **Dev server**: `npm run dev` su `localhost:5173`
- **Credenziali GitHub**: salvate in `~/.git-credentials-casa` (token)
- **Workflow**: modifica su `develop` → test → merge in `main` → push → Cloudflare deploy

### Per ripartire

```bash
cd /home/acriscuolo/Progetti/AppPrivata/casa-criscuolo
source "$HOME/.nvm/nvm.sh" && nvm use 22
npm run dev          # avvia server
npm test             # unit test
npx playwright test --config=e2e/playwright.config.ts  # e2e test
```

### Ultime cose fatte

- Configurato Firebase service account su questo PC
- Testato API (spesa aggiunta/rimossa OK)
- Verificato GitHub, Cloudflare, Firebase coordinati
- Modifica "- Test" su develop e poi rimossa (era solo un test)
- Pull remote già configurato con token
