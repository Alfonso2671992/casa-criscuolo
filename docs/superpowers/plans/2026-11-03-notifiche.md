# Notifiche push — Piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** notifica push all'altra persona quando viene aggiunta una spesa o un prodotto diventa urgente, con interruttore e notifica di prova nelle Impostazioni.

**Architecture:** il client ottiene un token FCM (SDK `firebase/messaging` + service worker statico) e lo registra via API nel Realtime DB sotto `push/<uid>/<tokenId>`. Le API esistenti, dopo aver salvato, compongono il messaggio e lo inviano con FCM HTTP v1 usando l'OAuth dell'account di servizio già presente, a tutti i token degli uid diversi dall'autore. Gli errori di invio non toccano mai la risposta del salvataggio.

**Tech Stack:** SvelteKit 5 (runes), Cloudflare Pages (`@sveltejs/adapter-cloudflare`), Firebase JS SDK ^10.12 (`firebase/messaging`), FCM HTTP v1, Vitest (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-03-notifiche-design.md`

## Global Constraints

- **Niente commit/push/merge senza comando esplicito dell'utente.** I passi "Checkpoint" sostituiscono i commit: test verdi, nessun commit.
- Testi esatti (dalla spec):
  - spesa: titolo `Spesa da pagare`, testo `${nome} ha aggiunto ${cap(n)} · ${fmtEuro(a)} €`;
  - urgente: titolo `Urgente da acquistare`, testo `${nome} ha segnato ${cap(n)} come urgente`;
  - prova: titolo `Notifiche attive`, testo `Le notifiche di Casa funzionano su questo dispositivo`.
- Nome autore sconosciuto → `Qualcuno`.
- Mai notificare l'uid autore. Mai far fallire o ritardare visibilmente un salvataggio per colpa delle notifiche.
- Email **mai** nel codice: solo nel segreto `NOTIFY_USERS` (JSON `{"email":"Nome"}`), repo pubblico.
- Nessuna richiesta di permesso fuori da un tocco dell'utente.
- Nuova chiave localStorage: `cc_push` (`'1'` = attive su questo dispositivo).
- Il DB locale è quello di produzione: nessuna scrittura reale nei test (tutto mockato).
- Node 22: `source "$HOME/.nvm/nvm.sh" && nvm use 22`.

## Review Focus

1. **FCM giù o risposta 500** durante l'aggiunta di una spesa → la spesa è salvata e la risposta è `{ ok: true }` (test in Task 3).
2. **Token scaduto/disinstallato** (FCM 404 `UNREGISTERED`) → il token viene cancellato dal DB e gli altri token ricevono comunque (test in Task 2).
3. **Doppio tocco "urgente"** o PATCH `u:true` su un prodotto già urgente → nessuna seconda notifica (test in Task 3).
4. **Stesso iPhone che attiva due volte** → un solo nodo token, non due (tokenId deterministico dal token, test in Task 2).
5. **App aperta da Safari invece che dalla Home** → interruttore disabilitato con il messaggio "Aggiungi l'app alla schermata Home per ricevere le notifiche" (test in Task 5).

---

### Task 1: Le API conoscono l'utente autore

**Files:**
- Modify: `src/lib/server/firebase-admin.ts` (`requireAuth`)
- Modify: `src/lib/server/api-utils.ts` (`apiHandler`)
- Test: `src/lib/server/api-utils.test.ts`

**Interfaces:**
- Produces:
  - `export interface AuthUser { uid: string; email?: string }` in `firebase-admin.ts`
  - `requireAuth(request: Request): Promise<AuthUser>`
  - `apiHandler(request: Request, handler: (user: AuthUser) => Promise<Response>): Promise<Response>`. Gli handler esistenti che ignorano il parametro restano validi.

- [ ] **Step 1: Test che fallisce** in `api-utils.test.ts`: `it('passes the authenticated user to the handler')`, con `mockRequireAuth.mockResolvedValue({ uid: 'u1', email: 'a@b.c' })`. L'handler deve ricevere esattamente `{ uid: 'u1', email: 'a@b.c' }`. Aggiorna anche i mock esistenti da `'uid1'` a `{ uid: 'uid1' }`.
- [ ] **Step 2:** `npx vitest run src/lib/server/api-utils.test.ts`. Atteso: FAIL sul nuovo test.
- [ ] **Step 3:** `requireAuth` restituisce `{ uid: user.sub, email: user.email }`; `apiHandler` passa il risultato a `handler(user)`.
- [ ] **Step 4:** `npm test` e `npm run check`. Atteso: tutto verde.
- [ ] **Step 5: Checkpoint**, senza commit.

---

### Task 2: Nucleo server delle notifiche

**Files:**
- Modify: `src/lib/server/firebase-admin.ts`
- Create: `src/lib/server/push.ts`
- Test: `src/lib/server/push.test.ts` (mock di `./firebase-admin` e di `$env/dynamic/private`, come in `acquisto.test.ts`)

**Interfaces:**
- Produces, in `firebase-admin.ts`:
  - scope OAuth: aggiungere `https://www.googleapis.com/auth/firebase.messaging` alla stringa `scope` in `token()`;
  - `getPushTokens(): Promise<Record<string, Record<string, { t: string; ts: number }>> | null>`, che legge `push`;
  - `savePushToken(uid: string, id: string, t: string): Promise<void>`, con PUT su `push/<uid>/<id>` di `{ t, ts: Date.now() }`;
  - `deletePushToken(uid: string, id: string): Promise<void>`;
  - `getAcquisto(k: string): Promise<AcquistoItem | null>`;
  - `fcmSend(message: object): Promise<{ ok: boolean; status: number; unregistered: boolean }>`, con POST a `https://fcm.googleapis.com/v1/projects/casa-criscuolo/messages:send` e body `{ message }`. `unregistered` è `true` se lo status è 404 oppure se il body contiene `UNREGISTERED`.
- Produces, in `push.ts`:
  - `export interface PushMsg { title: string; body: string; path: string }`, dove `path` vale `/?tab=spese` o `/?tab=acquisto`;
  - `authorName(email?: string): string`, che legge `env.NOTIFY_USERS` (JSON, confronto case-insensitive) e restituisce `Qualcuno` se manca, è invalido o non contiene l'email;
  - `expenseMsg(author: string, n: string, a: number): PushMsg`;
  - `urgentMsg(author: string, n: string): PushMsg`;
  - `testMsg(): PushMsg`, con path `/`;
  - `tokenId(t: string): Promise<string>`, SHA-256 esadecimale del token troncato a 32 caratteri (deterministico, valido come chiave Firebase);
  - `sendToOthers(authorUid: string, msg: PushMsg, origin: string): Promise<void>`;
  - `sendToToken(uid: string, t: string, msg: PushMsg, origin: string): Promise<void>`.
- Formato del messaggio FCM per ogni token: `{ token, notification: { title, body }, webpush: { fcm_options: { link: origin + path } } }`. `fcm_options` va omesso se `origin` non inizia con `https://`, perché FCM rifiuta link non HTTPS (succede in dev su localhost).

- [ ] **Step 1: Test che falliscono** in `push.test.ts`:
  - `expenseMsg('Alina', 'luce', 85)` → `{ title: 'Spesa da pagare', body: 'Alina ha aggiunto Luce · 85,00 €', path: '/?tab=spese' }`
  - `urgentMsg('Alina', 'limoni')` → `{ title: 'Urgente da acquistare', body: 'Alina ha segnato Limoni come urgente', path: '/?tab=acquisto' }`
  - `authorName`:
    - con `NOTIFY_USERS='{"a@x.it":"Alfonso"}'`: `'A@X.it'` → `'Alfonso'`, `'b@x.it'` → `'Qualcuno'`, `undefined` → `'Qualcuno'`;
    - con `NOTIFY_USERS='non json'` → `'Qualcuno'`.
  - `tokenId('abc')` restituisce lo stesso valore a ogni chiamata, lungo 32 caratteri, che rispetta `/^[0-9a-f]+$/`.
  - `sendToOthers('u1', msg, 'https://casa.test')`, con token `{ u1: {d1}, u2: {d2, d3} }` → `fcmSend` chiamato 2 volte, solo con i token di u2, e il link è `https://casa.test/?tab=spese`.
  - `sendToOthers` quando `fcmSend` restituisce `unregistered: true` per d2 → `deletePushToken('u2', 'd2')`, e d3 viene comunque inviato.
  - `sendToOthers` quando `getPushTokens` restituisce `null` → nessun invio e nessun errore.
  - `sendToToken` con origin `http://localhost:5173` → il messaggio non contiene `webpush.fcm_options`.
- [ ] **Step 2:** `npx vitest run src/lib/server/push.test.ts`. Atteso: FAIL (modulo mancante).
- [ ] **Step 3:** implementa le funzioni di `firebase-admin.ts` e `push.ts`. In `sendToOthers` gli invii avvengono in parallelo con `Promise.allSettled`.
- [ ] **Step 4:** `npm test`. Atteso: verde.
- [ ] **Step 5: Checkpoint**, senza commit.

---

### Task 3: Invio dalle API e route `/api/push`

**Files:**
- Create: `src/routes/api/push/+server.ts`
- Modify: `src/routes/api/exp/+server.ts`
- Modify: `src/routes/api/acquisto/[id]/+server.ts`
- Test: `src/routes/api/push/push.test.ts`, `src/routes/api/exp/exp.test.ts` (crearlo se non esiste), `src/routes/api/acquisto/acquisto.test.ts`

**Interfaces:**
- Consumes: `AuthUser` e `apiHandler(req, (user) => …)` dal Task 1; tutto `push.ts`, più `getAcquisto`, `savePushToken` e `deletePushToken` dal Task 2.
- Produces:
  - `POST /api/push` con body `{ action: 'register' | 'unregister' | 'test', token: string }`:
    - `register` → `savePushToken(user.uid, await tokenId(token), token)`;
    - `unregister` → `deletePushToken(user.uid, await tokenId(token))`;
    - `test` → `sendToToken(user.uid, token, testMsg(), url.origin)` con await; un errore di invio qui va restituito come errore, perché serve proprio a diagnosticare.
    - Token mancante o più lungo di 4096 caratteri, oppure azione sconosciuta → `ApiError(400, 'Richiesta non valida')`.
  - Helper locale, o in `push.ts`: `background(platform, p: Promise<unknown>)`, che usa `platform?.context?.waitUntil(p)` se disponibile e altrimenti fa await. In entrambi i casi `p` viene avvolta in `.catch(e => console.error('push', e))`.
- Regole d'invio:
  - `POST /api/exp`: dopo `addExpense`, `background(platform, sendToOthers(user.uid, expenseMsg(authorName(user.email), n, a), url.origin))`.
  - `PATCH /api/acquisto/[id]`: se `body.u === true`, prima dell'update legge `getAcquisto(id)`. Dopo l'update invia `urgentMsg` **solo** se il prodotto esisteva e `prev.u !== true`.

- [ ] **Step 1: Test che falliscono:**
  - exp: `it('saves and returns ok even if push fails')`. `sendToOthers` mockato che rifiuta → la risposta è `{ ok: true }` e `addExpense` è stato chiamato.
  - exp: `it('notifies others with author name')`. `sendToOthers` chiamato con `'u1'` e un body che contiene `'ha aggiunto Luce'`.
  - acquisto:
    - PATCH `{u:true}` con `getAcquisto` → `{n:'limoni', u: undefined}` → `sendToOthers` chiamato una volta;
    - con `prev.u === true` → mai chiamato;
    - PATCH `{u:false}` → mai chiamato, e `getAcquisto` non viene letto.
  - push route:
    - `register` → `savePushToken('u1', <id 32 hex>, 'tok')`;
    - `unregister` → `deletePushToken`;
    - `test` → `sendToToken`;
    - `{action:'x'}` → status 400.
  - Nei mock esistenti di `apiHandler`, chiamare `handler({ uid: 'u1', email: 'a@x.it' })`.
- [ ] **Step 2:** `npx vitest run src/routes/api`. Atteso: FAIL sui nuovi test.
- [ ] **Step 3:** implementa la route e gli agganci. Le firme delle route diventano `({ request, platform, url })` oppure `({ params, request, platform, url })`.
- [ ] **Step 4:** `npm test` e `npm run check`. Atteso: verde.
- [ ] **Step 5: Checkpoint**, senza commit.

---

### Task 4: Client — token, service worker, apertura sul tab

**Files:**
- Create: `static/firebase-messaging-sw.js`
- Create: `src/lib/push.ts`
- Modify: `src/lib/firebase-client.ts` (esporta `fbApp`, già esportato: nessuna modifica se basta)
- Modify: `src/routes/+layout.svelte` (lettura di `?tab=`, refresh del token, messaggi in primo piano)
- Test: `src/lib/push.test.ts`

**Interfaces:**
- Consumes: `POST /api/push` (Task 3), `authFetch`, `fbApp`, `currentTab`, `showToast`.
- Produces, in `src/lib/push.ts`:
  - `export const VAPID_KEY = ''`, da riempire con la chiave pubblica fornita dall'utente al Task 6;
  - `type PushSupport = 'ok' | 'need-home' | 'unsupported'`;
  - `pushSupport(): Promise<PushSupport>`. Restituisce `'ok'` se `isSupported()` di `firebase/messaging` è true. Altrimenti `'need-home'` se lo user agent è iOS (`/iPhone|iPad/`) e l'app non è in modalità standalone, `'unsupported'` negli altri casi;
  - `pushEnabled(): boolean`, cioè `localStorage.cc_push === '1'` (con try/catch);
  - `enablePush(): Promise<'on' | 'denied' | 'error'>`. Chiama `Notification.requestPermission()` (va invocata direttamente dal gestore del tocco). Poi registra `/firebase-messaging-sw.js`, chiama `getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration })` e `register`, e infine imposta `cc_push='1'`;
  - `disablePush(): Promise<void>`. Esegue `unregister` con il token corrente, poi `deleteToken` e rimuove `cc_push`. Rimuove `cc_push` anche se la rete fallisce;
  - `refreshPush(): Promise<void>`. Se `pushEnabled()` e il permesso è `granted`, rilegge il token e ripete `register`. Il server deduplica, quindi la chiamata è idempotente. Ignora gli errori;
  - `sendTestPush(): Promise<boolean>`;
  - `listenForeground(): void`. Usa `onMessage` e mostra `showToast(title + ': ' + body)`, perché con l'app aperta FCM non mostra la notifica di sistema *(scelta del piano, coerente con "accorgersene subito")*;
  - `tabFromUrl(search: string): TabId | null`. Restituisce solo `spese | acquisto | casa | misure`, altrimenti `null`.
- `static/firebase-messaging-sw.js`: `importScripts` di `firebase-app-compat.js` e `firebase-messaging-compat.js` da `https://www.gstatic.com/firebasejs/10.12.0/`, `firebase.initializeApp(<stessa config di firebase-client.ts>)`, `firebase.messaging()`. Il messaggio contiene già `notification` e `fcm_options.link`, quindi visualizzazione e apertura al tocco le gestisce l'SDK: nessun handler custom.
- `+layout.svelte`:
  - in `onMount`, `const t = tabFromUrl(location.search)`. Se non è null: `currentTab.set(t)` e `history.replaceState(null, '', '/')`;
  - quando l'utente è loggato: `refreshPush()` e `listenForeground()`, una sola volta.

- [ ] **Step 1: Test che falliscono** in `push.test.ts`, con `firebase/messaging` e `authFetch` mockati:
  - `tabFromUrl('?tab=acquisto')` → `'acquisto'`; `'?tab=hack'` → `null`; `''` → `null`;
  - `pushSupport()` con `isSupported` false, UA iPhone, non standalone → `'need-home'`; con `isSupported` true → `'ok'`;
  - `enablePush()` con permesso `'denied'` → `'denied'`, e `cc_push` non impostato;
  - `enablePush()` con permesso `'granted'` e `getToken` → `'tok'` → `authFetch('/api/push', …)` con body `{action:'register', token:'tok'}`, poi `cc_push === '1'` e il risultato è `'on'`;
  - `disablePush()` con `authFetch` che rifiuta → `cc_push` rimosso comunque.
- [ ] **Step 2:** `npx vitest run src/lib/push.test.ts`. Atteso: FAIL.
- [ ] **Step 3:** implementa `push.ts`, il service worker e gli agganci in `+layout.svelte`.
- [ ] **Step 4:** `npm test`, `npm run check` e `npm run build`. Atteso: verde, e `firebase-messaging-sw.js` presente in `.svelte-kit/cloudflare/`.
- [ ] **Step 5: Checkpoint**, senza commit.

---

### Task 5: Sezione Notifiche nelle Impostazioni

**Files:**
- Modify: `src/lib/components/SettingsModal.svelte`
- Test: `src/lib/components/SettingsModal.test.ts` (crearlo; usa `mount`, `flushSync` e il mock di `$lib/push` come negli altri test di componente)

**Interfaces:**
- Consumes: `pushSupport`, `pushEnabled`, `enablePush`, `disablePush`, `sendTestPush` (Task 4).
- UI, tra "Modalità scura" e "Disconnetti":
  - Riga con etichetta `Notifiche` e uno switch (`<button role="switch" aria-checked>`) a destra. Stile: stessa larghezza, bordo e raggio di `.btn-dark`; switch acceso in `--accent`.
  - Durante l'attivazione o la disattivazione lo switch è disabilitato.
  - Con lo switch acceso compare il pulsante `Invia notifica di prova`, con lo stile secondario di `.btn-dark`. Esito → toast: `Notifica inviata` oppure `Invio non riuscito`.
  - Messaggi sotto la riga (13px, `--text-secondary`):
    - `'need-home'` → `Aggiungi l'app alla schermata Home per ricevere le notifiche`, con lo switch disabilitato;
    - `'unsupported'` → `Questo browser non supporta le notifiche`, con lo switch disabilitato;
    - esito `'denied'` → `Attiva le notifiche per Casa nelle Impostazioni dell'iPhone`;
    - esito `'error'` → toast `Attivazione non riuscita, riprova`.

- [ ] **Step 1: Test che falliscono:**
  - con `pushSupport` → `'need-home'`, il testo "Aggiungi l'app alla schermata Home" è visibile e lo switch è `disabled`;
  - con `'ok'` e `pushEnabled` → false, un click sullo switch chiama `enablePush` e poi `aria-checked="true"` e il pulsante di prova è visibile;
  - con `enablePush` → `'denied'`, compare il testo "Impostazioni dell'iPhone" e `aria-checked="false"`;
  - con lo switch acceso, un click chiama `disablePush` e il pulsante di prova sparisce.
- [ ] **Step 2:** `npx vitest run src/lib/components/SettingsModal.test.ts`. Atteso: FAIL.
- [ ] **Step 3:** implementa la UI. `enablePush` va chiamato in modo sincrono dal gestore `onclick`, senza `await` prima, perché iOS richiede il gesto dell'utente.
- [ ] **Step 4:** `npm test` e `npm run check`. Atteso: verde.
- [ ] **Step 5: Checkpoint**, senza commit.

---

### Task 6: Configurazione, documentazione e prova reale (con l'utente)

**Files:**
- Modify: `src/lib/push.ts` (`VAPID_KEY`)
- Modify: `.dev.vars.example`, con la riga `NOTIFY_USERS={"email1@example.com":"Alfonso","email2@example.com":"Alina"}` e un commento. **Solo email d'esempio.**
- Modify: `CLAUDE.md`, aggiungendo:
  - il segreto `NOTIFY_USERS`;
  - la route `POST /api/push`;
  - il path DB `push`;
  - la chiave `cc_push`;
  - `src/lib/push.ts` e `src/lib/server/push.ts` nella tabella dei moduli.
- Modify: `README.md`, nella sezione di configurazione o deploy se esiste.
- Modify: `CHANGELOG.md`, sotto `[Unreleased]` → `### Added`.

- [ ] **Step 1 (utente):** in Firebase Console → Impostazioni progetto → Cloud Messaging, genera la coppia di chiavi in "Certificati push web" e incolla la chiave pubblica. L'implementatore la mette in `VAPID_KEY`.
- [ ] **Step 2 (utente):** aggiunge `NOTIFY_USERS` con le due email reali in `.dev.vars` e su Cloudflare Pages → Settings → Variables and Secrets, sia Production sia Preview.
- [ ] **Step 3:** verifica che l'API "Firebase Cloud Messaging API (V1)" sia abilitata sul progetto. Se `fcmSend` risponde 403 `SERVICE_DISABLED`, l'utente deve abilitarla dalla console Google Cloud.
- [ ] **Step 4:** documentazione e changelog. `npm test`, `npm run check` e `npm run build`. Atteso: verde.
- [ ] **Step 5:** commit, push su develop e merge su main **solo su comando dell'utente**. Poi verifica la produzione tramite `https://casa-criscuolo.pages.dev/_app/version.json`, il cui valore deve cambiare rispetto a quello letto prima del merge.
- [ ] **Step 6 (prova reale, con l'utente):**
  1. sull'iPhone, app aperta dalla Home → Impostazioni → Notifiche ON → `Invia notifica di prova` → la notifica arriva;
  2. sul PC, Chrome con l'account di Alina (login fatto da lei) → Notifiche ON;
  3. app chiusa sull'iPhone, spesa aggiunta dal PC → la notifica arriva sull'iPhone e il tocco apre il tab Spese;
  4. dall'iPhone, prodotto segnato come urgente → la notifica arriva sul PC e non sull'iPhone;
  5. Notifiche OFF sull'iPhone, nuova spesa dal PC → non arriva niente.
