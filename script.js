const $ = (selettore) => document.querySelector(selettore);
const telaGioco = $("#gameCanvas");
const contesto = telaGioco.getContext("2d");
const pannelloOverlay = $("#gameOverlay");
const sottotitoloOverlay = $("#overlayKicker");
const titoloOverlay = $("#overlayTitle");
const testoOverlay = $("#overlayText");
const pulsanteAvvio = $("#startButton");
const testoTurno = $("#roundDisplay");
const testoBersagli = $("#hitDisplay");
const testoPunteggio = $("#scoreDisplay");
const testoRecord = $("#bestScoreDisplay");
const testoColpi = $("#ammoDisplay");
const testoStato = $("#statusText");
const puntoStato = $("#statusDot");

let sfondi, spriteAnatre, spriteCaduta, immagineMirino, immagineMirinoBianco, spriteCane;
const SFONDI_TURNI = [
    ["sfondo", "Prato classico"], ["sfondo primavera", "Primavera"], ["sfondo autunno", "Autunno"],
    ["sfondo inverno", "Inverno"], ["sfondo galassia", "Galassia"],
];

let LARGHEZZA = 800;
let ALTEZZA = 480;
const BERSAGLI_PER_TURNO = 10;
const NUMERO_TURNI = 5;
const COLPI_PER_ANATRA = 3;
const PUNTI_PER_COLPO = [100, 60, 30];
const NUMERO_FOTOGRAMMI = 9;
const DURATA_CADUTA = 1.05;
const CHIAVE_RECORD = "duck-hunt-best-score";
const FOTOGRAMMI_CADUTA = [
    [36, 120, 231, 205], [284, 125, 224, 210], [534, 124, 224, 212], [788, 120, 215, 211],
    [36, 448, 197, 193], [292, 451, 204, 202], [548, 461, 198, 208], [800, 479, 180, 197],
    [45, 775, 159, 237], [293, 783, 171, 221], [548, 816, 177, 215], [816, 829, 177, 194],
    [52, 1151, 189, 213], [286, 1191, 222, 181], [533, 1191, 222, 174], [786, 1226, 233, 149],
];
const TEMPO_FOTOGRAMMA_CADUTA = DURATA_CADUTA / FOTOGRAMMI_CADUTA.length;
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
const IMPOSTAZIONI = { tempoVolo: 4.5, velocita: 360 };

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

const moltiplica = (oggetto, chiavi, fattore) => oggetto && chiavi.forEach((chiave) => { oggetto[chiave] *= fattore; });

function adattaCanvas() {
    const fattorePixel = Math.min(window.devicePixelRatio || 1, 2);
    const limiti = telaGioco.getBoundingClientRect();
    if (!limiti.width || !limiti.height) return;

    const scalaX = limiti.width / LARGHEZZA;
    const scalaY = limiti.height / ALTEZZA;
    LARGHEZZA = limiti.width;
    ALTEZZA = limiti.height;
    telaGioco.width = Math.round(LARGHEZZA * fattorePixel);
    telaGioco.height = Math.round(ALTEZZA * fattorePixel);
    contesto.setTransform(telaGioco.width / LARGHEZZA, 0, 0, telaGioco.height / ALTEZZA, 0, 0);

    const { anatra, anatraInCaduta, esitoColpo } = statoGioco;
    moltiplica(anatra, ["x", "velocitaX"], scalaX);
    moltiplica(anatra, ["y", "quotaBase", "velocitaY", "ampiezzaTraiettoria"], scalaY);
    moltiplica(anatraInCaduta, ["x", "velocitaX"], scalaX);
    moltiplica(anatraInCaduta, ["inizioY"], scalaY);
    moltiplica(esitoColpo, ["x"], scalaX);
    moltiplica(esitoColpo, ["y"], scalaY);
    statoGioco.mira.x = LARGHEZZA / 2;
    statoGioco.mira.y = ALTEZZA / 2;
}

function scalaGioco() {
    return Math.max(.65, Math.min(LARGHEZZA / 800, ALTEZZA / 480, 2));
}

