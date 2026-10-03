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
Effetto "vetro liquido" (liquid glass) su navbar e dock delle categorie.
Nessuna animazione globale della pagina: le animazioni riguardano solo gli
elementi interattivi e i dettagli di sfondo. Questi ultimi vivono di vita propria
ma lentamente: due strati di **aloni ambientali** fissi (viola e lavanda, in
`body::before` a 22 s e `html::before` a 31 s, in controfase, con derive di ±9%
e respiro di scala) si muovono su ogni pagina — non solo nell'hero —, i **due
anelli** dell'hero (`.orbital-outer` solido che pulsa di scala in 16 s,
`.orbital-inner` tratteggiato che ruota in 90 s, piu i due puntini che derivano
in 11 s e 14 s), la grana di carta "bolle" con scatti discreti di
posizione (1,6 s, il pattern si ripete ogni 160 px quindi non si vedono bordi),
gli aloni sfocati dell'hero derivano in 26 s e 34 s e le emoji dell'hero
galleggiano in 7 s con ritardi negativi, cosi non sono mai sincronizzate. Gli
strati ambientali stanno a `z-index: 0` e `app-root` sale a 1, quindi non coprono
mai il contenuto. (switch Classico/Dinamico con indicatore scorrevole, chip
dei filtri con pillola a molla al clic, link della dock con pillola scorrevole
e nessun altro riscontro in hover (solo l'icona si anima). Micro-interazioni: i pulsanti si comprimono alla pressione
(`scale(0.97)`, 160 ms), le pillole di dock, switch e chip si **sollevano** sia
quando le trascini sia dopo 180 ms di pressione prolungata (`scale(1.08)`, cosi
un click rapido non lampeggia) e tornano giu al rilascio; le stesse pillole hanno
un **riflesso interno** (velo chiaro che sfuma verso il basso piu un filo di luce
sul bordo superiore) che le fa leggere come gocce di vetro, il badge del
conteggio **pulsa** quando cambia la vista o il gruppo scelto (e mostra il numero
filtrato: "6 emoji" con un gruppo attivo), l'anello di focus usa l'accento, il dialog "Sorprendimi" entra ed esce dallo stesso lato
(240 ms) e gli stati vuoti entrano in dissolvenza. Le animazioni seguono la skill
`animate` di Emil Kowalski, con le curve condivise in `:root`: la capsula della
dock si rivela con `clip-path` in 320 ms — la stessa animazione nei due modi e
senza opacita in ingresso, cosi il passaggio Classico/Dinamico non lampeggia — e
la pillola della categoria attiva scorre tra le voci con una molla da 400 ms
(solo `transform`: le colonne sono di pari larghezza), il menu mobile e un pannello sovrapposto
che cresce dall'angolo del pulsante (180 ms, in entrata e in uscita) e la griglia
entra con una dissolvenza di 200 ms quando cambia categoria — mai mentre si
digita nella ricerca. La capsula della dock si puo anche **trascinare** (mouse,
penna o dito; con `touch-action: pan-y` lo scroll verticale resta al browser):
le voci restano ferme ed e la **pillola** a seguire il gesto, come il pollice di
un cursore — trascinando a destra si passa alla categoria successiva, a sinistra
alla precedente, e l'aggancio puo attraversarne due o tre in un solo gesto
(tinta e posizione si aggiornano durante il movimento, senza mai uscire dalla
capsula e con aggancio anche su una flick veloce). Anche lo switch Classico/Dinamico
si trascina: la sua pillola segue il gesto (al massimo di una voce, perche i modi
sono due) e il modo cambia al rilascio. La riga dei chip dei gruppi ("Tutti", ...)
funziona allo stesso modo: la pillola segue il gesto e al rilascio si aggancia al
chip il cui centro e piu vicino — qui si misurano le posizioni reali, perche i
chip hanno larghezze diverse (69, 100, 85 px...). Passando da Classico a Dinamico
la capsula si rivela dal centro verso i bordi e Cibo e Veicoli compaiono in
sequenza. I link
della dock e dello switch hanno `draggable="false"` e `-webkit-user-drag: none`,
cosi una pressione prolungata non trascina fuori il collegamento. Gli hover
(icona della categoria, icone dei pulsanti, emoji delle card) vivono dentro
`@media (hover: hover) and (pointer: fine)` e muovono solo `transform`. Con
`prefers-reduced-motion` restano le dissolvenze e spariscono gli spostamenti. In modalità Classico la dock mostra solo Animali
e Frutta; in modalità Dinamico spuntano anche Cibo e Veicoli con effetto molla.
Le skill di riferimento sono in `skills/`.
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

Il sistema visivo nasce da quattro skill applicate in sequenza (dettagli e fonti
in `skills/`): `frontend-design` per la direzione, `ui-ux-pro-max` per il
consolidamento, `taste-skill` per togliere il sapore di template e `impeccable`
per la revisione finale. Il risultato: un solo accento (blu-viola) usato come
riempimento e mai come testo, testo non sotto i 12 px con corpo a 16 px, target
touch da 44 px su puntatori grossolani, superfici "clay" con doppia ombra,
grana di carta su uno strato fisso, icone di categoria disegnate a mano in SVG
al posto delle emoji di navigazione, e le superfici del browser (selezione,
caret, scrollbar, focus) vestite con la stessa palette. Sono stati rimossi i
kicker sopra i titoli, la fascia di numeri giganti e i numeri di indice sulle card.

La palette non viene piu dal documento MycoForm ma dai `DESIGN.md` di
[awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (formato
Google Stitch): struttura dei neutri da **PostHog**, tinte di categoria da
**PostHog** e **Airtable**, con un accento **blu-viola** scelto per questa
versione. Il sistema e: canvas freddo `#eeeff4`, card quasi bianche `#fcfcfe`,
inchiostro `#22232e`, testo `#4d4e58`, accento `#6c5ce7` (solo riempimenti, bianco
sopra = 4.86:1) con `#4a3ac4` per testo e stati (sul canvas = 6.79:1), tinte
pastello per la pillola dei chip `#e8e5fb` / `#cdc7f4`, e quattro tinte pastello
che identificano le famiglie: animali
`#d9eddf`, frutta `#f7d6d3`, cibo `#fbe6bd`, veicoli `#dceaf6`. Le tinte
compaiono dove portano informazione (pillola attiva della dock, badge del
conteggio, tile dell'hero) e mai come decorazione sparsa.

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
