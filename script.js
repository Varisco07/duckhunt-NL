const telaGioco = document.querySelector("#gameCanvas");
const contesto = telaGioco.getContext("2d");
const immagineSfondo = new Image();
const spriteAnatre = new Image();
const spriteCaduta = new Image();
const immagineMirino = new Image();
const spriteCane = new Image();
const SFONDI_TURNI = [
    { immagine: immagineSfondo, percorso: "./img/sfondo.png", etichetta: "Prato classico" },
    { immagine: new Image(), percorso: "./img/sfondo primavera.png", etichetta: "Primavera" },
    { immagine: new Image(), percorso: "./img/sfondo autunno.png", etichetta: "Autunno" },
    { immagine: new Image(), percorso: "./img/sfondo inverno.png", etichetta: "Inverno" },
    { immagine: new Image(), percorso: "./img/sfondo galassia.png", etichetta: "Galassia" },
];
const pannelloOverlay = document.querySelector("#gameOverlay");
const sottotitoloOverlay = document.querySelector("#overlayKicker");
const titoloOverlay = document.querySelector("#overlayTitle");
const testoOverlay = document.querySelector("#overlayText");
const pulsanteAvvio = document.querySelector("#startButton");
const pulsantePausa = document.querySelector("#pauseButton");
const pulsanteSchermoIntero = document.querySelector("#fullscreenButton");
const contenitoreGioco = document.querySelector(".game-shell");
const selettoreDifficolta = document.querySelector("#difficultySelect");
const testoDifficolta = document.querySelector("#difficultyReadout");
const testoTurno = document.querySelector("#roundDisplay");
const testoBersagli = document.querySelector("#hitDisplay");
const testoPunteggio = document.querySelector("#scoreDisplay");
const testoRecord = document.querySelector("#bestScoreDisplay");
const testoColpi = document.querySelector("#ammoDisplay");
const testoStato = document.querySelector("#statusText");
const puntoStato = document.querySelector("#statusDot");

let LARGHEZZA = 800;
let ALTEZZA = 480;
const BERSAGLI_PER_TURNO = 10;
const NUMERO_TURNI = 5;
const COLPI_PER_ANATRA = 3;
const PUNTI_PER_COLPO = [100, 60, 30];
const NUMERO_FOTOGRAMMI = 9;
const DURATA_CADUTA = 1.05;
const TEMPO_FOTOGRAMMA_CADUTA = DURATA_CADUTA / 16;
const CHIAVE_RECORD = "duck-hunt-best-score";
const FOTOGRAMMI_CADUTA = [
    { x: 36, y: 120, width: 231, height: 205 },
    { x: 284, y: 125, width: 224, height: 210 },
    { x: 534, y: 124, width: 224, height: 212 },
    { x: 788, y: 120, width: 215, height: 211 },
    { x: 36, y: 448, width: 197, height: 193 },
    { x: 292, y: 451, width: 204, height: 202 },
    { x: 548, y: 461, width: 198, height: 208 },
    { x: 800, y: 479, width: 180, height: 197 },
    { x: 45, y: 775, width: 159, height: 237 },
    { x: 293, y: 783, width: 171, height: 221 },
    { x: 548, y: 816, width: 177, height: 215 },
    { x: 816, y: 829, width: 177, height: 194 },
    { x: 52, y: 1151, width: 189, height: 213 },
    { x: 286, y: 1191, width: 222, height: 181 },
    { x: 533, y: 1191, width: 222, height: 174 },
    { x: 786, y: 1226, width: 233, height: 149 },
];
const COLONNE_SPRITE_ANATRE = [
    [[128, 98], [250, 98], [367, 94], [482, 92], [594, 94], [707, 94], [821, 95], [934, 91], [1047, 96]],
    [[128, 94], [245, 93], [362, 88], [470, 94], [587, 93], [701, 89], [815, 92], [931, 97], [1045, 92]],
    [[135, 85], [255, 92], [366, 94], [487, 88], [594, 92], [706, 90], [829, 87], [944, 84], [1048, 94]],
    [[128, 90], [237, 91], [356, 89], [472, 92], [588, 96], [698, 88], [814, 87], [929, 96], [1044, 94]],
    [[136, 91], [249, 93], [366, 93], [485, 85], [588, 94], [708, 90], [822, 90], [933, 92], [1050, 88]],
    [[130, 90], [245, 90], [361, 88], [479, 90], [596, 87], [707, 87], [822, 87], [935, 84], [1045, 87]],
];
const BORDI_SUPERIORI_ANATRE = [
    [43, 23, 35, 16, 43, 43, 18, 16, 43],
    [37, 15, 11, 28, 36, 12, 14, 37, 37],
    [20, 9, 20, 9, 19, 18, 11, 15, 20],
    [19, 21, 22, 18, 23, 17, 17, 23, 23],
    [32, 8, 23, 24, 29, 29, 8, 9, 28],
    [21, 6, 18, 13, 23, 6, 5, 12, 20],
];
const BORDI_INFERIORI_ANATRE = [
    [95, 85, 84, 86, 91, 94, 86, 86, 95],
    [88, 79, 79, 78, 85, 78, 79, 87, 88],
    [92, 84, 82, 80, 88, 91, 80, 79, 90],
    [93, 82, 85, 84, 88, 85, 86, 88, 91],
    [82, 73, 75, 78, 73, 80, 73, 72, 79],
    [75, 70, 70, 72, 69, 70, 70, 72, 74],
];
const LIVELLI_DIFFICOLTA = {
    facile: { etichetta: "Facile", tempoVolo: 6, velocita: 230 },
    normale: { etichetta: "Normale", tempoVolo: 4.5, velocita: 360 },
    difficile: { etichetta: "Difficile", tempoVolo: 3.3, velocita: 500 },
};