function mostraStato(messaggio, modalita = "") {
    testoStato.textContent = messaggio;
    puntoStato.className = "status-dot" + (modalita ? " is-" + modalita : "");
}

const formatta = (valore) => String(valore).padStart(5, "0");

function aggiornaPannello() {
    testoTurno.textContent = statoGioco.fase === "pronta" ? "—" : statoGioco.turno + " / " + NUMERO_TURNI;
    testoBersagli.textContent = statoGioco.bersagliTurno + " / " + BERSAGLI_PER_TURNO;
    testoPunteggio.textContent = formatta(statoGioco.punteggio);
    testoRecord.textContent = statoGioco.recordDisponibile ? formatta(statoGioco.recordPersonale) : "—";
    testoColpi.style.setProperty("--ammo-row", COLPI_PER_ANATRA - statoGioco.colpi);
    testoColpi.setAttribute("aria-label", statoGioco.colpi === 1 ? "1 colpo rimasto" : statoGioco.colpi + " colpi rimasti");
}

function disegnaSprite(sprite, [sx, sy, sl, sa], cx, cy, l, a) {
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(sprite, sx, sy, sl, sa, cx - l / 2, cy - a / 2, l, a);
}

function disegnaSfondo() {
    contesto.fillStyle = "#2599ee";
    contesto.fillRect(0, 0, LARGHEZZA, ALTEZZA);
    if (!statoGioco.graficaCaricata) return;

    const sfondo = sfondi[statoGioco.turno - 1];
    const scala = Math.max(LARGHEZZA / sfondo.naturalWidth, ALTEZZA / sfondo.naturalHeight);
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(sfondo, (LARGHEZZA - sfondo.naturalWidth * scala) / 2, (ALTEZZA - sfondo.naturalHeight * scala) / 2, sfondo.naturalWidth * scala, sfondo.naturalHeight * scala);
}

function disegnaAnatra(anatra) {
    const direzione = anatra.velocitaX < 0 ? -1 : 1;
    const riga = Math.abs(anatra.velocitaY) > Math.abs(anatra.velocitaX) * .45
        ? anatra.velocitaY < 0 ? (direzione > 0 ? 2 : 3) : (direzione > 0 ? 4 : 5)
        : direzione > 0 ? 0 : 1;
    const [inizioX, larghezza] = COLONNE_SPRITE_ANATRE[riga][anatra.fotogramma];
    const inizio = BORDI_SUPERIORI_ANATRE[riga][anatra.fotogramma];
    const larghezzaSorgente = larghezza + 4;
    const altezzaSorgente = BORDI_INFERIORI_ANATRE[riga][anatra.fotogramma] - inizio + 5;
    const scalaSprite = Math.min(82 / larghezzaSorgente, 68 / altezzaSorgente) * scalaGioco();
    disegnaSprite(spriteAnatre, [inizioX - 2, riga * 128 + inizio - 2, larghezzaSorgente, altezzaSorgente],
        anatra.x, anatra.y, larghezzaSorgente * scalaSprite, altezzaSorgente * scalaSprite);
}

function disegnaMirino() {
    if (!statoGioco.mira.visibile || statoGioco.fase !== "inCorso") return;
    const { x, y } = statoGioco.mira;
    const dimensione = 48 * scalaGioco();
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(statoGioco.turno === NUMERO_TURNI ? immagineMirinoBianco : immagineMirino, x - dimensione / 2, y - dimensione / 2, dimensione, dimensione);
}

function disegnaCaduta() {
    const caduta = statoGioco.anatraInCaduta;
    if (!caduta) return;

    const progresso = Math.min(caduta.tempoTrascorso / DURATA_CADUTA, 1);
    const fotogramma = FOTOGRAMMI_CADUTA[Math.min(Math.floor(caduta.tempoTrascorso / TEMPO_FOTOGRAMMA_CADUTA), FOTOGRAMMI_CADUTA.length - 1)];
    const scala = scalaGioco() * .48;
    disegnaSprite(spriteCaduta, fotogramma,
        caduta.x + caduta.velocitaX * caduta.tempoTrascorso,
        caduta.inizioY + (ALTEZZA * .78 - caduta.inizioY) * progresso * progresso,
        fotogramma[2] * scala, fotogramma[3] * scala);
}

