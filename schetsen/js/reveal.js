const canvas = document.getElementById("confetti");
const ctx = canvas?.getContext("2d");
const revealBtn = document.querySelector("[data-reveal]");
const isGirl = document.body.classList.contains("theme-girl");
const fx = document.body.dataset.fx || "confetti";

const palettes = {
  feest: isGirl
    ? ["#e36b8f", "#f4a0b8", "#ffffff", "#f3c96b", "#c43d6a", "#ffe4ec"]
    : ["#1a6fb5", "#4aa3e6", "#ffffff", "#f0c75e", "#0d4a86", "#a8d8ff"],
  sprookje: isGirl
    ? ["#f4c6d7", "#ffe8f0", "#e8c9ff", "#fff4c2", "#ffd6e7", "#c9a0ff"]
    : ["#f7e7a8", "#c9d7ff", "#ffffff", "#9ec9ff", "#e8d48b", "#7aa2ff"],
  bioscoop: isGirl
    ? ["#f3c96b", "#f7e7b0", "#ffd0dc", "#e8b4c8", "#ffffff", "#c98a1a"]
    : ["#f0c75e", "#ffe9a8", "#d4a017", "#ffffff", "#c9a227", "#fff4cc"],
  cadeau: isGirl
    ? ["#e36b8f", "#f7d6e0", "#ffffff", "#f3c96b", "#c43d6a"]
    : ["#1a6fb5", "#d4e8ff", "#ffffff", "#f0c75e", "#c45c4a"],
};

const colors = palettes[fx] || palettes.feest;

let pieces = [];
let running = false;

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

function spawnBurst(count = 160) {
  if (!canvas || !ctx) return;
  const cx = canvas.width / 2;
  const cy = canvas.height * 0.4;

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 12;
    pieces.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5,
      w: 5 + Math.random() * 9,
      h: 7 + Math.random() * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      life: 170 + Math.random() * 90,
      kind: fx === "sprookje" ? "star" : fx === "bioscoop" ? "spark" : "rect",
    });
  }
}

function drawPiece(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = Math.max(p.life / 90, 0);
  ctx.fillStyle = p.color;

  if (p.kind === "star") {
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = i === 0 ? p.w : p.w * 0.42;
      const px = Math.cos(a) * (i % 2 === 0 ? p.w : p.w * 0.4);
      const py = Math.sin(a) * (i % 2 === 0 ? p.w : p.w * 0.4);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (p.kind === "spark") {
    ctx.fillRect(-p.w / 2, -1.2, p.w, 2.4);
    ctx.fillRect(-1.2, -p.h / 2, 2.4, p.h);
  } else {
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
  }
  ctx.restore();
}

function tick() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieces = pieces.filter((p) => p.life > 0);

  for (const p of pieces) {
    p.vy += 0.16;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;
    drawPiece(p);
  }

  if (pieces.length) {
    requestAnimationFrame(tick);
  } else {
    running = false;
  }
}

function celebrate() {
  spawnBurst(isGirl ? 170 : 200);
  if (!running) {
    running = true;
    tick();
  }
  window.setTimeout(() => spawnBurst(80), 420);
}

function reveal() {
  if (document.body.classList.contains("is-revealed")) {
    celebrate();
    return;
  }
  document.body.classList.add("is-revealed");
  celebrate();
}

revealBtn?.addEventListener("click", reveal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    if (event.target === document.body || event.target === revealBtn) {
      event.preventDefault();
      reveal();
    }
  }
});
