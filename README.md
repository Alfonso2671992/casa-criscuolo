# Casa Criscuolo / Falabella

App per gestire spese condivise, liste della spesa, oggetti per la casa e misure, con sincronizzazione real-time tra due persone.

## Stack

- **Frontend**: SvelteKit 5 + TypeScript
- **Backend**: API endpoints SvelteKit (Cloudflare edge)
- **Database**: Firebase Realtime Database
- **Auth**: Firebase Auth (Email/Password)
- **Deploy**: Cloudflare Pages

## Sviluppo

```bash
npm install
npm run dev        # localhost:5173
npm run build      # build di produzione
npm run preview    # preview build locale
npm test           # test unitari
npm run check      # type-check
```

## Variabili d'ambiente

Copia `.dev.vars.example` in `.dev.vars` e inserisci il service account Firebase:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"casa-criscuolo",...}
```

Necessaria solo per lo sviluppo locale. Su Cloudflare Pages va impostata come secret.

## Struttura

```
src/
  lib/
    components/    → Componenti Svelte 5
    server/        → firebase-admin.ts (API REST Firebase)
    firebase-client.ts → SDK Firebase client + listener real-time
    stores.ts      → Store Svelte + cache localStorage
    types.ts       → Tipi TypeScript
    utils.ts       → Funzioni utility
    constants.ts   → Categorie, mesi, giorni, ROOT
  routes/
    +page.svelte   → App principale (4 tab: Spese, Acquisto, Casa, Misure)
    +layout.svelte → Layout con header, tab bar, auth gate
    api/           → Endpoint REST (exp, wish, mis)
static/            → Manifest, icone, favicon
```

## Deploy

Il deploy è automatico su Cloudflare Pages tramite push su `main`.
L'unico secret richiesto: `FIREBASE_SERVICE_ACCOUNT`.
