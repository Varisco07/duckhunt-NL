const $ = (selettore) => document.querySelector(selettore);
const telaGioco = $("#gameCanvas");
const contesto = telaGioco.getContext("2d");
const campoGioco = $(".canvas-wrap");
const videoSfondo = $("#gameBackground");
const immagineAnatra = $("#duckSprite");
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

let animazioniAnatra, animazioniCaduta, immagineMirino, immagineMirinoBianco, spriteCane;
const SFONDI_TURNI = [
    ["sfondo_classico_50fps.mp4", "Prato classico"], ["sfondo_primavera_50fps.mp4", "Primavera"], ["sfondo_autunno_50fps.mp4", "Autunno"],
    ["sfondo_inverno_50fps.mp4", "Inverno"], ["sfondo_notte_50fps.mp4", "Galassia"],
];
const GIF_ANATRE = {
    destra: "anatra_destra.gif",
    sinistra: "anatra_sinistra.gif",
};

let LARGHEZZA = 800;
let ALTEZZA = 480;
const BERSAGLI_PER_TURNO = 10;
const NUMERO_TURNI = 5;
const COLPI_PER_ANATRA = 3;
const PUNTI_PER_COLPO = [100, 60, 30];
const DURATA_CADUTA = 1.05;
const CHIAVE_RECORD = "duck-hunt-best-score";
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
    if (!statoGioco.graficaCaricata) return;
    const sfondo = SFONDI_TURNI[statoGioco.turno - 1][0];
    if (campoGioco.dataset.sfondo !== sfondo) {
        campoGioco.dataset.sfondo = sfondo;
        videoSfondo.src = "./gif/" + sfondo;
        videoSfondo.load();
        videoSfondo.play().catch(() => {});
    }
}

function mostraAnatra(immagine, x, y, inclinazione) {
    if (immagineAnatra.dataset.sorgente !== immagine.src) {
        immagineAnatra.dataset.sorgente = immagine.src;
        immagineAnatra.src = immagine.src;
    }
    const scala = Math.min(82 / immagine.naturalWidth, 68 / immagine.naturalHeight) * scalaGioco();
    immagineAnatra.hidden = false;
    immagineAnatra.style.left = x + "px";
    immagineAnatra.style.top = y + "px";
    immagineAnatra.style.width = immagine.naturalWidth * scala + "px";
    immagineAnatra.style.height = immagine.naturalHeight * scala + "px";
    immagineAnatra.style.transform = "translate(-50%, -50%) rotate(" + inclinazione + "rad)";
}

function disegnaMirino() {
    if (!statoGioco.mira.visibile || statoGioco.fase !== "inCorso") return;
    const { x, y } = statoGioco.mira;
    const dimensione = 48 * scalaGioco();
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(statoGioco.turno === NUMERO_TURNI ? immagineMirinoBianco : immagineMirino, x - dimensione / 2, y - dimensione / 2, dimensione, dimensione);
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
    contesto.clearRect(0, 0, LARGHEZZA, ALTEZZA);
    disegnaSfondo();
    if (statoGioco.anatra) {
        const anatra = statoGioco.anatra;
        const direzione = anatra.velocitaX < 0 ? "sinistra" : "destra";
        mostraAnatra(animazioniAnatra[direzione], anatra.x, anatra.y, 0);
    } else if (statoGioco.anatraInCaduta) {
        const caduta = statoGioco.anatraInCaduta;
        const progresso = Math.min(caduta.tempoTrascorso / DURATA_CADUTA, 1);
        mostraAnatra(animazioniCaduta[caduta.direzione],
            caduta.x + caduta.velocitaX * caduta.tempoTrascorso,
            caduta.inizioY + (ALTEZZA * .78 - caduta.inizioY) * progresso * progresso,
            caduta.direzione === "destra" ? .12 : -.12);
    } else {
        immagineAnatra.hidden = true;
    }
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
    const tipiTraiettoria = turno >= 4 ? ["onda", "zigzag", "tuffo"] : ["onda"];
    const quotaBase = ALTEZZA * (.34 + Math.random() * .08);
    const ampiezzaTraiettoria = Math.min(70 + (turno - 1) * 8, ALTEZZA * .2);
    statoGioco.anatra = {
        x: direzione === 1 ? -40 * scala : LARGHEZZA + 40 * scala,
        y: quotaBase,
        quotaBase,
        velocitaX: direzione * velocita,
        velocitaY: 0,
        tipoTraiettoria: tipiTraiettoria[Math.floor(Math.random() * tipiTraiettoria.length)],
        ampiezzaTraiettoria,
        frequenzaTraiettoria: 1.7 + turno * .25,
        faseTraiettoria: Math.random() * Math.PI * 2,
        tempoTraiettoria: 0,
        tempoResiduo: Math.max(2.1, impostazioni.tempoVolo - (turno - 1) * .35),
    };
    statoGioco.colpi = COLPI_PER_ANATRA;
    aggiornaPannello();
}

const attendi = (millisecondi) => new Promise((completa) => window.setTimeout(completa, millisecondi));

