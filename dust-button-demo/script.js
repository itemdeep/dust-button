const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");
const btn = document.getElementById("deleteBtn");
const resetBtn = document.getElementById("resetBtn");

let particles = [];
let rafId = null;
let isAnimating = false;

function resizeCanvas() {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function choose(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

// Toz/duman + ufak parçacık karışımı
function spawnDisintegrateParticles(targetEl) {
  const r = targetEl.getBoundingClientRect();
  const c = canvas.getBoundingClientRect();

  const x = r.left - c.left;
  const y = r.top - c.top;
  const w = r.width;
  const h = r.height;

  const colors = [
    "#ff7a7f", "#ff5f66", "#f14d57", "#ea3846",
    "rgba(255,255,255,0.95)", "rgba(255,220,220,0.7)"
  ];

  const total = 90; // performans/efekt dengesi

  for (let i = 0; i < total; i++) {
    const fromEdge = Math.random() < 0.35;
    const px = fromEdge ? (Math.random() < 0.5 ? x : x + w) : x + rand(0, w);
    const py = fromEdge ? y + rand(0, h) : y + rand(0, h);

    const angle = rand(-Math.PI * 0.9, Math.PI * 0.25); // çoğunlukla sağa/üst-sağa dağılsın
    const speed = rand(0.8, 3.8);

    const isSmoke = Math.random() < 0.45;
    const size = isSmoke ? rand(4, 11) : rand(1.2, 3.2);

    particles.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * speed + rand(-0.35, 0.45),
      vy: Math.sin(angle) * speed + rand(-0.25, 0.25),
      life: rand(24, 42),
      maxLife: 42,
      size,
      baseSize: size,
      alpha: rand(0.55, 1),
      rotation: rand(0, Math.PI * 2),
      vr: rand(-0.12, 0.12),
      color: choose(colors),
      smoke: isSmoke,
      drag: isSmoke ? 0.96 : 0.94,
      gravity: isSmoke ? -0.01 : 0.03
    });
  }

  // Hafif “patlama pufu”
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x + w * 0.5 + rand(-6, 6),
      y: y + h * 0.5 + rand(-4, 4),
      vx: rand(-0.8, 1.8),
      vy: rand(-1.2, 0.4),
      life: rand(16, 24),
      maxLife: 24,
      size: rand(10, 18),
      baseSize: rand(10, 18),
      alpha: rand(0.18, 0.3),
      rotation: 0,
      vr: 0,
      color: "rgba(255,255,255,0.35)",
      smoke: true,
      drag: 0.94,
      gravity: -0.005
    });
  }
}

function drawParticle(p) {
  ctx.save();
  ctx.globalAlpha = p.alpha;

  if (p.smoke) {
    // Dumanı daha soft göstermek için blur hissi
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(255,255,255,0.20)";
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
  }

  ctx.restore();
}

function tick() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.life -= 1;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    p.vx *= p.drag;
    p.vy *= p.drag;
    p.vy += p.gravity;

    p.x += p.vx;
    p.y += p.vy;

    p.rotation += p.vr;

    const t = p.life / p.maxLife;
    p.alpha = Math.max(0, t * (p.smoke ? 0.75 : 1));
    p.size = p.smoke
      ? p.baseSize * (0.8 + (1 - t) * 0.9) // duman büyüsün
      : p.baseSize * (0.75 + t * 0.5);

    drawParticle(p);
  }

  if (particles.length > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = null;
    isAnimating = false;
  }
}

function startAnimation() {
  if (isAnimating) return;
  isAnimating = true;

  btn.classList.remove("hidden");
  btn.classList.add("disintegrating");

  spawnDisintegrateParticles(btn);

  if (!rafId) tick();

  // Butonu görünümden kaldır
  setTimeout(() => {
    btn.classList.remove("disintegrating");
    btn.classList.add("hidden");
  }, 380);
}

function resetButton() {
  particles = [];
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  isAnimating = false;
  btn.classList.remove("disintegrating", "hidden");
}

btn.addEventListener("click", startAnimation);
resetBtn.addEventListener("click", resetButton);