const statoGioco = {
    fase: "pronta",
    turno: 1,
    bersagliTurno: 0,
    anatreColpite: 0,
    anatreMancate: 0,
    colpiSparati: 0,
    punteggio: 0,
    recordPersonale: 0,
    recordDisponibile: true,
    colpi: COLPI_PER_ANATRA,
    anatra: null,
    anatraInCaduta: null,
    esitoColpo: null,
    gestoTouch: null,
    mira: { x: LARGHEZZA / 2, y: ALTEZZA / 2, visibile: false },
    ultimoTempo: 0,
    gettonePartita: 0,
    graficaCaricata: false,
};

function adattaCanvas() {
    const fattorePixel = Math.min(window.devicePixelRatio || 1, 2);
    const limiti = telaGioco.getBoundingClientRect();
    if (!limiti.width || !limiti.height) return;

    const vecchiaLarghezza = LARGHEZZA;
    const vecchiaAltezza = ALTEZZA;
    LARGHEZZA = limiti.width;
    ALTEZZA = limiti.height;
    telaGioco.width = Math.round(LARGHEZZA * fattorePixel);
    telaGioco.height = Math.round(ALTEZZA * fattorePixel);
    contesto.setTransform(telaGioco.width / LARGHEZZA, 0, 0, telaGioco.height / ALTEZZA, 0, 0);

    const scalaLarghezza = LARGHEZZA / vecchiaLarghezza;
    const scalaAltezza = ALTEZZA / vecchiaAltezza;
    if (statoGioco.anatra) {
        statoGioco.anatra.x *= scalaLarghezza;
        statoGioco.anatra.y *= scalaAltezza;
        statoGioco.anatra.quotaBase *= scalaAltezza;
        statoGioco.anatra.velocitaX *= scalaLarghezza;
        statoGioco.anatra.velocitaY *= scalaAltezza;
        statoGioco.anatra.ampiezzaTraiettoria *= scalaAltezza;
    }
    if (statoGioco.anatraInCaduta) {
        statoGioco.anatraInCaduta.x *= scalaLarghezza;
        statoGioco.anatraInCaduta.inizioY *= scalaAltezza;
        statoGioco.anatraInCaduta.velocitaX *= scalaLarghezza;
    }
    if (statoGioco.esitoColpo) {
        statoGioco.esitoColpo.x *= scalaLarghezza;
        statoGioco.esitoColpo.y *= scalaAltezza;
    }
    statoGioco.mira.x = LARGHEZZA / 2;
    statoGioco.mira.y = ALTEZZA / 2;
    disegna();
}

function scalaGioco() {
    return Math.max(.65, Math.min(LARGHEZZA / 800, ALTEZZA / 480, 2));
}

function mostraStato(messaggio, modalita = "") {
    testoStato.textContent = messaggio;
    puntoStato.className = "status-dot" + (modalita ? " is-" + modalita : "");
}

function aggiornaPannello() {
    testoTurno.textContent = statoGioco.fase === "pronta" ? "—" : statoGioco.turno + " / " + NUMERO_TURNI;
    testoBersagli.textContent = statoGioco.bersagliTurno + " / " + BERSAGLI_PER_TURNO;
    testoPunteggio.textContent = String(statoGioco.punteggio).padStart(5, "0");
    testoRecord.textContent = statoGioco.recordDisponibile
        ? String(statoGioco.recordPersonale).padStart(5, "0")
        : "—";
    const rigaColpi = COLPI_PER_ANATRA - statoGioco.colpi;
    testoColpi.style.setProperty("--ammo-row", rigaColpi);
    testoColpi.setAttribute(
        "aria-label",
        statoGioco.colpi === 1 ? "1 colpo rimasto" : statoGioco.colpi + " colpi rimasti"
    );
}

