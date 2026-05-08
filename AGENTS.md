# Casa Criscuolo / Falabella — Agent Guide

## What this is

A SvelteKit 5 app for two people to track shared expenses, shopping lists, home items, and measurements. Firebase Realtime Database for realtime sync, Firebase Auth (Google), Firebase Admin SDK for server-side writes, Cloudflare Pages deployment.

## Project structure

```
src/
  lib/
    components/     → Svelte 5 components (runes syntax)
    server/         → firebase-admin.ts (Firebase REST API — OAuth2 JWT from service account)
    __mocks__/
      app/          → vitest mock for $app/environment
    constants.ts    → CATS, CASA_CATS, MONTHS, DAYS, paths
    firebase-client.ts → client SDK init + realtime listeners
    stores.ts       → Svelte writable stores + cache helpers
    types.ts        → Expense, WishItem, Misura, etc.
    utils.ts        → esc(), safeUrl(), date helpers, snap2arr
  routes/
    +page.svelte    → main app with 4 tabbed sections
    +layout.svelte  → header, tab bar, onboarding gate
    api/
      exp/          → POST /[id] (PATCH, DELETE)
      wish/         → POST /[id] (PATCH, DELETE)
      mis/          → POST /[id] (DELETE)
      upload/       → POST (multipart → Firebase Storage)
static/             → manifest.json, icons
index.html          → LEGACY v1 app (still usable, not deleted)
wrangler.jsonc      → Cloudflare Pages config
```

## Data flow

- **Reads**: Client Firebase SDK realtime listeners → Svelte stores → reactive UI
- **Writes**: Client → SvelteKit API endpoint → Firebase REST API (OAuth2 JWT) → Realtime DB → all clients via listener
- **Photos**: Client → `/api/upload` → Firebase REST API (OAuth2 JWT) → Storage → returns public URL → saved in DB

`index.html` is the old v1 app — it shares the same Firebase project. Changes from v2 appear in both apps immediately.

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
- **Admin**: `firebase-admin` lazily initialized from `FIREBASE_SERVICE_ACCOUNT` env var (uses REST API internally — compatible with Cloudflare edge runtime)
- **Auth**: Google Sign-In via Firebase Auth (client + token verification on server)

## Repo conventions

- **Branch**: `main` primary
- **Commits**: short, English
- **UI labels**: Italian (`Spese`, `Da acquistare`, `Misure`)
- **localStorage keys**: prefixed `cc_`

## Deployment

Cloudflare Pages via `@sveltejs/adapter-cloudflare`. Set `FIREBASE_SERVICE_ACCOUNT` as a Cloudflare Pages secret. Build command: `npm run build`. Output dir: `.svelte-kit/cloudflare`.

## Constraints

- Firebase Admin SDK requires `FIREBASE_SERVICE_ACCOUNT` env var (service account JSON) — fails at runtime if unset
- Photo upload requires Firebase Storage to be enabled and bucket publicly readable (or use signed URLs)
- Legacy `index.html` v1 app still in repo — don't delete until v2 is verified by both users