function disegnaEsitoColpo() {
    const riscontro = statoGioco.esitoColpo;
    if (!riscontro) return;

    const { x, y, colpita } = riscontro;
    const progresso = riscontro.tempoTrascorso / .52;
    const scala = scalaGioco();
    const raggio = (9 + progresso * 27) * scala;
    const colore = colpita ? "#f6cf58" : "#ed6858";

    contesto.save();
    contesto.globalAlpha = 1 - progresso;
    contesto.strokeStyle = colore;
    contesto.lineWidth = 3 * scala;
    contesto.beginPath();
    contesto.arc(x, y, raggio, 0, Math.PI * 2);
    contesto.stroke();

    if (colpita) {
        for (let indice = 0; indice < 8; indice += 1) {
            const angolo = indice * Math.PI / 4;
            const raggioEsterno = raggio + (8 + (indice % 3) * 4) * scala;
            contesto.beginPath();
            contesto.moveTo(x + Math.cos(angolo) * raggio * .75, y + Math.sin(angolo) * raggio * .75);
            contesto.lineTo(x + Math.cos(angolo) * raggioEsterno, y + Math.sin(angolo) * raggioEsterno);
            contesto.stroke();
        }
    } else {
        const d = 7 * scala;
        contesto.beginPath();
        contesto.moveTo(x - d, y - d);
        contesto.lineTo(x + d, y + d);
        contesto.moveTo(x + d, y - d);
        contesto.lineTo(x - d, y + d);
        contesto.stroke();
    }

    contesto.font = "700 " + 13 * scala + "px Consolas, monospace";
    contesto.textAlign = "center";
    contesto.textBaseline = "bottom";
    contesto.strokeStyle = "rgba(0, 0, 0, .8)";
    const etichetta = colpita ? "+" + riscontro.punti : "MANCATO";
    contesto.strokeText(etichetta, x, y - raggio - 4 * scala);
    contesto.fillStyle = colore;
    contesto.fillText(etichetta, x, y - raggio - 4 * scala);
    contesto.restore();
}

function disegnaCaneIntro() {
    if (statoGioco.fase !== "pronta" || !statoGioco.graficaCaricata) return;
    const scala = 78 / 89 * scalaGioco();
    disegnaSprite(spriteCane, [26, 46, 70, 89], LARGHEZZA * .5, ALTEZZA * .78, 70 * scala, 89 * scala);
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
    const impostazioni = IMPOSTAZIONI;
    const turno = statoGioco.turno;
    const scala = scalaGioco();
    const direzione = Math.random() < .5 ? -1 : 1;
    const velocita = impostazioni.velocita * (1 + (turno - 1) * .18) * scala;
    const haTraiettoriaOndulata = turno >= 2;
    const tipiTraiettoria = turno >= 4 ? ["onda", "zigzag", "tuffo"] : ["onda"];
    const quotaBase = ALTEZZA * (haTraiettoriaOndulata ? .28 + Math.random() * .2 : .15 + Math.random() * .38);
    statoGioco.anatra = {
        x: direzione === 1 ? -40 * scala : LARGHEZZA + 40 * scala,
        y: quotaBase,
        quotaBase,
        velocitaX: direzione * velocita,
        velocitaY: haTraiettoriaOndulata ? 0 : (Math.random() - .5) * velocita * .72,
        tipoTraiettoria: haTraiettoriaOndulata ? tipiTraiettoria[Math.floor(Math.random() * tipiTraiettoria.length)] : "lineare",
        ampiezzaTraiettoria: haTraiettoriaOndulata ? Math.min(7 + (turno - 2) * 7, ALTEZZA * .14) : 0,
        frequenzaTraiettoria: 1.7 + turno * .25,
        faseTraiettoria: Math.random() * Math.PI * 2,
        tempoTraiettoria: 0,
        tempoResiduo: Math.max(2.1, impostazioni.tempoVolo - (turno - 1) * .35),
        fotogramma: 0,
        timerFotogramma: 0,
    };
    statoGioco.colpi = COLPI_PER_ANATRA;
    aggiornaPannello();
}

