import { Particle, drawParticle } from "./particles";

export interface SceneState {
  time: number;
  buildingStage: number;
  workerCounts: Record<string, number>;
  particles: Particle[];
  dayNightPhase: number; // 0 = day, 1 = midnight
}

// ── tiny helpers ─────────────────────────────────────────

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 5) {
  const R = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + R, y);
  ctx.lineTo(x + w - R, y);
  ctx.arcTo(x + w, y, x + w, y + R, R);
  ctx.lineTo(x + w, y + h - R);
  ctx.arcTo(x + w, y + h, x + w - R, y + h, R);
  ctx.lineTo(x + R, y + h);
  ctx.arcTo(x, y + h, x, y + h - R, R);
  ctx.lineTo(x, y + R);
  ctx.arcTo(x, y, x + R, y, R);
  ctx.closePath();
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function hexRgb(h: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}
function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexRgb(a);
  const [br, bg, bb] = hexRgb(b);
  return `rgb(${Math.round(lerp(ar, br, t))},${Math.round(lerp(ag, bg, t))},${Math.round(lerp(ab, bb, t))})`;
}

// ── main entry ───────────────────────────────────────────

export function drawScene(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  scene: SceneState
) {
  const { time, buildingStage, workerCounts, particles, dayNightPhase: dn } = scene;

  ctx.clearRect(0, 0, W, H);

  // Layout constants (everything relative to canvas size)
  const groundY = H * 0.68;   // where the sidewalk starts
  const horizonY = H * 0.45;  // visual horizon line

  drawSky(ctx, W, H, groundY, dn, time);
  drawDistantBuildings(ctx, W, H, groundY, horizonY, dn, time);
  drawGround(ctx, W, H, groundY);
  drawRestaurant(ctx, W, H, groundY, horizonY, buildingStage, dn, time);
  drawStreetElements(ctx, W, H, groundY, time, dn, buildingStage);
  drawWorkers(ctx, W, H, groundY, workerCounts, time, buildingStage);

  for (const p of particles) drawParticle(ctx, p);
}

// ── SKY ──────────────────────────────────────────────────

