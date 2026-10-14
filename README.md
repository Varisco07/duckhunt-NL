# Duck Hunt

Una reinterpretazione arcade di Duck Hunt realizzata con HTML, CSS e JavaScript, senza framework o dipendenze.

## Avvio

Apri `index.html` nel browser. Non sono necessari installazione, compilazione o server.

## Come si gioca

- Muovi il mouse per puntare e fai clic per sparare.
- Premi **Spazio** per sparare nella posizione del puntatore.
- Premi **P** per mettere in pausa o riprendere.
- Usa **Schermo intero** per espandere il gioco.
- Scegli Facile, Normale o Difficile prima di iniziare; la difficoltà resta bloccata durante la partita e si può cambiare al termine.
- Ogni papera offre tre colpi: 100 punti se la colpisci al primo, 60 al secondo o 30 al terzo.
- Se esaurisci i colpi senza colpire, passi alla papera successiva e il round continua.
- Completa 10 abbattimenti per round. Ci sono 5 round e la velocità aumenta con la difficoltà e con i round.

## Struttura

- `index.html` — struttura e comandi del gioco.
- `style.css` — interfaccia a schermo intero e adattamento agli schermi piccoli.
- `script.js` — animazione, movimento, punteggio, difficoltà e controlli.
- `img/sfondo.png` — scenario di gioco.
- `img/frame-anatra.png` — sprite sheet delle anatre.
- `img/mirino.png` — mirino personalizzato.
- `img/colpi.png` — sprite dei colpi visualizzata nell'interfaccia.
- `img/frame-cane.png` — sprite del cane, disponibile per una futura integrazione.

Le immagini vengono caricate dal browser dalla cartella `img`.
