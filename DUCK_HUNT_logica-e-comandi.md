# Duck Hunt NL — Logica di gioco e comandi in `script.js`

Documento tecnico che spiega **come funziona il gioco** e **cosa fa ogni comando/funzione/evento** di `script.js` (554 righe, JavaScript puro, nessuna libreria). I numeri di riga si riferiscono alla versione presente nello zip.

---

## Indice

1. [Panoramica](#1-panoramica)
2. [Comandi del giocatore](#2-comandi-del-giocatore)
3. [Costanti e configurazione](#3-costanti-e-configurazione)
4. [Lo stato del gioco (`statoGioco`)](#4-lo-stato-del-gioco-statogioco)
5. [Macchina a stati: le fasi della partita](#5-macchina-a-stati-le-fasi-della-partita)
6. [Ciclo di una partita, passo per passo](#6-ciclo-di-una-partita-passo-per-passo)
7. [Regole: anatre, traiettorie, round](#7-regole-anatre-traiettorie-round)
8. [Sparo, hitbox e punteggio](#8-sparo-hitbox-e-punteggio)
9. [Game loop e tempo (`requestAnimationFrame`)](#9-game-loop-e-tempo)
10. [Rendering su canvas](#10-rendering-su-canvas)
11. [Gestione degli eventi (mouse, touch, tastiera)](#11-gestione-degli-eventi)
12. [Flusso asincrono e "gettone di partita"](#12-flusso-asincrono-e-gettone-di-partita)
13. [Caricamento della grafica e avvio](#13-caricamento-della-grafica-e-avvio)
14. [Riferimento rapido: tutte le funzioni](#14-riferimento-rapido-tutte-le-funzioni)
15. [Note e incongruenze con il README](#15-note-e-incongruenze-con-il-readme)

---

## 1. Panoramica

Duck Hunt NL è uno sparatutto arcade a **un solo bersaglio alla volta**:

- una partita = **5 round**;
- ogni round = **10 bersagli** (anatre);
- per ogni anatra il giocatore ha **3 colpi**;
- l'anatra attraversa il campo da un lato all'altro; se esce dallo schermo, scade il tempo di volo o finiscono i colpi, è **mancata** e si passa alla successiva;
- più si avanza nei round, più le anatre sono **veloci**, hanno **meno tempo** e volano in modo **meno prevedibile**.

Tutto il gioco gira su un unico `<canvas id="gameCanvas">`, ridisegnato ~60 volte al secondo. L'interfaccia HTML (punteggi, overlay, pulsante, barra di stato) viene aggiornata da JavaScript tramite `textContent`.

---

## 2. Comandi del giocatore

| Azione | Mouse / tastiera | Touch (telefono/tablet) | Codice responsabile |
| --- | --- | --- | --- |
| **Mirare** | Muovere il puntatore sul canvas | Trascinare il dito sul canvas | `pointermove` → `puntaMira()` |
| **Sparare** | Clic sinistro **oppure** tasto **Spazio** | **Tocco** senza trascinare (sparo al rilascio) | `pointerdown` / `pointerup` / `keydown` → `spara()` |
| **Iniziare la partita** | Pulsante *Inizia a giocare* **oppure** tasto **Invio** (solo nella schermata iniziale) | Pulsante | `click` su `#startButton` / `keydown` → `avviaPartita()` |
| **Rigiocare** | Pulsante *Gioca ancora* | Pulsante | `click` su `#startButton` |
| Nascondere il mirino | Il puntatore esce dal canvas | Rilascio o annullamento del tocco | `pointerleave` / `pointerup` / `pointercancel` |

Dettagli importanti:

- Il **clic** spara **subito** alla pressione (`pointerdown`). Solo il tasto sinistro (`evento.button === 0`) conta.
- **Spazio** spara dove si trova già il mirino (l'ultima posizione nota del puntatore) e blocca lo scroll della pagina (`preventDefault`).
- **Invio** funziona solo quando `fase === "pronta"` (prima partita dopo il caricamento). A fine partita (`"conclusa"`) per rigiocare serve il pulsante.
- Sul **touch** il dito serve per mirare *e* per sparare: se tra tocco e rilascio il dito si sposta di **più di 12 px** (`144` è il quadrato di 12) il gesto viene considerato un trascinamento e **non spara**; così non partono colpi accidentali.
- Il **mirino è visibile solo durante il volo** (`fase === "inCorso"`) e solo se il puntatore è sul canvas.

---

## 3. Costanti e configurazione

### Regole di gioco

| Costante | Valore | Significato |
| --- | ---: | --- |
| `BERSAGLI_PER_TURNO` | `10` | Anatre per round |
| `NUMERO_TURNI` | `5` | Round per partita |
| `COLPI_PER_ANATRA` | `3` | Colpi disponibili per ogni anatra |
| `PUNTI_PER_COLPO` | `[100, 60, 30]` | Punti se l'anatra cade al 1°, 2°, 3° colpo |
| `IMPOSTAZIONI` | `{ tempoVolo: 4.5, velocita: 360 }` | Velocità base (px/s su 800 px) e tempo di volo base (s) |
| `CHIAVE_RECORD` | `"duck-hunt-best-score"` | Chiave del `localStorage` per il record |
| `SFONDI_TURNI` | 5 coppie `[file, nome]` | Sfondo e nome di ogni round |

### Animazione

| Asset | Uso |
| --- | --- |
| GIF in `gif/` | Sfondi animati dei cinque round, volo dell'anatra nelle sei varianti di direzione e caduta |
| `DURATA_CADUTA` (`1.05 s`) | Durata della caduta prima del bersaglio successivo |

### Dimensioni dinamiche

`LARGHEZZA` e `ALTEZZA` partono da 800 × 480 ma vengono **sovrascritte** da `adattaCanvas()` con la dimensione reale del canvas sullo schermo. Tutte le posizioni e velocità sono espresse in queste unità e **scalate** quando la finestra cambia.

---

## 4. Lo stato del gioco (`statoGioco`)

Un unico oggetto contiene tutto ciò che cambia durante la partita (righe 65-84).

| Campo | Tipo | Descrizione |
| --- | --- | --- |
| `fase` | stringa | Fase corrente (vedi §5) |
| `turno` | numero | Round attuale (1–5) |
| `bersagliTurno` | numero | Quanti bersagli sono già stati *chiusi* nel round (0–10) |
| `anatreColpite` / `anatreMancate` | numero | Contatori della partita |
| `colpiSparati` | numero | Totale colpi sparati (per la precisione) |
| `punteggio` | numero | Punti correnti |
| `recordPersonale` | numero | Miglior punteggio letto da `localStorage` |
| `recordDisponibile` | booleano | `false` se il browser blocca `localStorage` |
| `colpi` | numero | Colpi rimasti per l'anatra attuale (3 → 0) |
| `anatra` | oggetto/`null` | L'anatra in volo (vedi §7) |
| `anatraInCaduta` | oggetto/`null` | Animazione di caduta dell'anatra colpita |
| `esitoColpo` | oggetto/`null` | Anello + etichetta "+punti"/"MANCATO" dell'ultimo sparo |
| `gestoTouch` | oggetto/`null` | Tocco in corso `{ inizioX, inizioY, spostato }` |
| `mira` | `{ x, y, visibile }` | Posizione del mirino nel campo |
| `ultimoTempo` | numero | Timestamp dell'ultimo frame (per il delta time) |
| `gettonePartita` | numero | Contatore che invalida le pause asincrone vecchie (§12) |
| `graficaCaricata` | booleano | `true` quando tutte le immagini sono pronte |

---

## 5. Macchina a stati: le fasi della partita

`statoGioco.fase` può valere:

| Fase | Quando | Cosa è permesso |
| --- | --- | --- |
| `"pronta"` | Dopo il caricamento, prima della prima partita | Invio / pulsante per iniziare. Compare il **cane** |
| `"traRound"` | Schermata di annuncio "ROUND N" (1,8 s) | Niente (gli spari sono ignorati) |
| `"inCorso"` | Un'anatra sta volando | **Unica fase in cui `spara()` funziona** e in cui `aggiornaAnatra()` gira |
| `"traBersagli"` | Pausa dopo un bersaglio (0,9 s o 1,05 s se colpita) | Niente |
| `"conclusa"` | Fine partita, overlay con statistiche | Solo il pulsante *Gioca ancora* |

```
                      avviaPartita()
        pronta ───────────────────────────────┐
                                              ▼
        conclusa ──(Gioca ancora)──►  traRound ──(1,8 s)──► lanciaAnatra()
           ▲                                                      │
           │                                                      ▼
           │                                                  inCorso ◄──────────┐
           │                                  colpita / scappata / colpi finiti  │
           │                                                      │              │
           │                                                      ▼              │
           │                                                 traBersagli ─(pausa)┤ bersaglio < 10
           │                                                      │              │
           │                                  bersaglio = 10      ▼              │
           │                  ultimo round ◄──────────────────────┴──► nuovo round: traRound
           └──────────────── terminaPartita()
```

---

## 6. Ciclo di una partita, passo per passo

1. **Caricamento** — gli sfondi, le varianti GIF dell'anatra e della caduta, il mirino e il cane vengono caricati con `Promise.all`. Finché non sono pronti il pulsante è disabilitato con scritta *"Caricamento…"*. Se un asset fallisce, appare *"Grafica non disponibile"*.
2. **Schermata iniziale** (`pronta`) — sfondo del round 1 con il cane al centro e l'overlay *"Pronta la mira?"*.
3. **`avviaPartita()`** — incrementa il gettone, **azzera** tutti i contatori (turno 1, punteggio 0, ecc.) e mostra l'intro del round.
4. **`mostraIntroTurno()`** — fase `traRound`, overlay *"ROUND N · nome scenario"* per **1,8 s**, poi chiama `lanciaAnatra()`.
5. **`lanciaAnatra()`** — fase `inCorso`, crea l'anatra (`creaAnatra()`), nasconde l'overlay, scrive nella barra di stato *"Turno X · bersaglio Y/10: prendi la mira!"*.
6. **Durante il volo** — ogni frame `aggiornaAnatra()` muove l'anatra. Il giocatore può sparare fino a 3 volte (`spara()`).
7. **Fine bersaglio** — in tre casi si chiama `continuaPartita()`:
   - anatra **colpita** (animazione di caduta);
   - **3 colpi esauriti** senza colpire;
   - anatra **scappata** (tempo scaduto o uscita dallo schermo).
8. **`continuaPartita()`** — fase `traBersagli`, `bersagliTurno += 1`, pausa (0,9 s, oppure 1,05 s se si deve mostrare la caduta), poi:
   - se il round non è finito → `lanciaAnatra()`;
   - se è finito ed era il round 5 → `terminaPartita()`;
   - altrimenti `turno += 1`, `bersagliTurno = 0` e `mostraIntroTurno()` (cambia lo sfondo).
9. **`terminaPartita()`** — fase `conclusa`, salva il record se battuto, mostra punteggio, anatre abbattute su 50, mancate, precisione, colpi sparati; il pulsante diventa *"Gioca ancora"*.

> **Nota:** un bersaglio conta come "affrontato" sia se colpito sia se mancato. Per questo un round dura sempre esattamente 10 bersagli e una partita 50.

---

## 7. Regole: anatre, traiettorie, round

### Creazione dell'anatra — `creaAnatra()` (righe 246-272)

Ogni volta che parte un bersaglio viene generato `statoGioco.anatra` con questi campi:

| Campo | Come viene calcolato |
| --- | --- |
| `x` | Parte **fuori schermo**: a sinistra (`-40·scala`) se va verso destra, a destra (`LARGHEZZA + 40·scala`) se va verso sinistra. La direzione è **casuale 50/50** |
| `quotaBase` / `y` | Quota centrale di volo, tra il 28 % e il 48 % dell'altezza in tutti i round |
| `velocitaX` | `±velocita`, con `velocita = 360 · (1 + (turno−1)·0,18) · scalaGioco()` |
| `velocitaY` | Parte da 0 e viene aggiornata in base alla traiettoria |
| `tipoTraiettoria` | Round 1–3: `"onda"`. Round 4–5: a caso tra `"onda"`, `"zigzag"`, `"tuffo"` |
| `ampiezzaTraiettoria` | `min(70 + (turno−1)·8, 20 % dell'altezza)` |
| `frequenzaTraiettoria` | `1,7 + turno·0,25` |
| `faseTraiettoria` | Fase iniziale casuale dell'onda (0–2π) |
| `tempoResiduo` | `max(2,1 ; 4,5 − (turno−1)·0,35)` secondi di volo |
| Direzione GIF | GIF di volo scelto in base alla direzione orizzontale; la traiettoria verticale è gestita dal movimento |

In più: `colpi` torna a **3** e il pannello viene aggiornato.

### Tabella riassuntiva per round (a 800×480, difficoltà impostata nel codice)

| Round | Scenario | Velocità (px/s) | Tempo di volo | Traiettoria | Ampiezza onda |
| :---: | --- | ---: | ---: | --- | ---: |
| 1 | Prato classico | 360 | 4,50 s | onda | 70 |
| 2 | Primavera | 425 | 4,15 s | onda | 78 |
| 3 | Autunno | 490 | 3,80 s | onda | 86 |
| 4 | Inverno | 554 | 3,45 s | onda / zigzag / tuffo | 94 |
| 5 | Galassia (mirino bianco) | 619 | 3,10 s | onda / zigzag / tuffo | 96 |

### Movimento — `aggiornaAnatra(intervallo)` (righe 381-415)

A ogni frame:

1. **Avanzamento orizzontale:** `x += velocitaX · intervallo`.
2. **Movimento verticale**, in base al tipo:
   - **Onda:** `y = quotaBase + sin(t·frequenza + fase) · ampiezza`.
   - **Zigzag:** come l'onda, ma sommando una seconda sinusoide più veloce (`sin(2,2·angolo)·0,3`), normalizzata, per un movimento spigoloso.
   - **Tuffo:** l'onda è moltiplicata per un fattore lento (`0,55 … 1,0`) che fa alternare fasi di oscillazione ampia e ridotta.
   - Per le onde `velocitaY` viene ricalcolata come derivata (coseno) per mantenere il movimento coerente con la curva.
3. **Timer di volo:** `tempoResiduo -= intervallo`.
4. **Animazione alare:** il browser riproduce il GIF di volo scelto per direzione e inclinazione.
5. **Fuga:** se `tempoResiduo ≤ 0` **oppure** l'anatra supera il margine (`55·scala` px) a sinistra o a destra → `anatreMancate += 1` e `continuaPartita(..., "La papera è scappata.")`.

---

## 8. Sparo, hitbox e punteggio

### `spara()` (righe 417-446)

```
se fase ≠ "inCorso" oppure colpi = 0 → esce senza fare nulla
colpi -= 1;  colpiSparati += 1
colpita = |mira.x − anatra.x| < 27·scala  E  |mira.y − anatra.y| < 21·scala
numeroColpo = 3 − colpi        (1° / 2° / 3° colpo)
punti = colpita ? PUNTI_PER_COLPO[numeroColpo−1] : 0
esitoColpo = { x, y, colpita, punti }     ← feedback visivo di 0,52 s
```

Poi:

- **Colpita:** aggiunge i punti, `anatreColpite += 1`, toglie l'anatra dal volo, crea `anatraInCaduta` (parte da `x`, `y` dell'anatra con una piccola deriva orizzontale pari all'8 % della sua velocità) e chiama `continuaPartita(..., mostraCaduta = true)`. **Un solo colpo a segno chiude il bersaglio**: i colpi residui vanno persi.
- **Mancata con colpi rimasti:** nessun cambio di fase, solo messaggio *"Mancato. Restano N colpi."*.
- **Mancata all'ultimo colpo:** `anatreMancate += 1` e `continuaPartita(..., "Colpi esauriti: papera mancata.")`.

### Hitbox

Rettangolo centrato sull'anatra di **±27 px in orizzontale e ±21 px in verticale** (cioè 54 × 42 px a scala 1), moltiplicato per `scalaGioco()`. Non è un cerchio: è un controllo `|dx| < 27 e |dy| < 21`.

### Punteggio

| Colpo che abbatte l'anatra | Punti |
| --- | ---: |
| Primo | 100 |
| Secondo | 60 |
| Terzo | 30 |

Massimo teorico: `10 · 5 · 100 = 5000` punti. A fine partita:

- **Precisione** = `round(anatreColpite / colpiSparati · 100)` %, oppure 0 se non si è mai sparato;
- **Record**: se `punteggio > recordPersonale` viene scritto in `localStorage` (dentro `try/catch`; se fallisce `recordDisponibile = false` e il gioco continua senza record).

---

## 9. Game loop e tempo

`aggiornaFotogramma(tempoAttuale)` (righe 458-469) è chiamata da `requestAnimationFrame` e si richiama da sola ad ogni frame:

1. Calcola il **delta time**: `intervallo = min((tempoAttuale − ultimoTempo)/1000, 0,05)`. Il limite di **0,05 s** impedisce salti enormi se la scheda del browser viene messa in background.
2. Se `fase === "inCorso"` → `aggiornaAnatra(intervallo)`.
3. Se c'è una caduta in corso → ne avanza il timer.
4. Se c'è un `esitoColpo` → ne avanza il timer; a **0,52 s** viene azzerato (`null`).
5. `disegna()` ridisegna tutta la scena.
6. Richiede il frame successivo.

Poiché movimento e timer usano `intervallo` e non il numero di frame, il gioco ha la **stessa velocità a 60, 120 o 144 Hz**.

---

## 10. Rendering su canvas

### `adattaCanvas()` (righe 88-110)

Eseguita all'avvio e a ogni `resize`:

- legge la dimensione reale del canvas (`getBoundingClientRect`);
- imposta la risoluzione interna con il `devicePixelRatio` (**massimo 2**) per nitidezza su schermi retina;
- applica `contesto.setTransform(...)` così si disegna sempre in coordinate "logiche";
- **riscala** tutto ciò che è in gioco (posizioni e velocità dell'anatra, caduta, esito colpo) con il rapporto tra vecchia e nuova dimensione, tramite l'helper `moltiplica()`;
- rimette il mirino al centro.

### `scalaGioco()`

`max(0,65 ; min(LARGHEZZA/800 ; ALTEZZA/480 ; 2))`: fattore unico che adatta sprite, velocità, hitbox e testi alla dimensione dello schermo (tra 0,65× e 2×).

### Funzioni di disegno (chiamate in ordine da `disegna()`)

| Ordine | Funzione | Cosa disegna |
| :---: | --- | --- |
| 1 | `disegnaSfondo()` | Riempie di blu `#2599ee`, poi l'immagine di sfondo del round (`sfondi[turno-1]`) in modalità *cover* centrata |
| 2 | `disegnaAnatra()` | Anatra in volo (solo se esiste) |
| 3 | `disegnaCaduta()` | Anatra che cade |
| 4 | `disegnaEsitoColpo()` | Anello + raggi (colpita, giallo `#f6cf58`) o croce (mancata, rosso `#ed6858`) + etichetta |
| 5 | `disegnaCaneIntro()` | Il cane, **solo** in fase `pronta` |
| 6 | `disegnaMirino()` | Mirino sopra a tutto, solo in `inCorso` e se `mira.visibile` |

**`disegnaSprite(sprite, [sx,sy,sl,sa], cx, cy, l, a)`** è l'helper comune: disattiva lo smoothing (pixel art nitida) e disegna il ritaglio `[sx,sy,sl,sa]` dello sprite sheet centrato in `(cx, cy)` con dimensione `l × a`.

**Scelta dello sprite dell'anatra** (`disegnaAnatra`): lo sprite sheet ha **6 righe da 128 px**:

| Riga | Direzione | Condizione |
| :---: | --- | --- |
| 0 | Destra | movimento prevalentemente orizzontale, `velocitaX > 0` |
| 1 | Sinistra | movimento prevalentemente orizzontale, `velocitaX < 0` |
| 2 | Su-destra | `|velocitaY| > 0,45·|velocitaX|` e sale, verso destra |
| 3 | Su-sinistra | idem, verso sinistra |
| 4 | Giù-destra | `|velocitaY| > 0,45·|velocitaX|` e scende, verso destra |
| 5 | Giù-sinistra | idem, verso sinistra |

La colonna è `anatra.fotogramma` (0–8). Il ritaglio usa le tabelle `COLONNE_SPRITE_ANATRE`, `BORDI_SUPERIORI_ANATRE`, `BORDI_INFERIORI_ANATRE` più un margine di 2 px, e la dimensione a schermo è limitata a circa **82 × 68 px** × `scalaGioco()`.

**Caduta** (`disegnaCaduta`): il fotogramma dipende dal tempo (`tempoTrascorso / TEMPO_FOTOGRAMMA_CADUTA`, bloccato sull'ultimo); l'ordinata scende con andamento **quadratico** (`progresso²`, accelera come in caduta libera) da `inizioY` fino al **78 % dell'altezza**; scala `0,48·scalaGioco()`.

**Esito colpo** (`disegnaEsitoColpo`): raggio che cresce da 9 a 36 px mentre l'opacità scende da 1 a 0 in 0,52 s. Se colpita: 8 raggi attorno all'anello e testo `+punti`; se mancata: una X e il testo `MANCATO`.

**Mirino** (`disegnaMirino`): 48 px × `scalaGioco()`; nel **round 5** usa `mirino-bianco.png` (leggibile sullo sfondo scuro della galassia), negli altri `mirino.png`.

---

## 11. Gestione degli eventi

Tutti gli eventi sono registrati in fondo al file (righe 471-519).

| Riga | Evento | Bersaglio | Cosa fa |
| ---: | --- | --- | --- |
| 471 | `click` | `#startButton` | `avviaPartita()` |
| 474 | `pointermove` | canvas | `puntaMira(evento)`; per il touch controlla se il dito si è spostato di > 12 px e in tal caso imposta `gesto.spostato = true` |
| 482 | `pointerleave` | canvas | Nasconde il mirino |
| 484 | `pointerdown` | canvas | Solo tasto sinistro. Aggiorna la mira. **Mouse/penna:** `spara()` subito. **Touch:** `preventDefault`, `setPointerCapture` e registra `gestoTouch` (punto iniziale, `spostato: false`) |
| 493 | `pointerup` | canvas | Solo touch. Se il gesto **non** è stato un trascinamento → aggiorna la mira e `spara()`. In ogni caso nasconde il mirino |
| 504 | `pointercancel` | canvas | Solo touch. Annulla il gesto e nasconde il mirino |
| 510 | `keydown` | `window` | `Space` → `preventDefault()` + `spara()`. `Enter` in fase `pronta` → `avviaPartita()` |
| 519 | `resize` | `window` | `adattaCanvas()` |

### `puntaMira(evento)` (righe 448-456)

Converte le coordinate dello schermo in coordinate del campo:

```
x = (clientX − limiti.left) · LARGHEZZA / limiti.width
y = (clientY − limiti.top)  · ALTEZZA  / limiti.height
```

Questo funziona anche se il canvas è mostrato a una dimensione diversa da quella logica (CSS responsive). Imposta `mira.visibile = true` e restituisce la mira.

Gli eventi **pointer** unificano mouse, touch e penna con un solo codice; `evento.pointerType` distingue `"mouse"`, `"pen"` e `"touch"`.

---

## 12. Flusso asincrono e "gettone di partita"

Le pause (tra bersagli, tra round) sono scritte con `async/await` e `attendi(ms)`:

```js
const attendi = (ms) => new Promise((completa) => setTimeout(completa, ms));
```

**Problema:** se durante una pausa il giocatore ricomincia una partita (o la partita finisce), la pausa "vecchia" si risveglia dopo e potrebbe lanciare un'anatra a sproposito.

**Soluzione:** `statoGioco.gettonePartita` è un contatore che viene incrementato in `avviaPartita()` e in `terminaPartita()`. Ogni funzione asincrona (`continuaPartita`, `mostraIntroTurno`) riceve il valore del gettone al momento della chiamata e, **dopo l'attesa**, controlla:

```js
if (statoGioco.fase !== "traBersagli" || statoGioco.gettonePartita !== gettone) return;
```

Se il gettone è cambiato (o la fase non è più quella attesa), la funzione **esce senza fare nulla**: la pausa è "scaduta".

Tempi di attesa usati:

| Dove | Durata |
| --- | ---: |
| Dopo un bersaglio mancato/scappato | 900 ms |
| Dopo un bersaglio colpito (per mostrare la caduta) | 1050 ms (`DURATA_CADUTA · 1000`) |
| Annuncio del nuovo round | 1800 ms |

---

## 13. Caricamento della grafica e avvio

Sequenza eseguita al caricamento della pagina (righe 521-554):

1. `adattaCanvas()` — dimensiona il canvas.
2. Lettura del record: `localStorage.getItem("duck-hunt-best-score")` convertito con `parseInt`, minimo 0. In caso di errore (`catch`) → `recordDisponibile = false`.
3. `aggiornaPannello()` — mostra i valori iniziali.
4. `requestAnimationFrame(aggiornaFotogramma)` — **parte subito il game loop** (anche prima che le immagini siano caricate: disegna solo il fondo blu).
5. `caricaImmagine(percorso)` — promessa che si risolve in `onload` e si rifiuta in `onerror`.
6. `Promise.all([...])` carica in parallelo, in quest'ordine:
   - i **5 sfondi** (`./img/<nome>.png`),
   - `frame-anatra.png`, `anatra morta frame.png`, `mirino.png`, `mirino-bianco.png`, `frame-cane.png`.
7. **Successo:** `immagini.splice(-5)` estrae le ultime 5 (sprite anatre, caduta, mirini, cane); le 5 rimaste sono gli `sfondi`. Poi `graficaCaricata = true`, il pulsante si abilita con la scritta *"Inizia a giocare"*.
8. **Errore:** overlay *"Grafica non disponibile"* con il messaggio d'errore, pulsante disabilitato.

---

## 14. Riferimento rapido: tutte le funzioni

| Funzione | Righe | Scopo |
| --- | ---: | --- |
| `$(selettore)` | 1 | Scorciatoia per `document.querySelector` |
| `moltiplica(oggetto, chiavi, fattore)` | 86 | Moltiplica per un fattore le proprietà indicate di un oggetto (se esiste); usata nel ridimensionamento |
| `adattaCanvas()` | 88 | Adatta risoluzione e riscala gli oggetti in gioco |
| `scalaGioco()` | 112 | Fattore di scala 0,65–2 in base alle dimensioni |
| `mostraStato(messaggio, modalita)` | 116 | Scrive nella barra di stato e colora il pallino (`is-loading`, `is-active`, nessuna) |
| `formatta(valore)` | 121 | Numero con zeri iniziali a 5 cifre (`00120`) |
| `aggiornaPannello()` | 123 | Aggiorna round, bersagli, punteggio, record e munizioni (anche `aria-label`) |
| `disegnaSprite(...)` | 132 | Disegna un ritaglio di sprite centrato, senza smoothing |
| `disegnaSfondo()` | 137 | Sfondo del round corrente |
| `disegnaAnatra(anatra)` | 148 | Anatra in volo con sprite in base alla direzione |
| `disegnaMirino()` | 162 | Mirino (standard o bianco) |
| `disegnaCaduta()` | 170 | Animazione di caduta |
| `disegnaEsitoColpo()` | 183 | Feedback del colpo (anello, raggi/X, testo) |
| `disegnaCaneIntro()` | 231 | Cane della schermata iniziale |
| `disegna()` | 237 | Orchestra il disegno di tutta la scena |
| `creaAnatra()` | 246 | Genera una nuova anatra con parametri del round |
| `attendi(ms)` | 274 | Pausa asincrona |
| `nascondiOverlay()` | 276 | Nasconde il pannello centrale e ripristina il pulsante |
| `continuaPartita(gettone, messaggio, mostraCaduta)` | 282 | Chiude un bersaglio, attende, decide cosa viene dopo |
| `mostraIntroTurno(gettone)` | 310 | Mostra "ROUND N" per 1,8 s poi lancia l'anatra |
| `terminaPartita()` | 326 | Fine partita: record, statistiche, "Gioca ancora" |
| `lanciaAnatra()` | 360 | Fase `inCorso` + nuova anatra |
| `avviaPartita()` | 370 | Azzera tutto e comincia dal round 1 |
| `aggiornaAnatra(intervallo)` | 381 | Movimento, animazione e fuga dell'anatra |
| `spara()` | 417 | Gestisce un colpo: hitbox, punti, esito |
| `puntaMira(evento)` | 448 | Da coordinate schermo a coordinate campo |
| `aggiornaFotogramma(tempoAttuale)` | 458 | Game loop |
| `caricaImmagine(percorso)` | 530 | Carica un'immagine come promessa |

---

## 15. Note e incongruenze con il README

Analizzando il codice sono emerse alcune differenze rispetto al `README.md` del progetto:

1. **Selettore di difficoltà assente.** Il README descrive tre livelli (Facile 230 / Normale 360 / Difficile 500) e una costante `LIVELLI_DIFFICOLTA`, ma in `script.js` **non esiste** e `index.html` non contiene alcun selettore. Il gioco usa un'unica configurazione fissa, `IMPOSTAZIONI = { tempoVolo: 4.5, velocita: 360 }`, corrispondente al livello "Normale". Anche il messaggio di stato iniziale (*"Scegli la difficoltà e inizia"*, riga 546) è quindi un residuo.
2. **Invio a fine partita.** Il README dice che Invio avvia la partita; nel codice funziona **solo nella schermata iniziale** (`fase === "pronta"`). Dopo una partita conclusa serve il pulsante *Gioca ancora*.
3. **`volo anatra speciale.png`** è presente nella cartella `img` ma non viene mai caricato dal codice.
4. **Cane:** compare solo nella schermata iniziale (`fase === "pronta"`), non dopo una partita conclusa.

---

*Documento generato dall'analisi di `script.js` e `index.html` del progetto Duck Hunt NL — © Varisco Nicolò · Androni Lorenzo*
