# Duck Hunt NL

Un gioco arcade in pixel art ispirato a Duck Hunt, realizzato con HTML, CSS e JavaScript puro. Il progetto comprende un sito informativo e una pagina di gioco, senza framework o dipendenze esterne.

**Autori:** Varisco Nicolò · Androni Lorenzo

## Avvio

1. Conserva l’intera cartella del progetto, comprese `img` e `gif`.
2. Apri `index.html` in un browser desktop aggiornato.
3. Premi **Gioca ora** per aprire `gioco.html`.
4. Attendi il caricamento delle immagini e premi **Inizia a giocare**.

È possibile aprire direttamente `gioco.html`. Le risorse sono locali, quindi non è necessaria una connessione Internet per giocare. Il browser deve supportare i video MP4 inclusi.

## Comandi

| Azione | Comando |
| --- | --- |
| Mirare | Muovere il mouse sul campo |
| Sparare | Clic sinistro oppure Spazio |
| Avviare la prima partita | Pulsante oppure Invio nella fase iniziale |
| Mettere in pausa / riprendere | P oppure Esc durante il volo |
| Riprendere dalla pausa | Anche pulsante Riprendi |
| Rigiocare a fine partita | Pulsante Gioca ancora |

Il gioco è pensato per mouse e tastiera. Il layout si adatta alla finestra, ma non è implementata una gestione dedicata dei gesti touch. La pausa si attiva durante il volo, non durante le introduzioni o le attese tra bersagli.

## Regole e punteggio

- Una partita comprende **5 round da 10 bersagli**, per un totale di 50 anatre.
- Ogni anatra concede **3 colpi**, ripristinati al bersaglio successivo.
- Colpire al primo tentativo assegna **100 punti**, al secondo **60**, al terzo **30**.
- Un’anatra è mancata se esaurisci i colpi, se termina il suo tempo di volo o se esce dal campo.
- Ogni bersaglio conta per completare il round, sia colpito sia mancato.
- Dopo un colpo a segno viene mostrata la caduta; il campo indica anche l’esito dello sparo.

Il massimo teorico è `5 × 10 × 100 = 5000 punti`. Alla fine vengono mostrati punteggio, colpite su 50, mancate, colpi sparati, precisione e colpite per round. La precisione è `colpite / colpi sparati × 100`, arrotondata; se non vengono sparati colpi vale zero.

Il record è salvato nel `localStorage` del browser e non è condiviso tra dispositivi. Lettura e scrittura sono sincrone e protette da `try/catch`: se il salvataggio non è disponibile, la partita può comunque proseguire.

## Round e difficoltà

Non è presente un selettore di difficoltà. La configurazione iniziale è `IMPOSTAZIONI = { tempoVolo: 4.5, velocita: 360 }`; la difficoltà cresce con il round.

| Round | Scenario | Traiettorie | Fattore velocità | Tempo massimo di volo |
| --- | --- | --- | --- | --- |
| 1 | Prato classico | Onda | 1,00 | 4,50 s |
| 2 | Primavera | Onda | 1,18 | 4,15 s |
| 3 | Autunno | Onda | 1,36 | 3,80 s |
| 4 | Inverno | Onda, zigzag o tuffo | 1,54 | 3,45 s |
| 5 | Galassia | Onda, zigzag o tuffo | 1,72 | 3,10 s |

Il fattore moltiplica la velocità base, poi adattata alla scala del campo. Ogni round aggiunge il 18% della velocità base: non è un incremento composto. Il tempo diminuisce di 0,35 secondi per round, con un limite minimo nel codice di 2,1 secondi. L’uscita dal campo può terminare il bersaglio prima del tempo massimo. L’ampiezza della traiettoria cresce entro il 20% dell’altezza del campo. Nell’ultimo round viene usato il mirino bianco.

## Struttura del progetto

```text
duckhunt-NL/
|-- index.html                         Sito: regole, comandi, scenari e FAQ
|-- sito.css                           Stile del sito informativo
|-- gioco.html                         Campo, punteggi, pannelli e risultati
|-- style.css                          Stile del gioco
|-- script.js                          Stato, regole, eventi e animazione
|-- README.md                          Guida alla versione corrente
|-- DUCK_HUNT_logica-e-comandi.md       Documento tecnico di una versione precedente
|-- Progetto TPSI (1).pdf               Consegna del progetto
|-- img/                               Mirini, cane, munizioni e banner dei round
|-- gif/                               GIF delle anatre e video MP4 degli scenari
|-- presentazione/
    |-- Duck_Hunt_NL.pptx               Presentazione di 17 slide
    |-- Duck_Hunt_NL.pdf                Presentazione in PDF
    |-- Duck_Hunt_NL_Discorso.pdf        Guida all’esposizione, senza divisione dei relatori
```

Il foglio delle ore di lavoro è preparato separatamente e va incluso nella consegna insieme alla cartella del progetto. Il documento `DUCK_HUNT_logica-e-comandi.md` contiene riferimenti a una versione precedente: per il comportamento attuale fanno riferimento questo README e il codice.

## Come funziona JavaScript

### Stato e funzioni

