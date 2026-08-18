const stars = document.getElementById("stars");
const fx = document.getElementById("fx");

function isGirlReveal() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("meisje") || params.get("gender") === "meisje") return true;
  return window.GENDER_REVEAL === "meisje";
}

// Eigenaar-preview: ?preview of ?nu ontgrendelt Start vóór het reveal-moment.
function isPreviewMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has("preview") || params.has("nu");
}

function zonedDateTimeToUtc({ year, month, day, hour, minute, second, timeZone }) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  function getOffset(ms) {
    const parts = Object.fromEntries(
      dtf.formatToParts(new Date(ms)).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
    );
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    return asUtc - ms;
  }

  let ms = utcGuess;
  for (let i = 0; i < 3; i += 1) {
    ms = utcGuess - getOffset(ms);
  }
  return ms;
}

function getRevealTimestamp() {
  const cfg = window.REVEAL_AT;
  if (!cfg) return 0;
  return zonedDateTimeToUtc(cfg);
}

function padCountdown(n) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function hideSkipUntilShow() {
  const skip = document.querySelector("[data-skip]");
  if (skip) skip.hidden = true;
}

function initCountdownGate() {
  const invite = document.querySelector("[data-invite]");
  const startScreen = document.querySelector("[data-start]");
  const startBtn = document.querySelector("[data-start-btn]");
  const daysEl = document.querySelector("[data-countdown-days]");
  const hoursEl = document.querySelector("[data-countdown-hours]");
  const minutesEl = document.querySelector("[data-countdown-minutes]");
  const secondsEl = document.querySelector("[data-countdown-seconds]");
  if (!invite || !startScreen || !startBtn) return;

  const revealAt = getRevealTimestamp();
  let unlocked = isPreviewMode();

  function unlockStart() {
    if (unlocked) return;
    unlocked = true;
    invite.hidden = true;
    startScreen.hidden = false;
    startBtn.disabled = false;
    hideSkipUntilShow();
    document.body.dataset.scene = "start";
    document.title = "Hoop ontwaakt";
  }

  function renderCountdown() {
    if (unlocked) return;
    const remaining = revealAt - Date.now();
    if (remaining <= 0) {
      unlockStart();
      return;
    }
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (daysEl) daysEl.textContent = String(days);
    if (hoursEl) hoursEl.textContent = padCountdown(hours);
    if (minutesEl) minutesEl.textContent = padCountdown(minutes);
    if (secondsEl) secondsEl.textContent = padCountdown(seconds);
  }

  if (unlocked || Date.now() >= revealAt) {
    invite.hidden = true;
    startScreen.hidden = false;
    startBtn.disabled = false;
    hideSkipUntilShow();
    document.body.dataset.scene = "start";
    document.title = "Hoop ontwaakt";
    return;
  }

  document.body.dataset.scene = "invite";
  document.title = "Het moment nadert";
  invite.hidden = false;
  startScreen.hidden = true;
  startBtn.disabled = true;
  hideSkipUntilShow();
  renderCountdown();
  window.setInterval(renderCountdown, 1000);
}

function isRevealUnlocked() {
  return isPreviewMode() || Date.now() >= getRevealTimestamp();
}

function sizeCanvas(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return ctx;
}

/* —— Sterrenhemel (alleen crawl/reveal) —— */
if (stars) {
  const ctx = sizeCanvas(stars);
  const dots = Array.from({ length: 180 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.4 + 0.2,
    a: Math.random() * 0.8 + 0.2,
    tw: Math.random() * Math.PI * 2,
  }));

  function drawStars() {
    ctx.clearRect(0, 0, stars.width, stars.height);
    const t = performance.now() / 800;
    for (const d of dots) {
      ctx.globalAlpha = d.a * (0.55 + 0.45 * Math.sin(t + d.tw));
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(d.x * stars.width, d.y * stars.height, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawStars);
  }

  window.addEventListener("resize", () => sizeCanvas(stars));
  drawStars();
}

/* —— Confetti / glitter —— */
const palettes = {
  boy: ["#7ec8ff", "#ffe66a", "#ffffff", "#4aa3e6", "#c9a227"],
  girl: ["#ff4d8d", "#ffb6d9", "#ffffff", "#ffd6ea", "#f3c96b", "#ff7eb3", "#fff0f6"],
};