function nascondiOverlay() {
    pannelloOverlay.hidden = true;
    pannelloOverlay.classList.remove("is-round-intro", "is-paused");
    pulsanteAvvio.hidden = false;
}

function mettiInPausa() {
    if (statoGioco.fase !== "inCorso") return;
    statoGioco.fase = "inPausa";
    statoGioco.mira.visibile = false;
    videoSfondo.pause();
    sottotitoloOverlay.textContent = "";
    titoloOverlay.textContent = "Pausa";
    testoOverlay.textContent = "";
    pannelloOverlay.classList.remove("is-round-intro");
    pannelloOverlay.classList.add("is-paused");
    pulsanteAvvio.textContent = "Riprendi";
    pulsanteAvvio.hidden = false;
    pannelloOverlay.hidden = false;
}

function riprendiPartita() {
    if (statoGioco.fase !== "inPausa") return;
    statoGioco.fase = "inCorso";
    nascondiOverlay();
    pulsanteAvvio.textContent = "Inizia a giocare";
    videoSfondo.play().catch(() => {});
}

function attivaPausa() {
    if (statoGioco.fase === "inPausa") {
        riprendiPartita();
    } else {
        mettiInPausa();
    }
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
    const avanzamento = anatra.tempoTraiettoria * anatra.frequenzaTraiettoria + anatra.faseTraiettoria;
    let scostamento = Math.sin(avanzamento);
    if (anatra.tipoTraiettoria === "zigzag") {
        scostamento = (scostamento + Math.sin(avanzamento * 2.2) * .3) / 1.3;
    } else if (anatra.tipoTraiettoria === "tuffo") {
        scostamento *= .55 + .45 * (.5 + .5 * Math.sin(anatra.tempoTraiettoria * .6));
    }
    anatra.y = anatra.quotaBase + scostamento * anatra.ampiezzaTraiettoria;
    anatra.velocitaY = Math.cos(avanzamento) * anatra.frequenzaTraiettoria * anatra.ampiezzaTraiettoria;
    anatra.tempoResiduo -= intervallo;
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
        statoGioco.anatraInCaduta = {
            x: anatra.x, inizioY: anatra.y, velocitaX: anatra.velocitaX * .08,
            direzione: anatra.velocitaX < 0 ? "sinistra" : "destra", tempoTrascorso: 0,
        };
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
    if (statoGioco.fase !== "inPausa") {
        if (statoGioco.fase === "inCorso") aggiornaAnatra(intervallo);
        if (statoGioco.anatraInCaduta) statoGioco.anatraInCaduta.tempoTrascorso += intervallo;
        if (statoGioco.esitoColpo) {
            statoGioco.esitoColpo.tempoTrascorso += intervallo;
            if (statoGioco.esitoColpo.tempoTrascorso >= .52) statoGioco.esitoColpo = null;
        }
    }
    disegna();
    requestAnimationFrame(aggiornaFotogramma);
}

pulsanteAvvio.addEventListener("click", () => {
    if (statoGioco.fase === "inPausa") riprendiPartita();
    else avviaPartita();
});


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
    if ((evento.code === "Escape" || evento.code === "KeyP") && !evento.repeat) {
        evento.preventDefault();
        attivaPausa();
    } else if (evento.code === "Space") {
        evento.preventDefault();
        spara();
    } else if (evento.code === "Enter" && statoGioco.fase === "pronta") {
        avviaPartita();
    }
});
sdnfkjasnfndkffffffdddddd
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

const percorsiGifAnatre = Object.entries(GIF_ANATRE).map(([direzione, file]) => [direzione, "./gif/" + file]);
const numeroGifAnatre = percorsiGifAnatre.length;

Promise.all([
    ...percorsiGifAnatre.map(([, percorso]) => percorso),
    "./gif/anatra_caduta_destra.gif", "./gif/anatra_caduta_sinistra.gif",
    "./img/mirino.png", "./img/mirino-bianco.png", "./img/frame-cane.png",
].map(caricaImmagine)).then((immagini) => {
    animazioniAnatra = Object.fromEntries(percorsiGifAnatre.map(([direzione], indice) => [
        direzione, immagini[indice],
    ]));
    [animazioniCaduta, immagineMirino, immagineMirinoBianco, spriteCane] = [
        { destra: immagini[numeroGifAnatre], sinistra: immagini[numeroGifAnatre + 1] },
        ...immagini.slice(numeroGifAnatre + 2),
    ];
    statoGioco.graficaCaricata = true;
    pulsanteAvvio.disabled = false;
    pulsanteAvvio.textContent = "Inizia a giocare";
    mostraStato("Pronto: le papere ora volano veloci. Scegli la difficoltà e inizia.");
}).catch((errore) => {
    sottotitoloOverlay.textContent = "Errore di caricamento";
    titoloOverlay.textContent = "Grafica non disponibile";
    testoOverlay.textContent = errore.message + ". Controlla che i file grafici siano nelle cartelle img e gif.";
    pulsanteAvvio.disabled = true;
    pulsanteAvvio.textContent = "Gioco non disponibile";
    mostraStato("Errore nel caricamento della grafica: " + errore.message);
});
