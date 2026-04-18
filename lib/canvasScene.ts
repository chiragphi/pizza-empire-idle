import { Particle, drawParticle } from "./particles";

export interface SceneState {
  time: number;
  buildingStage: number;
  workerCounts: Record<string, number>;
  particles: Particle[];
  dayNightPhase: number; // 0=day 1=night
}

// ── Utilities ─────────────────────────────────────────────

function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r = 6
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

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hexRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexRgb(a);
  const [br, bg, bb] = hexRgb(b);
  return `rgb(${Math.round(lerp(ar, br, t))},${Math.round(lerp(ag, bg, t))},${Math.round(lerp(ab, bb, t))})`;
}

// ── Main draw ─────────────────────────────────────────────

export function drawScene(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  scene: SceneState
) {
  const { time, buildingStage, workerCounts, particles, dayNightPhase: p } = scene;

  drawSky(ctx, W, H, p, time);
  drawBackgroundCity(ctx, W, H, p, time);
  drawStreet(ctx, W, H);
  drawBuilding(ctx, W, H, buildingStage, time, p);
  drawWorkers(ctx, W, H, workerCounts, time, buildingStage);
  drawForeground(ctx, W, H, time, buildingStage);

  for (const pt of particles) drawParticle(ctx, pt);
}

// ── SKY ───────────────────────────────────────────────────