function drawSky(ctx: CanvasRenderingContext2D, W: number, H: number, groundY: number, dn: number, time: number) {
  // Gradient: warm blue day → deep indigo night
  const topDay   = "#1a5280";
  const topNight = "#06091a";
  const botDay   = "#4a8ab0";
  const botNight = "#0e1535";

  const g = ctx.createLinearGradient(0, 0, 0, groundY);
  g.addColorStop(0, lerpHex(topDay, topNight, dn));
  g.addColorStop(1, lerpHex(botDay, botNight, dn));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, groundY);

  // Stars — only at night
  if (dn > 0.3) {
    const sa = clamp((dn - 0.3) / 0.4, 0, 1);
    const stars: [number, number, number][] = [
      [0.06,0.06,1.2],[0.14,0.14,1],[0.22,0.05,1.4],[0.31,0.2,1],[0.4,0.08,1.3],
      [0.49,0.17,1],[0.58,0.06,1.2],[0.68,0.22,1.1],[0.77,0.1,1.4],[0.86,0.05,1],
      [0.92,0.18,1.2],[0.97,0.1,1],[0.35,0.28,0.9],[0.55,0.3,1.1],[0.73,0.28,0.9],
      [0.19,0.3,1],[0.85,0.28,1],[0.5,0.06,1.3],[0.12,0.32,0.8],[0.65,0.14,1],
    ];
    for (const [sx, sy, sr] of stars) {
      const tw = 0.5 + 0.5 * Math.sin(time * 1.4 + sx * 20 + sy * 30);
      ctx.fillStyle = `rgba(255,255,255,${sa * tw * 0.85})`;
      ctx.beginPath();
      ctx.arc(sx * W, sy * groundY, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Moon at night
  if (dn > 0.4) {
    const ma = clamp((dn - 0.4) / 0.3, 0, 1);
    const mx = W * 0.84, my = groundY * 0.15;
    ctx.save();
    ctx.globalAlpha = ma;
    ctx.fillStyle = "#ddd8c0";
    ctx.shadowColor = "#ddd8c0";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(mx, my, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // crescent shadow
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.96)";
    ctx.beginPath();
    ctx.arc(mx + 9, my - 3, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  // Sun at day
  if (dn < 0.5) {
    const sa = clamp(1 - dn * 2.5, 0, 1);
    const sx = W * 0.8, sy = groundY * 0.16;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 55);
    sg.addColorStop(0, `rgba(255,235,100,${sa})`);
    sg.addColorStop(0.45, `rgba(255,195,50,${sa * 0.35})`);
    sg.addColorStop(1, "rgba(255,195,50,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sx, sy, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,245,160,${sa})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  // Horizon glow (always present, warmer at dusk)
  const glowAlpha = 0.25 + 0.2 * Math.sin(dn * Math.PI);
  const hg = ctx.createLinearGradient(0, groundY - H * 0.18, 0, groundY);
  hg.addColorStop(0, "rgba(255,140,60,0)");
  hg.addColorStop(1, `rgba(255,140,60,${glowAlpha})`);
  ctx.fillStyle = hg;
  ctx.fillRect(0, groundY - H * 0.18, W, H * 0.18);
}

// ── DISTANT BUILDINGS ─────────────────────────────────────

function drawDistantBuildings(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  groundY: number, horizonY: number,
  dn: number, time: number
) {
  const bldgColor = lerpHex("#1e3050", "#0a0f1e", dn);
  const winAlpha  = clamp((dn - 0.2) / 0.4, 0, 0.75);

  // Buildings: [x_fraction, width, height_above_ground]
  const bldgs: [number, number, number][] = [
    [0, 52, 110], [0.04, 40, 90], [0.09, 62, 140],
    [0.16, 48, 105], [0.22, 70, 160], [0.31, 44, 120],
    [0.37, 55, 95], [0.43, 45, 130],
    // right side (restaurant takes center ~0.22–0.7 so bg buildings on sides)
    [0.72, 50, 110], [0.77, 65, 145], [0.84, 48, 100],
    [0.88, 72, 130], [0.93, 50, 90], [0.97, 42, 115],
  ];

  // Draw silhouettes
  for (const [xf, bw, bh] of bldgs) {
    const bx = xf * W;
    const by = groundY - bh;
    ctx.fillStyle = bldgColor;
    ctx.fillRect(bx, by, bw, bh);

    // Night windows
    if (winAlpha > 0) {
      const cols = Math.floor(bw / 11);
      const rows = Math.floor(bh / 13);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const on = Math.sin(xf * 100 + r * 7.3 + c * 13.1) > 0.05;
          if (!on) continue;
          const blink = 0.6 + 0.4 * Math.sin(time * 0.3 + xf * 50 + r * 4 + c * 9);
          ctx.fillStyle = `rgba(255,210,90,${winAlpha * blink})`;
          ctx.fillRect(bx + 3 + c * 11, by + 4 + r * 13, 6, 7);
        }
      }
    }
  }

  // Thin horizon line
  ctx.fillStyle = lerpHex("#1a3850", "#08101e", dn);
  ctx.fillRect(0, groundY - 4, W, 4);

  // Avoid unused warning
  void horizonY;
}

// ── GROUND / STREET ───────────────────────────────────────

function drawGround(ctx: CanvasRenderingContext2D, W: number, H: number, groundY: number) {
  // Sidewalk
  const swH = H * 0.1;
  ctx.fillStyle = "#706860";
  ctx.fillRect(0, groundY, W, swH);

  // Sidewalk tile grid
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 0.6;
  for (let x = 0; x < W; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, groundY + swH); ctx.stroke();
  }
  for (let y = groundY; y < groundY + swH; y += 25) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Curb edge
  ctx.fillStyle = "#504840";
  ctx.fillRect(0, groundY + swH - 3, W, 6);

  // Road
  const roadY = groundY + swH + 3;
  ctx.fillStyle = "#1e1c1a";
  ctx.fillRect(0, roadY, W, H - roadY);

  // Road surface texture (subtle)
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  for (let x = 0; x < W; x += 80) {
    ctx.fillRect(x, roadY, 40, H - roadY);
  }

  // Center dashes
  const dashY = roadY + (H - roadY) * 0.45;
  ctx.strokeStyle = "#c09030";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([36, 24]);
  ctx.beginPath();
  ctx.moveTo(0, dashY);
  ctx.lineTo(W, dashY);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ── RESTAURANT BUILDING ───────────────────────────────────

function drawRestaurant(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  groundY: number, _horizonY: number,
  stage: number, dn: number, time: number
) {
  // Restaurant is centered, width grows with stage
  const widths  = [200, 260, 340, 440];
  const heights = [160, 220, 290, 360];
  const bw = widths[stage];
  const bh = heights[stage];
  const bx = (W - bw) / 2;
  const by = groundY - bh;

  if (stage === 0) drawKiosk(ctx, bx, by, bw, bh, dn, time);
  else if (stage === 1) drawSmallShop(ctx, bx, by, bw, bh, dn, time);
  else if (stage === 2) drawRestaurantFacade(ctx, bx, by, bw, bh, dn, time);
  else drawFranchiseTower(ctx, bx, by, bw, bh, W, dn, time);
}

// ── Stage 0: Street kiosk ──────────────────────────────

function drawKiosk(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  dn: number, time: number
) {
  // Base body
  ctx.fillStyle = "#b89a6a";
  rr(ctx, x, y + 28, w, h - 28, 4);
  ctx.fill();
  ctx.strokeStyle = "#7a6840";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  rr(ctx, x, y + 28, w, h - 28, 4);
  ctx.stroke();

  // Striped awning
  const aw = w + 32, ah = 36;
  const ax = x - 16;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#c02828" : "#e04040";
    ctx.fillRect(ax + i * (aw / 6), y, aw / 6, ah);
  }
  // Awning bottom edge (scallop row)
  ctx.fillStyle = "#c02828";
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(ax + i * (aw / 6.5) + 10, y + ah, 10, 0, Math.PI);
    ctx.fill();
  }

  // Counter
  ctx.fillStyle = "#7a5c2e";
  ctx.fillRect(x, y + h - 28, w, 28);
  // Counter trim
  ctx.fillStyle = "#5a4020";
  ctx.fillRect(x, y + h - 30, w, 4);

  // Sign board (horizontal rectangle - NOT a circle)
  drawSignBoard(ctx, x + w / 2, y - 18, w - 24, 34, "PIZZA STAND", dn, time);

  // Chimney smoke
  drawSmoke(ctx, x + w - 35, y + 28, time, 0.25);
}

// ── Stage 1: Small shop ────────────────────────────────

function drawSmallShop(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  dn: number, time: number
) {
  // Roof (sloped suggestion)
  ctx.fillStyle = "#6a2c10";
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 22);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w + 12, y + 22);
  ctx.lineTo(x + w + 12, y + 30);
  ctx.lineTo(x - 12, y + 30);
  ctx.closePath();
  ctx.fill();

  // Main wall
  ctx.fillStyle = "#d4b07a";
  rr(ctx, x, y + 22, w, h - 22, 6);
  ctx.fill();
  ctx.strokeStyle = "#8a6830";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  rr(ctx, x, y + 22, w, h - 22, 6);
  ctx.stroke();

  // Facade detail (horizontal plank lines)
  ctx.strokeStyle = "rgba(100,70,30,0.18)";
  ctx.lineWidth = 1;
  for (let fy = y + 40; fy < y + h - 10; fy += 20) {
    ctx.beginPath();
    ctx.moveTo(x + 4, fy);
    ctx.lineTo(x + w - 4, fy);
    ctx.stroke();
  }

  // Left window
  drawWindow(ctx, x + 18, y + h - 105, 60, 70, dn, time);
  // Right window
  drawWindow(ctx, x + w - 78, y + h - 105, 60, 70, dn, time);

  // Door (centered)
  drawDoor(ctx, x + w / 2 - 22, y + h - 80, 44, 80);

  // Awning strip above door
  ctx.fillStyle = "#b82020";
  ctx.fillRect(x + w / 2 - 55, y + h - 100, 110, 16);
  // Awning underside shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(x + w / 2 - 55, y + h - 86, 110, 4);

  // Sign board
  drawSignBoard(ctx, x + w / 2, y - 8, w - 14, 38, "PIZZA EMPIRE", dn, time);

  drawSmoke(ctx, x + w - 40, y + 22, time, 0.3);
}

