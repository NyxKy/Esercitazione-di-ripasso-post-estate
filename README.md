# EmojiCorp

SPA didattica in italiano con Angular 21, Bootstrap 5, routing e control flow `@for` / `@if`.
48 emoji suddivise in Animali, Frutta, Cibo e Veicoli.

## Avvio

Richiede una versione di Node supportata da Angular 21, ad esempio Node 24.14.

```bash
npm ci
npm start
```

Aprire http://localhost:4200. Il server aggiorna la pagina automaticamente.

```bash
npm run build
npm run test:ci
npx playwright install chromium
npm run test:e2e
```

La build si trova in `dist/emoji-corp/browser`. Per pubblicarla occorre configurare
l'hosting con fallback su `index.html` per le route Angular.
Playwright riusa il server locale; in CI avvia un server dedicato sulla porta 4200.

## Requisiti dell'esercitazione

- `src/app/emoji.data.ts`: interfacce esportabili `Emoji` e `EmojiCategory`, categorie tipizzate e dati.
- `src/app/app-routes.ts`: unico vettore `routes`, redirect iniziale a `/animals` e fallback.
- `src/app/pages.component.ts`: `AnimalsComponent`, `FruitsComponent` e `GenericComponent`.
- `src/app/catalog.component.*`: griglia Bootstrap condivisa, `@for`, ricerca, filtri e ordinamento.
- `src/app/app.component.html`: navbar, `routerLink`, `routerLinkActive` e `router-outlet`.
- `GenericComponent` riceve `ActivatedRoute` nel costruttore, sottoscrive `paramMap`,
  legge `params.get('id')` e aggiorna la categoria. `takeUntilDestroyed` chiude la sottoscrizione.
- `/animals` e `/fruits`: componenti classici.
- `/generic/animals`, `/generic/fruits`, `/generic/food`, `/generic/vehicles`: componente dinamico.
- Il selettore Classico/Dinamico permette di confrontare i due approcci.
- Le pagine sono caricate su richiesta con `loadComponent`.

## Funzionalita

Ricerca per nome, emoji o gruppo; filtri; ordine alfabetico; copia negli appunti;
raccolta di preferiti persistente in `localStorage`; scoperta casuale con dialog
accessibile; navbar mobile; gestione delle categorie inesistenti.
I preferiti sono locali al browser, non sincronizzati con un account.
La copia richiede HTTPS o localhost e il permesso del browser; in caso di errore
viene mostrato un messaggio con il simbolo da copiare manualmente.

## Design

`SKILL.md` e stato letto e mantenuto intatto. Il documento descrive MycoForm:
palette calcareo/terra/zinco, Syne e DM Mono, impaginazione editoriale asimmetrica,
sottolineature e movimento solo su interazione sono adattati al soggetto EmojiCorp.
Il catalogo mantiene la griglia Bootstrap richiesta dall'esercitazione.
Font e icone sono serviti localmente; le emoji sono caratteri Unicode nativi
e possono variare graficamente tra sistemi operativi.

L'aggiornamento della skill e applicato in `src/progressive-blur.css`: otto livelli
di blur da 0.5 a 64 px sul 25% inferiore della viewport, con `z-index: 5` e
`pointer-events: none`. Navbar, notifiche, footer e dialog rimangono leggibili
sopra l'effetto. La sfocatura si nasconde con focus da tastiera e con preferenze
di trasparenza ridotta o colori forzati.
Hero, catalogo e sezione universo occupano tutta la larghezza e almeno l'altezza
visibile sotto la navbar (`100dvh`, fallback `100svh`), senza ritagliare i contenuti
piu lunghi. Navbar e superfici decorative usano un blur traslucido aggiuntivo.

## Collaborazione Git e GitHub

Il repository locale ha gia un remote `origin`. Non sono stati creati account,
invitati collaboratori o pubblicati commit automaticamente.
Il GitHub Manager puo verificare il remote con `git remote -v` e invitare i membri
da Settings > Collaborators su GitHub.

Dopo aver revisionato i file, effettuare il primo commit e push:

```bash
git add .editorconfig .gitignore .prettierrc README.md SKILL.md angular.json package.json package-lock.json playwright.config.ts tsconfig.json tsconfig.app.json tsconfig.spec.json src public e2e
git commit -m "Add EmojiCorp catalog with static and dynamic routing"
git push -u origin main
```

Ogni membro lavora poi sul proprio branch:

```bash
git switch -c feature/nome-attivita
```

Ruoli consigliati: GitHub Manager (integrazione e pull request), UI/UX Designer
(CSS e accessibilita), Angular Developer 1 (catalogo e dati),
Angular Developer 2 (routing, raccolta e test).
Prima di aprire una pull request eseguire build e test; richiedere la revisione
di almeno un compagno e unire solo dopo esito positivo.