function drawSky(ctx: CanvasRenderingContext2D, W: number, H: number, p: number, time: number) {
  // Sky gradient
  const skyA = lerpColor("#1c4a6e", "#0d1520", p);
  const skyB = lerpColor("#2a6a9a", "#111e30", p);
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  g.addColorStop(0, skyA);
  g.addColorStop(1, skyB);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Sun
  if (p < 0.6) {
    const sunAlpha = Math.max(0, 1 - p * 2);
    const sunX = W * 0.78;
    const sunY = H * 0.12;
    const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 50);
    sg.addColorStop(0, `rgba(255,230,100,${sunAlpha})`);
    sg.addColorStop(0.5, `rgba(255,180,50,${sunAlpha * 0.4})`);
    sg.addColorStop(1, "rgba(255,180,50,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
    ctx.fill();
    // disc
    ctx.fillStyle = `rgba(255,240,130,${sunAlpha})`;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moon
  if (p > 0.45) {
    const moonAlpha = Math.min(1, (p - 0.45) / 0.25);
    const mx = W * 0.82, my = H * 0.1;
    ctx.save();
    ctx.globalAlpha = moonAlpha;
    ctx.fillStyle = "#e8e0c8";
    ctx.shadowColor = "#e8e0c8";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(mx, my, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Crescent
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.96)";
    ctx.beginPath();
    ctx.arc(mx + 10, my - 4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  // Stars
  if (p > 0.35) {
    const starAlpha = Math.min(0.9, (p - 0.35) / 0.25);
    const stars = [
      [0.08,0.04],[0.18,0.1],[0.3,0.03],[0.45,0.07],[0.6,0.05],
      [0.72,0.13],[0.88,0.06],[0.94,0.1],[0.25,0.18],[0.55,0.2],
      [0.38,0.15],[0.5,0.22],[0.15,0.22],[0.65,0.18],[0.04,0.25],
      [0.78,0.02],[0.35,0.09],[0.62,0.15],[0.42,0.19],[0.9,0.17],
    ];
    for (const [sx, sy] of stars) {
      const twinkle = 0.5 + Math.sin(time * 1.8 + sx * 30) * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${starAlpha * twinkle})`;
      ctx.beginPath();
      ctx.arc(sx * W, sy * H * 0.65, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── BACKGROUND CITY ───────────────────────────────────────

function drawBackgroundCity(ctx: CanvasRenderingContext2D, W: number, H: number, p: number, time: number) {
  const bldgColor = lerpColor("#1e3050", "#111e30", p);
  const winColor = p > 0.3 ? `rgba(255,210,90,${Math.min(0.7, (p - 0.3) * 1.5)})` : null;

  const buildings = [
    [0,55,90],[45,48,100],[85,52,130],[135,58,95],[175,55,145],
    [240,62,115],[285,58,90],[325,56,135],[380,50,100],[W*0.7,55,120],
    [W*0.78,52,90],[W*0.84,50,110],[W*0.91,58,80],[W*0.95,55,70],
  ] as [number, number, number][];

  for (const [bx, bw, bh] of buildings) {
    const by = H * 0.62 - bh;
    ctx.fillStyle = bldgColor;
    ctx.fillRect(bx, by, bw, bh);

    // Windows
    if (winColor) {
      ctx.fillStyle = winColor;
      const cols = Math.floor(bw / 13);
      const rows = Math.floor(bh / 15);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.sin(bx * 0.1 + r * 5.3 + c * 11.7) > 0.15) {
            ctx.fillRect(bx + 4 + c * 13, by + 5 + r * 15, 7, 8);
          }
        }
      }
    }
  }

  // Distant hills / ground fade
  const hillG = ctx.createLinearGradient(0, H * 0.55, 0, H * 0.65);
  hillG.addColorStop(0, lerpColor("#1e3848", "#0d1a28", p));
  hillG.addColorStop(1, lerpColor("#1a3040", "#0d1520", p));
  ctx.fillStyle = hillG;
  ctx.fillRect(0, H * 0.55, W, H * 0.1);
}

// ── STREET ────────────────────────────────────────────────

function drawStreet(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const groundY = H * 0.62;

  // Sidewalk
  ctx.fillStyle = "#8a7e72";
  ctx.fillRect(0, groundY, W, H * 0.1);

  // Sidewalk tiles
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x, groundY + H * 0.1);
    ctx.stroke();
  }

  // Road
  ctx.fillStyle = "#252220";
  ctx.fillRect(0, groundY + H * 0.1, W, H * 0.28);

  // Road center line
  ctx.strokeStyle = "#c8a040";
  ctx.lineWidth = 2;
  ctx.setLineDash([32, 22]);
  ctx.beginPath();
  ctx.moveTo(0, groundY + H * 0.18);
  ctx.lineTo(W, groundY + H * 0.18);
  ctx.stroke();
  ctx.setLineDash([]);

  // Curb
  ctx.fillStyle = "#5a5248";
  ctx.fillRect(0, groundY + H * 0.098, W, 4);
}

// ── BUILDING ──────────────────────────────────────────────

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  stage: number, time: number, p: number
) {
  const cx  = W * 0.42;
  const groundY = H * 0.62;

  if (stage === 0) drawStand(ctx, cx - 75, groundY - 90, 150, 90, time, p);
  else if (stage === 1) drawRestaurantS(ctx, cx - 100, groundY - 160, 200, 160, time, p);
  else if (stage === 2) drawRestaurantL(ctx, cx - 140, groundY - 240, 280, 240, time, p);
  else drawFranchise(ctx, cx - 190, groundY - 320, 380, 320, time, p);
}

// Stage 0: food cart / kiosk
function drawStand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, p: number) {
  // Body
  ctx.fillStyle = "#9c7c50";
  rr(ctx, x, y, w, h, 5);
  ctx.fill();

  // Awning
  ctx.fillStyle = "#b02020";
  ctx.fillRect(x - 18, y, w + 36, 22);
  // Awning stripes
  ctx.fillStyle = "#d43030";
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 18 + i * 34, y, 17, 22);

  // Counter
  ctx.fillStyle = "#6e5030";
  ctx.fillRect(x, y + h - 22, w, 22);

  // Sign above awning
  drawSign(ctx, x + w/2, y - 28, w - 30, 26, "PIZZA", time, p);

  drawSmoke(ctx, x + w - 28, y - 2, time);
}

// Stage 1: small restaurant
function drawRestaurantS(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, p: number) {
  // Building
  ctx.fillStyle = "#c4a878";
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = "#7a6040";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Roof
  ctx.fillStyle = "#6e3a18";
  ctx.fillRect(x - 8, y, w + 16, 18);

  // Door
  ctx.fillStyle = "#3c2010";
  rr(ctx, x + w/2 - 18, y + h - 60, 36, 60, 4);
  ctx.fill();

  // Windows (2)
  drawWindow(ctx, x + 18, y + h - 95, 42, 52, p, time);
  drawWindow(ctx, x + w - 60, y + h - 95, 42, 52, p, time);

  // Sign
  drawSign(ctx, x + w/2, y - 18, w - 20, 34, "PIZZA EMPIRE", time, p);
  drawSmoke(ctx, x + w - 30, y - 2, time);
}

// Stage 2: full restaurant
function drawRestaurantL(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, p: number) {
  // Ground floor
  ctx.fillStyle = "#d4b888";
  rr(ctx, x, y + h/2, w, h/2, 8);
  ctx.fill();
  // Upper floor
  ctx.fillStyle = "#c4a870";
  rr(ctx, x + 24, y, w - 48, h/2 + 10, 8);
  ctx.fill();
  // border
  ctx.strokeStyle = "#7a6040";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  rr(ctx, x, y + h/2, w, h/2, 8);
  ctx.stroke();

  // Roof
  ctx.fillStyle = "#6e2a0e";
  ctx.fillRect(x + 16, y + h/2, w - 32, 14);
  ctx.fillRect(x + 36, y, w - 72, 12);

  // Windows ground floor x3
  for (let i = 0; i < 3; i++) {
    const wx = x + 14 + i * ((w - 28) / 3);
    drawWindow(ctx, wx, y + h - 95, 50, 60, p, time);
  }
  // Upper windows x2
  drawWindow(ctx, x + 44, y + 20, 44, 38, p, time);
  drawWindow(ctx, x + w - 88, y + 20, 44, 38, p, time);

  // Door
  ctx.fillStyle = "#2a1408";
  rr(ctx, x + w/2 - 24, y + h - 65, 48, 65, 6);
  ctx.fill();

  // Sign
  drawSign(ctx, x + w/2, y + h/2 - 20, w - 24, 38, "PIZZA EMPIRE", time, p);
  drawSmoke(ctx, x + 42, y + h/2 - 4, time);
  drawSmoke(ctx, x + w - 42, y + h/2 - 4, time + 1.3);

  // Outdoor table
  drawTable(ctx, x - 52, y + h - 38, time);
}

// Stage 3: mega franchise
function drawFranchise(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, p: number) {
  // Main tower
  ctx.fillStyle = "#e0c898";
  rr(ctx, x, y + h * 0.35, w, h * 0.65, 10);
  ctx.fill();
  // Upper section
  ctx.fillStyle = "#d0b880";
  rr(ctx, x + 30, y + h * 0.15, w - 60, h * 0.5, 8);
  ctx.fill();
  // Top spire section
  ctx.fillStyle = "#c0a870";
  rr(ctx, x + 70, y, w - 140, h * 0.3, 8);
  ctx.fill();

  // Borders
  ctx.strokeStyle = "#7a6040";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  rr(ctx, x, y + h * 0.35, w, h * 0.65, 10);
  ctx.stroke();

  // Antenna + blinking red LED
  ctx.strokeStyle = "#5a4830";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + w/2, y);
  ctx.lineTo(x + w/2, y - 36);
  ctx.stroke();
  ctx.fillStyle = Math.sin(time * 5) > 0 ? "#ff3030" : "#550000";
  ctx.beginPath();
  ctx.arc(x + w/2, y - 38, 4, 0, Math.PI * 2);
  ctx.fill();

  // Windows (grid)
  const rows = 4, cols = 5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === rows - 1 && c > 0 && c < cols - 1) continue; // door space
      const wx = x + 16 + c * ((w - 32) / cols);
      const wy = y + h * 0.38 + r * ((h * 0.52) / rows);
      const on = Math.sin(time * 0.4 + r * 3.1 + c * 6.7) > -0.3;
      drawWindow(ctx, wx, wy, 38, 28, on && p > 0.3 ? p : 0, time);
    }
  }

  // Upper windows
  for (let i = 0; i < 3; i++) {
    drawWindow(ctx, x + 48 + i * ((w - 96) / 3), y + h * 0.18, 44, 30, p, time);
  }

  // Entrance canopy
  ctx.fillStyle = "#a02020";
  ctx.fillRect(x + w/2 - 60, y + h - 88, 120, 16);

  // Door
  ctx.fillStyle = "#1a0800";
  rr(ctx, x + w/2 - 32, y + h - 72, 64, 72, 6);
  ctx.fill();

  // Neon sign
  const neonPulse = 0.65 + Math.sin(time * 2.2) * 0.35;
  const neonAlpha = Math.min(1, neonPulse);
  ctx.fillStyle = "#0d1520";
  rr(ctx, x - 10, y + h * 0.35 - 52, w + 20, 52, 8);
  ctx.fill();
  ctx.strokeStyle = `rgba(212,149,42,${neonAlpha})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = "#d4952a";
  ctx.shadowBlur = 12 * neonAlpha;
  ctx.beginPath();
  rr(ctx, x - 10, y + h * 0.35 - 52, w + 20, 52, 8);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Sign text drawn as geometric shapes instead of text
  drawSignGraphic(ctx, x + w/2, y + h * 0.35 - 26, neonAlpha);

  // Chimneys
  drawSmoke(ctx, x + 60, y + h * 0.35 - 4, time);
  drawSmoke(ctx, x + w - 60, y + h * 0.35 - 4, time + 1.1);
  drawSmoke(ctx, x + w/2, y + h * 0.15 - 4, time + 2.2);

  drawTable(ctx, x - 70, y + h - 45, time);
}

// ── HELPERS ───────────────────────────────────────────────

function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  lightLevel: number, time: number
) {
  const lit = lightLevel > 0.1;
  ctx.fillStyle = lit
    ? `rgba(255,200,80,${Math.min(0.85, lightLevel * 0.85 + Math.sin(time * 0.3) * 0.05)})`
    : "rgba(20,35,55,0.8)";
  ctx.shadowColor = lit ? "#ffa030" : "transparent";
  ctx.shadowBlur  = lit ? 8 : 0;
  rr(ctx, x, y, w, h, 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Frame
  ctx.strokeStyle = "rgba(80,60,30,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  rr(ctx, x, y, w, h, 2);
  ctx.stroke();

  // Cross pane
  ctx.strokeStyle = "rgba(80,60,30,0.4)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + w/2, y);
  ctx.lineTo(x + w/2, y + h);
  ctx.moveTo(x, y + h/2);
  ctx.lineTo(x + w, y + h/2);
  ctx.stroke();
}

function drawSign(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number, w: number, h: number,
  _label: string, time: number, p: number
) {
  const glow = p > 0.3 ? 0.5 + Math.sin(time * 2.5) * 0.3 : 0;
  ctx.fillStyle = "#1a0a00";
  rr(ctx, cx - w/2, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = `rgba(212,149,42,${0.3 + glow * 0.5})`;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "#d4952a";
  ctx.shadowBlur = glow > 0 ? 10 * glow : 0;
  ctx.beginPath();
  rr(ctx, cx - w/2, y, w, h, 4);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw stylized "P" and lines as SVG-style marks
  drawPizzaSignContent(ctx, cx, y + h/2, w, h);
}

// Draw sign content as geometric SVG marks (no text rendering)
function drawPizzaSignContent(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, w: number, _h: number
) {
  ctx.strokeStyle = "rgba(212,149,42,0.8)";
  ctx.lineWidth = 1.5;

  // Pizza circle icon on the left
  const iconX = cx - w * 0.28;
  const r = 6;
  ctx.beginPath();
  ctx.arc(iconX, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // Slice lines
  ctx.beginPath();
  ctx.moveTo(iconX, cy - r);
  ctx.lineTo(iconX, cy + r);
  ctx.moveTo(iconX - r * 0.87, cy - r * 0.5);
  ctx.lineTo(iconX + r * 0.87, cy + r * 0.5);
  ctx.moveTo(iconX - r * 0.87, cy + r * 0.5);
  ctx.lineTo(iconX + r * 0.87, cy - r * 0.5);
  ctx.stroke();

  // Three horizontal bars = text placeholder
  const textX = cx - w * 0.05;
  const lineW = w * 0.38;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(textX, cy - 5);
  ctx.lineTo(textX + lineW, cy - 5);
  ctx.moveTo(textX, cy);
  ctx.lineTo(textX + lineW * 0.75, cy);
  ctx.moveTo(textX, cy + 5);
  ctx.lineTo(textX + lineW * 0.88, cy + 5);
  ctx.stroke();
}

function drawSignGraphic(ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha: number) {
  ctx.strokeStyle = `rgba(212,149,42,${alpha * 0.9})`;
  ctx.lineWidth = 2;

  // Large pizza circle
  ctx.beginPath();
  ctx.arc(cx - 60, cy, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 60, cy - 14);
  ctx.lineTo(cx - 60, cy + 14);
  ctx.moveTo(cx - 74, cy - 7);
  ctx.lineTo(cx - 46, cy + 7);
  ctx.moveTo(cx - 74, cy + 7);
  ctx.lineTo(cx - 46, cy - 7);
  ctx.stroke();

  // Text bars
  const bars = [
    [cx - 30, cy - 7, 110],
    [cx - 30, cy + 1, 80],
    [cx - 30, cy + 9, 100],
  ] as [number, number, number][];
  ctx.lineWidth = 3;
  for (const [bx, by, bw] of bars) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bw, by);
    ctx.stroke();
  }
}

function drawSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.45 + i * 0.33) % 1;
    const ox = Math.sin(time + i * 2.1) * 4;
    const oy = -t * 38;
    const a  = (1 - t) * 0.28;
    const sz = 5 + t * 12;
    ctx.fillStyle = `rgba(200,190,180,${a})`;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, sz, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTable(ctx: CanvasRenderingContext2D, x: number, y: number, _time: number) {
  // Umbrella
  ctx.fillStyle = "#a02020";
  ctx.beginPath();
  ctx.moveTo(x + 28, y - 28);
  ctx.lineTo(x, y - 4);
  ctx.lineTo(x + 56, y - 4);
  ctx.closePath();
  ctx.fill();

  // Pole
  ctx.strokeStyle = "#6e4020";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 28, y - 4);
  ctx.lineTo(x + 28, y + 6);
  ctx.stroke();

  // Table top
  ctx.fillStyle = "#b08850";
  ctx.fillRect(x + 4, y - 2, 48, 8);

  // Chairs
  ctx.fillStyle = "#6e4020";
  ctx.fillRect(x, y + 6, 14, 10);
  ctx.fillRect(x + 42, y + 6, 14, 10);
}

// ── WORKERS ON CANVAS ─────────────────────────────────────

function drawWorkers(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  counts: Record<string, number>,
  time: number,
  stage: number
) {
  const groundY = H * 0.62;

  // Delivery bikers
  const bikers = Math.min(counts["pizza_boy"] || 0, 3);
  for (let i = 0; i < bikers; i++) {
    const speed = 0.28 + i * 0.09;
    const xPos  = ((time * speed * 80 + i * (W / 3)) % (W + 120)) - 60;
    drawBiker(ctx, xPos, groundY - 38, time);
  }

  // Chef in window
  const chefs = Math.min(counts["head_chef"] || 0, 2);
  for (let i = 0; i < chefs; i++) {
    const bob = Math.sin(time * 2.2 + i) * 2;
    drawChef(ctx, W * 0.32 + i * 54, groundY - (stage >= 2 ? 100 : 70) + bob);
  }

  // Manager figure (stage 2+)
  if ((counts["kitchen_manager"] || 0) > 0 && stage >= 2) {
    const bob = Math.sin(time * 1.4) * 1.5;
    drawManager(ctx, W * 0.5, groundY - 75 + bob);
  }

  // Drones (stage 3 or many delivery guys)
  if (stage >= 3 || (counts["regional_director"] || 0) > 0) {
    for (let i = 0; i < 2; i++) {
      const xPos = ((time * (1.1 + i * 0.4) * 55 + i * (W / 2)) % (W + 100)) - 50;
      const yPos = H * 0.12 + Math.sin(time * 1.8 + i * 2.1) * 18 + i * 35;
      drawDrone(ctx, xPos, yPos, time);
    }
  }
}

function drawBiker(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  // Wheels
  ctx.strokeStyle = "#1a1814";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#2a2620";
  for (const wx of [-17, 17]) {
    ctx.beginPath();
    ctx.arc(wx, 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4a4440";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Spoke
    ctx.strokeStyle = "#3a3430";
    ctx.beginPath();
    ctx.moveTo(wx - 4, 8);
    ctx.lineTo(wx + 4, 8);
    ctx.moveTo(wx, 4);
    ctx.lineTo(wx, 12);
    ctx.stroke();
  }

  // Frame
  ctx.strokeStyle = "#c02020";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-17, 6);
  ctx.lineTo(0, -8);
  ctx.lineTo(17, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, -16);
  ctx.stroke();

  // Rider body
  const bob = Math.sin(time * 10) * 0.8;
  ctx.fillStyle = "#2c5c3c";
  ctx.fillRect(-5, -28 + bob, 14, 18);
  // Head
  ctx.fillStyle = "#d4a870";
  ctx.beginPath();
  ctx.arc(5, -34 + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  // Helmet
  ctx.fillStyle = "#c02020";
  ctx.beginPath();
  ctx.arc(5, -37 + bob, 6, Math.PI, 0);
  ctx.fill();

  // Pizza box
  ctx.fillStyle = "#d4952a";
  ctx.fillRect(-18, -24 + bob, 12, 8);
  ctx.strokeStyle = "#a07020";
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-18, -24 + bob, 12, 8);

  ctx.restore();
}

function drawChef(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Hat
  ctx.fillStyle = "#f0e8d8";
  ctx.fillRect(-9, -22, 18, 10);
  ctx.beginPath();
  ctx.arc(0, -22, 9, Math.PI, 0);
  ctx.fill();

  // Body / apron
  ctx.fillStyle = "#f0e8d8";
  ctx.fillRect(-10, 0, 20, 24);

  // Apron strings
  ctx.fillStyle = "#d0c8b0";
  ctx.fillRect(-6, 6, 12, 14);

  // Head
  ctx.fillStyle = "#d4a870";
  ctx.beginPath();
  ctx.arc(0, -10, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawManager(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Suit
  ctx.fillStyle = "#2a3a5c";
  ctx.fillRect(-9, 0, 18, 26);

  // Head
  ctx.fillStyle = "#d4a870";
  ctx.beginPath();
  ctx.arc(0, -8, 8, 0, Math.PI * 2);
  ctx.fill();

  // Clipboard
  ctx.fillStyle = "#7a6040";
  ctx.fillRect(9, 4, 10, 14);

  ctx.restore();
}

function drawDrone(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  // Body
  ctx.fillStyle = "#1a2840";
  rr(ctx, -10, -5, 20, 10, 3);
  ctx.fill();
  ctx.strokeStyle = "#2a4060";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  rr(ctx, -10, -5, 20, 10, 3);
  ctx.stroke();

  // Arms
  ctx.strokeStyle = "#2a4060";
  ctx.lineWidth = 1.5;
  for (const [ax, ay] of [[-10, -5], [10, -5], [-10, 5], [10, 5]]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ax * 1.8, ay * 1.8);
    ctx.stroke();
  }

  // Spinning props (blur as ellipses)
  ctx.strokeStyle = "rgba(180,200,220,0.45)";
  ctx.lineWidth = 1;
  for (const [px, py] of [[-18, -9], [18, -9], [-18, 9], [18, 9]]) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(time * 18);
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 1.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Delivery box dangling
  ctx.fillStyle = "#c09020";
  ctx.strokeStyle = "#907010";
  ctx.lineWidth = 0.8;
  rr(ctx, -6, 8, 12, 8, 2);
  ctx.fill();
  ctx.stroke();
  // String
  ctx.strokeStyle = "rgba(200,160,40,0.6)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(0, 8);
  ctx.stroke();

  // LED blink
  ctx.fillStyle = Math.sin(time * 9 + x * 0.05) > 0 ? "#ff3030" : "#550000";
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── FOREGROUND ────────────────────────────────────────────

function drawForeground(ctx: CanvasRenderingContext2D, W: number, H: number, time: number, stage: number) {
  const groundY = H * 0.62;

  // Customers
  const custCount = 1 + Math.min(stage, 2);
  for (let i = 0; i < custCount; i++) {
    const dir   = i % 2 === 0 ? 1 : -1;
    const speed = 0.35 + i * 0.12;
    let xPos = ((time * speed * 45 * dir + i * (W / custCount)) % (W + 70)) - 35;
    if (dir < 0) xPos = W - xPos;
    drawCustomer(ctx, xPos, groundY - 8, i, time);
  }

  // Street lamps
  drawLamp(ctx, W * 0.14, groundY, time);
  drawLamp(ctx, W * 0.66, groundY, time);

  // Flower pots
  drawPot(ctx, W * 0.24, groundY - 4);
  drawPot(ctx, W * 0.58, groundY - 4);
}

function drawCustomer(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  const bob  = Math.sin(time * 5.5 + seed * 1.7) * 2;
  const legs = Math.sin(time * 5.5 + seed * 1.7) * 6;

  const bodyColors = ["#c02828", "#2c6c3c", "#3a6c9c", "#8a4a18", "#5c3a7c"];
  const skinColors = ["#d4a870", "#c08040", "#e0b898", "#8a5228"];

  // Body
  ctx.fillStyle = bodyColors[seed % bodyColors.length];
  ctx.fillRect(-8, -28 + bob, 16, 20);
  // Head
  ctx.fillStyle = skinColors[seed % skinColors.length];
  ctx.beginPath();
  ctx.arc(0, -34 + bob, 8, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, -8 + bob);
  ctx.lineTo(-5 + legs, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -8 + bob);
  ctx.lineTo(5 - legs, 6);
  ctx.stroke();

  ctx.restore();
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  // Pole
  ctx.strokeStyle = "#3a3830";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 75);
  ctx.lineTo(x + 18, y - 75);
  ctx.stroke();

  // Lamp head
  ctx.fillStyle = "#2a2820";
  ctx.fillRect(x + 10, y - 82, 22, 10);

  // Light cone
  const flicker = 0.72 + Math.sin(time * 2.8) * 0.04;
  const cg = ctx.createRadialGradient(x + 21, y - 77, 0, x + 21, y - 55, 46);
  cg.addColorStop(0, `rgba(255,220,100,${flicker * 0.55})`);
  cg.addColorStop(1, "rgba(255,220,100,0)");
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(x + 21, y - 77);
  ctx.lineTo(x - 18, y - 20);
  ctx.lineTo(x + 60, y - 20);
  ctx.closePath();
  ctx.fill();

  // Bulb
  ctx.fillStyle = `rgba(255,240,150,${flicker})`;
  ctx.shadowColor = "#ffe060";
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  ctx.arc(x + 21, y - 77, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawPot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Pot
  ctx.fillStyle = "#9c5c20";
  ctx.beginPath();
  ctx.moveTo(x - 9, y);
  ctx.lineTo(x + 9, y);
  ctx.lineTo(x + 6, y - 18);
  ctx.lineTo(x - 6, y - 18);
  ctx.closePath();
  ctx.fill();

  // Soil top
  ctx.fillStyle = "#5a3a18";
  ctx.fillRect(x - 7, y - 20, 14, 4);

  // Stems
  ctx.strokeStyle = "#2e7a3e";
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    const h = 10 + Math.abs(i) * 2;
    ctx.beginPath();
    ctx.moveTo(x + i * 3, y - 20);
    ctx.lineTo(x + i * 3, y - 20 - h);
    ctx.stroke();
  }

  // Buds
  ctx.fillStyle = "#c03030";
  ctx.beginPath();
  ctx.arc(x - 6, y - 30, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d4952a";
  ctx.beginPath();
  ctx.arc(x + 6, y - 28, 3.5, 0, Math.PI * 2);
  ctx.fill();
}
