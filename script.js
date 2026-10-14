const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const sceneBackground = new Image();
const duckSpriteSheet = new Image();
const crosshairImage = new Image();
const overlay = document.querySelector("#gameOverlay");
const overlayKicker = document.querySelector("#overlayKicker");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const gameShell = document.querySelector(".game-shell");
const difficultySelect = document.querySelector("#difficultySelect");
const difficultyReadout = document.querySelector("#difficultyReadout");
const roundDisplay = document.querySelector("#roundDisplay");
const hitDisplay = document.querySelector("#hitDisplay");
const scoreDisplay = document.querySelector("#scoreDisplay");
const ammoDisplay = document.querySelector("#ammoDisplay");
const statusText = document.querySelector("#statusText");
const statusDot = document.querySelector("#statusDot");

let WIDTH = 800;
let HEIGHT = 480;
const DUCKS_PER_ROUND = 10;
const TOTAL_ROUNDS = 5;
const AMMO_PER_DUCK = 3;
const DUCK_HIT_SCORES = [100, 60, 30];
const DUCK_FRAME_COUNT = 9;
const DUCK_SPRITE_COLUMNS = [
    [[128, 98], [250, 98], [367, 94], [482, 92], [594, 94], [707, 94], [821, 95], [934, 91], [1047, 96]],
    [[128, 94], [245, 93], [362, 88], [470, 94], [587, 93], [701, 89], [815, 92], [931, 97], [1045, 92]],
    [[135, 85], [255, 92], [366, 94], [487, 88], [594, 92], [706, 90], [829, 87], [944, 84], [1048, 94]],
    [[128, 90], [237, 91], [356, 89], [472, 92], [588, 96], [698, 88], [814, 87], [929, 96], [1044, 94]],
    [[136, 91], [249, 93], [366, 93], [485, 85], [588, 94], [708, 90], [822, 90], [933, 92], [1050, 88]],
    [[130, 90], [245, 90], [361, 88], [479, 90], [596, 87], [707, 87], [822, 87], [935, 84], [1045, 87]],
];
const DUCK_SPRITE_TOPS = [
    [43, 23, 35, 16, 43, 43, 18, 16, 43],
    [37, 15, 11, 28, 36, 12, 14, 37, 37],
    [20, 9, 20, 9, 19, 18, 11, 15, 20],
    [19, 21, 22, 18, 23, 17, 17, 23, 23],
    [32, 8, 23, 24, 29, 29, 8, 9, 28],
    [21, 6, 18, 13, 23, 6, 5, 12, 20],
];
const DUCK_SPRITE_BOTTOMS = [
    [95, 85, 84, 86, 91, 94, 86, 86, 95],
    [88, 79, 79, 78, 85, 78, 79, 87, 88],
    [92, 84, 82, 80, 88, 91, 80, 79, 90],
    [93, 82, 85, 84, 88, 85, 86, 88, 91],
    [82, 73, 75, 78, 73, 80, 73, 72, 79],
    [75, 70, 70, 72, 69, 70, 70, 72, 74],
];
const DIFFICULTIES = {
    easy: { label: "Facile", flightTime: 6, speed: 230 },
    normal: { label: "Normale", flightTime: 4.5, speed: 360 },
    hard: { label: "Difficile", flightTime: 3.3, speed: 500 },
};

const state = {
    phase: "ready",
    round: 1,
    ducksHit: 0,
    score: 0,
    shots: AMMO_PER_DUCK,
    duck: null,
    aim: { x: WIDTH / 2, y: HEIGHT / 2, visible: false },
    lastTime: 0,
    roundToken: 0,
    sceneLoaded: false,
};

function fitCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const oldWidth = WIDTH;
    const oldHeight = HEIGHT;
    WIDTH = bounds.width;
    HEIGHT = bounds.height;
    canvas.width = Math.round(WIDTH * ratio);
    canvas.height = Math.round(HEIGHT * ratio);
    ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);

    if (state.duck) {
        state.duck.x *= WIDTH / oldWidth;
        state.duck.y *= HEIGHT / oldHeight;
    }
    state.aim.x = WIDTH / 2;
    state.aim.y = HEIGHT / 2;
    draw();
}

