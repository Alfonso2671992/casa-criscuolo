# Notifiche push — design

Data: 2026-11-03 · Stato: bozza da approvare

## Perché

L'app è usata da due persone (Alfonso e Alina), entrambe su iPhone con l'app aggiunta alla schermata Home (PWA). Oggi chi aggiunge una spesa da pagare o segna un prodotto come urgente deve avvisare l'altro a voce o per messaggio. L'obiettivo è che l'altra persona lo sappia subito, senza dover aprire l'app per controllare.

## Obiettivi

- Notifica push all'**altra persona** (mai a chi ha fatto l'azione) in due soli casi:
  1. **Nuova spesa** aggiunta in Spese (`POST /api/exp`). Tutte le spese nuove nascono "da pagare" (`s: 'da'`), quindi ogni inserimento notifica.
  2. **Prodotto segnato come urgente** in Da acquistare (`PATCH /api/acquisto/[id]` con `u: true`).
- Ogni persona attiva le notifiche dal proprio iPhone con un interruttore nelle Impostazioni e può disattivarle dallo stesso interruttore.
- Pulsante "Invia notifica di prova" nelle Impostazioni che manda una notifica al proprio dispositivo (serve per il test con un solo iPhone e per diagnosticare problemi in futuro).
- Toccando la notifica si apre l'app sul tab giusto (`spese` o `acquisto`).

## Non obiettivi

- Nessuna notifica per: spese modificate, pagate, eliminate; prodotti aggiunti senza urgenza, rinominati, eliminati; urgenza tolta; Casa; Misure.
- Il promemoria delle spese fisse resta com'è (riquadro all'apertura dell'app), senza push.
- Nessuna cronologia delle notifiche nell'app, nessuna preferenza per tipo di notifica (un solo interruttore per tutto).
- Nessun supporto pensato per Android; il desktop (Chrome) conta solo come strumento di test.

## Anti-obiettivi (sarebbe un fallimento anche se "funziona")

