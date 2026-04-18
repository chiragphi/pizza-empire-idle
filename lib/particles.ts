export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: "coin" | "pizza" | "steam" | "confetti" | "star" | "sparkle";
  color: string;
  rotation: number;
  rotationSpeed: number;
  emoji?: string;
}

const COIN_COLORS = ["#ffe94a", "#ffd700", "#ffb300", "#fff176"];
const CONFETTI_COLORS = ["#e8352a", "#ffe94a", "#2d6a4f", "#faf7f0", "#f59e0b", "#60a5fa"];
const PIZZA_EMOJIS = ["🍕", "🧀", "🍅", "🔥"];

export function createClickParticles(
  x: number,
  y: number,
  count: number = 6
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    const isEmoji = i < 2;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 1,
      size: isEmoji ? 16 : 8 + Math.random() * 8,
      type: isEmoji ? "pizza" : "coin",
      color: COIN_COLORS[Math.floor(Math.random() * COIN_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      emoji: isEmoji ? PIZZA_EMOJIS[Math.floor(Math.random() * PIZZA_EMOJIS.length)] : undefined,
    });
  }

  return particles;
}

export function createCoinParticles(x: number, y: number, count: number = 3): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 3,
      vy: -2 - Math.random() * 3,
      life: 1,
      maxLife: 1,
      size: 6 + Math.random() * 6,
      type: "coin",
      color: COIN_COLORS[Math.floor(Math.random() * COIN_COLORS.length)],
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    });
  }
  return particles;
}

export function createSteamParticles(x: number, y: number, count: number = 2): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 1,
      life: 1,
      maxLife: 1,
      size: 8 + Math.random() * 12,
      type: "steam",
      color: "rgba(255, 255, 255, 0.4)",
      rotation: 0,
      rotationSpeed: 0,
    });
  }
  return particles;
}

export function createConfettiParticles(
  x: number,
  y: number,
  count: number = 40
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5,
      life: 1,
      maxLife: 1,
      size: 6 + Math.random() * 10,
      type: "confetti",
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
    });
  }
  return particles;
}

export function createSparkleParticles(x: number, y: number, count: number = 8): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: 3 + Math.random() * 5,
      type: "sparkle",
      color: "#ffe94a",
      rotation: 0,
      rotationSpeed: 0.2,
    });
  }
  return particles;
}

export function updateParticle(p: Particle, dt: number): boolean {
  p.x += p.vx * dt * 60;
  p.y += p.vy * dt * 60;
  p.rotation += p.rotationSpeed * dt * 60;

  if (p.type === "steam") {
    p.vy -= 0.02 * dt * 60;
    p.size += 0.3 * dt * 60;
  } else if (p.type === "confetti") {
    p.vy += 0.15 * dt * 60; // gravity
  } else if (p.type === "coin" || p.type === "pizza") {
    p.vy += 0.1 * dt * 60; // light gravity
  } else if (p.type === "sparkle") {
    p.size *= Math.pow(0.95, dt * 60);
  }

  p.life -= (1 / (p.type === "steam" ? 80 : p.type === "confetti" ? 100 : 50)) * dt * 60;
  return p.life > 0;
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, p.life);
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  if (p.type === "steam") {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    gradient.addColorStop(0, `rgba(255,255,255,${p.life * 0.4})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === "pizza") {
    if (p.emoji) {
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.emoji, 0, 0);
    } else {
      ctx.fillStyle = "#ffe94a";
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.type === "coin") {
    ctx.fillStyle = p.color;
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // coin shine
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(-p.size / 6, -p.size / 6, p.size / 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === "confetti") {
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
  } else if (p.type === "sparkle") {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    // 4-pointed star
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      const outerX = Math.cos(angle) * p.size;
      const outerY = Math.sin(angle) * p.size;
      const innerX = Math.cos(angle + Math.PI / 4) * (p.size * 0.3);
      const innerY = Math.sin(angle + Math.PI / 4) * (p.size * 0.3);
      if (i === 0) ctx.moveTo(outerX, outerY);
      else ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
  } else if (p.type === "star") {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