function getGameScale() {
    return Math.max(.65, Math.min(WIDTH / 800, HEIGHT / 480, 2));
}

function setStatus(message, mode = "") {
    statusText.textContent = message;
    statusDot.className = "status-dot" + (mode ? " is-" + mode : "");
}

function updateHud() {
    roundDisplay.textContent = state.phase === "ready" ? "—" : state.round + " / " + TOTAL_ROUNDS;
    hitDisplay.textContent = state.ducksHit + " / " + DUCKS_PER_ROUND;
    scoreDisplay.textContent = String(state.score).padStart(5, "0");
    ammoDisplay.textContent = Array.from(
        { length: AMMO_PER_DUCK },
        (_, index) => index < state.shots ? "●" : "○"
    ).join(" ");
    ammoDisplay.setAttribute("aria-label", state.shots + " colpi rimasti");
}

function drawBackground() {
    ctx.fillStyle = "#2599ee";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (!state.sceneLoaded) return;

    const scale = Math.max(WIDTH / sceneBackground.naturalWidth, HEIGHT / sceneBackground.naturalHeight);
    const imageWidth = sceneBackground.naturalWidth * scale;
    const imageHeight = sceneBackground.naturalHeight * scale;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sceneBackground, (WIDTH - imageWidth) / 2, (HEIGHT - imageHeight) / 2, imageWidth, imageHeight);
}

function drawDuck(duck) {
    const direction = duck.vx < 0 ? -1 : 1;
    const row = Math.abs(duck.vy) > Math.abs(duck.vx) * .45
        ? duck.vy < 0 ? (direction > 0 ? 2 : 3) : (direction > 0 ? 4 : 5)
        : direction > 0 ? 0 : 1;
    const [frameX, frameWidth] = DUCK_SPRITE_COLUMNS[row][duck.frame];
    const frameTop = DUCK_SPRITE_TOPS[row][duck.frame];
    const frameBottom = DUCK_SPRITE_BOTTOMS[row][duck.frame];
    const sourceWidth = frameWidth + 4;
    const sourceHeight = frameBottom - frameTop + 5;
    const spriteScale = Math.min(82 / sourceWidth, 68 / sourceHeight);
    const drawWidth = sourceWidth * spriteScale;
    const drawHeight = sourceHeight * spriteScale;
    ctx.save();
    ctx.translate(duck.x, duck.y);
    ctx.scale(getGameScale(), getGameScale());
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        duckSpriteSheet,
        frameX - 2,
        row * 128 + frameTop - 2,
        sourceWidth,
        sourceHeight,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight,
    );
    ctx.restore();
}

function drawCrosshair() {
    if (!state.aim.visible || state.phase !== "playing") return;
    const { x, y } = state.aim;
    const size = 48 * getGameScale();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(crosshairImage, x - size / 2, y - size / 2, size, size);
}

function draw() {
    drawBackground();
    if (state.duck) drawDuck(state.duck);
    drawCrosshair();
}

function createDuck() {
    const settings = DIFFICULTIES[difficultySelect.value];
    const scale = getGameScale();
    const direction = Math.random() < .5 ? -1 : 1;
    const roundSpeed = settings.speed * (1 + (state.round - 1) * .14);
    const speed = roundSpeed * scale;
    state.duck = {
        x: direction === 1 ? -40 * scale : WIDTH + 40 * scale,
        y: HEIGHT * (.15 + Math.random() * .38),
        vx: direction * speed,
        vy: (Math.random() - .5) * speed * .72,
        timeLeft: Math.max(2, settings.flightTime - (state.round - 1) * .25),
        frame: 0,
        frameTimer: 0,
    };
    state.shots = AMMO_PER_DUCK;
    updateHud();
}

