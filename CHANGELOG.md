# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-05-12

### Added

- Test: 4 nuovi test per `fmtDim` (formato completo, null parziali, tutto null, zero)
- Test: 7 nuovi test per `groupAcquisti` (grouping, activeCount exclude comprati, sorting, categorie vuote, caso misto)
- Test: 5 nuovi test per `sortDaPagare` (ordinamento sc prima di dt, sc crescente, dt crescente, dt prima di null, caso misto completo)

### Changed

- Contatore categorie "Da acquistare" ora mostra solo item non ancora comprati (es. `Spesa (7)` invece di `Spesa (8)` se 1 item è checkato)
- Sezione "Pagate" nel tab Spese: collassabile di default (come le categorie acquisti), si apre cliccando sull'header verde
- Spese "Da pagare" ordinate: prima bollette (sc) per scadenza, poi spese (dt) per data, infine senza data
- Refactor: `sortDaPagare` estratta in `utils.ts` come funzione pura testabile
- Dark mode: palette raffinata — sfondo più ricco, card più distinte, testo più contrastato, colori semantici più vividi, overlay meno aggressivo
- **Tab Misure**: dimensioni con campi separati L (Lunghezza), P (Profondità), A (Altezza) in cm, valori partono da 0 con pulsanti −10/−1/+1/+10, rimosso selettore unità (sempre cm)

### Removed

- Tab "Carte" (5° tab) e tutto il relativo codice: componente scanner barcode, form/card carte, API routes, tipo `CartaItem`, store `carte`, dipendenza `@ericblade/quagga2`

### Docs

- `AGENTS.md`: aggiunta sezione `src/lib/group-acquisti.ts`

## [2.8.0] - 2026-05-11

### Added

- ConfirmDialog: modale di conferma personalizzata per tutte le eliminazioni (invece di window.confirm nativo)
- Stato di caricamento (submitting) in tutti i 7 form + modali: bottone disabilitato con "Salvataggio..." durante le chiamate API, previene doppi tap

### Changed

- Tutte le card: eliminazione ora passa da ConfirmDialog invece di conferma nativa del browser
- Svuota categoria: stessa modale di conferma

## [2.7.0] - 2026-05-11

### Changed

- Rimosse barra di ricerca e toggle "Nascondi comprati" dalla lista acquisti
- Pulsante "Svuota" categoria: colore aggiornato a `var(--accent)` (coerente col bottone Aggiungi)
- Spazio verticale extra tra gruppi categoria nella lista acquisti

## [2.6.0] - 2026-05-11

### Added

- Suggerimenti predefiniti nel form acquisti: ~90 item comuni (Acqua, Pasta, Pomodori, Latte, Dentifricio, ecc.) organizzati per categoria, sempre suggeriti anche senza averli mai aggiunti. Si combinano con gli item inseriti manualmente (es. Whisky, Gin) — stile lista Alexa.
- File `src/lib/acquisto-suggestions.ts` con la lista completa dei default

## [2.5.0] - 2026-05-11

### Added

- Tab "Da acquistare": pulsante check per segnare item come comprati (`b` field ora usato nell'UI, sincronizzato su Firebase)
- Barra di ricerca nella lista acquisti (filtra per nome in tempo reale)
- Categorie collassabili: click sul nome categoria per chiudere/aprire, con contatore item
- Pulsante "Nascondi comprati": toggle per nascondere gli item già spuntati
- Suggerimenti autocompletamento nel form "Cosa devi comprare?" (basati su item già aggiunti, dopo 2 caratteri, auto-seleziona categoria)

### Changed

- AcquistoCard: card comprata si opacizza e nome barrato
- AcquistoForm: più spazio tra campo quantità e bottone aggiungi

## [2.4.0] - 2026-05-11

### Changed

- Modali modifica (Spese, Wish, Misure): colori hardcoded sostituiti con CSS custom properties per supporto dark mode
- API endpoints: refactor con `apiHandler` wrapper centralizzato, rimosso boilerplate try/catch (17 file, ~80 righe nette eliminate)
- Validazione `payer` lato server: ora controlla anche spazi vuoti
- AcquistoCard: testo nome usa `var(--text-primary)` per leggibilità in dark mode

### Added

- Loader spinner durante inizializzazione auth (invece di schermata bianca)

### Removed

- `listenNote`, `saveNote`, `freeNotes` store, `.notepad` CSS (dead code blocco note mai completato)
- Test `saveFreeNotes` correlati

## [2.3.0] - 2026-05-11

### Added

- Tab "Da acquistare" rinnovato: lista della spesa strutturata con categorie (Spesa, Igiene, Pulizia, Elettronica, Abbigliamento, Altro), form rapido con nome + quantità, card raggruppate per categoria, eliminazione diretta. Dati salvati su Firebase in `casa_criscuolo/acquisti/` con API dedicata
- Cache localStorage per acquisti (`cc_a`)
- Ordinamento cronologico item (FIFO) all'interno di ogni categoria
- Pulsante "Svuota" per eliminare tutti gli item di una categoria (DELETE batch su server)
- Badge quantità visibile sulle card (stile pillola colorata)

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
