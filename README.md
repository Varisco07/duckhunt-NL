# 🦆 Duck Hunt NL

> Le vedi, le prendi di mira, fai fuoco. Tre colpi per ogni papera, cinque scenari, nessuna pietà.

Un omaggio arcade in **pixel art** al classico sparatutto con le anatre, scritto in HTML, CSS e JavaScript puro. Nessuna libreria, nessun build, nessuna installazione: si apre il file e si gioca.

**Autori:** Varisco Nicolò · Androni Lorenzo

---

## Indice

1. [Avvio rapido](#avvio-rapido)
2. [Comandi](#comandi)
3. [Come si gioca](#come-si-gioca)
4. [Punteggio](#punteggio)
5. [Round e scenari](#round-e-scenari)
6. [Difficoltà](#difficoltà)
7. [Struttura del progetto](#struttura-del-progetto)
8. [Dettagli tecnici](#dettagli-tecnici)
9. [Personalizzare il gioco](#personalizzare-il-gioco)

---

## Avvio rapido

1. Scarica o clona la cartella del progetto.
2. Apri `index.html` con un browser moderno (Chrome, Edge, Firefox, Safari).
3. Scegli la difficoltà e premi **Inizia a giocare**.

Funziona anche **offline**: basta che la cartella `img` resti accanto ai file `index.html`, `style.css` e `script.js`, perché il gioco carica le immagini da lì.

> Se le immagini non si caricano, il gioco lo segnala con la schermata *"Grafica non disponibile"* e blocca il pulsante di avvio.

## Comandi

| Azione | Mouse e tastiera | Telefono o tablet |
| --- | --- | --- |
| Mirare | Muovi il puntatore sul campo | Trascina il dito sul campo |
| Sparare | Clic sinistro oppure **Spazio** | Tocca il campo |
| Iniziare la partita | Pulsante oppure **Invio** | Pulsante |

Su dispositivi touch **trascinare serve solo a mirare**: rilasciare il dito dopo uno spostamento non spara. Per fare fuoco bisogna toccare senza trascinare, così non parte mai un colpo per errore.

## Come si gioca

- Un'anatra attraversa il campo: mira e spara prima che esca dallo schermo o scada il tempo di volo.
- Per **ogni anatra** hai **3 colpi** (l'icona delle munizioni a fianco del punteggio mostra quanti ne restano).
- Ogni bersaglio conta, sia colpito sia mancato: **un round dura sempre 10 bersagli**.
- Dopo il decimo bersaglio parte il round successivo, con un nuovo scenario e una schermata di annuncio. Dopo il **quinto round** la partita finisce.
- Quando colpisci un'anatra, questa cade con una breve animazione prima che compaia la successiva.
- Ogni colpo mostra un riscontro sul campo: **+punti** se a segno, **MANCATO** altrimenti.

## Punteggio

| Colpo che abbatte l'anatra | Punti |
| --- | ---: |
| Primo | **100** |
| Secondo | **60** |
| Terzo | **30** |

Il massimo teorico è quindi `10 bersagli × 5 round × 100 punti = 5000`.

A fine partita il gioco mostra:

- punteggio finale e **record personale**;
- anatre abbattute su 50 e anatre mancate;
- colpi sparati e **precisione** (anatre colpite / colpi sparati).

Il record viene salvato nel `localStorage` del browser, quindi resta sul dispositivo in uso. Se il browser blocca il salvataggio (per esempio in navigazione privata), il gioco funziona lo stesso e lo segnala al posto del record.

## Round e scenari

Ogni round ha uno sfondo diverso e anatre più insidiose del precedente.

| Round | Scenario | Traiettoria delle anatre |
| :---: | --- | --- |
| 1 | Prato classico | Volo lineare, con salite e discese che rimbalzano |
| 2 | Primavera | Onda |
| 3 | Autunno | Onda più ampia |
| 4 | Inverno | Onda, **zigzag** o **tuffo** (a caso) |
| 5 | Galassia | Onda, zigzag o tuffo, ampiezza massima. Qui il **mirino diventa bianco** per restare leggibile sullo sfondo scuro |

Da un round al successivo:

- la **velocità** aumenta del **18 %** rispetto al round 1 per ogni round che passa;
- il **tempo di volo** scende di **0,35 s** per round, fino a un minimo di **2,1 s**;
- l'ampiezza dell'ondulazione cresce, entro il 14 % dell'altezza del campo.

## Difficoltà

La difficoltà si sceglie prima di partire e **resta bloccata fino alla fine della partita**; si può cambiare di nuovo quando la partita è conclusa.

| Livello | Velocità iniziale | Tempo di volo iniziale |
| --- | ---: | ---: |
| Facile | 230 | 6 s |
| Normale | 360 | 4,5 s |
| Difficile | 500 | 3,3 s |

La velocità è un valore interno al gioco (pixel al secondo su un campo di 800 px di larghezza) e viene scalata con le dimensioni dello schermo.

## Struttura del progetto

```
duckhunt-NL/
├── index.html        Pagina e interfaccia (punteggi, overlay, selettore difficoltà)
├── style.css         Grafica, layout e adattamento agli schermi piccoli
├── script.js         Logica di gioco, disegno su canvas e comandi
├── README.md
└── img/
    ├── sfondo.png              Round 1 · prato classico
    ├── sfondo primavera.png    Round 2
    ├── sfondo autunno.png      Round 3
    ├── sfondo inverno.png      Round 4
    ├── sfondo galassia.png     Round 5
    ├── frame-anatra.png        Sprite sheet dell'anatra in volo (6 direzioni × 9 fotogrammi)
    ├── anatra morta frame.png  Fotogrammi dell'animazione di caduta
    ├── frame-cane.png          Il cane della schermata iniziale
    ├── mirino.png              Mirino standard (round 1–4)
    ├── mirino-bianco.png       Mirino bianco (round 5)
    ├── colpi.png               Icona delle munizioni
    └── volo anatra speciale.png  Sprite extra, non usato dal gioco
```

## Dettagli tecnici

- **Rendering:** un unico `<canvas>` ridisegnato a ogni frame con `requestAnimationFrame`. Il canvas si adatta alla dimensione della finestra e al `devicePixelRatio` (limitato a 2), e anatre, colpi e riscontri vengono riscalati quando la finestra cambia.
- **Pixel art nitida:** lo smoothing delle immagini è disattivato, così gli sprite non sfocano quando vengono ingranditi.
- **Animazioni a sprite:** l'anatra sceglie la riga dello sprite sheet in base alla direzione (destra, sinistra, su, giù) e cicla 9 fotogrammi; la caduta usa 16 fotogrammi ritagliati a coordinate fisse.
- **Hitbox:** un colpo è a segno se il mirino è entro circa 27 × 21 px dal centro dell'anatra (scalati con le dimensioni del campo).
- **Flusso asincrono:** le pause tra bersagli e round usano `async/await` con un *gettone di partita*, così una pausa pendente non può interferire con una partita nuova.
- **Input unificato:** gli eventi `pointer` gestiscono insieme mouse e touch; la tastiera aggiunge Spazio e Invio.
- **Accessibilità:** la barra di stato è una regione `aria-live`, e le munizioni espongono il numero di colpi rimasti come testo alternativo.
- **Zero dipendenze:** nessun framework, nessun font o script esterno.

## Personalizzare il gioco

Le costanti principali sono all'inizio di `script.js`:

| Costante | Cosa controlla | Valore |
| --- | --- | ---: |
| `BERSAGLI_PER_TURNO` | Bersagli per round | 10 |
| `NUMERO_TURNI` | Round per partita | 5 |
| `COLPI_PER_ANATRA` | Colpi a disposizione per anatra | 3 |
| `PUNTI_PER_COLPO` | Punti per primo, secondo, terzo colpo | 100 / 60 / 30 |
| `LIVELLI_DIFFICOLTA` | Velocità e tempo di volo per livello | vedi tabella |
| `SFONDI_TURNI` | Sfondo e nome di ogni round | 5 scenari |

Per aggiungere uno scenario, inserisci il nuovo PNG in `img`, aggiungilo a `SFONDI_TURNI` e aumenta `NUMERO_TURNI`. Il mirino bianco compare sempre nell'**ultimo** round.

---

© Varisco Nicolò · Androni Lorenzo
