import { Particle, drawParticle } from "./particles";

export interface SceneState {
  time: number;          // seconds elapsed (for animations)
  buildingStage: number; // 0-3
  workerCounts: Record<string, number>;
  particles: Particle[];
  dayNightPhase: number; // 0-1, 0=day, 0.5=dusk, 1=night (loops)
}

// Helper to draw rounded rect
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number = 8
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState
): void {
  const { time, buildingStage, workerCounts, particles, dayNightPhase } = scene;

  // Sky gradient based on day/night
  const phase = dayNightPhase; // 0=noon, 0.5=dusk, 1=midnight
  const skyTop = lerpColor("#1a3a5c", "#0f1b2d", phase);
  const skyBottom = lerpColor("#4a7ca8", "#1a2744", phase);
  const grad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height * 0.65);

  // Stars (visible at night)
  if (phase > 0.4) {
    const starAlpha = Math.min(1, (phase - 0.4) / 0.3);
    ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 0.8})`;
    const starSeeds = [
      [0.1, 0.05], [0.2, 0.12], [0.35, 0.03], [0.5, 0.08], [0.65, 0.04],
      [0.75, 0.14], [0.85, 0.06], [0.9, 0.11], [0.45, 0.15], [0.15, 0.18],
      [0.6, 0.18], [0.8, 0.2], [0.3, 0.22], [0.55, 0.22], [0.05, 0.25],
      [0.95, 0.08], [0.25, 0.09], [0.7, 0.03], [0.4, 0.19], [0.88, 0.17],
    ];
    for (const [sx, sy] of starSeeds) {
      const twinkle = Math.sin(time * 2 + sx * 30) * 0.3 + 0.7;
      ctx.globalAlpha = starAlpha * twinkle * 0.9;
      ctx.beginPath();
      ctx.arc(sx * width, sy * height * 0.6, 1 + Math.random() * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Moon (night)
  if (phase > 0.5) {
    const moonAlpha = Math.min(1, (phase - 0.5) / 0.2);
    ctx.save();
    ctx.globalAlpha = moonAlpha;
    ctx.fillStyle = "#fffde7";
    ctx.shadowColor = "#fffde7";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.08, 22, 0, Math.PI * 2);
    ctx.fill();
    // Crescent mask
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.95)";
    ctx.beginPath();
    ctx.arc(width * 0.85 + 12, height * 0.08 - 5, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  // Sun (day)
  if (phase < 0.5) {
    const sunAlpha = Math.max(0, 1 - phase * 4);
    ctx.save();
    ctx.globalAlpha = sunAlpha;
    ctx.fillStyle = "#ffe94a";
    ctx.shadowColor = "#ffa500";
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.1, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // BACKGROUND: Distant city skyline
  drawCitySkyline(ctx, width, height, phase, time);

  // MIDGROUND: Street + sidewalk
  drawStreet(ctx, width, height);

  // BUILDING: Pizza restaurant (evolves with stage)
  drawBuilding(ctx, width, height, buildingStage, time, phase);

  // Workers on canvas
  drawCanvasWorkers(ctx, width, height, workerCounts, time);

  // Drones (late game)
  if ((workerCounts["pizza_boy"] || 0) > 3 || buildingStage >= 3) {
    drawDrones(ctx, width, height, time);
  }

  // Foreground: customers + street elements
  drawForeground(ctx, width, height, time, buildingStage);

  // Particles
  for (const p of particles) {
    drawParticle(ctx, p);
  }
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function drawCitySkyline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: number,
  time: number
) {
  const buildingColor = lerpColor("#2a3a52", "#1a2438", phase);
  const windowGlow = phase > 0.3 ? `rgba(255, 220, 100, ${Math.min(0.8, (phase - 0.3) * 2)})` : "transparent";

  // Background buildings (parallax layer 1 - slowest)
  const buildings = [
    { x: 0, w: 60, h: 80 },
    { x: 50, w: 45, h: 100 },
    { x: 85, w: 70, h: 120 },
    { x: 140, w: 55, h: 90 },
    { x: 185, w: 80, h: 140 },
    { x: 250, w: 60, h: 110 },
    { x: 295, w: 75, h: 85 },
    { x: 355, w: 90, h: 130 },
    { x: 430, w: 55, h: 95 },
    { x: 470, w: 70, h: 115 },
    { x: 520, w: 50, h: 75 },
    { x: width - 200, w: 80, h: 100 },
    { x: width - 140, w: 55, h: 130 },
    { x: width - 100, w: 65, h: 90 },
    { x: width - 50, w: 55, h: 80 },
  ];

  for (const b of buildings) {
    const by = height * 0.6 - b.h;
    ctx.fillStyle = buildingColor;
    ctx.fillRect(b.x, by, b.w, b.h);

    // Windows
    if (phase > 0.3 && windowGlow !== "transparent") {
      ctx.fillStyle = windowGlow;
      const cols = Math.floor(b.w / 12);
      const rows = Math.floor(b.h / 14);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.sin(b.x * 0.3 + r * 7 + c * 13) > 0.1) {
            ctx.fillRect(b.x + 4 + c * 12, by + 6 + r * 14, 6, 8);
          }
        }
      }
    }
  }
}

function drawStreet(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Sidewalk
  ctx.fillStyle = "#b0a090";
  ctx.fillRect(0, height * 0.6, width, height * 0.12);

  // Street
  ctx.fillStyle = "#3a3530";
  ctx.fillRect(0, height * 0.72, width, height * 0.28);

  // Street markings
  ctx.strokeStyle = "#ffe94a";
  ctx.lineWidth = 3;
  ctx.setLineDash([30, 20]);
  ctx.beginPath();
  ctx.moveTo(0, height * 0.82);
  ctx.lineTo(width, height * 0.82);
  ctx.stroke();
  ctx.setLineDash([]);

  // Sidewalk tiles
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, height * 0.6);
    ctx.lineTo(x, height * 0.72);
    ctx.stroke();
  }
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stage: number,
  time: number,
  phase: number
) {
  const cx = width * 0.42;
  const groundY = height * 0.6;

  if (stage === 0) {
    // Small food stand
    drawFoodStand(ctx, cx - 80, groundY - 100, 160, 100, time, phase);
  } else if (stage === 1) {
    // Small restaurant
    drawSmallRestaurant(ctx, cx - 110, groundY - 160, 220, 160, time, phase);
  } else if (stage === 2) {
    // Full restaurant with second floor
    drawFullRestaurant(ctx, cx - 150, groundY - 230, 300, 230, time, phase);
  } else {
    // Multi-story neon franchise
    drawMegaFranchise(ctx, cx - 200, groundY - 310, 400, 310, time, phase);
  }
}

function drawFoodStand(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  time: number,
  phase: number
) {
  // Stand body
  ctx.fillStyle = "#c8a96e";
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();

  // Awning
  ctx.fillStyle = "#e8352a";
  ctx.fillRect(x - 20, y - 20, w + 40, 30);
  // Awning stripes
  ctx.fillStyle = "#faf7f0";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x - 20 + i * 40, y - 20, 20, 30);
  }
  // Counter
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(x, y + h - 25, w, 25);

  // Sign
  ctx.fillStyle = "#0f1b2d";
  roundRect(ctx, x + 20, y - 55, w - 40, 32, 4);
  ctx.fill();
  ctx.fillStyle = "#ffe94a";
  ctx.shadowColor = "#ffe94a";
  ctx.shadowBlur = phase > 0.3 ? 8 : 0;
  ctx.font = "bold 13px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🍕 PIZZA", x + w / 2, y - 33);
  ctx.shadowBlur = 0;

  // Smoke from chimney
  drawSmoke(ctx, x + w - 30, y - 5, time);
}

function drawSmallRestaurant(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  time: number,
  phase: number
) {
  // Building body
  ctx.fillStyle = "#d4b896";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = "#8B6914";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Roof
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(x - 10, y, w + 20, 20);

  // Door
  ctx.fillStyle = "#5c3a1e";
  roundRect(ctx, x + w / 2 - 20, y + h - 65, 40, 65, 4);
  ctx.fill();

  // Windows (2)
  for (let i = 0; i < 2; i++) {
    const wx = x + 20 + i * (w - 60);
    ctx.fillStyle = phase > 0.4
      ? "rgba(255, 200, 80, 0.8)"
      : "rgba(135, 206, 235, 0.7)";
    ctx.shadowColor = phase > 0.4 ? "#ffa500" : "transparent";
    ctx.shadowBlur = phase > 0.4 ? 12 : 0;
    roundRect(ctx, wx, y + h - 100, 40, 55, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cross pane
    ctx.beginPath();
    ctx.moveTo(wx + 20, y + h - 100);
    ctx.lineTo(wx + 20, y + h - 45);
    ctx.moveTo(wx, y + h - 72);
    ctx.lineTo(wx + 40, y + h - 72);
    ctx.stroke();
  }

  // Sign
  ctx.fillStyle = "#e8352a";
  roundRect(ctx, x + 20, y - 20, w - 40, 38, 6);
  ctx.fill();
  ctx.fillStyle = "#faf7f0";
  ctx.shadowColor = phase > 0.3 ? "#ffe94a" : "transparent";
  ctx.shadowBlur = phase > 0.3 ? 10 : 0;
  ctx.font = "bold 15px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🍕 PIZZA EMPIRE", x + w / 2, y + 6);
  ctx.shadowBlur = 0;

  drawSmoke(ctx, x + w - 30, y - 5, time);
}

function drawFullRestaurant(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  time: number,
  phase: number
) {
  // Main building
  ctx.fillStyle = "#e8d5b0";
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = "#8B6914";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Second floor
  ctx.fillStyle = "#d4b896";
  roundRect(ctx, x + 20, y, w - 40, h / 2, 8);
  ctx.fill();

  // Roof tiles
  ctx.fillStyle = "#8B2500";
  ctx.fillRect(x + 10, y, w - 20, 18);
  ctx.fillRect(x + 30, y - 8, w - 60, 14);

  // Ground floor windows (3)
  for (let i = 0; i < 3; i++) {
    const wx = x + 15 + i * ((w - 30) / 3);
    ctx.fillStyle = phase > 0.4 ? "rgba(255, 200, 80, 0.85)" : "rgba(135, 206, 235, 0.7)";
    ctx.shadowColor = phase > 0.4 ? "#ffa500" : "transparent";
    ctx.shadowBlur = phase > 0.4 ? 15 : 0;
    roundRect(ctx, wx, y + h - 100, 55, 65, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Second floor windows
  for (let i = 0; i < 2; i++) {
    const wx = x + 40 + i * (w / 2 - 10);
    ctx.fillStyle = phase > 0.4 ? "rgba(255, 200, 80, 0.7)" : "rgba(135, 206, 235, 0.6)";
    roundRect(ctx, wx, y + 20, 50, 40, 4);
    ctx.fill();
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Door
  ctx.fillStyle = "#3d1c02";
  roundRect(ctx, x + w / 2 - 28, y + h - 72, 56, 72, 6);
  ctx.fill();

  // Big neon sign
  const signGlow = phase > 0.3 ? Math.sin(time * 3) * 0.3 + 0.7 : 0;
  ctx.fillStyle = "#e8352a";
  roundRect(ctx, x + 20, y - 45, w - 40, 52, 8);
  ctx.fill();
  ctx.strokeStyle = "#ffe94a";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#ffe94a";
  ctx.shadowBlur = signGlow * 20;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffe94a";
  ctx.shadowColor = "#ffe94a";
  ctx.shadowBlur = signGlow * 15;
  ctx.font = "bold 18px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🍕 PIZZA EMPIRE 🍕", x + w / 2, y - 11);
  ctx.shadowBlur = 0;

  // Chimney smoke (2 chimneys)
  drawSmoke(ctx, x + 50, y - 5, time);
  drawSmoke(ctx, x + w - 50, y - 5, time + 1.5);

  // Outdoor seating
  drawOutdoorSeating(ctx, x - 60, y + h - 40, time);
}

function drawMegaFranchise(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  time: number,
  phase: number
) {
  // Main tower
  ctx.fillStyle = "#f0e0c0";
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = "#8B6914";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Upper stories
  ctx.fillStyle = "#e0d0a8";
  roundRect(ctx, x + 30, y, w - 60, h * 0.55, 10);
  ctx.fill();
  roundRect(ctx, x + 70, y, w - 140, h * 0.3, 8);
  ctx.fill();

  // Roof antenna
  ctx.strokeStyle = "#8B6914";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y - 40);
  ctx.stroke();
  const blinkOn = Math.sin(time * 4) > 0;
  ctx.fillStyle = blinkOn ? "#ff4444" : "#880000";
  ctx.beginPath();
  ctx.arc(x + w / 2, y - 42, 5, 0, Math.PI * 2);
  ctx.fill();

  // Neon sign panel (full width)
  const neonAlpha = 0.6 + Math.sin(time * 2.5) * 0.4;
  ctx.fillStyle = "#0f1b2d";
  roundRect(ctx, x - 20, y - 65, w + 40, 72, 10);
  ctx.fill();
  // Neon border
  ctx.strokeStyle = `rgba(255, 233, 74, ${neonAlpha})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ffe94a";
  ctx.shadowBlur = 20 * neonAlpha;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = "bold 22px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(255, 233, 74, ${neonAlpha})`;
  ctx.shadowColor = "#ffe94a";
  ctx.shadowBlur = 15 * neonAlpha;
  ctx.fillText("🍕 PIZZA EMPIRE 🌍", x + w / 2, y - 22);
  ctx.shadowBlur = 0;

  // Many windows with warm glow
  const rows = 4;
  const cols = 5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === rows - 1 && (c === 1 || c === 2 || c === 3)) continue; // Door space
      const wx = x + 20 + c * ((w - 40) / cols);
      const wy = y + 20 + r * ((h - 80) / rows);
      const on = Math.sin(time * 0.5 + r * 3 + c * 7) > -0.5;
      ctx.fillStyle = on
        ? (phase > 0.4 ? "rgba(255,200,80,0.9)" : "rgba(200,230,255,0.8)")
        : "rgba(20,30,50,0.8)";
      ctx.shadowColor = on && phase > 0.4 ? "#ffa500" : "transparent";
      ctx.shadowBlur = on && phase > 0.4 ? 12 : 0;
      roundRect(ctx, wx, wy, 38, 28, 3);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Entrance canopy
  ctx.fillStyle = "#e8352a";
  ctx.fillRect(x + w / 2 - 70, y + h - 100, 140, 20);

  // Door
  ctx.fillStyle = "#1a0a00";
  roundRect(ctx, x + w / 2 - 35, y + h - 80, 70, 80, 8);
  ctx.fill();

  // Multiple chimneys
  for (let i = 0; i < 3; i++) {
    drawSmoke(ctx, x + 40 + i * (w / 2 - 20), y - 5, time + i * 1.2);
  }

  drawOutdoorSeating(ctx, x - 80, y + h - 50, time);
}

