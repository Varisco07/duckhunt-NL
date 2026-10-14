const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const sceneBackground = new Image();
const duckSpriteSheet = new Image();
const duckDeathSpriteSheet = new Image();
const crosshairImage = new Image();
const dogSpriteSheet = new Image();
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
const bestScoreDisplay = document.querySelector("#bestScoreDisplay");
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
const DUCK_FALL_TIME = 1.05;
const DUCK_DEATH_FRAME_TIME = DUCK_FALL_TIME / 16;
const BEST_SCORE_KEY = "duck-hunt-best-score";
const DUCK_DEATH_FRAMES = [
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
    totalDucksHit: 0,
    ducksEscaped: 0,
    shotsFired: 0,
    score: 0,
    bestScore: 0,
    recordAvailable: true,
    shots: AMMO_PER_DUCK,
    duck: null,
    fallingDuck: null,
    shotFeedback: null,
    touchGesture: null,
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

    const widthScale = WIDTH / oldWidth;
    const heightScale = HEIGHT / oldHeight;
    if (state.duck) {
        state.duck.x *= widthScale;
        state.duck.y *= heightScale;
        state.duck.baseY *= heightScale;
        state.duck.vx *= widthScale;
        state.duck.vy *= heightScale;
        state.duck.pathAmplitude *= heightScale;
    }
    if (state.fallingDuck) {
        state.fallingDuck.x *= widthScale;
        state.fallingDuck.startY *= heightScale;
        state.fallingDuck.vx *= widthScale;
    }
    if (state.shotFeedback) {
        state.shotFeedback.x *= widthScale;
        state.shotFeedback.y *= heightScale;
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
    bestScoreDisplay.textContent = state.recordAvailable
        ? String(state.bestScore).padStart(5, "0")
        : "—";
    const ammoRow = AMMO_PER_DUCK - state.shots;
    ammoDisplay.style.setProperty("--ammo-row", ammoRow);
    ammoDisplay.setAttribute(
        "aria-label",
        state.shots === 1 ? "1 colpo rimasto" : state.shots + " colpi rimasti"
    );
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

function drawFallingDuck() {
    const fallingDuck = state.fallingDuck;
    if (!fallingDuck) return;

    const progress = Math.min(fallingDuck.elapsed / DUCK_FALL_TIME, 1);
    const frame = DUCK_DEATH_FRAMES[Math.min(
        Math.floor(fallingDuck.elapsed / DUCK_DEATH_FRAME_TIME),
        DUCK_DEATH_FRAMES.length - 1
    )];
    const scale = getGameScale() * .48;
    const drawWidth = frame.width * scale;
    const drawHeight = frame.height * scale;
    const x = fallingDuck.x + fallingDuck.vx * fallingDuck.elapsed;
    const y = fallingDuck.startY + (HEIGHT * .78 - fallingDuck.startY) * progress * progress;

    ctx.save();
    ctx.translate(x, y);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        duckDeathSpriteSheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight,
    );
    ctx.restore();
}

function drawShotFeedback() {
    const feedback = state.shotFeedback;
    if (!feedback) return;

    const progress = feedback.elapsed / .52;
    const scale = getGameScale();
    const radius = (9 + progress * 27) * scale;
    const alpha = 1 - progress;
    const color = feedback.hit ? "#f6cf58" : "#ed6858";

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(feedback.x, feedback.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    if (feedback.hit) {
        for (let index = 0; index < 8; index += 1) {
            const angle = index * Math.PI / 4;
            const innerRadius = radius * .75;
            const outerRadius = radius + (8 + (index % 3) * 4) * scale;
            ctx.beginPath();
            ctx.moveTo(
                feedback.x + Math.cos(angle) * innerRadius,
                feedback.y + Math.sin(angle) * innerRadius
            );
            ctx.lineTo(
                feedback.x + Math.cos(angle) * outerRadius,
                feedback.y + Math.sin(angle) * outerRadius
            );
            ctx.stroke();
        }
    } else {
        ctx.beginPath();
        ctx.moveTo(feedback.x - 7 * scale, feedback.y - 7 * scale);
        ctx.lineTo(feedback.x + 7 * scale, feedback.y + 7 * scale);
        ctx.moveTo(feedback.x + 7 * scale, feedback.y - 7 * scale);
        ctx.lineTo(feedback.x - 7 * scale, feedback.y + 7 * scale);
        ctx.stroke();
    }

    ctx.font = "700 " + 13 * scale + "px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.strokeStyle = "rgba(0, 0, 0, .8)";
    ctx.lineWidth = 3 * scale;
    const label = feedback.hit ? "+" + feedback.points : "MANCATO";
    ctx.strokeText(label, feedback.x, feedback.y - radius - 4 * scale);
    ctx.fillStyle = color;
    ctx.fillText(label, feedback.x, feedback.y - radius - 4 * scale);
    ctx.restore();
}

function drawIntroDog() {
    if (state.phase !== "ready" || !state.sceneLoaded) return;
    const frame = { x: 26, y: 46, width: 70, height: 89 };
    const scale = 78 / frame.height * getGameScale();
    const drawWidth = frame.width * scale;
    const drawHeight = frame.height * scale;
    const x = WIDTH * .5;
    const y = HEIGHT * .78;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        dogSpriteSheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        x - drawWidth / 2,
        y - drawHeight / 2,
        drawWidth,
        drawHeight,
    );
}

function draw() {
    drawBackground();
    if (state.duck) drawDuck(state.duck);
    drawFallingDuck();
    drawShotFeedback();
    drawIntroDog();
    drawCrosshair();
}

function createDuck() {
    const settings = DIFFICULTIES[difficultySelect.value];
    const scale = getGameScale();
    const direction = Math.random() < .5 ? -1 : 1;
    const roundSpeed = settings.speed * (1 + (state.round - 1) * .18);
    const speed = roundSpeed * scale;
    const hasWavyPath = state.round >= 2;
    const baseY = hasWavyPath
        ? HEIGHT * (.28 + Math.random() * .2)
        : HEIGHT * (.15 + Math.random() * .38);
    const pathTypes = state.round >= 4 ? ["wave", "weave", "swoop"] : ["wave"];
    state.duck = {
        x: direction === 1 ? -40 * scale : WIDTH + 40 * scale,
        y: baseY,
        baseY,
        vx: direction * speed,
        vy: hasWavyPath ? 0 : (Math.random() - .5) * speed * .72,
        pathType: hasWavyPath
            ? pathTypes[Math.floor(Math.random() * pathTypes.length)]
            : "straight",
        pathAmplitude: hasWavyPath
            ? Math.min(7 + (state.round - 2) * 7, HEIGHT * .14)
            : 0,
        pathFrequency: 1.7 + state.round * .25,
        pathPhase: Math.random() * Math.PI * 2,
        pathTime: 0,
        timeLeft: Math.max(2.1, settings.flightTime - (state.round - 1) * .35),
        frame: 0,
        frameTimer: 0,
    };
    state.shots = AMMO_PER_DUCK;
    updateHud();
}

function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function continueGame(token, message, showFallingDuck = false) {
    state.phase = "between";
    state.duck = null;
    if (!showFallingDuck) state.fallingDuck = null;
    state.aim.visible = false;
    pauseButton.disabled = true;

    if (state.ducksHit >= DUCKS_PER_ROUND) {
        setStatus("Round completato: " + state.ducksHit + " papere abbattute. Caricamento del prossimo round…", "loading");
    } else {
        setStatus(message, "loading");
    }

    updateHud();
    draw();
    await wait(showFallingDuck ? DUCK_FALL_TIME * 1000 : 900);
    if (state.phase !== "between" || state.roundToken !== token) return;
    state.fallingDuck = null;

    if (state.ducksHit >= DUCKS_PER_ROUND) {
        if (state.round === TOTAL_ROUNDS) {
            finishGame();
            return;
        }
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
    const isNewRecord = state.score > state.bestScore;
    if (isNewRecord && state.recordAvailable) {
        try {
            window.localStorage.setItem(BEST_SCORE_KEY, String(state.score));
            state.bestScore = state.score;
        } catch (error) {
            state.recordAvailable = false;
        }
    }
    const accuracy = state.shotsFired
        ? Math.round(state.totalDucksHit / state.shotsFired * 100)
        : 0;
    overlayKicker.textContent = "Partita conclusa";
    overlayTitle.textContent = isNewRecord && state.recordAvailable ? "Nuovo record!" : "Bella mira!";
    overlayText.textContent =
        "Punteggio: " + state.score + " punti" +
        "\nPapere abbattute: " + state.totalDucksHit + " / " + (DUCKS_PER_ROUND * TOTAL_ROUNDS) +
        " · mancate: " + state.ducksEscaped +
        "\nPrecisione: " + accuracy + "% · colpi sparati: " + state.shotsFired +
        "\nRecord personale: " + (state.recordAvailable ? state.bestScore + " punti" : "salvataggio non disponibile") +
        "\nVuoi fare un'altra partita?";
    startButton.textContent = "Gioca ancora";
    difficultySelect.disabled = false;
    overlay.hidden = false;
    setStatus(
        state.recordAvailable
            ? "Partita completata: " + accuracy + "% di precisione."
            : "Partita completata, ma il browser non consente di salvare il record.",
        state.recordAvailable ? "active" : ""
    );
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
    state.totalDucksHit = 0;
    state.ducksEscaped = 0;
    state.shotsFired = 0;
    state.score = 0;
    state.shots = AMMO_PER_DUCK;
    state.duck = null;
    state.fallingDuck = null;
    state.shotFeedback = null;
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
    duck.pathTime += deltaTime;
    if (duck.pathAmplitude) {
        const pathProgress = duck.pathTime * duck.pathFrequency + duck.pathPhase;
        let pathOffset = Math.sin(pathProgress);
        if (duck.pathType === "weave") {
            pathOffset = (pathOffset + Math.sin(pathProgress * 2.2) * .3) / 1.3;
        } else if (duck.pathType === "swoop") {
            pathOffset *= .55 + .45 * (.5 + .5 * Math.sin(duck.pathTime * .6));
        }
        duck.y = duck.baseY + pathOffset * duck.pathAmplitude;
        duck.vy = Math.cos(pathProgress) * duck.pathFrequency * duck.pathAmplitude;
    } else {
        duck.y += duck.vy * deltaTime;
        if ((duck.y < HEIGHT * .12 && duck.vy < 0) || (duck.y > HEIGHT * .64 && duck.vy > 0)) {
            duck.vy *= -1;
        }
    }
    duck.timeLeft -= deltaTime;
    duck.frameTimer += deltaTime;
    if (duck.frameTimer >= .085) {
        const framesElapsed = Math.floor(duck.frameTimer / .085);
        duck.frame = (duck.frame + framesElapsed) % DUCK_FRAME_COUNT;
        duck.frameTimer %= .085;
    }

    const duckMargin = 55 * getGameScale();
    if (duck.timeLeft <= 0 || duck.x < -duckMargin || duck.x > WIDTH + duckMargin) {
        state.ducksEscaped += 1;
        void continueGame(state.roundToken, "La papera è scappata. Un nuovo bersaglio sta arrivando…");
    }
}

function shoot() {
    if (state.phase !== "playing" || state.shots === 0) return;

    state.shots -= 1;
    state.shotsFired += 1;
    const duck = state.duck;
    const scale = getGameScale();
    const hit = duck && Math.abs(state.aim.x - duck.x) < 27 * scale && Math.abs(state.aim.y - duck.y) < 21 * scale;

    if (hit) {
        const points = DUCK_HIT_SCORES[AMMO_PER_DUCK - state.shots - 1];
        state.score += points;
        state.ducksHit += 1;
        state.totalDucksHit += 1;
        state.duck = null;
        state.shotFeedback = {
            x: state.aim.x,
            y: state.aim.y,
            hit: true,
            points,
            elapsed: 0,
        };
        state.fallingDuck = {
            x: duck.x,
            startY: duck.y,
            vx: duck.vx * .08,
            elapsed: 0,
        };
        updateHud();
        const shotNumber = AMMO_PER_DUCK - state.shots;
        void continueGame(
            state.roundToken,
            "Colpita al colpo " + shotNumber + "! +" + points + " punti. Prossimo bersaglio in arrivo…",
            true
        );
        return;
    }

    state.shotFeedback = {
        x: state.aim.x,
        y: state.aim.y,
        hit: false,
        points: 0,
        elapsed: 0,
    };
    updateHud();
    if (state.shots === 0) {
        state.ducksEscaped += 1;
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
    if (state.fallingDuck) state.fallingDuck.elapsed += deltaTime;
    if (state.shotFeedback) {
        state.shotFeedback.elapsed += deltaTime;
        if (state.shotFeedback.elapsed >= .52) state.shotFeedback = null;
    }
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
    const point = getCanvasPoint(event);
    state.aim = { ...point, visible: true };
    if (event.pointerType === "touch" && state.touchGesture) {
        const deltaX = point.x - state.touchGesture.startX;
        const deltaY = point.y - state.touchGesture.startY;
        if (deltaX * deltaX + deltaY * deltaY > 144) {
            state.touchGesture.moved = true;
        }
    }
});

canvas.addEventListener("pointerleave", () => {
    state.aim.visible = false;
});

canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.pointerType === "touch") {
        event.preventDefault();
        canvas.setPointerCapture(event.pointerId);
        const point = getCanvasPoint(event);
        state.aim = { ...point, visible: true };
        state.touchGesture = { startX: point.x, startY: point.y, moved: false };
        return;
    }
    state.aim = { ...getCanvasPoint(event), visible: true };
    shoot();
});

canvas.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch") return;
    const gesture = state.touchGesture;
    state.touchGesture = null;
    if (gesture && !gesture.moved) {
        state.aim = { ...getCanvasPoint(event), visible: true };
        shoot();
    }
    state.aim.visible = false;
});

canvas.addEventListener("pointercancel", (event) => {
    if (event.pointerType !== "touch") return;
    state.touchGesture = null;
    state.aim.visible = false;
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
try {
    const storedBestScore = Number.parseInt(window.localStorage.getItem(BEST_SCORE_KEY), 10);
    state.bestScore = Number.isSafeInteger(storedBestScore) && storedBestScore >= 0
        ? storedBestScore
        : 0;
} catch (error) {
    state.recordAvailable = false;
}
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
    loadImage(duckDeathSpriteSheet, "./img/anatra morta frame.png"),
    loadImage(crosshairImage, "./img/mirino.png"),
    loadImage(dogSpriteSheet, "./img/frame-cane.png"),
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
