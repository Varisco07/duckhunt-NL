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
const bannerRound = $("#roundBanner");

let animazioniAnatra, animazioniCaduta, immagineMirino, immagineMirinoBianco, spriteCane;
const SFONDI_TURNI = [
    ["sfondo_classico_50fps.mp4", "Prato classico"], ["sfondo_primavera_50fps.mp4", "Primavera"], ["sfondo_autunno_50fps.mp4", "Autunno"],
    ["sfondo_inverno_50fps.mp4", "Inverno"], ["sfondo_notte_50fps.mp4", "Galassia"],
];

let LARGHEZZA = 800;
let ALTEZZA = 480;
const BERSAGLI_PER_TURNO = 10;
const NUMERO_TURNI = 5;
const COLPI_PER_ANATRA = 3;
const PUNTI_PER_COLPO = [100, 60, 30];
const DURATA_CADUTA = 1.05;
const CHIAVE_RECORD = "duck-hunt-best-score";
const IMPOSTAZIONI = { tempoVolo: 4.5, velocita: 360 };

const statoIniziale = {
    turno: 1, bersagliTurno: 0, anatreColpite: 0, anatreMancate: 0, colpiSparati: 0, punteggio: 0,
    colpi: COLPI_PER_ANATRA, anatra: null, anatraInCaduta: null, esitoColpo: null,
};
const statoGioco = {
    ...statoIniziale,
    colpitePerTurno: Array(NUMERO_TURNI).fill(0),
    fase: "pronta",
    recordPersonale: 0,
    recordDisponibile: true,
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
    moltiplica(anatra, ["y", "quotaBase", "ampiezzaTraiettoria"], scalaY);
    moltiplica(anatraInCaduta, ["x", "velocitaX"], scalaX);
    moltiplica(anatraInCaduta, ["inizioY"], scalaY);
    moltiplica(esitoColpo, ["x"], scalaX);
    moltiplica(esitoColpo, ["y"], scalaY);
    statoGioco.mira.x = LARGHEZZA / 2;
    statoGioco.mira.y = ALTEZZA / 2;
}

const scalaGioco = () => Math.max(.65, Math.min(LARGHEZZA / 800, ALTEZZA / 480, 2));

const formatta = (valore) => String(valore).padStart(5, "0");

function aggiornaPannello() {
    testoTurno.textContent = statoGioco.fase === "pronta" ? "—" : statoGioco.turno + " / " + NUMERO_TURNI;
    testoBersagli.textContent = statoGioco.bersagliTurno + " / " + BERSAGLI_PER_TURNO;
    testoPunteggio.textContent = formatta(statoGioco.punteggio);
    testoRecord.textContent = statoGioco.recordDisponibile ? formatta(statoGioco.recordPersonale) : "—";
    testoColpi.style.setProperty("--ammo-row", COLPI_PER_ANATRA - statoGioco.colpi);
    testoColpi.setAttribute("aria-label", statoGioco.colpi === 1 ? "1 colpo rimasto" : statoGioco.colpi + " colpi rimasti");
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
    contesto.imageSmoothingEnabled = false;
    contesto.drawImage(spriteCane, 26, 46, 70, 89, LARGHEZZA * .5 - 35 * scala, ALTEZZA * .78 - 44.5 * scala, 70 * scala, 89 * scala);
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
    const turno = statoGioco.turno;
    const scala = scalaGioco();
    const direzione = Math.random() < .5 ? -1 : 1;
    const velocita = IMPOSTAZIONI.velocita * (1 + (turno - 1) * .18) * scala;
    const tipiTraiettoria = turno >= 4 ? ["onda", "zigzag", "tuffo"] : ["onda"];
    const quotaBase = ALTEZZA * (.34 + Math.random() * .08);
    const ampiezzaTraiettoria = Math.min(70 + (turno - 1) * 8, ALTEZZA * .2);
    statoGioco.anatra = {
        x: direzione === 1 ? -40 * scala : LARGHEZZA + 40 * scala,
        y: quotaBase,
        quotaBase,
        velocitaX: direzione * velocita,
        tipoTraiettoria: tipiTraiettoria[Math.floor(Math.random() * tipiTraiettoria.length)],
        ampiezzaTraiettoria,
        frequenzaTraiettoria: 1.7 + turno * .25,
        faseTraiettoria: Math.random() * Math.PI * 2,
        tempoTraiettoria: 0,
        tempoResiduo: Math.max(2.1, IMPOSTAZIONI.tempoVolo - (turno - 1) * .35),
    };
    statoGioco.colpi = COLPI_PER_ANATRA;
    aggiornaPannello();
}