// ── Stage 2: Full restaurant ───────────────────────────

function drawRestaurantFacade(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  dn: number, time: number
) {
  // Upper floor
  ctx.fillStyle = "#c8a868";
  rr(ctx, x + 28, y, w - 56, h / 2 + 20, 6);
  ctx.fill();

  // Ground floor
  ctx.fillStyle = "#d8b87a";
  rr(ctx, x, y + h / 2 - 10, w, h / 2 + 10, 6);
  ctx.fill();
  ctx.strokeStyle = "#8a6830";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  rr(ctx, x, y + h / 2 - 10, w, h / 2 + 10, 6);
  ctx.stroke();

  // Roof band
  ctx.fillStyle = "#5c2008";
  ctx.fillRect(x - 4, y + h / 2 - 12, w + 8, 14);
  ctx.fillRect(x + 22, y - 2, w - 44, 12);

  // Ground floor cornice
  ctx.fillStyle = "#9a7040";
  ctx.fillRect(x - 2, y + h / 2 - 1, w + 4, 6);

  // Upper windows (2)
  drawWindow(ctx, x + 46, y + 18, 52, 44, dn, time);
  drawWindow(ctx, x + w - 98, y + 18, 52, 44, dn, time);

  // Ground floor windows (3)
  drawWindow(ctx, x + 14, y + h - 118, 62, 78, dn, time);
  drawWindow(ctx, x + w / 2 - 32, y + h - 118, 62, 78, dn, time);
  drawWindow(ctx, x + w - 76, y + h - 118, 62, 78, dn, time);

  // Main door
  drawDoor(ctx, x + w / 2 - 26, y + h - 85, 52, 85);

  // Awning
  ctx.fillStyle = "#aa1e1e";
  ctx.fillRect(x + w / 2 - 75, y + h - 100, 150, 18);
  drawAwningScallop(ctx, x + w / 2 - 75, y + h - 83, 150, 14);

  // Sign
  drawSignBoard(ctx, x + w / 2, y - 12, w - 10, 44, "PIZZA EMPIRE", dn, time);

  // Smoke
  drawSmoke(ctx, x + 50, y + h / 2 - 6, time, 0.3);
  drawSmoke(ctx, x + w - 50, y + h / 2 - 6, time + 1.4, 0.3);
}