function disegnaSfondo() {
    contesto.fillStyle = "#2599ee";
    contesto.fillRect(0, 0, LARGHEZZA, ALTEZZA);
    if (!statoGioco.graficaCaricata) return;

    const sfondo = SFONDI_TURNI[statoGioco.turno - 1].immagine;
    const scala = Math.max(LARGHEZZA / sfondo.naturalWidth, ALTEZZA / sfondo.naturalHeight);
    const larghezzaImmagine = sfondo.naturalWidth * scala;
    const altezzaImmagine = sfondo.naturalHeight * scala;
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(sfondo, (LARGHEZZA - larghezzaImmagine) / 2, (ALTEZZA - altezzaImmagine) / 2, larghezzaImmagine, altezzaImmagine);
}

function disegnaAnatra(anatra) {
    const direzione = anatra.velocitaX < 0 ? -1 : 1;
    const riga = Math.abs(anatra.velocitaY) > Math.abs(anatra.velocitaX) * .45
        ? anatra.velocitaY < 0 ? (direzione > 0 ? 2 : 3) : (direzione > 0 ? 4 : 5)
        : direzione > 0 ? 0 : 1;
    const [inizioXFotogramma, larghezzaFotogramma] = COLONNE_SPRITE_ANATRE[riga][anatra.fotogramma];
    const inizioFotogramma = BORDI_SUPERIORI_ANATRE[riga][anatra.fotogramma];
    const fineFotogramma = BORDI_INFERIORI_ANATRE[riga][anatra.fotogramma];
    const larghezzaSorgente = larghezzaFotogramma + 4;
    const altezzaSorgente = fineFotogramma - inizioFotogramma + 5;
    const scalaSprite = Math.min(82 / larghezzaSorgente, 68 / altezzaSorgente);
    const larghezzaDisegno = larghezzaSorgente * scalaSprite;
    const altezzaDisegno = altezzaSorgente * scalaSprite;
    contesto.save();
    contesto.translate(anatra.x, anatra.y);
    contesto.scale(scalaGioco(), scalaGioco());
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(
        spriteAnatre,
        inizioXFotogramma - 2,
        riga * 128 + inizioFotogramma - 2,
        larghezzaSorgente,
        altezzaSorgente,
        -larghezzaDisegno / 2,
        -altezzaDisegno / 2,
        larghezzaDisegno,
        altezzaDisegno,
    );
    contesto.restore();
}

function disegnaMirino() {
    if (!statoGioco.mira.visibile || statoGioco.fase !== "inCorso") return;
    const { x, y } = statoGioco.mira;
    const dimensione = 48 * scalaGioco();
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(immagineMirino, x - dimensione / 2, y - dimensione / 2, dimensione, dimensione);
}

function disegnaCaduta() {
    const anatraInCaduta = statoGioco.anatraInCaduta;
    if (!anatraInCaduta) return;

    const progresso = Math.min(anatraInCaduta.tempoTrascorso / DURATA_CADUTA, 1);
    const fotogramma = FOTOGRAMMI_CADUTA[Math.min(
        Math.floor(anatraInCaduta.tempoTrascorso / TEMPO_FOTOGRAMMA_CADUTA),
        FOTOGRAMMI_CADUTA.length - 1
    )];
    const scala = scalaGioco() * .48;
    const larghezzaDisegno = fotogramma.width * scala;
    const altezzaDisegno = fotogramma.height * scala;
    const x = anatraInCaduta.x + anatraInCaduta.velocitaX * anatraInCaduta.tempoTrascorso;
    const y = anatraInCaduta.inizioY + (ALTEZZA * .78 - anatraInCaduta.inizioY) * progresso * progresso;

    contesto.save();
    contesto.translate(x, y);
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(
        spriteCaduta,
        fotogramma.x,
        fotogramma.y,
        fotogramma.width,
        fotogramma.height,
        -larghezzaDisegno / 2,
        -altezzaDisegno / 2,
        larghezzaDisegno,
        altezzaDisegno,
    );
    contesto.restore();
}