const attendi = (millisecondi) => new Promise((completa) => window.setTimeout(completa, millisecondi));

function nascondiOverlay() {
    pannelloOverlay.hidden = true;
    bannerRound.hidden = true;
    pannelloOverlay.classList.remove("is-round-intro", "is-paused");
    pulsanteAvvio.hidden = false;
}

function riprendiPartita() {
    if (statoGioco.fase !== "inPausa") return;
    statoGioco.fase = "inCorso";
    nascondiOverlay();
    pulsanteAvvio.textContent = "Inizia a giocare";
    videoSfondo.play().catch(() => {});
}

function attivaPausa() {
    if (statoGioco.fase === "inPausa") return riprendiPartita();
    if (statoGioco.fase !== "inCorso") return;
    statoGioco.fase = "inPausa";
    statoGioco.mira.visibile = false;
    videoSfondo.pause();
    nascondiOverlay();
    pannelloOverlay.classList.add("is-paused");
    mostraOverlay("", "Pausa", "", "Riprendi");
}

function mostraOverlay(sottotitolo, titolo, testo, pulsante) {
    pannelloOverlay.dataset.fase = statoGioco.fase;
    sottotitoloOverlay.textContent = sottotitolo;
    titoloOverlay.textContent = titolo;
    testoOverlay.textContent = testo;
    pulsanteAvvio.textContent = pulsante;
    pannelloOverlay.hidden = false;
}

async function continuaPartita(gettone, messaggio, mostraCaduta = false) {
    statoGioco.fase = "traBersagli";
    statoGioco.anatra = null;
    statoGioco.bersagliTurno += 1;
    if (!mostraCaduta) statoGioco.anatraInCaduta = null;
    statoGioco.mira.visibile = false;

    const turnoFinito = statoGioco.bersagliTurno >= BERSAGLI_PER_TURNO;
    aggiornaPannello();
    await attendi(mostraCaduta ? DURATA_CADUTA * 1000 : 900);
    if (statoGioco.fase !== "traBersagli" || statoGioco.gettonePartita !== gettone) return;
    statoGioco.anatraInCaduta = null;

    if (!turnoFinito) return lanciaAnatra();
    if (statoGioco.turno === NUMERO_TURNI) return terminaPartita();
    statoGioco.turno += 1;
    statoGioco.bersagliTurno = 0;
    await mostraIntroTurno(gettone);
}

