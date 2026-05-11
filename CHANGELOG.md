# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-05-11

### Added

- Tab "Da acquistare" rinnovato: lista della spesa strutturata con categorie (Spesa, Igiene, Pulizia, Elettronica, Abbigliamento, Altro), form rapido con nome + quantità, card raggruppate per categoria, eliminazione diretta. Dati salvati su Firebase in `casa_criscuolo/acquisti/` con API dedicata
- Cache localStorage per acquisti (`cc_a`)

### Fixed

- Modali di modifica sovrapposti ai tab su iPhone grandi: padding top overlay con `env(safe-area-inset-top)`

## [2.2.0] - 2026-05-08

### Added

- Test: 57 nuovi test per stores (showToast, saveNames, cache, derived), firebase-admin (verifyToken, b64url, requireAuth) e edge case utils (88 totali, 5 test files)
- Mock per `$env/dynamic/private` nei test
- Modifica spese: pulsante "Modifica" nelle card, modal con form precompilata (nome, importo, categoria, pagante, data/scadenza)
- Modifica wishlist: pulsante "Modifica" nelle card, modal con form precompilata (nome, categoria, dimensioni, link, budget, foto)
- Modifica misure: pulsante "Modifica" con stile coerente agli altri bottoni, modal con form precompilata (nome, dimensioni, note, foto)
- Endpoint PATCH per misure (`/api/mis/[id]`)
- Dark mode: tema scuro con toggle nelle impostazioni (salvato in localStorage)

## [2.1.1] - 2026-05-08

### Fixed

- Input decimali cross-locale: sostituito `type=number` con `type=text` + `inputmode=decimal` per supportare virgola e punto su qualsiasi locale
- Eliminazione spese/wish/misure dava 500 su Cloudflare Workers
- Verifica JWT lato server falliva su Cloudflare (rimossa dipendenza da Google public keys endpoint, validazione solo payload + expiry)

### Changed

- Rimosso onboarding iniziale: si atterra direttamente sulla pagina di login
- Pulsanti importo rapido (+, -) ora funzionano con decimali

### Removed

- Endpoint `/api/upload` (dead code, le foto sono data URL inline)
- Firebase Storage (getStorage) dal client (inutilizzato)
- Store inutilizzati: `unpaidExpenses`, `paidExpenses`, `getAuthHeaders`
- Import `showToast` inutilizzato in `+page.svelte`
- File `Onboarding.svelte`

### Docs

- README.md
- AGENTS.md allineato (foto via data URL, struttura aggiornata)

## [2.1.0] - 2026-05-08

### Added

- Autenticazione Firebase Auth (Email/Password) su tutti gli API endpoint
- Helper `authFetch` sul client (allega token JWT automaticamente)
- LoginForm con login, registrazione e reset password

### Changed

- Rimosso `firebase-admin` npm package, usata REST API con OAuth2 JWT direttamente
- Rimosso debug endpoint

### Fixed

- Favicon mancante (404)
- Firebase Storage fallback → data URL diretto
- Scopes OAuth2 per Realtime Database

### Security

- Ogni API route verifica il token Firebase Auth prima di processare la richiesta

## [2.0.0] - 2026-05-08

### Added

- Prima versione SvelteKit 5
- 4 tab: Spese, Da acquistare, Casa, Misure
- Firebase Realtime Database con listener real-time
- Firebase Auth (Email/Password)
- Upload foto via data URL
- Note libere sincronizzate
- Calendario per date e scadenze
- Categorie spesa configurabili
- Test unitari Vitest (31 test)
- Cloudflare Pages deployment via adapter

### Removed

- Vecchia app v1 (index.html, root icons)

[2.2.0]: https://github.com/Alfonso2671992/casa-criscuolo/compare/2.1.1...2.2.0
[2.1.1]: https://github.com/Alfonso2671992/casa-criscuolo/compare/2.1.0...2.1.1
[2.1.0]: https://github.com/Alfonso2671992/casa-criscuolo/compare/2.0.0...2.1.0
[2.0.0]: https://github.com/Alfonso2671992/casa-criscuolo/releases/tag/2.0.0