function drawSmoke(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  time: number
) {
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.5 + i * 0.33) % 1;
    const oy = -t * 40;
    const ox = Math.sin(time + i * 2) * 5;
    const alpha = (1 - t) * 0.35;
    const size = 6 + t * 14;
    ctx.fillStyle = `rgba(220,210,200,${alpha})`;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOutdoorSeating(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  time: number
) {
  // Umbrella table
  ctx.fillStyle = "#e8352a";
  ctx.beginPath();
  ctx.moveTo(x + 30, y - 30);
  ctx.lineTo(x, y - 5);
  ctx.lineTo(x + 60, y - 5);
  ctx.closePath();
  ctx.fill();
  // Pole
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 30, y - 5);
  ctx.lineTo(x + 30, y + 5);
  ctx.stroke();
  // Table top
  ctx.fillStyle = "#c8a87a";
  ctx.fillRect(x + 5, y - 2, 50, 6);
  // Chairs
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(x, y + 5, 15, 10);
  ctx.fillRect(x + 45, y + 5, 15, 10);
}

function drawCanvasWorkers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  workerCounts: Record<string, number>,
  time: number
) {
  const groundY = height * 0.6;

  // Pizza boys on bikes
  const bikeCount = Math.min(workerCounts["pizza_boy"] || 0, 3);
  for (let i = 0; i < bikeCount; i++) {
    const speed = 0.3 + i * 0.1;
    const xPos = ((time * speed * 80 + i * (width / 3)) % (width + 120)) - 60;
    drawDeliveryBiker(ctx, xPos, groundY - 35, time);
  }

  // Chefs in window
  const chefCount = Math.min(workerCounts["head_chef"] || 0, 2);
  for (let i = 0; i < chefCount; i++) {
    const wobble = Math.sin(time * 2 + i) * 2;
    drawChefInWindow(ctx, width * 0.3 + i * 60, groundY - 80 + wobble, time);
  }

  // Kitchen manager peeking
  if ((workerCounts["kitchen_manager"] || 0) > 0) {
    const wobble = Math.sin(time * 1.5) * 1;
    drawManagerFigure(ctx, width * 0.52, groundY - 65 + wobble);
  }
}