function disegnaEsitoColpo() {
    const riscontro = statoGioco.esitoColpo;
    if (!riscontro) return;

    const progresso = riscontro.tempoTrascorso / .52;
    const scala = scalaGioco();
    const raggio = (9 + progresso * 27) * scala;
    const opacita = 1 - progresso;
    const colore = riscontro.colpita ? "#f6cf58" : "#ed6858";

    contesto.save();
    contesto.globalAlpha = opacita;
    contesto.strokeStyle = colore;
    contesto.fillStyle = colore;
    contesto.lineWidth = 3 * scala;
    contesto.beginPath();
    contesto.arc(riscontro.x, riscontro.y, raggio, 0, Math.PI * 2);
    contesto.stroke();

    if (riscontro.colpita) {
        for (let indice = 0; indice < 8; indice += 1) {
            const angolo = indice * Math.PI / 4;
            const raggioInterno = raggio * .75;
            const raggioEsterno = raggio + (8 + (indice % 3) * 4) * scala;
            contesto.beginPath();
            contesto.moveTo(
                riscontro.x + Math.cos(angolo) * raggioInterno,
                riscontro.y + Math.sin(angolo) * raggioInterno
            );
            contesto.lineTo(
                riscontro.x + Math.cos(angolo) * raggioEsterno,
                riscontro.y + Math.sin(angolo) * raggioEsterno
            );
            contesto.stroke();
        }
    } else {
        contesto.beginPath();
        contesto.moveTo(riscontro.x - 7 * scala, riscontro.y - 7 * scala);
        contesto.lineTo(riscontro.x + 7 * scala, riscontro.y + 7 * scala);
        contesto.moveTo(riscontro.x + 7 * scala, riscontro.y - 7 * scala);
        contesto.lineTo(riscontro.x - 7 * scala, riscontro.y + 7 * scala);
        contesto.stroke();
    }

    contesto.font = "700 " + 13 * scala + "px Consolas, monospace";
    contesto.textAlign = "center";
    contesto.textBaseline = "bottom";
    contesto.strokeStyle = "rgba(0, 0, 0, .8)";
    contesto.lineWidth = 3 * scala;
    const etichetta = riscontro.colpita ? "+" + riscontro.punti : "MANCATO";
    contesto.strokeText(etichetta, riscontro.x, riscontro.y - raggio - 4 * scala);
    contesto.fillStyle = colore;
    contesto.fillText(etichetta, riscontro.x, riscontro.y - raggio - 4 * scala);
    contesto.restore();
}

function disegnaCaneIntro() {
    if (statoGioco.fase !== "pronta" || !statoGioco.graficaCaricata) return;
    const fotogramma = { x: 26, y: 46, width: 70, height: 89 };
    const scala = 78 / fotogramma.height * scalaGioco();
    const larghezzaDisegno = fotogramma.width * scala;
    const altezzaDisegno = fotogramma.height * scala;
    const x = LARGHEZZA * .5;
    const y = ALTEZZA * .78;
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(
        spriteCane,
        fotogramma.x,
        fotogramma.y,
        fotogramma.width,
        fotogramma.height,
        x - larghezzaDisegno / 2,
        y - altezzaDisegno / 2,
        larghezzaDisegno,
        altezzaDisegno,
    );
}

function disegna() {
    disegnaSfondo();
    if (statoGioco.anatra) disegnaAnatra(statoGioco.anatra);
    disegnaCaduta();
    disegnaEsitoColpo();
    disegnaCaneIntro();
    disegnaMirino();
}

function creaAnatra() {
    const impostazioni = LIVELLI_DIFFICOLTA[selettoreDifficolta.value];
    const scala = scalaGioco();
    const direzione = Math.random() < .5 ? -1 : 1;
    const velocitaTurno = impostazioni.velocita * (1 + (statoGioco.turno - 1) * .18);
    const velocita = velocitaTurno * scala;
    const haTraiettoriaOndulata = statoGioco.turno >= 2;
    const quotaBase = haTraiettoriaOndulata
        ? ALTEZZA * (.28 + Math.random() * .2)
        : ALTEZZA * (.15 + Math.random() * .38);
    const tipiTraiettoria = statoGioco.turno >= 4 ? ["onda", "zigzag", "tuffo"] : ["onda"];
    statoGioco.anatra = {
        x: direzione === 1 ? -40 * scala : LARGHEZZA + 40 * scala,
        y: quotaBase,
        quotaBase,
        velocitaX: direzione * velocita,
        velocitaY: haTraiettoriaOndulata ? 0 : (Math.random() - .5) * velocita * .72,
        tipoTraiettoria: haTraiettoriaOndulata
            ? tipiTraiettoria[Math.floor(Math.random() * tipiTraiettoria.length)]
            : "lineare",
        ampiezzaTraiettoria: haTraiettoriaOndulata
            ? Math.min(7 + (statoGioco.turno - 2) * 7, ALTEZZA * .14)
            : 0,
        frequenzaTraiettoria: 1.7 + statoGioco.turno * .25,
        faseTraiettoria: Math.random() * Math.PI * 2,
        tempoTraiettoria: 0,
        tempoResiduo: Math.max(2.1, impostazioni.tempoVolo - (statoGioco.turno - 1) * .35),
        fotogramma: 0,
        timerFotogramma: 0,
    };
    statoGioco.colpi = COLPI_PER_ANATRA;
    aggiornaPannello();
}