const attendi = (millisecondi) => new Promise((completa) => window.setTimeout(completa, millisecondi));

function nascondiOverlay() {
    pannelloOverlay.hidden = true;
    pannelloOverlay.classList.remove("is-round-intro");
    pulsanteAvvio.hidden = false;
}

async function continuaPartita(gettone, messaggio, mostraCaduta = false) {
    statoGioco.fase = "traBersagli";
    statoGioco.anatra = null;
    statoGioco.bersagliTurno += 1;
    if (!mostraCaduta) statoGioco.anatraInCaduta = null;
    statoGioco.mira.visibile = false;

    const turnoFinito = statoGioco.bersagliTurno >= BERSAGLI_PER_TURNO;
    mostraStato(
        turnoFinito
            ? "Hai affrontato tutti i bersagli del turno. Caricamento del prossimo turno…"
            : messaggio + " Prossimo bersaglio: " + (statoGioco.bersagliTurno + 1) + "/" + BERSAGLI_PER_TURNO + ".",
        "loading"
    );

    aggiornaPannello();
    await attendi(mostraCaduta ? DURATA_CADUTA * 1000 : 900);
    if (statoGioco.fase !== "traBersagli" || statoGioco.gettonePartita !== gettone) return;
    statoGioco.anatraInCaduta = null;

    if (!turnoFinito) return lanciaAnatra();
    if (statoGioco.turno === NUMERO_TURNI) return terminaPartita();
    statoGioco.turno += 1;
    statoGioco.bersagliTurno = 0;
    aggiornaPannello();
    await mostraIntroTurno(gettone);
}

async function mostraIntroTurno(gettone) {
    statoGioco.fase = "traRound";
    sottotitoloOverlay.textContent = "Nuovo scenario · " + SFONDI_TURNI[statoGioco.turno - 1][1];
    titoloOverlay.textContent = "ROUND " + statoGioco.turno;
    testoOverlay.textContent = BERSAGLI_PER_TURNO + " bersagli · la caccia continua";
    pannelloOverlay.classList.add("is-round-intro");
    pulsanteAvvio.hidden = true;
    pannelloOverlay.hidden = false;
    mostraStato("Preparati per il round " + statoGioco.turno + ".", "loading");
    aggiornaPannello();

    await attendi(1800);
    if (statoGioco.fase !== "traRound" || statoGioco.gettonePartita !== gettone) return;
    lanciaAnatra();
}

function terminaPartita() {
    statoGioco.fase = "conclusa";
    statoGioco.gettonePartita += 1;
    const nuovoRecord = statoGioco.punteggio > statoGioco.recordPersonale;
    if (nuovoRecord && statoGioco.recordDisponibile) {
        try {
            window.localStorage.setItem(CHIAVE_RECORD, String(statoGioco.punteggio));
            statoGioco.recordPersonale = statoGioco.punteggio;
        } catch {
            statoGioco.recordDisponibile = false;
        }
    }
    const { recordDisponibile, colpiSparati, anatreColpite } = statoGioco;
    const precisione = colpiSparati ? Math.round(anatreColpite / colpiSparati * 100) : 0;
    sottotitoloOverlay.textContent = "Partita conclusa";
    titoloOverlay.textContent = nuovoRecord && recordDisponibile ? "Nuovo record!" : "Bella mira!";
    testoOverlay.textContent =
        "Punteggio: " + statoGioco.punteggio + " punti" +
        "\nPapere abbattute: " + anatreColpite + " / " + (BERSAGLI_PER_TURNO * NUMERO_TURNI) +
        " · mancate: " + statoGioco.anatreMancate +
        "\nPrecisione: " + precisione + "% · colpi sparati: " + colpiSparati +
        "\nRecord personale: " + (recordDisponibile ? statoGioco.recordPersonale + " punti" : "salvataggio non disponibile") +
        "\nVuoi fare un'altra partita?";
    pulsanteAvvio.textContent = "Gioca ancora";
    pannelloOverlay.hidden = false;
    mostraStato(
        recordDisponibile
            ? "Partita completata: " + precisione + "% di precisione."
            : "Partita completata, ma il browser non consente di salvare il record.",
        recordDisponibile ? "active" : ""
    );
    aggiornaPannello();
}