async function mostraIntroTurno(gettone) {
    statoGioco.fase = "traRound";
    bannerRound.src = "./img/round" + statoGioco.turno + ".png";
    bannerRound.alt = "Round " + statoGioco.turno + " - " + SFONDI_TURNI[statoGioco.turno - 1][1];
    bannerRound.hidden = false;
    mostraOverlay("Nuovo scenario · " + SFONDI_TURNI[statoGioco.turno - 1][1],
        "ROUND " + statoGioco.turno, BERSAGLI_PER_TURNO + " bersagli · la caccia continua", pulsanteAvvio.textContent);
    pannelloOverlay.classList.add("is-round-intro");
    pulsanteAvvio.hidden = true;
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
    const valutazione = statoGioco.punteggio >= 4000 ? "Cecchino" : statoGioco.punteggio >= 2000 ? "Buona mira" : "Principiante";
    $("#finalScore").textContent = formatta(statoGioco.punteggio);
    $("#finalAccuracy").textContent = precisione + "%";
    $("#finalHits").textContent = anatreColpite + " / " + BERSAGLI_PER_TURNO * NUMERO_TURNI;
    document.querySelectorAll("#roundResults li").forEach((riga, indice) => {
        riga.querySelector("meter").value = statoGioco.colpitePerTurno[indice];
        riga.querySelector("strong").textContent = statoGioco.colpitePerTurno[indice] + " / " + BERSAGLI_PER_TURNO;
    });
    mostraOverlay(nuovoRecord && recordDisponibile ? "Partita conclusa · Nuovo record!" : "Partita conclusa", valutazione,
        "Colpi sparati: " + colpiSparati + " · papere mancate: " + statoGioco.anatreMancate +
        "\nRecord personale: " + (recordDisponibile ? statoGioco.recordPersonale + " punti" : "salvataggio non disponibile") +
        "\nVuoi fare un'altra partita?", "Gioca ancora");
    aggiornaPannello();
}

function lanciaAnatra() {
    statoGioco.fase = "inCorso";
    creaAnatra();
    nascondiOverlay();
}

function avviaPartita() {
    if (!statoGioco.graficaCaricata) return;
    statoGioco.gettonePartita += 1;
    Object.assign(statoGioco, statoIniziale);
    statoGioco.colpitePerTurno.fill(0);
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
        statoGioco.colpitePerTurno[statoGioco.turno - 1] += 1;
        statoGioco.anatraInCaduta = {
            x: anatra.x, inizioY: anatra.y, velocitaX: anatra.velocitaX * .08,
            direzione: anatra.velocitaX < 0 ? "sinistra" : "destra", tempoTrascorso: 0,
        };
        continuaPartita(statoGioco.gettonePartita, "Colpita al colpo " + numeroColpo + "! +" + punti + " punti.", true);
        return;
    }

    aggiornaPannello();
    if (statoGioco.colpi === 0) {
        statoGioco.anatreMancate += 1;
        continuaPartita(statoGioco.gettonePartita, "Colpi esauriti: papera mancata.");
    }
}

function puntaMira(evento) {
    const limiti = telaGioco.getBoundingClientRect();
    statoGioco.mira = {
        x: (evento.clientX - limiti.left) * LARGHEZZA / limiti.width,
        y: (evento.clientY - limiti.top) * ALTEZZA / limiti.height,
        visibile: true,
    };
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


telaGioco.addEventListener("mousemove", puntaMira);
telaGioco.addEventListener("mouseleave", () => { statoGioco.mira.visibile = false; });
telaGioco.addEventListener("mousedown", (evento) => {
    if (evento.button !== 0) return;
    puntaMira(evento);
    spara();
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

[1, 2, 3, 4, 5].forEach((n) => { new Image().src = "./img/round" + n + ".png"; });

Promise.all([
    "./gif/anatra_destra.gif", "./gif/anatra_sinistra.gif",
    "./gif/anatra_caduta_destra.gif", "./gif/anatra_caduta_sinistra.gif",
    "./img/mirino.png", "./img/mirino-bianco.png", "./img/frame-cane.png",
].map(caricaImmagine)).then(([destra, sinistra, cadutaDestra, cadutaSinistra, mirino, mirinoBianco, cane]) => {
    animazioniAnatra = { destra, sinistra };
    animazioniCaduta = { destra: cadutaDestra, sinistra: cadutaSinistra };
    immagineMirino = mirino;
    immagineMirinoBianco = mirinoBianco;
    spriteCane = cane;
    statoGioco.graficaCaricata = true;
    pulsanteAvvio.disabled = false;
    pulsanteAvvio.textContent = "Inizia a giocare";
}).catch((errore) => {
    mostraOverlay("Errore di caricamento", "Grafica non disponibile",
        errore.message + ". Controlla che i file grafici siano nelle cartelle img e gif.", "Gioco non disponibile");
    pulsanteAvvio.disabled = true;
});