let pieces = [];
let running = false;
let fxCtx = null;
let fxColors = palettes.boy;

function spawnBurst(count, colors, fromTop = false) {
  if (!fx) return;
  fxCtx = fxCtx || sizeCanvas(fx);
  const cx = fx.width / 2;
  const cy = fromTop ? 0 : fx.height * 0.38;

  for (let i = 0; i < count; i += 1) {
    const angle = fromTop ? Math.PI / 2 + (Math.random() - 0.5) * 1.4 : Math.random() * Math.PI * 2;
    const speed = fromTop ? 3 + Math.random() * 6 : 7 + Math.random() * 12;
    pieces.push({
      x: fromTop ? Math.random() * fx.width : cx,
      y: fromTop ? -10 : cy,
      vx: fromTop ? (Math.random() - 0.5) * 4 : Math.cos(angle) * speed,
      vy: fromTop ? speed : Math.sin(angle) * speed - 5,
      w: 6 + Math.random() * 9,
      h: 8 + Math.random() * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      life: 160 + Math.random() * 90,
      round: Math.random() > 0.55,
    });
  }
}

function tick() {
  if (!fxCtx) return;
  fxCtx.clearRect(0, 0, fx.width, fx.height);
  pieces = pieces.filter((p) => p.life > 0 && p.y < fx.height + 40);

  for (const p of pieces) {
    p.vy += 0.16;
    p.vx *= 0.995;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;

    fxCtx.save();
    fxCtx.translate(p.x, p.y);
    fxCtx.rotate(p.rot);
    fxCtx.globalAlpha = Math.min(1, p.life / 50);
    fxCtx.fillStyle = p.color;
    if (p.round) {
      fxCtx.beginPath();
      fxCtx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
      fxCtx.fill();
    } else {
      fxCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    fxCtx.restore();
  }

  if (pieces.length) {
    requestAnimationFrame(tick);
  } else {
    running = false;
  }
}

function celebrate(kind) {
  fxColors = palettes[kind] || palettes.boy;
  if (fx) {
    fxCtx = sizeCanvas(fx);
  }
  spawnBurst(kind === "girl" ? 240 : 180, fxColors, kind === "girl");
  if (!running) {
    running = true;
    tick();
  }
  window.setTimeout(() => spawnBurst(kind === "girl" ? 120 : 80, fxColors, kind === "girl"), 420);
}

window.addEventListener("resize", () => {
  if (fx) sizeCanvas(fx);
});

/* —— Audio: eigen mp3 óf originele ruimte-fanfare (geen filmthema) —— */
const htmlAudio = document.getElementById("intro-audio");
const muteBtn = document.querySelector("[data-mute]");
let audioCtx = null;
let masterGain = null;
let muted = false;

function applyMute() {
  if (htmlAudio) htmlAudio.muted = muted;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 1, audioCtx.currentTime, 0.04);
  }
  if (muteBtn) muteBtn.textContent = muted ? "Geluid aan" : "Geluid uit";
}

function stopAudio() {
  if (htmlAudio) {
    htmlAudio.pause();
    htmlAudio.currentTime = 0;
  }
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15);
  }
}