function attendi(millisecondi) {
    return new Promise((completa) => window.setTimeout(completa, millisecondi));
}

async function continuaPartita(gettone, messaggio, mostraCaduta = false) {
    // Ogni esito consuma un bersaglio: anche tre tiri a vuoto fanno avanzare l'indice.
    statoGioco.fase = "traBersagli";
    statoGioco.anatra = null;
    statoGioco.bersagliTurno += 1;
    if (!mostraCaduta) statoGioco.anatraInCaduta = null;
    statoGioco.mira.visibile = false;
    pulsantePausa.disabled = true;

    if (statoGioco.bersagliTurno >= BERSAGLI_PER_TURNO) {
        mostraStato("Hai affrontato tutti i bersagli del turno. Caricamento del prossimo turno…", "loading");
    } else {
        mostraStato(
            messaggio + " Prossimo bersaglio: " + (statoGioco.bersagliTurno + 1) + "/" + BERSAGLI_PER_TURNO + ".",
            "loading"
        );
    }

    aggiornaPannello();
    disegna();
    await attendi(mostraCaduta ? DURATA_CADUTA * 1000 : 900);
    if (statoGioco.fase !== "traBersagli" || statoGioco.gettonePartita !== gettone) return;
    statoGioco.anatraInCaduta = null;

    if (statoGioco.bersagliTurno >= BERSAGLI_PER_TURNO) {
        if (statoGioco.turno === NUMERO_TURNI) {
            terminaPartita();
            return;
        }
        statoGioco.turno += 1;
        statoGioco.bersagliTurno = 0;
        aggiornaPannello();
        await mostraIntroTurno(gettone);
        return;
    }

    lanciaAnatra();
}

async function mostraIntroTurno(gettone) {
    const scenario = SFONDI_TURNI[statoGioco.turno - 1];
    statoGioco.fase = "traRound";
    statoGioco.anatra = null;
    statoGioco.anatraInCaduta = null;
    statoGioco.mira.visibile = false;
    sottotitoloOverlay.textContent = "Nuovo scenario · " + scenario.etichetta;
    titoloOverlay.textContent = "ROUND " + statoGioco.turno;
    testoOverlay.textContent = BERSAGLI_PER_TURNO + " bersagli · la caccia continua";
    pannelloOverlay.classList.add("is-round-intro");
    pulsanteAvvio.hidden = true;
    pannelloOverlay.hidden = false;
    mostraStato("Preparati per il round " + statoGioco.turno + ".", "loading");
    aggiornaPannello();
    disegna();

    await attendi(1800);
    if (statoGioco.fase !== "traRound" || statoGioco.gettonePartita !== gettone) return;

    pannelloOverlay.hidden = true;
    pannelloOverlay.classList.remove("is-round-intro");
    pulsanteAvvio.hidden = false;
    lanciaAnatra();
}

function terminaPartita() {
    statoGioco.fase = "conclusa";
    statoGioco.gettonePartita += 1;
    statoGioco.anatra = null;
    statoGioco.mira.visibile = false;
    pulsantePausa.disabled = true;
    const nuovoRecord = statoGioco.punteggio > statoGioco.recordPersonale;
    if (nuovoRecord && statoGioco.recordDisponibile) {
        try {
            window.localStorage.setItem(CHIAVE_RECORD, String(statoGioco.punteggio));
            statoGioco.recordPersonale = statoGioco.punteggio;
        } catch (errore) {
            statoGioco.recordDisponibile = false;
        }
    }
    const precisione = statoGioco.colpiSparati
        ? Math.round(statoGioco.anatreColpite / statoGioco.colpiSparati * 100)
        : 0;
    sottotitoloOverlay.textContent = "Partita conclusa";
    titoloOverlay.textContent = nuovoRecord && statoGioco.recordDisponibile ? "Nuovo record!" : "Bella mira!";
    testoOverlay.textContent =
        "Punteggio: " + statoGioco.punteggio + " punti" +
        "\nPapere abbattute: " + statoGioco.anatreColpite + " / " + (BERSAGLI_PER_TURNO * NUMERO_TURNI) +
        " · mancate: " + statoGioco.anatreMancate +
        "\nPrecisione: " + precisione + "% · colpi sparati: " + statoGioco.colpiSparati +
        "\nRecord personale: " + (statoGioco.recordDisponibile ? statoGioco.recordPersonale + " punti" : "salvataggio non disponibile") +
        "\nVuoi fare un'altra partita?";
    pulsanteAvvio.textContent = "Gioca ancora";
    selettoreDifficolta.disabled = false;
    pannelloOverlay.hidden = false;
    mostraStato(
        statoGioco.recordDisponibile
            ? "Partita completata: " + precisione + "% di precisione."
            : "Partita completata, ma il browser non consente di salvare il record.",
        statoGioco.recordDisponibile ? "active" : ""
    );
    aggiornaPannello();
    disegna();
}