function drawDeliveryBiker(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Scooter body
  ctx.fillStyle = "#e8352a";
  roundRect(ctx, -20, -15, 45, 20, 5);
  ctx.fill();

  // Wheels
  ctx.fillStyle = "#1a1a1a";
  [-18, 18].forEach(wx => {
    ctx.beginPath();
    ctx.arc(wx, 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.arc(wx, 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
  });

  // Rider
  const bodyBob = Math.sin(time * 10) * 1;
  ctx.fillStyle = "#2d6a4f";
  ctx.fillRect(-5, -35 + bodyBob, 18, 22);

  // Head
  ctx.fillStyle = "#f5c78e";
  ctx.beginPath();
  ctx.arc(5, -42 + bodyBob, 8, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = "#e8352a";
  ctx.beginPath();
  ctx.arc(5, -45 + bodyBob, 7, Math.PI, 0);
  ctx.fill();

  // Pizza box on back
  ctx.fillStyle = "#ffe94a";
  ctx.fillRect(-18, -28 + bodyBob, 14, 12);
  ctx.fillStyle = "#e8352a";
  ctx.font = "6px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🍕", -11, -18 + bodyBob);

  ctx.restore();
}

function drawChefInWindow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  _time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Chef body
  ctx.fillStyle = "#faf7f0";
  ctx.fillRect(-12, 0, 24, 30);

  // Chef head
  ctx.fillStyle = "#f5c78e";
  ctx.beginPath();
  ctx.arc(0, -10, 10, 0, Math.PI * 2);
  ctx.fill();

  // Chef hat
  ctx.fillStyle = "#faf7f0";
  ctx.fillRect(-8, -20, 16, 12);
  ctx.beginPath();
  ctx.arc(0, -20, 8, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

function drawManagerFigure(
  ctx: CanvasRenderingContext2D,
  x: number, y: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Business suit
  ctx.fillStyle = "#2d3a5c";
  ctx.fillRect(-10, 0, 20, 28);

  // Head
  ctx.fillStyle = "#f5c78e";
  ctx.beginPath();
  ctx.arc(0, -8, 8, 0, Math.PI * 2);
  ctx.fill();

  // Clipboard
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(10, 5, 12, 16);

  ctx.restore();
}

function drawDrones(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  const droneCount = 2;
  for (let i = 0; i < droneCount; i++) {
    const xPos = ((time * (1.2 + i * 0.5) * 60 + i * (width / 2)) % (width + 100)) - 50;
    const yPos = height * 0.15 + Math.sin(time * 2 + i * Math.PI) * 20 + i * 40;
    drawDrone(ctx, xPos, yPos, time);
  }
}

function drawDrone(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Body
  ctx.fillStyle = "#0f1b2d";
  roundRect(ctx, -12, -6, 24, 12, 3);
  ctx.fill();

  // Propellers spin
  const spinAngle = time * 20;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  [-14, 14].forEach(ox => {
    ctx.save();
    ctx.translate(ox, -4);
    ctx.rotate(spinAngle);
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    ctx.restore();
  });

  // Pizza box hanging
  ctx.fillStyle = "#ffe94a";
  ctx.fillRect(-8, 8, 16, 10);
  ctx.font = "7px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🍕", 0, 16);

  // LED light blink
  const blink = Math.sin(time * 8 + x * 0.1) > 0;
  ctx.fillStyle = blink ? "#ff4444" : "#440000";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawForeground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  buildingStage: number
) {
  // Customers walking
  const customerCount = 1 + buildingStage;
  for (let i = 0; i < customerCount; i++) {
    const speed = 0.4 + i * 0.15;
    const direction = i % 2 === 0 ? 1 : -1;
    let xPos = ((time * speed * 50 * direction + i * (width / customerCount)) % (width + 60)) - 30;
    if (direction < 0) xPos = width - xPos;
    const groundY = height * 0.6 - 10;
    drawCustomer(ctx, xPos, groundY, i, time);
  }

  // Street lamps
  [width * 0.15, width * 0.65].forEach(lx => {
    drawStreetLamp(ctx, lx, height * 0.6, time);
  });

  // Flower pots near building
  drawFlowerPot(ctx, width * 0.25, height * 0.6 - 5);
  drawFlowerPot(ctx, width * 0.58, height * 0.6 - 5);
}

function drawCustomer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  seed: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(time * 6 + seed) * 2;
  const colors = ["#e8352a", "#2d6a4f", "#4a7ca8", "#8B4513", "#5c3a6e"];
  const bodyColor = colors[seed % colors.length];

  // Body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-8, -30 + bob, 16, 22);

  // Head
  const skinTones = ["#f5c78e", "#c68642", "#e8b88a", "#8d4e2a"];
  ctx.fillStyle = skinTones[seed % skinTones.length];
  ctx.beginPath();
  ctx.arc(0, -38 + bob, 9, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  const legSwing = Math.sin(time * 6 + seed) * 5;
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, -8 + bob);
  ctx.lineTo(-6 + legSwing, 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -8 + bob);
  ctx.lineTo(6 - legSwing, 5);
  ctx.stroke();

  ctx.restore();
}

function drawStreetLamp(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  time: number
) {
  // Pole
  ctx.strokeStyle = "#4a4a4a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 80);
  ctx.lineTo(x + 20, y - 80);
  ctx.stroke();

  // Lamp head
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(x + 12, y - 88, 24, 12);

  // Light cone
  const flicker = 0.7 + Math.sin(time * 3) * 0.05;
  const lampGrad = ctx.createRadialGradient(x + 24, y - 82, 0, x + 24, y - 60, 50);
  lampGrad.addColorStop(0, `rgba(255, 220, 100, ${flicker * 0.6})`);
  lampGrad.addColorStop(1, "rgba(255, 220, 100, 0)");
  ctx.fillStyle = lampGrad;
  ctx.beginPath();
  ctx.moveTo(x + 24, y - 82);
  ctx.lineTo(x - 20, y - 20);
  ctx.lineTo(x + 68, y - 20);
  ctx.closePath();
  ctx.fill();

  // Lamp glow point
  ctx.fillStyle = `rgba(255, 240, 150, ${flicker})`;
  ctx.shadowColor = "#ffe94a";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x + 24, y - 82, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawFlowerPot(
  ctx: CanvasRenderingContext2D,
  x: number, y: number
) {
  // Pot
  ctx.fillStyle = "#c17f24";
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x + 7, y - 20);
  ctx.lineTo(x - 7, y - 20);
  ctx.closePath();
  ctx.fill();

  // Flowers/basil
  ctx.fillStyle = "#2d6a4f";
  for (let i = -2; i <= 2; i++) {
    const h = 10 + Math.abs(i) * 2;
    ctx.fillRect(x + i * 3 - 1, y - 20 - h, 2, h);
  }
  // Flower tops
  ctx.fillStyle = "#e8352a";
  ctx.beginPath();
  ctx.arc(x - 6, y - 32, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe94a";
  ctx.beginPath();
  ctx.arc(x + 6, y - 30, 4, 0, Math.PI * 2);
  ctx.fill();
}