function lanciaAnatra() {
    statoGioco.fase = "inCorso";
    creaAnatra();
    nascondiOverlay();
    mostraStato(
        "Turno " + statoGioco.turno + " · bersaglio " + (statoGioco.bersagliTurno + 1) + "/" + BERSAGLI_PER_TURNO + ": prendi la mira!",
        "active"
    );
}

function avviaPartita() {
    if (!statoGioco.graficaCaricata) return;
    statoGioco.gettonePartita += 1;
    Object.assign(statoGioco, {
        turno: 1, bersagliTurno: 0, anatreColpite: 0, anatreMancate: 0, colpiSparati: 0, punteggio: 0,
        colpi: COLPI_PER_ANATRA, anatra: null, anatraInCaduta: null, esitoColpo: null,
    });
    aggiornaPannello();
    mostraIntroTurno(statoGioco.gettonePartita);
}

function aggiornaAnatra(intervallo) {
    const anatra = statoGioco.anatra;
    if (!anatra) return;

    anatra.x += anatra.velocitaX * intervallo;
    anatra.tempoTraiettoria += intervallo;
    if (anatra.ampiezzaTraiettoria) {
        const avanzamento = anatra.tempoTraiettoria * anatra.frequenzaTraiettoria + anatra.faseTraiettoria;
        let scostamento = Math.sin(avanzamento);
        if (anatra.tipoTraiettoria === "zigzag") {
            scostamento = (scostamento + Math.sin(avanzamento * 2.2) * .3) / 1.3;
        } else if (anatra.tipoTraiettoria === "tuffo") {
            scostamento *= .55 + .45 * (.5 + .5 * Math.sin(anatra.tempoTraiettoria * .6));
        }
        anatra.y = anatra.quotaBase + scostamento * anatra.ampiezzaTraiettoria;
        anatra.velocitaY = Math.cos(avanzamento) * anatra.frequenzaTraiettoria * anatra.ampiezzaTraiettoria;
    } else {
        anatra.y += anatra.velocitaY * intervallo;
        if ((anatra.y < ALTEZZA * .12 && anatra.velocitaY < 0) || (anatra.y > ALTEZZA * .64 && anatra.velocitaY > 0)) {
            anatra.velocitaY *= -1;
        }
    }
    anatra.tempoResiduo -= intervallo;
    anatra.timerFotogramma += intervallo;
    if (anatra.timerFotogramma >= .085) {
        anatra.fotogramma = (anatra.fotogramma + Math.floor(anatra.timerFotogramma / .085)) % NUMERO_FOTOGRAMMI;
        anatra.timerFotogramma %= .085;
    }

    const margine = 55 * scalaGioco();
    if (anatra.tempoResiduo <= 0 || anatra.x < -margine || anatra.x > LARGHEZZA + margine) {
        statoGioco.anatreMancate += 1;
        continuaPartita(statoGioco.gettonePartita, "La papera è scappata.");
    }
}

function spara() {
    if (statoGioco.fase !== "inCorso" || statoGioco.colpi === 0) return;

    statoGioco.colpi -= 1;
    statoGioco.colpiSparati += 1;
    const { anatra, mira } = statoGioco;
    const scala = scalaGioco();
    const colpita = Math.abs(mira.x - anatra.x) < 27 * scala && Math.abs(mira.y - anatra.y) < 21 * scala;
    const numeroColpo = COLPI_PER_ANATRA - statoGioco.colpi;
    const punti = colpita ? PUNTI_PER_COLPO[numeroColpo - 1] : 0;
    statoGioco.esitoColpo = { x: mira.x, y: mira.y, colpita, punti, tempoTrascorso: 0 };

    if (colpita) {
        statoGioco.punteggio += punti;
        statoGioco.anatreColpite += 1;
        statoGioco.anatra = null;
        statoGioco.anatraInCaduta = { x: anatra.x, inizioY: anatra.y, velocitaX: anatra.velocitaX * .08, tempoTrascorso: 0 };
        aggiornaPannello();
        continuaPartita(statoGioco.gettonePartita, "Colpita al colpo " + numeroColpo + "! +" + punti + " punti.", true);
        return;
    }

    aggiornaPannello();
    if (statoGioco.colpi === 0) {
        statoGioco.anatreMancate += 1;
        continuaPartita(statoGioco.gettonePartita, "Colpi esauriti: papera mancata.");
    } else {
        mostraStato("Mancato. Restano " + (statoGioco.colpi === 1 ? "1 colpo" : statoGioco.colpi + " colpi") + ".");
    }
}

