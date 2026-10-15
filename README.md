# Duck Hunt NL

Una caccia arcade in pixel art: prendi la mira, colpisci le anatre e completa cinque round sempre più impegnativi. Hai tre colpi per ogni bersaglio: la precisione conta quanto i riflessi.

## Avviare il gioco

Apri `index.html` con un browser moderno. Non servono installazione, compilazione o dipendenze esterne. Per giocare offline, mantieni la cartella `img` accanto ai file HTML, CSS e JavaScript.

## Comandi

| Azione | Mouse e tastiera | Telefono o tablet |
| --- | --- | --- |
| Mirare | Muovi il puntatore | Trascina sul campo |
| Sparare | Clic oppure **Spazio** | Tocca il campo |

Su dispositivi touch, trascinare serve a spostare la mira; rilasciare non spara. Tocca per fare fuoco.

## Regole e punteggio

- Ogni anatra può essere colpita con un massimo di tre colpi.
- Un colpo a segno vale **100 punti** al primo tentativo, **60** al secondo e **30** al terzo.
- Se finiscono i tre colpi o l'anatra scappa, quel bersaglio è mancato e si passa subito al successivo.
- Ogni round comprende **10 bersagli**, indipendentemente da quanti ne colpisci; la partita si completa dopo **5 round**. Ogni round ha uno scenario diverso e una schermata arcade annuncia il round successivo.
- Quando viene colpita, l'anatra mostra un'animazione di caduta prima del bersaglio successivo.
- A fine partita trovi punteggio, anatre abbattute e mancate, colpi sparati e precisione. Il record personale viene conservato nel browser sul dispositivo in uso.

## Difficoltà

La difficoltà si sceglie prima della partita e resta bloccata fino alla fine. Influisce sulla velocità iniziale e sul tempo di volo disponibile per ogni bersaglio:

| Livello | Velocità iniziale | Tempo iniziale |
| --- | ---: | ---: |
| Facile | 230 | 6 secondi |
| Normale | 360 | 4,5 secondi |
| Difficile | 500 | 3,3 secondi |

I valori di velocità sono riferimenti interni al gioco. Nei round successivi le anatre accelerano e hanno meno tempo per attraversare il campo. Dal secondo round seguono traiettorie ondulate, che diventano più ampie; dal quarto possono anche zigzagare o cambiare ampiezza durante il volo.

## File del progetto

- `index.html` — pagina e interfaccia del gioco.
- `style.css` — grafica, layout e adattamento a schermi piccoli.
- `script.js` — movimento delle anatre, round, punteggio e comandi.
- `img/sfondo.png` — scenario di gioco.
- `img/sfondo primavera.png`, `img/sfondo autunno.png`, `img/sfondo inverno.png` e `img/sfondo galassia.png` — scenari dei round successivi.
- `img/frame-anatra.png` — sprite sheet delle anatre in volo.
- `img/anatra morta frame.png` — frame dell'animazione di caduta.
- `img/frame-cane.png` — posa del cane nella schermata iniziale.
- `img/mirino.png` — mirino.
- `img/colpi.png` — icona delle munizioni.

Le immagini devono restare nella cartella `img`: il gioco le carica direttamente dal browser.