function lanciaAnatra() {
    statoGioco.fase = "inCorso";
    creaAnatra();
    pannelloOverlay.hidden = true;
    pannelloOverlay.classList.remove("is-round-intro");
    pulsanteAvvio.hidden = false;
    pulsantePausa.disabled = false;
    pulsantePausa.textContent = "Pausa";
    mostraStato(
        "Turno " + statoGioco.turno + " · bersaglio " + (statoGioco.bersagliTurno + 1) +
        "/" + BERSAGLI_PER_TURNO + ": prendi la mira!",
        "active"
    );
    statoGioco.ultimoTempo = performance.now();
}

function avviaPartita() {
    if (!statoGioco.graficaCaricata) return;
    selettoreDifficolta.disabled = true;
    statoGioco.gettonePartita += 1;
    statoGioco.turno = 1;
    statoGioco.bersagliTurno = 0;
    statoGioco.anatreColpite = 0;
    statoGioco.anatreMancate = 0;
    statoGioco.colpiSparati = 0;
    statoGioco.punteggio = 0;
    statoGioco.colpi = COLPI_PER_ANATRA;
    statoGioco.anatra = null;
    statoGioco.anatraInCaduta = null;
    statoGioco.esitoColpo = null;
    aggiornaPannello();
    void mostraIntroTurno(statoGioco.gettonePartita);
}

function mettiInPausa() {
    if (statoGioco.fase === "inCorso") {
        statoGioco.fase = "inPausa";
        statoGioco.mira.visibile = false;
        pulsantePausa.textContent = "Riprendi";
        sottotitoloOverlay.textContent = "Turno " + statoGioco.turno;
        titoloOverlay.textContent = "In pausa";
        testoOverlay.textContent = "La partita è ferma. Quando vuoi, torna a caccia.";
        pulsanteAvvio.textContent = "Riprendi";
        pannelloOverlay.hidden = false;
        mostraStato("Partita in pausa.", "");
    } else if (statoGioco.fase === "inPausa") {
        statoGioco.fase = "inCorso";
        statoGioco.ultimoTempo = performance.now();
        pulsantePausa.textContent = "Pausa";
        pannelloOverlay.hidden = true;
        mostraStato("La caccia continua!", "active");
    }
}

function aggiornaAnatra(intervallo) {
    // Ogni anatra riceve una fase casuale; dal quarto turno cambia anche il tipo di traiettoria.
    const anatra = statoGioco.anatra;
    if (!anatra) return;

    anatra.x += anatra.velocitaX * intervallo;
    anatra.tempoTraiettoria += intervallo;
    if (anatra.ampiezzaTraiettoria) {
        const avanzamentoTraiettoria = anatra.tempoTraiettoria * anatra.frequenzaTraiettoria + anatra.faseTraiettoria;
        let scostamentoTraiettoria = Math.sin(avanzamentoTraiettoria);
        if (anatra.tipoTraiettoria === "zigzag") {
            scostamentoTraiettoria = (scostamentoTraiettoria + Math.sin(avanzamentoTraiettoria * 2.2) * .3) / 1.3;
        } else if (anatra.tipoTraiettoria === "tuffo") {
            scostamentoTraiettoria *= .55 + .45 * (.5 + .5 * Math.sin(anatra.tempoTraiettoria * .6));
        }
        anatra.y = anatra.quotaBase + scostamentoTraiettoria * anatra.ampiezzaTraiettoria;
        anatra.velocitaY = Math.cos(avanzamentoTraiettoria) * anatra.frequenzaTraiettoria * anatra.ampiezzaTraiettoria;
    } else {
        anatra.y += anatra.velocitaY * intervallo;
        if ((anatra.y < ALTEZZA * .12 && anatra.velocitaY < 0) || (anatra.y > ALTEZZA * .64 && anatra.velocitaY > 0)) {
            anatra.velocitaY *= -1;
        }
    }
    anatra.tempoResiduo -= intervallo;
    anatra.timerFotogramma += intervallo;
    if (anatra.timerFotogramma >= .085) {
        const fotogrammiTrascorsi = Math.floor(anatra.timerFotogramma / .085);
        anatra.fotogramma = (anatra.fotogramma + fotogrammiTrascorsi) % NUMERO_FOTOGRAMMI;
        anatra.timerFotogramma %= .085;
    }

    const margineAnatra = 55 * scalaGioco();
    if (anatra.tempoResiduo <= 0 || anatra.x < -margineAnatra || anatra.x > LARGHEZZA + margineAnatra) {
        statoGioco.anatreMancate += 1;
        void continuaPartita(statoGioco.gettonePartita, "La papera è scappata.");
    }
}