`statoGioco` raccoglie fase, turno, bersagli, punteggio, munizioni, mira, anatra corrente e risultati. Le fasi sono `pronta`, `traRound`, `inCorso`, `traBersagli`, `inPausa` e `conclusa`. Le funzioni separano avvio, creazione dei bersagli, movimento, sparo, disegno e fine partita. I controlli sulla fase impediscono azioni fuori tempo.

### Scena e animazione

La scena combina tre livelli:

- Un elemento `<video>` riproduce lo sfondo MP4 del round.
- Un elemento `<img>` mostra la GIF dell’anatra in volo o in caduta; JavaScript aggiorna posizione, dimensioni e trasformazione CSS.
- Il `<canvas>` disegna mirino, effetti dei colpi e cane iniziale. Punteggi e pannelli sono elementi HTML.

`requestAnimationFrame` programma il callback del frame successivo. `aggiornaFotogramma` calcola l’intervallo trascorso in secondi, limitato a 0,05, aggiorna la simulazione e disegna. Il movimento orizzontale usa `velocitaX × intervallo`; il seno e le sue varianti determinano l’oscillazione verticale. Il limite riduce i salti dopo frame lenti, ma può rallentare il tempo simulato rispetto al tempo reale.

`adattaCanvas` aggiorna risoluzione e coordinate in caso di ridimensionamento. Il fattore `devicePixelRatio` è limitato a 2. GIF e mirino usano impostazioni adatte alla pixel art.

### Eventi e DOM

Sono gestiti `click`, `mousemove`, `mouseleave`, `mousedown`, `keydown` e `resize`. I callback richiamano funzioni dedicate, come `avviaPartita`, `puntaMira`, `spara` e `adattaCanvas`.

La manipolazione del DOM comprende aggiornamenti tramite `textContent`, attributi `hidden` e `aria-label`, classi CSS, sorgenti di immagini e video, stili della GIF e valori dei `<meter>` dei risultati. Non serve creare nuovi nodi per soddisfare questo requisito: il programma modifica quelli già presenti.

### Sparo e collisione

`spara` verifica fase e munizioni, consuma un colpo e confronta la mira con il centro dell’anatra. La hitbox è rettangolare: distanza orizzontale minore di `27 × scala` e verticale minore di `21 × scala`, quindi circa 54 × 42 unità a scala 1. Il numero del tentativo seleziona i punti nell’array `[100, 60, 30]`.

### Sincrono e asincrono

Calcolo delle collisioni, aggiornamento del punteggio, modifiche al DOM e accesso a `localStorage` sono sincroni.

`attendi` restituisce una Promise completata da `setTimeout`. Le funzioni `async` `continuaPartita` e `mostraIntroTurno` usano `await` per sospendere la propria prosecuzione senza bloccare il browser. Le attese sono di 900 ms tra bersagli mancati, 1050 ms per la caduta e 1800 ms per l’introduzione del round. Sono ritardi programmati: la ripresa può avvenire più tardi se il browser è occupato.

Dopo le attese vengono controllati fase e `gettonePartita`. Il gettone cambia all’avvio e alla conclusione: una prosecuzione vecchia viene ignorata e non modifica una partita diversa. Il controllo non cancella il timer.

### Caricamento e messaggi

`caricaImmagine` gestisce `Image.onload` e `Image.onerror` con Promise. `Promise.all` attende sette immagini: due GIF di volo, due di caduta, due mirini e il cane. Il pulsante mostra **Caricamento…** finché queste risorse non sono pronte. Se una fallisce, viene mostrato un errore e l’avvio resta disabilitato.

I cinque banner dei round vengono precaricati separatamente; i video MP4 sono caricati quando cambia lo scenario. Non sono inclusi nel controllo di `Promise.all`.

I pannelli mostrano introduzione del round, pausa e risultati. Il pulsante iniziale indica il caricamento delle immagini e un pannello segnala gli eventuali errori. Non è presente una barra di stato testuale separata.

### Pausa

La pausa blocca gli aggiornamenti della simulazione e mette in pausa il video dello sfondo. Il loop continua e aggiorna il timestamp, evitando un salto di posizione alla ripresa. La GIF può continuare la propria animazione interna anche mentre l’anatra resta ferma.

## Modificare la configurazione

Le costanti principali si trovano all’inizio di `script.js`:

| Costante | Funzione | Valore attuale |
| --- | --- | --- |
| `BERSAGLI_PER_TURNO` | Bersagli per round | 10 |
| `NUMERO_TURNI` | Numero di round | 5 |
| `COLPI_PER_ANATRA` | Munizioni per bersaglio | 3 |
| `PUNTI_PER_COLPO` | Punti per tentativo | `[100, 60, 30]` |
| `IMPOSTAZIONI` | Tempo e velocità base | 4,5 s / 360 |
| `DURATA_CADUTA` | Tempo della caduta | 1,05 s |
| `SFONDI_TURNI` | File MP4 e nomi degli scenari | 5 elementi |

Se si modifica il numero dei round, vanno aggiornati in modo coerente anche gli scenari, i banner `img/roundN.png`, il loro precaricamento, le righe dei risultati in `gioco.html` e i testi che indicano cinque round o cinquanta bersagli. Il mirino bianco è associato all’ultimo round.