// ── Stage 3: Franchise tower ───────────────────────────

function drawFranchiseTower(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  W: number, dn: number, time: number
) {
  // Side wings
  ctx.fillStyle = "#c09858";
  rr(ctx, x - 28, y + h * 0.48, 48, h * 0.52, 4);
  ctx.fill();
  rr(ctx, x + w - 20, y + h * 0.48, 48, h * 0.52, 4);
  ctx.fill();

  // Lower facade
  ctx.fillStyle = "#d8b870";
  rr(ctx, x, y + h * 0.42, w, h * 0.58, 6);
  ctx.fill();

  // Mid facade
  ctx.fillStyle = "#caa860";
  rr(ctx, x + 22, y + h * 0.22, w - 44, h * 0.38, 6);
  ctx.fill();

  // Upper tower
  ctx.fillStyle = "#ba9850";
  rr(ctx, x + 52, y, w - 104, h * 0.3, 8);
  ctx.fill();

  // Borders
  ctx.strokeStyle = "#7a5828";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  rr(ctx, x, y + h * 0.42, w, h * 0.58, 6);
  ctx.stroke();

  // Roof bands
  ctx.fillStyle = "#5c1e08";
  ctx.fillRect(x - 2, y + h * 0.4, w + 4, 12);
  ctx.fillRect(x + 18, y + h * 0.2, w - 36, 10);
  ctx.fillRect(x + 48, y - 2, w - 96, 10);

  // Antenna
  ctx.strokeStyle = "#6a5030";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y - 42);
  ctx.stroke();
  // Blinking LED
  const ledOn = Math.sin(time * 5) > 0;
  ctx.fillStyle = ledOn ? "#ff3c3c" : "#3c0000";
  ctx.beginPath();
  ctx.arc(x + w / 2, y - 44, 4, 0, Math.PI * 2);
  ctx.fill();
  if (ledOn) {
    ctx.fillStyle = "rgba(255,60,60,0.25)";
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 44, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Window grid (lower facade)
  const cols = 5, rows = 3;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === rows - 1 && c > 0 && c < cols - 1) continue; // door space
      const wx = x + 14 + c * ((w - 28) / cols);
      const wy = y + h * 0.46 + r * ((h * 0.4) / rows);
      const lightOn = Math.sin(time * 0.35 + r * 4.2 + c * 7.7) > -0.4;
      drawWindow(ctx, wx, wy, 42, 30, lightOn && dn > 0.2 ? dn : 0, time);
    }
  }

  // Mid windows (2)
  drawWindow(ctx, x + 48, y + h * 0.25, 50, 40, dn, time);
  drawWindow(ctx, x + w - 98, y + h * 0.25, 50, 40, dn, time);

  // Door
  drawDoor(ctx, x + w / 2 - 30, y + h - 88, 60, 88);

  // Main entrance awning
  ctx.fillStyle = "#aa1e1e";
  ctx.fillRect(x + w / 2 - 90, y + h - 105, 180, 20);
  drawAwningScallop(ctx, x + w / 2 - 90, y + h - 86, 180, 16);

  // BIG illuminated sign board (the marquee)
  drawMarqueeSign(ctx, x + w / 2, y + h * 0.42 - 22, w - 8, 50, dn, time);

  // Smaller sign above upper floor
  drawSignBoard(ctx, x + w / 2, y - 16, w - 106, 38, "PIZZA EMPIRE", dn, time);

  // Side wing windows
  drawWindow(ctx, x - 20, y + h * 0.54, 32, 24, dn, time);
  drawWindow(ctx, x + w - 12, y + h * 0.54, 32, 24, dn, time);

  // Smoke from roof
  drawSmoke(ctx, x + 55, y - 2, time, 0.35);
  drawSmoke(ctx, x + w - 55, y - 2, time + 1.6, 0.35);
  drawSmoke(ctx, x + w / 2 - 15, y + h * 0.2 - 6, time + 0.8, 0.28);

  void W;
}

// ── SIGN BOARD (horizontal panel — NOT a circle) ───────