function spara() {
    if (statoGioco.fase !== "inCorso" || statoGioco.colpi === 0) return;

    statoGioco.colpi -= 1;
    statoGioco.colpiSparati += 1;
    const anatra = statoGioco.anatra;
    const scala = scalaGioco();
    const colpita = anatra && Math.abs(statoGioco.mira.x - anatra.x) < 27 * scala && Math.abs(statoGioco.mira.y - anatra.y) < 21 * scala;

    if (colpita) {
        const punti = PUNTI_PER_COLPO[COLPI_PER_ANATRA - statoGioco.colpi - 1];
        statoGioco.punteggio += punti;
        statoGioco.anatreColpite += 1;
        statoGioco.anatra = null;
        statoGioco.esitoColpo = {
            x: statoGioco.mira.x,
            y: statoGioco.mira.y,
            colpita: true,
            punti,
            tempoTrascorso: 0,
        };
        statoGioco.anatraInCaduta = {
            x: anatra.x,
            inizioY: anatra.y,
            velocitaX: anatra.velocitaX * .08,
            tempoTrascorso: 0,
        };
        aggiornaPannello();
        const shotNumber = COLPI_PER_ANATRA - statoGioco.colpi;
        void continuaPartita(
            statoGioco.gettonePartita,
            "Colpita al colpo " + shotNumber + "! +" + punti + " punti.",
            true
        );
        return;
    }

    statoGioco.esitoColpo = {
        x: statoGioco.mira.x,
        y: statoGioco.mira.y,
        colpita: false,
        punti: 0,
        tempoTrascorso: 0,
    };
    aggiornaPannello();
    if (statoGioco.colpi === 0) {
        statoGioco.anatreMancate += 1;
        void continuaPartita(statoGioco.gettonePartita, "Colpi esauriti: papera mancata.");
    } else {
        const colpiRimasti = statoGioco.colpi === 1 ? "1 colpo" : statoGioco.colpi + " colpi";
        mostraStato("Mancato. Restano " + colpiRimasti + ".", "");
    }
}

function coordinateCanvas(evento) {
    const limiti = telaGioco.getBoundingClientRect();
    return {
        x: (evento.clientX - limiti.left) * LARGHEZZA / limiti.width,
        y: (evento.clientY - limiti.top) * ALTEZZA / limiti.height,
    };
}

function aggiornaPulsanteSchermoIntero() {
    const schermoInteroAttivo = Boolean(document.fullscreenElement);
    pulsanteSchermoIntero.textContent = schermoInteroAttivo ? "Esci da schermo intero" : "Schermo intero";
    pulsanteSchermoIntero.setAttribute("aria-label", schermoInteroAttivo ? "Esci da schermo intero" : "Attiva schermo intero");
}

function aggiornaFotogramma(tempoAttuale) {
    const intervallo = Math.min((tempoAttuale - statoGioco.ultimoTempo) / 1000, .05);
    statoGioco.ultimoTempo = tempoAttuale;
    if (statoGioco.fase === "inCorso") aggiornaAnatra(intervallo);
    if (statoGioco.anatraInCaduta) statoGioco.anatraInCaduta.tempoTrascorso += intervallo;
    if (statoGioco.esitoColpo) {
        statoGioco.esitoColpo.tempoTrascorso += intervallo;
        if (statoGioco.esitoColpo.tempoTrascorso >= .52) statoGioco.esitoColpo = null;
    }
    disegna();
    requestAnimationFrame(aggiornaFotogramma);
}

pulsanteAvvio.addEventListener("click", () => {
    if (statoGioco.fase === "inPausa") {
        mettiInPausa();
    } else {
        avviaPartita();
    }
});

pulsanteAvvio.addEventListener("mouseover", () => {
    if (statoGioco.fase === "pronta") mostraStato("Premi il pulsante: le papere non aspettano.", "");
});

pulsantePausa.addEventListener("click", mettiInPausa);

pulsanteSchermoIntero.addEventListener("click", async () => {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await contenitoreGioco.requestFullscreen();
        }
        aggiornaPulsanteSchermoIntero();
    } catch (errore) {
        mostraStato("Impossibile attivare lo schermo intero: " + errore.message, "");
    }
});

document.addEventListener("fullscreenchange", () => {
    aggiornaPulsanteSchermoIntero();
    window.requestAnimationFrame(adattaCanvas);
});