async function mp3Exists() {
  try {
    const res = await fetch("audio/intro.mp3", { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

function ensureAudioGraph() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playOriginalSpaceIntro() {
  const ctx = ensureAudioGraph();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;

  function connectOut(node) {
    node.connect(masterGain);
  }

  function pad(freq, start, dur, type, amp) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.value = freq;
    filt.type = "lowpass";
    filt.frequency.value = 520;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(amp, start + 1.4);
    gain.gain.setValueAtTime(amp, start + Math.max(dur - 2.2, 1.6));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(filt);
    filt.connect(gain);
    connectOut(gain);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function timpani(freq, time, amp) {
    const osc = ctx.createOscillator();
    const noise = ctx.createOscillator();
    const gain = ctx.createGain();
    const ng = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.62, time + 0.45);
    filt.type = "lowpass";
    filt.frequency.value = 160;
    gain.gain.setValueAtTime(amp, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.95);
    osc.connect(filt);
    filt.connect(gain);
    connectOut(gain);
    noise.type = "square";
    noise.frequency.value = freq * 3.1;
    ng.gain.setValueAtTime(amp * 0.08, time);
    ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    noise.connect(ng);
    connectOut(ng);
    osc.start(time);
    osc.stop(time + 1.05);
    noise.start(time);
    noise.stop(time + 0.14);
  }

  function chord(freqs, time, dur, amp) {
    const filt = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(900, time);
    filt.frequency.linearRampToValueAtTime(1600, time + 0.35);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(amp, time + 0.09);
    gain.gain.setValueAtTime(amp, time + dur - 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    filt.connect(gain);
    connectOut(gain);
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.connect(filt);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    });
  }

  /* Origineel: mineur-terts-drone, pauken in tweeën, kwartstapeling.
     Geen kwint-opening, geen da-da-da-daaaa, geen Bb-fanfare. */
  pad(58.27, now, 56, "sine", 0.11);      /* A#1 — drone, geen kwintpaar */
  pad(69.3, now, 56, "triangle", 0.05);   /* C#2 — kleine terts erboven */
  pad(87.31, now + 8, 48, "sine", 0.035); /* F2 — later zachter */

  timpani(46.25, now + 0.9, 0.62);        /* één zware hit */
  timpani(43.65, now + 2.55, 0.42);       /* twee hits, géén triplet+lang */
  timpani(38.89, now + 2.82, 0.38);

  chord([123.47, 164.81, 220.0, 293.66], now + 4.05, 1.7, 0.055); /* kwart-achtig: B2 E3 A3 D4 */
  chord([138.59, 174.61, 220.0, 277.18], now + 5.95, 1.85, 0.06); /* C#3 F3 A3 C#4 */
  chord([146.83, 184.99, 233.08, 311.13], now + 8.0, 2.6, 0.05);  /* D3 F#3 A#3 D#4 */
}

async function startAudio() {
  const hasFile = await mp3Exists();
  if (hasFile && htmlAudio) {
    htmlAudio.volume = 0.88;
    htmlAudio.muted = muted;
    try {
      await htmlAudio.play();
      return;
    } catch {
      /* valt terug op originele synth */
    }
  }
  playOriginalSpaceIntro();
}

muteBtn?.addEventListener("click", () => {
  muted = !muted;
  applyMute();
});

/* —— Crawl-flow —— */
let crawlPaused = false;
let crawlEndTimer = 0;
let crawlSpeed = 1;

function crawlTrack() {
  return document.querySelector("[data-crawl-track]");
}

function crawlAnimation() {
  const track = crawlTrack();
  return track?.getAnimations?.()?.[0] ?? null;
}

function applyCrawlSpeed() {
  const anim = crawlAnimation();
  if (anim) anim.playbackRate = crawlSpeed;
  const label = document.querySelector("[data-speed-label]");
  if (label) {
    const pretty = Number.isInteger(crawlSpeed) ? `${crawlSpeed}` : String(crawlSpeed);
    label.textContent = `${pretty}×`;
  }
}

function crawlDurationMs(anim) {
  const timing = anim?.effect?.getComputedTiming?.();
  const duration = Number(timing?.duration);
  return Number.isFinite(duration) ? duration : 0;
}

function scrubCrawlByPixels(dy) {
  const anim = crawlAnimation();
  const track = crawlTrack();
  if (!anim || !track) return;
  const travel = track.scrollHeight + window.innerHeight;
  const msPerPx = travel > 0 ? crawlDurationMs(anim) / travel : 20;
  const next = (anim.currentTime || 0) - dy * msPerPx;
  const max = crawlDurationMs(anim) || next;
  anim.currentTime = Math.min(max, Math.max(0, next));
}

function setCrawlPaused(paused) {
  crawlPaused = paused;
  const anim = crawlAnimation();
  if (anim) {
    if (paused) anim.pause();
    else anim.play();
  } else {
    const track = crawlTrack();
    if (track) track.style.animationPlayState = paused ? "paused" : "running";
  }
  const btn = document.querySelector("[data-pause]");
  if (btn) btn.textContent = paused ? "Speel" : "Pauze";
}

function hideGalaxyChrome() {
  const start = document.querySelector("[data-start]");
  const intro = document.querySelector("[data-intro]");
  const crawl = document.querySelector("[data-crawl]");
  const skip = document.querySelector("[data-skip]");
  const controls = document.querySelector("[data-crawl-controls]");
  if (start) start.hidden = true;
  if (intro) intro.hidden = true;
  if (crawl) crawl.hidden = true;
  if (skip) skip.hidden = true;
  if (controls) controls.hidden = true;
  if (muteBtn) muteBtn.hidden = true;
}

function preloadRevealMorph() {
  document.querySelectorAll(".reveal-morph img").forEach((img) => {
    if (img.decode) img.decode().catch(() => {});
    else if (!img.complete) {
      const warm = new Image();
      warm.src = img.currentSrc || img.src;
    }
  });
}

function startRevealMorph() {
  const grin = document.querySelector(".reveal-morph-grin");
  if (!grin || grin.dataset.morphing === "1") return;
  grin.dataset.morphing = "1";
  grin.style.opacity = "0";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cycle = 9000;
  const holdA = 0.12;
  const fadeIn = 0.30;
  const holdB = 0.62;
  const fadeOut = 0.80;

  const ease = (t) => t * t * (3 - 2 * t);
  let origin = 0;

  function frame(now) {
    if (!origin) origin = now;
    const p = ((now - origin) % cycle) / cycle;
    let opacity = 0;
    if (p >= holdA && p < fadeIn) opacity = ease((p - holdA) / (fadeIn - holdA));
    else if (p >= fadeIn && p < holdB) opacity = 1;
    else if (p >= holdB && p < fadeOut) opacity = 1 - ease((p - holdB) / (fadeOut - holdB));
    grin.style.opacity = String(opacity);
    window.requestAnimationFrame(frame);
  }

  const ready = grin.decode ? grin.decode() : Promise.resolve();
  const timeout = new Promise((resolve) => window.setTimeout(resolve, 250));
  Promise.race([ready.catch(() => {}), timeout]).then(() => {
    window.requestAnimationFrame(frame);
  });
}

function showWait() {
  window.clearTimeout(crawlEndTimer);
  if (isGirlReveal()) {
    window.location.href = "meisje.html";
    return;
  }
  if (document.body.dataset.scene === "wait" || document.body.dataset.scene === "reveal") return;
  document.body.dataset.scene = "wait";
  hideGalaxyChrome();
  const wait = document.querySelector("[data-wait]");
  const girlLink = document.querySelector("[data-girl-link]");
  if (wait) wait.hidden = false;
  if (girlLink) girlLink.hidden = false;
  document.title = "De echo";
  stopAudio();
  preloadRevealMorph();
}

function showReveal() {
  if (document.body.dataset.scene === "reveal") return;
  document.body.dataset.scene = "reveal";
  hideGalaxyChrome();
  const wait = document.querySelector("[data-wait]");
  const reveal = document.querySelector("[data-reveal]");
  const girlLink = document.querySelector("[data-girl-link]");
  if (wait) wait.hidden = true;
  if (girlLink) girlLink.hidden = false;
  if (reveal) reveal.hidden = false;
  document.title = "Een mini-Jedi";
  stopAudio();
  celebrate("boy");
  startRevealMorph();
}

function startCrawl() {
  if (document.body.dataset.scene === "wait" || document.body.dataset.scene === "reveal") return;
  document.body.dataset.scene = "crawl";
  const intro = document.querySelector("[data-intro]");
  const crawl = document.querySelector("[data-crawl]");
  if (intro) intro.hidden = true;
  if (crawl) crawl.hidden = false;

  const track = document.querySelector("[data-crawl-track]");
  if (!track) return;
  track.classList.remove("is-crawling");
  track.style.animationDuration = "";
  void track.offsetWidth;
  const pxPerSec = 52;
  const duration = Math.max(55, Math.round((track.scrollHeight + window.innerHeight) / pxPerSec));
  track.style.animationDuration = `${duration}s`;
  track.classList.add("is-crawling");
  track.addEventListener(
    "animationend",
    () => {
      if (document.body.dataset.scene !== "crawl") return;
      crawlEndTimer = window.setTimeout(showWait, 1800);
    },
    { once: true },
  );
  const controls = document.querySelector("[data-crawl-controls]");
  if (controls) controls.hidden = false;
  window.requestAnimationFrame(() => {
    applyCrawlSpeed();
    setCrawlPaused(crawlPaused);
  });
}

function beginShow() {
  if (document.body.dataset.scene !== "start") return;
  if (!isRevealUnlocked()) return;
  const start = document.querySelector("[data-start]");
  const intro = document.querySelector("[data-intro]");
  const skip = document.querySelector("[data-skip]");
  if (start) start.hidden = true;
  if (intro) intro.hidden = false;
  if (skip) skip.hidden = false;
  if (muteBtn) muteBtn.hidden = false;
  document.body.dataset.scene = "intro";
  startAudio();

  intro?.addEventListener("animationend", startCrawl, { once: true });
  window.setTimeout(() => {
    if (document.body.dataset.scene === "intro") startCrawl();
  }, 8200);
}

if (document.body.classList.contains("galaxy")) {
  initCountdownGate();
  document.querySelector("[data-start-btn]")?.addEventListener("click", beginShow);
  document.querySelector("[data-skip]")?.addEventListener("click", showWait);
  document.querySelector("[data-after-echo]")?.addEventListener("click", showReveal);

  document.querySelector("[data-pause]")?.addEventListener("click", () => {
    if (document.body.dataset.scene !== "crawl") return;
    setCrawlPaused(!crawlPaused);
  });

  document.querySelector("[data-speed]")?.addEventListener("input", (event) => {
    crawlSpeed = Number(event.target.value) || 1;
    applyCrawlSpeed();
  });

  const crawlStage = document.querySelector("[data-crawl]");
  let dragging = false;
  let lastY = 0;
  let dragPaused = false;

  function ignoreCrawlDrag(target) {
    return target.closest(".crawl-controls, .skip-btn, .mute-btn, .pause-btn, .speed-slider");
  }

  crawlStage?.addEventListener("pointerdown", (event) => {
    if (document.body.dataset.scene !== "crawl") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (ignoreCrawlDrag(event.target)) return;
    const anim = crawlAnimation();
    if (!anim) return;
    dragging = true;
    lastY = event.clientY;
    dragPaused = crawlPaused;
    setCrawlPaused(true);
    crawlStage.classList.add("is-dragging");
    crawlStage.setPointerCapture?.(event.pointerId);
  });

  crawlStage?.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dy = event.clientY - lastY;
    lastY = event.clientY;
    scrubCrawlByPixels(dy);
  });

  function endCrawlDrag() {
    if (!dragging) return;
    dragging = false;
    crawlStage?.classList.remove("is-dragging");
    if (!dragPaused) setCrawlPaused(false);
  }

  crawlStage?.addEventListener("pointerup", endCrawlDrag);
  crawlStage?.addEventListener("pointercancel", endCrawlDrag);

  crawlStage?.addEventListener(
    "wheel",
    (event) => {
      if (document.body.dataset.scene !== "crawl") return;
      event.preventDefault();
      scrubCrawlByPixels(-event.deltaY);
    },
    { passive: false },
  );

  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" && event.key !== " ") return;
    if (document.body.dataset.scene !== "crawl") return;
    if (event.target.matches("input, button, textarea")) return;
    event.preventDefault();
    setCrawlPaused(!crawlPaused);
  });

  const secret = document.querySelector("[data-secret]");
  let secretTaps = [];
  let secretKeys = [];

  function openGirlPage() {
    window.location.href = "meisje.html";
  }

  secret?.addEventListener("click", (event) => {
    event.preventDefault();
    const now = Date.now();
    secretTaps = secretTaps.filter((t) => now - t < 1800);
    secretTaps.push(now);
    if (secretTaps.length >= 3) openGirlPage();
  });

  document.addEventListener("keydown", (event) => {
    if (document.body.dataset.scene !== "reveal" && document.body.dataset.scene !== "wait") return;
    if (event.key !== "m" && event.key !== "M") return;
    const now = Date.now();
    secretKeys = secretKeys.filter((t) => now - t < 1800);
    secretKeys.push(now);
    if (secretKeys.length >= 3) openGirlPage();
  });
}

if (document.body.classList.contains("girl-page")) {
  celebrate("girl");
  window.setInterval(() => {
    spawnBurst(40, palettes.girl, true);
    if (!running) {
      running = true;
      tick();
    }
  }, 1800);
}