function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function continueGame(token, message) {
    state.phase = "between";
    state.duck = null;
    state.aim.visible = false;
    pauseButton.disabled = true;

    if (state.ducksHit >= DUCKS_PER_ROUND) {
        if (state.round === TOTAL_ROUNDS) {
            finishGame();
            return;
        }
        setStatus("Round completato: " + state.ducksHit + " papere abbattute. Caricamento del prossimo round…", "loading");
    } else {
        setStatus(message, "loading");
    }

    updateHud();
    draw();
    await wait(900);
    if (state.phase !== "between" || state.roundToken !== token) return;

    if (state.ducksHit >= DUCKS_PER_ROUND) {
        state.round += 1;
        state.ducksHit = 0;
        updateHud();
    }

    launchDuck();
}

function finishGame() {
    state.phase = "finished";
    state.roundToken += 1;
    state.duck = null;
    state.aim.visible = false;
    pauseButton.disabled = true;
    overlayKicker.textContent = "Partita conclusa";
    overlayTitle.textContent = "Bella mira!";
    overlayText.textContent = "Hai totalizzato " + state.score + " punti. Vuoi fare un'altra partita?";
    startButton.textContent = "Gioca ancora";
    difficultySelect.disabled = false;
    overlay.hidden = false;
    setStatus("Hai completato tutti e cinque i round.", "active");
    updateHud();
    draw();
}

function launchDuck() {
    state.phase = "playing";
    createDuck();
    overlay.hidden = true;
    pauseButton.disabled = false;
    pauseButton.textContent = "Pausa";
    setStatus("Round " + state.round + ": prendi la mira!", "active");
    state.lastTime = performance.now();
}

function startGame() {
    if (!state.sceneLoaded) return;
    difficultySelect.disabled = true;
    state.roundToken += 1;
    state.round = 1;
    state.ducksHit = 0;
    state.score = 0;
    state.shots = AMMO_PER_DUCK;
    state.duck = null;
    overlay.hidden = true;
    updateHud();
    launchDuck();
}

function pauseGame() {
    if (state.phase === "playing") {
        state.phase = "paused";
        state.aim.visible = false;
        pauseButton.textContent = "Riprendi";
        overlayKicker.textContent = "Round " + state.round;
        overlayTitle.textContent = "In pausa";
        overlayText.textContent = "La partita è ferma. Quando vuoi, torna a caccia.";
        startButton.textContent = "Riprendi";
        overlay.hidden = false;
        setStatus("Partita in pausa.", "");
    } else if (state.phase === "paused") {
        state.phase = "playing";
        state.lastTime = performance.now();
        pauseButton.textContent = "Pausa";
        overlay.hidden = true;
        setStatus("La caccia continua!", "active");
    }
}

function updateDuck(deltaTime) {
    const duck = state.duck;
    if (!duck) return;

    duck.x += duck.vx * deltaTime;
    duck.y += duck.vy * deltaTime;
    duck.timeLeft -= deltaTime;
    duck.frameTimer += deltaTime;
    if (duck.frameTimer >= .085) {
        const framesElapsed = Math.floor(duck.frameTimer / .085);
        duck.frame = (duck.frame + framesElapsed) % DUCK_FRAME_COUNT;
        duck.frameTimer %= .085;
    }

    if ((duck.y < HEIGHT * .12 && duck.vy < 0) || (duck.y > HEIGHT * .64 && duck.vy > 0)) duck.vy *= -1;
    const duckMargin = 55 * getGameScale();
    if (duck.timeLeft <= 0 || duck.x < -duckMargin || duck.x > WIDTH + duckMargin) {
        void continueGame(state.roundToken, "La papera è scappata. Un nuovo bersaglio sta arrivando…");
    }
}