- Ricevere la notifica delle proprie azioni.
- Un salvataggio che fallisce o rallenta visibilmente perché l'invio della notifica non è andato a buon fine: **la notifica è secondaria, il salvataggio deve riuscire comunque**.
- Email degli utenti scritte nel codice: il repository GitHub è **pubblico**.
- Richiesta del permesso notifiche all'apertura dell'app senza che l'utente l'abbia chiesto (su iOS va comunque fatta da un tocco dell'utente).

## Testi delle notifiche (decisi con l'utente)

Formato importo come nel resto dell'app: `fmtEuro(a) + ' €'` (es. `85,00 €`). Nome prodotto/spesa con `cap()` come in UI.

| Caso | Titolo | Testo |
|------|--------|-------|
| Nuova spesa | `Spesa da pagare` | `Alina ha aggiunto Luce · 85,00 €` |
| Prodotto urgente | `Urgente da acquistare` | `Alina ha segnato Limoni come urgente` |
| Prova | `Notifiche attive` | `Le notifiche di Casa funzionano su questo dispositivo` *(scelta mia)* |

Nessuna scadenza nel testo (deciso dall'utente).

## Come (decisioni prese)

### Trasporto: Firebase Cloud Messaging (FCM)

- Client: SDK `firebase/messaging` (già presente la dipendenza `firebase` ^10) con chiave VAPID generata in Firebase Console → Impostazioni progetto → Cloud Messaging → Certificati push web. La chiave pubblica VAPID è pubblica per natura: può stare nel codice client come la config Firebase.
- Server: FCM **HTTP v1** (`POST https://fcm.googleapis.com/v1/projects/casa-criscuolo/messages:send`) autenticato con l'OAuth dell'account di servizio già usato in `src/lib/server/firebase-admin.ts` (aggiungere lo scope `https://www.googleapis.com/auth/firebase.messaging`). Niente pacchetto `firebase-admin` (non compatibile con l'edge runtime di Cloudflare).
- Service worker per ricevere i push e gestire il tocco sulla notifica (apre/porta in primo piano l'app sull'URL con il tab). Oggi l'app **non ha** un service worker.
- iOS: le notifiche web funzionano solo con l'app aperta dalla schermata Home, da iOS 16.4.

### Chi è chi: abbinamento email → nome (deciso dall'utente)

- Confermato dall'utente: Alfonso e Alina hanno **due account Firebase Auth distinti**, ognuno sul proprio iPhone (in Auth risultano esattamente due account). La regola "destinatari = uid diversi dall'autore" è quindi valida.
- Nuovo segreto `NOTIFY_USERS` (Cloudflare Pages + `.dev.vars`, e riga d'esempio in `.dev.vars.example`), JSON su una riga, es. `{"alfonso@…":"Alfonso","alina@…":"Alina"}`.
- Il server ricava l'email dal token Firebase già verificato in `requireAuth` (oggi restituisce solo `uid`: va esteso per esporre anche l'email all'handler).
- Se l'email dell'autore non è nella mappa: la notifica parte comunque con il nome `Qualcuno` *(scelta mia)*.

### Destinatari e token

- Ogni dispositivo che attiva le notifiche registra il proprio token FCM nel Realtime DB, sotto l'utente: `casa_criscuolo/push/<uid>/<tokenId>` → `{ t: <token FCM>, ts, ua? }`. *(Struttura e chiave `tokenId` a scelta del builder, purché un dispositivo non si duplichi a ogni attivazione.)*
- Destinatari di un evento: **tutti i token di tutti gli uid diversi da quello dell'autore**.
- Il pulsante di prova manda solo ai token del dispositivo corrente (o dell'uid corrente — a scelta del builder).
- Token rifiutati da FCM come non più validi (`UNREGISTERED` / 404) vengono cancellati dal DB.
- Il token va riletto all'avvio dell'app quando le notifiche sono attive, e aggiornato nel DB se cambia.

### Invio

- Nuove API: registrazione/rimozione token e invio prova (es. `POST /api/push` con azioni, o route separate — a scelta del builder), sempre dietro `apiHandler`.
- Gli invii partono dalle API esistenti **dopo** che la scrittura su Firebase è andata a buon fine; errori di invio vengono loggati e ignorati, la risposta all'utente resta `{ ok: true }`. Se possibile usare `platform.context.waitUntil` di Cloudflare per non far aspettare il client.
- Prodotto urgente: la PATCH riceve solo `{ u: true }`, quindi il server deve leggere il nome del prodotto dal DB per comporre il testo. Notificare solo se il prodotto **non era già** urgente (evita doppioni).
- Messaggio con `notification` (titolo/testo) e un link/dato con l'URL di destinazione (es. `/?tab=spese`, `/?tab=acquisto`). L'app all'avvio legge il parametro e imposta `currentTab`.

### Interfaccia: sezione "Notifiche" nelle Impostazioni (`SettingsModal.svelte`)

- Interruttore "Notifiche" acceso/spento per **questo dispositivo**.
  - Acceso → chiede il permesso iOS (dentro il tocco), ottiene il token, lo registra.
  - Spento → rimuove il token di questo dispositivo dal DB.
  - Lo stato iniziale dell'interruttore riflette permesso + token registrato (es. `localStorage` `cc_push` come cache, prefisso `cc_` come da convenzione).
- Pulsante "Invia notifica di prova", visibile quando l'interruttore è acceso.
- Messaggi di aiuto quando non si può attivare:
  - app aperta da Safari e non dalla Home → "Aggiungi l'app alla schermata Home per ricevere le notifiche";
  - permesso negato in iOS → "Attiva le notifiche per Casa nelle Impostazioni dell'iPhone".
- Stile coerente con il resto della modale.

## Vincoli

- SvelteKit 5 (runes), Cloudflare Pages, Firebase Realtime DB + Auth come oggi.
- Il DB locale è lo **stesso di produzione**: niente scritture di prova senza consenso.
- Test Vitest per la logica server (composizione testi, selezione destinatari, gestione token scaduti, nessuna notifica all'autore, salvataggio ok anche se FCM fallisce) e per i componenti toccati, come il resto del progetto.
- Aggiornare `CHANGELOG.md`, `CLAUDE.md` (nuovo segreto, nuova route, nuova chiave `cc_`, path `push`) e `README.md` se descrive la configurazione.

## Passi manuali dell'utente (fuori dal codice)

1. Generare la chiave VAPID in Firebase Console (la guida passo passo la dà il builder).
2. Aggiungere il segreto `NOTIFY_USERS` su Cloudflare Pages (produzione e anteprima) e in `.dev.vars`.
3. Eventuali regole di sicurezza Realtime DB per il nuovo path `push`, se le regole attuali lo richiedono.

## Test con un solo iPhone (deciso con l'utente)

1. iPhone (Alfonso, app dalla Home) → attiva notifiche → "Invia notifica di prova".
2. Chrome sul PC con l'account di Alina (login fatto da lei quando si arriva al test) → attiva notifiche.
3. Spesa aggiunta dal PC → arriva sull'iPhone; spesa/prodotto urgente dall'iPhone → arriva sul PC; nessuna notifica sul dispositivo dell'autore.

## Lasciato al builder

- Struttura esatta delle route API e dei nodi DB `push`.
- Service worker: file dedicato `firebase-messaging-sw.js` o integrazione in un service worker SvelteKit.
- Come mostrare lo stato "in corso" durante l'attivazione.
- Scrittura dei messaggi d'errore secondari.