function puntaMira(evento) {
    const limiti = telaGioco.getBoundingClientRect();
    statoGioco.mira = {
        x: (evento.clientX - limiti.left) * LARGHEZZA / limiti.width,
        y: (evento.clientY - limiti.top) * ALTEZZA / limiti.height,
        visibile: true,
    };
    return statoGioco.mira;
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

pulsanteAvvio.addEventListener("click", avviaPartita);


telaGioco.addEventListener("pointermove", (evento) => {
    const punto = puntaMira(evento);
    const gesto = statoGioco.gestoTouch;
    if (evento.pointerType === "touch" && gesto && (punto.x - gesto.inizioX) ** 2 + (punto.y - gesto.inizioY) ** 2 > 144) {
        gesto.spostato = true;
    }
});

telaGioco.addEventListener("pointerleave", () => { statoGioco.mira.visibile = false; });

telaGioco.addEventListener("pointerdown", (evento) => {
    if (evento.button !== 0) return;
    const punto = puntaMira(evento);
    if (evento.pointerType !== "touch") return spara();
    evento.preventDefault();
    telaGioco.setPointerCapture(evento.pointerId);
    statoGioco.gestoTouch = { inizioX: punto.x, inizioY: punto.y, spostato: false };
});

telaGioco.addEventListener("pointerup", (evento) => {
    if (evento.pointerType !== "touch") return;
    const gesto = statoGioco.gestoTouch;
    statoGioco.gestoTouch = null;
    if (gesto && !gesto.spostato) {
        puntaMira(evento);
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
    } else if (evento.code === "Enter" && statoGioco.fase === "pronta") {
        avviaPartita();
    }
});

window.addEventListener("resize", adattaCanvas);

adattaCanvas();
try {
    statoGioco.recordPersonale = Math.max(0, Number.parseInt(window.localStorage.getItem(CHIAVE_RECORD), 10) || 0);
} catch {
    statoGioco.recordDisponibile = false;
}
aggiornaPannello();
requestAnimationFrame(aggiornaFotogramma);

const caricaImmagine = (percorso) => new Promise((completa, rifiuta) => {
    const immagine = new Image();
    immagine.onload = () => completa(immagine);
    immagine.onerror = () => rifiuta(new Error("Impossibile caricare " + percorso));
    immagine.src = percorso;
});

Promise.all([
    ...SFONDI_TURNI.map(([nome]) => "./img/" + nome + ".png"),
    "./img/frame-anatra.png", "./img/anatra morta frame.png", "./img/mirino.png", "./img/mirino-bianco.png", "./img/frame-cane.png",
].map(caricaImmagine)).then((immagini) => {
    [spriteAnatre, spriteCaduta, immagineMirino, immagineMirinoBianco, spriteCane] = immagini.splice(-5);
    sfondi = immagini;
    statoGioco.graficaCaricata = true;
    pulsanteAvvio.disabled = false;
    pulsanteAvvio.textContent = "Inizia a giocare";
    mostraStato("Pronto: le papere ora volano veloci. Scegli la difficoltà e inizia.");
}).catch((errore) => {
    sottotitoloOverlay.textContent = "Errore di caricamento";
    titoloOverlay.textContent = "Grafica non disponibile";
    testoOverlay.textContent = errore.message + ". Controlla che i file grafici siano nella cartella img.";
    pulsanteAvvio.disabled = true;
    pulsanteAvvio.textContent = "Gioco non disponibile";
    mostraStato("Errore nel caricamento della grafica: " + errore.message);
});