function drawSignBoard(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number, w: number, h: number,
  label: string, dn: number, time: number
) {
  const glow = dn > 0.25 ? clamp((dn - 0.25) / 0.4, 0, 1) : 0;
  const pulse = glow > 0 ? 0.7 + 0.3 * Math.sin(time * 2) : 0;

  // Panel background
  ctx.fillStyle = "#0e1a2c";
  rr(ctx, cx - w / 2, y, w, h, 4);
  ctx.fill();

  // Gold border
  ctx.strokeStyle = `rgba(212,149,42,${0.4 + pulse * 0.5})`;
  ctx.lineWidth = 2;
  if (glow > 0) {
    ctx.shadowColor = "#d4952a";
    ctx.shadowBlur = 10 * pulse;
  }
  ctx.beginPath();
  rr(ctx, cx - w / 2, y, w, h, 4);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Content: text-bars (readable as text placeholder since we can't use real fonts reliably)
  // Use canvas text rendering — it's fine here as it's part of the game world
  ctx.fillStyle = `rgba(212,149,42,${0.8 + pulse * 0.2})`;
  ctx.shadowColor = glow > 0 ? "#d4952a" : "transparent";
  ctx.shadowBlur = glow > 0 ? 6 * pulse : 0;
  ctx.font = `bold ${Math.floor(h * 0.42)}px 'DM Sans', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, y + h / 2);
  ctx.shadowBlur = 0;
}

// ── MARQUEE SIGN (franchise stage — wider, more dramatic) ─

function drawMarqueeSign(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number, w: number, h: number,
  dn: number, time: number
) {
  const pulse = 0.65 + 0.35 * Math.sin(time * 2.5);

  // Outer panel
  ctx.fillStyle = "#09111e";
  rr(ctx, cx - w / 2, y, w, h, 6);
  ctx.fill();

  // Neon border strip
  ctx.strokeStyle = `rgba(212,149,42,${0.5 + pulse * 0.45})`;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "#d4952a";
  ctx.shadowBlur = dn > 0.3 ? 16 * pulse : 4;
  ctx.beginPath();
  rr(ctx, cx - w / 2, y, w, h, 6);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner content
  ctx.fillStyle = `rgba(212,149,42,${0.85 + pulse * 0.15})`;
  ctx.shadowColor = dn > 0.3 ? "#d4952a" : "transparent";
  ctx.shadowBlur = dn > 0.3 ? 8 * pulse : 0;
  ctx.font = `bold ${Math.floor(h * 0.38)}px 'DM Sans', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PIZZA EMPIRE", cx, y + h / 2 - 2);
  ctx.shadowBlur = 0;

  // Decorative dot lights along top + bottom edges
  const dotCount = Math.floor(w / 14);
  for (let i = 0; i < dotCount; i++) {
    const dx = cx - w / 2 + 8 + i * 14;
    const dotOn = Math.sin(time * 3 + i * 0.7) > 0.1;
    ctx.fillStyle = dotOn ? `rgba(255,220,80,${0.9})` : "rgba(60,45,15,0.9)";
    if (dotOn) { ctx.shadowColor = "#ffe050"; ctx.shadowBlur = 5; }
    ctx.beginPath();
    ctx.arc(dx, y + 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx, y + h - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ── WINDOW ────────────────────────────────────────────────

function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  lightLevel: number, _time: number
) {
  const lit = lightLevel > 0.05;
  // Frame
  ctx.fillStyle = "#4a3820";
  rr(ctx, x - 2, y - 2, w + 4, h + 4, 2);
  ctx.fill();

  // Glass
  ctx.fillStyle = lit
    ? `rgba(255,200,80,${clamp(lightLevel * 0.8, 0.3, 0.82)})`
    : "rgba(20,35,60,0.75)";
  if (lit) {
    ctx.shadowColor = "#ffb830";
    ctx.shadowBlur = 10 * lightLevel;
  }
  rr(ctx, x, y, w, h, 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pane divisions
  ctx.strokeStyle = "rgba(60,40,10,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h * 0.45);
  ctx.lineTo(x + w, y + h * 0.45);
  ctx.stroke();

  // Sill
  ctx.fillStyle = "#5a4020";
  ctx.fillRect(x - 3, y + h, w + 6, 4);
}

// ── DOOR ──────────────────────────────────────────────────

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Frame
  ctx.fillStyle = "#3a2010";
  rr(ctx, x - 3, y, w + 6, h, 4);
  ctx.fill();

  // Door panels (two)
  const pw = (w - 6) / 2;
  ctx.fillStyle = "#2a1808";
  rr(ctx, x, y + 4, pw - 1, h - 4, 3);
  ctx.fill();
  rr(ctx, x + pw + 2, y + 4, pw - 1, h - 4, 3);
  ctx.fill();

  // Door handle dots
  ctx.fillStyle = "#c8a040";
  ctx.beginPath();
  ctx.arc(x + pw - 4, y + h / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + pw + 6, y + h / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Transom window above
  ctx.fillStyle = "rgba(60,100,160,0.4)";
  rr(ctx, x, y - 16, w, 14, 3);
  ctx.fill();
}

// ── AWNING SCALLOP EDGE ───────────────────────────────────

function drawAwningScallop(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {
  const count = Math.floor(w / 18);
  const aw = w / count;
  ctx.fillStyle = "#991a1a";
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(x + i * aw + aw / 2, y, aw / 2, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = "#bb2020";
  ctx.fillRect(x, y - h, w, h);
  // Stripes
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < Math.floor(w / 22); i++) {
    ctx.fillRect(x + i * 22, y - h, 11, h);
  }
}

// ── SMOKE ─────────────────────────────────────────────────

function drawSmoke(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  time: number, strength: number
) {
  for (let i = 0; i < 4; i++) {
    const t = (time * 0.4 + i * 0.25) % 1;
    const ox = Math.sin(time * 0.8 + i * 2.3) * 5;
    const oy = -t * 45;
    const a  = (1 - t) * strength;
    const sz = 4 + t * 14;
    ctx.fillStyle = `rgba(220,215,200,${a})`;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, sz, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── STREET ELEMENTS ───────────────────────────────────────

function drawStreetElements(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  groundY: number,
  time: number, dn: number, stage: number
) {
  // Lamp posts (flanking restaurant)
  const cx = W / 2;
  const lampSpread = 180 + stage * 40;
  drawLampPost(ctx, cx - lampSpread, groundY, time, dn);
  drawLampPost(ctx, cx + lampSpread, groundY, time, dn);

  // Outdoor seating (appears from stage 1+)
  if (stage >= 1) {
    drawCafeTable(ctx, cx - lampSpread + 30, groundY - 2, time);
  }
  if (stage >= 2) {
    drawCafeTable(ctx, cx + lampSpread - 60, groundY - 2, time);
  }

  // Flower planters (always)
  drawPlanter(ctx, cx - 145, groundY - 2);
  drawPlanter(ctx, cx + 125, groundY - 2);

  void H;
}

function drawLampPost(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  time: number, dn: number
) {
  // Base
  ctx.fillStyle = "#2c2820";
  ctx.fillRect(x - 4, y - 2, 8, 6);

  // Pole
  ctx.strokeStyle = "#2c2820";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 88);
  ctx.stroke();

  // Arm
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 85);
  ctx.quadraticCurveTo(x, y - 98, x + 22, y - 98);
  ctx.stroke();

  // Lamp housing
  ctx.fillStyle = "#1e1c18";
  ctx.fillRect(x + 14, y - 106, 20, 14);

  // Light (brighter at night)
  const litAlpha = dn > 0.15 ? clamp(dn * 1.4, 0.3, 1) : 0.15;
  const flicker  = 0.85 + 0.15 * Math.sin(time * 3.2);

  // Light cone
  const cg = ctx.createRadialGradient(x + 24, y - 99, 0, x + 24, y - 75, 52);
  cg.addColorStop(0, `rgba(255,220,100,${litAlpha * flicker * 0.65})`);
  cg.addColorStop(1, "rgba(255,220,100,0)");
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(x + 24, y - 99);
  ctx.lineTo(x - 18, y - 25);
  ctx.lineTo(x + 66, y - 25);
  ctx.closePath();
  ctx.fill();

  // Bulb
  ctx.fillStyle = `rgba(255,245,160,${litAlpha * flicker})`;
  ctx.shadowColor = "#ffe060";
  ctx.shadowBlur  = 8 * litAlpha;
  ctx.beginPath();
  ctx.arc(x + 24, y - 99, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawCafeTable(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  _time: number
) {
  // Umbrella canopy
  const r = 32;
  const ug = ctx.createRadialGradient(x, y - 38, 0, x, y - 38, r);
  ug.addColorStop(0, "#c82828");
  ug.addColorStop(0.7, "#a82020");
  ug.addColorStop(1, "#8a1818");
  ctx.fillStyle = ug;
  ctx.beginPath();
  ctx.ellipse(x, y - 38, r, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scallop edge
  const segs = 8;
  ctx.fillStyle = "#a82020";
  for (let i = 0; i < segs; i++) {
    const angle = (Math.PI * 2 * i) / segs;
    const ex = x + Math.cos(angle) * r;
    const ey = y - 38 + Math.sin(angle) * 10;
    ctx.beginPath();
    ctx.arc(ex, ey, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center pole
  ctx.strokeStyle = "#5a4820";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 28);
  ctx.lineTo(x, y + 4);
  ctx.stroke();

  // Table top
  ctx.fillStyle = "#9c7840";
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 28, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6a5020";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Chairs (2)
  for (const side of [-1, 1]) {
    ctx.fillStyle = "#6a4820";
    // Seat
    ctx.beginPath();
    ctx.ellipse(x + side * 34, y + 4, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.strokeStyle = "#5a3810";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + side * 34 - 8, y + 4);
    ctx.lineTo(x + side * 34 - 8, y + 14);
    ctx.moveTo(x + side * 34 + 8, y + 4);
    ctx.lineTo(x + side * 34 + 8, y + 14);
    ctx.stroke();
  }
}

function drawPlanter(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Pot
  ctx.fillStyle = "#8a5020";
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x + 7, y - 22);
  ctx.lineTo(x - 7, y - 22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#6a3c14";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Soil
  ctx.fillStyle = "#4a2810";
  ctx.beginPath();
  ctx.ellipse(x, y - 22, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stems
  ctx.strokeStyle = "#2a6a2a";
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    const stemH = 12 + Math.abs(i) * 3;
    ctx.beginPath();
    ctx.moveTo(x + i * 3, y - 22);
    ctx.quadraticCurveTo(x + i * 5, y - 28, x + i * 4, y - 22 - stemH);
    ctx.stroke();
  }

  // Flowers (small circles)
  ctx.fillStyle = "#c83030";
  ctx.beginPath(); ctx.arc(x - 6, y - 35, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d49020";
  ctx.beginPath(); ctx.arc(x + 6, y - 32, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#c83030";
  ctx.beginPath(); ctx.arc(x, y - 38, 3.5, 0, Math.PI * 2); ctx.fill();
}

// ── WORKERS ───────────────────────────────────────────────

function drawWorkers(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  groundY: number,
  counts: Record<string, number>,
  time: number,
  stage: number
) {
  // Delivery bikers (road level)
  const bikerCount = Math.min(counts["pizza_boy"] || 0, 3);
  for (let i = 0; i < bikerCount; i++) {
    const spd  = 0.22 + i * 0.08;
    const xPos = ((time * spd * 90 + i * (W / 3)) % (W + 140)) - 70;
    const roadY = groundY + H * 0.1 + 18;
    drawBiker(ctx, xPos, roadY, time);
  }

  // Chefs visible in windows (from stage 1)
  if (stage >= 1) {
    const chefCount = Math.min(counts["head_chef"] || 0, 2);
    const cx = W / 2;
    const windowXs = [cx - 90, cx + 36];
    for (let i = 0; i < chefCount; i++) {
      const bob = Math.sin(time * 1.8 + i) * 2;
      drawChef(ctx, windowXs[i], groundY - 70 + bob - (stage >= 2 ? 30 : 0));
    }
  }

  // Manager at door (stage 2+)
  if ((counts["kitchen_manager"] || 0) > 0 && stage >= 2) {
    const bob = Math.sin(time * 1.1) * 1.5;
    const cx = W / 2;
    drawStaffFigure(ctx, cx - 18, groundY - 68 + bob, "#2a3a5c");
  }

  // Customers walking on sidewalk
  const custCount = 1 + Math.min(stage, 3);
  for (let i = 0; i < custCount; i++) {
    const dir  = i % 2 === 0 ? 1 : -1;
    const spd  = 0.28 + i * 0.09;
    let   xPos = ((time * spd * 50 * dir + i * (W / custCount)) % (W + 80)) - 40;
    if (dir < 0) xPos = W - xPos;
    drawCustomer(ctx, xPos, groundY + 5, i, time);
  }

  // Drones (stage 3 or high-level workers)
  if (stage >= 3 || (counts["regional_director"] || 0) > 0) {
    for (let i = 0; i < 2; i++) {
      const xPos = ((time * (1.0 + i * 0.35) * 60 + i * (W / 2)) % (W + 120)) - 60;
      const yPos = groundY * 0.18 + Math.sin(time * 1.6 + i * 2) * 16 + i * 38;
      drawDrone(ctx, xPos, yPos, time);
    }
  }
}

function drawBiker(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  // Wheels
  for (const wx of [-16, 16]) {
    ctx.fillStyle = "#181614";
    ctx.strokeStyle = "#383430";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(wx, 6, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Spoke cross
    ctx.strokeStyle = "#303030";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(wx - 5, 6); ctx.lineTo(wx + 5, 6);
    ctx.moveTo(wx, 1);     ctx.lineTo(wx, 11);
    ctx.stroke();
  }

  // Bike frame
  ctx.strokeStyle = "#c02828";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-16, 4);
  ctx.lineTo(-2, -10);
  ctx.lineTo(16, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, -10);
  ctx.lineTo(-2, -18);
  ctx.stroke();
  // Handlebar
  ctx.beginPath();
  ctx.moveTo(-6, -18);
  ctx.lineTo(2, -18);
  ctx.stroke();

  // Rider body (bobbing)
  const bob = Math.sin(time * 10) * 0.7;
  ctx.fillStyle = "#2c5040";
  ctx.fillRect(-5, -30 + bob, 12, 16);
  // Head
  ctx.fillStyle = "#d4a870";
  ctx.beginPath();
  ctx.arc(4, -36 + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  // Helmet
  ctx.fillStyle = "#c02828";
  ctx.beginPath();
  ctx.arc(4, -39 + bob, 6, Math.PI, 0);
  ctx.fill();
  // Visor
  ctx.fillStyle = "rgba(80,160,200,0.5)";
  ctx.fillRect(0, -38 + bob, 8, 3);

  // Delivery box
  ctx.fillStyle = "#c89020";
  ctx.strokeStyle = "#907018";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  rr(ctx, -20, -26 + bob, 14, 10, 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawChef(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Hat (toque)
  ctx.fillStyle = "#f0e8d8";
  ctx.fillRect(-8, -22, 16, 8);
  ctx.beginPath();
  ctx.arc(0, -22, 8, Math.PI, 0);
  ctx.fill();
  // Hat rim
  ctx.fillStyle = "#e0d8c8";
  ctx.fillRect(-9, -16, 18, 3);

  // Body (apron)
  ctx.fillStyle = "#f0e8d8";
  ctx.fillRect(-9, 0, 18, 22);
  // Apron center band
  ctx.fillStyle = "#e0d0b0";
  ctx.fillRect(-5, 6, 10, 12);

  // Head
  ctx.fillStyle = "#d4a870";
  ctx.beginPath();
  ctx.arc(0, -10, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStaffFigure(ctx: CanvasRenderingContext2D, x: number, y: number, suitColor: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = suitColor;
  ctx.fillRect(-8, 0, 16, 24);
  ctx.fillStyle = "#d4a870";
  ctx.beginPath();
  ctx.arc(0, -8, 7, 0, Math.PI * 2);
  ctx.fill();
  // Clipboard
  ctx.fillStyle = "#9a7040";
  ctx.fillRect(8, 3, 8, 12);
  ctx.restore();
}

function drawCustomer(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  const bob  = Math.sin(time * 5.5 + seed * 1.8) * 2;
  const legs = Math.sin(time * 5.5 + seed * 1.8) * 7;

  const bodyColors  = ["#c02828", "#2a5c34", "#2a4a8c", "#7a4018", "#5a2a7c"];
  const skinColors  = ["#d4a870", "#b87840", "#e0b898", "#8c5228"];

  // Body
  ctx.fillStyle = bodyColors[seed % bodyColors.length];
  ctx.fillRect(-7, -26 + bob, 14, 18);
  // Head
  ctx.fillStyle = skinColors[seed % skinColors.length];
  ctx.beginPath();
  ctx.arc(0, -32 + bob, 8, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.strokeStyle = "#241e18";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-3, -8 + bob); ctx.lineTo(-5 + legs, 5); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -8 + bob);  ctx.lineTo(5 - legs, 5);  ctx.stroke();

  ctx.restore();
}

function drawDrone(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  // Arm struts
  ctx.strokeStyle = "#2a4060";
  ctx.lineWidth = 1.5;
  for (const [ax, ay] of [[-18, -10], [18, -10], [-18, 10], [18, 10]]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ax, ay);
    ctx.stroke();
  }

  // Body
  ctx.fillStyle = "#1a2840";
  rr(ctx, -10, -5, 20, 10, 3);
  ctx.fill();
  ctx.strokeStyle = "#2a4866";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  rr(ctx, -10, -5, 20, 10, 3);
  ctx.stroke();

  // Props (spinning ellipses)
  ctx.strokeStyle = "rgba(180,200,220,0.4)";
  ctx.lineWidth = 1;
  for (const [px, py] of [[-18, -10], [18, -10], [-18, 10], [18, 10]]) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(time * 20);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Delivery box (hanging)
  const swing = Math.sin(time * 2.5) * 2;
  ctx.save();
  ctx.translate(swing, 0);
  ctx.fillStyle = "#c09020";
  ctx.strokeStyle = "#907010";
  ctx.lineWidth = 0.8;
  rr(ctx, -6, 8, 12, 8, 2);
  ctx.fill();
  ctx.stroke();
  // Tether
  ctx.strokeStyle = "rgba(180,140,30,0.6)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(swing * -0.5, 8);
  ctx.stroke();
  ctx.restore();

  // LED blink
  const led = Math.sin(time * 9 + x * 0.04) > 0;
  ctx.fillStyle = led ? "#ff3030" : "#3c0000";
  if (led) { ctx.shadowColor = "#ff3030"; ctx.shadowBlur = 6; }
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}