function shoot() {
    if (state.phase !== "playing" || state.shots === 0) return;

    state.shots -= 1;
    const duck = state.duck;
    const scale = getGameScale();
    const hit = duck && Math.abs(state.aim.x - duck.x) < 27 * scale && Math.abs(state.aim.y - duck.y) < 21 * scale;

    if (hit) {
        const points = DUCK_HIT_SCORES[AMMO_PER_DUCK - state.shots - 1];
        state.score += points;
        state.ducksHit += 1;
        state.duck = null;
        updateHud();
        void continueGame(state.roundToken, "Colpita al colpo " + (AMMO_PER_DUCK - state.shots) + "! +" + points + " punti. Prossimo bersaglio in arrivo…");
        return;
    }

    updateHud();
    if (state.shots === 0) {
        void continueGame(state.roundToken, "Colpi esauriti. Prossimo bersaglio in arrivo…");
    } else {
        const remainingShots = state.shots === 1 ? "1 colpo" : state.shots + " colpi";
        setStatus("Mancato. Restano " + remainingShots + ".", "");
    }
}

function getCanvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - bounds.left) * WIDTH / bounds.width,
        y: (event.clientY - bounds.top) * HEIGHT / bounds.height,
    };
}

function updateFullscreenButton() {
    const isFullscreen = Boolean(document.fullscreenElement);
    fullscreenButton.textContent = isFullscreen ? "Esci da schermo intero" : "Schermo intero";
    fullscreenButton.setAttribute("aria-label", isFullscreen ? "Esci da schermo intero" : "Attiva schermo intero");
}

function frame(now) {
    const deltaTime = Math.min((now - state.lastTime) / 1000, .05);
    state.lastTime = now;
    if (state.phase === "playing") updateDuck(deltaTime);
    draw();
    requestAnimationFrame(frame);
}

startButton.addEventListener("click", () => {
    if (state.phase === "paused") {
        pauseGame();
    } else {
        startGame();
    }
});

startButton.addEventListener("mouseover", () => {
    if (state.phase === "ready") setStatus("Premi il pulsante: le papere non aspettano.", "");
});

pauseButton.addEventListener("click", pauseGame);

fullscreenButton.addEventListener("click", async () => {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await gameShell.requestFullscreen();
        }
        updateFullscreenButton();
    } catch (error) {
        setStatus("Impossibile attivare lo schermo intero: " + error.message, "");
    }
});

document.addEventListener("fullscreenchange", () => {
    updateFullscreenButton();
    window.requestAnimationFrame(fitCanvas);
});

difficultySelect.addEventListener("change", () => {
    difficultyReadout.textContent = DIFFICULTIES[difficultySelect.value].label;
    if (state.phase === "ready") {
        setStatus("Difficoltà impostata su " + DIFFICULTIES[difficultySelect.value].label.toLowerCase() + ".", "");
    }
});

canvas.addEventListener("pointermove", (event) => {
    state.aim = { ...getCanvasPoint(event), visible: true };
});

canvas.addEventListener("pointerleave", () => {
    state.aim.visible = false;
});

canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    state.aim = { ...getCanvasPoint(event), visible: true };
    shoot();
});

window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        shoot();
    } else if (event.code === "KeyP" && !event.repeat) {
        pauseGame();
    } else if (event.code === "Enter" && state.phase === "ready") {
        startGame();
    }
});

window.addEventListener("resize", fitCanvas);

fitCanvas();
difficultyReadout.textContent = DIFFICULTIES[difficultySelect.value].label;
updateHud();
draw();
requestAnimationFrame(frame);

function loadImage(image, path) {
    return new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", () => reject(new Error("Impossibile caricare " + path)), { once: true });
        image.src = path;
    });
}

Promise.all([
    loadImage(sceneBackground, "./img/sfondo.png"),
    loadImage(duckSpriteSheet, "./img/frame-anatra.png"),
    loadImage(crosshairImage, "./img/mirino.png"),
]).then(() => {
    state.sceneLoaded = true;
    startButton.disabled = false;
    startButton.textContent = "Inizia a giocare";
    setStatus("Pronto: le papere ora volano veloci. Scegli la difficoltà e inizia.", "");
    draw();
}).catch((error) => {
    overlayKicker.textContent = "Errore di caricamento";
    overlayTitle.textContent = "Grafica non disponibile";
    overlayText.textContent = error.message + ". Controlla che i file grafici siano nella cartella img.";
    startButton.disabled = true;
    startButton.textContent = "Gioco non disponibile";
    setStatus("Errore nel caricamento della grafica: " + error.message, "");
});