selettoreDifficolta.addEventListener("change", () => {
    testoDifficolta.textContent = LIVELLI_DIFFICOLTA[selettoreDifficolta.value].etichetta;
    if (statoGioco.fase === "pronta") {
        mostraStato("Difficoltà impostata su " + LIVELLI_DIFFICOLTA[selettoreDifficolta.value].etichetta.toLowerCase() + ".", "");
    }
});

telaGioco.addEventListener("pointermove", (evento) => {
    const punto = coordinateCanvas(evento);
    statoGioco.mira = { ...punto, visibile: true };
    if (evento.pointerType === "touch" && statoGioco.gestoTouch) {
        const scartoX = punto.x - statoGioco.gestoTouch.inizioX;
        const scartoY = punto.y - statoGioco.gestoTouch.inizioY;
        if (scartoX * scartoX + scartoY * scartoY > 144) {
            statoGioco.gestoTouch.spostato = true;
        }
    }
});

telaGioco.addEventListener("pointerleave", () => {
    statoGioco.mira.visibile = false;
});

telaGioco.addEventListener("pointerdown", (evento) => {
    if (evento.button !== 0) return;
    if (evento.pointerType === "touch") {
        evento.preventDefault();
        telaGioco.setPointerCapture(evento.pointerId);
        const punto = coordinateCanvas(evento);
        statoGioco.mira = { ...punto, visibile: true };
        statoGioco.gestoTouch = { inizioX: punto.x, inizioY: punto.y, spostato: false };
        return;
    }
    statoGioco.mira = { ...coordinateCanvas(evento), visibile: true };
    spara();
});

telaGioco.addEventListener("pointerup", (evento) => {
    if (evento.pointerType !== "touch") return;
    const gesto = statoGioco.gestoTouch;
    statoGioco.gestoTouch = null;
    if (gesto && !gesto.spostato) {
        statoGioco.mira = { ...coordinateCanvas(evento), visibile: true };
        spara();
    }
    statoGioco.mira.visibile = false;
});

telaGioco.addEventListener("pointercancel", (evento) => {
    if (evento.pointerType !== "touch") return;
    statoGioco.gestoTouch = null;
    statoGioco.mira.visibile = false;
});

window.addEventListener("keydown", (evento) => {
    if (evento.code === "Space") {
        evento.preventDefault();
        spara();
    } else if (evento.code === "KeyP" && !evento.repeat) {
        mettiInPausa();
    } else if (evento.code === "Enter" && statoGioco.fase === "pronta") {
        avviaPartita();
    }
});

window.addEventListener("resize", adattaCanvas);

adattaCanvas();
try {
    const recordSalvato = Number.parseInt(window.localStorage.getItem(CHIAVE_RECORD), 10);
    statoGioco.recordPersonale = Number.isSafeInteger(recordSalvato) && recordSalvato >= 0
        ? recordSalvato
        : 0;
} catch (errore) {
    statoGioco.recordDisponibile = false;
}
testoDifficolta.textContent = LIVELLI_DIFFICOLTA[selettoreDifficolta.value].etichetta;
aggiornaPannello();
disegna();
requestAnimationFrame(aggiornaFotogramma);

function caricaImmagine(immagine, percorso) {
    return new Promise((completa, rifiuta) => {
        immagine.addEventListener("load", completa, { once: true });
        immagine.addEventListener("error", () => rifiuta(new Error("Impossibile caricare " + percorso)), { once: true });
        immagine.src = percorso;
    });
}

Promise.all([
    ...SFONDI_TURNI.map((scenario) => caricaImmagine(scenario.immagine, scenario.percorso)),
    caricaImmagine(spriteAnatre, "./img/frame-anatra.png"),
    caricaImmagine(spriteCaduta, "./img/anatra morta frame.png"),
    caricaImmagine(immagineMirino, "./img/mirino.png"),
    caricaImmagine(spriteCane, "./img/frame-cane.png"),
]).then(() => {
    statoGioco.graficaCaricata = true;
    pulsanteAvvio.disabled = false;
    pulsanteAvvio.textContent = "Inizia a giocare";
    mostraStato("Pronto: le papere ora volano veloci. Scegli la difficoltà e inizia.", "");
    disegna();
}).catch((errore) => {
    sottotitoloOverlay.textContent = "Errore di caricamento";
    titoloOverlay.textContent = "Grafica non disponibile";
    testoOverlay.textContent = errore.message + ". Controlla che i file grafici siano nella cartella img.";
    pulsanteAvvio.disabled = true;
    pulsanteAvvio.textContent = "Gioco non disponibile";
    mostraStato("Errore nel caricamento della grafica: " + errore.message, "");
});
