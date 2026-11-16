import type { SceneId } from "@/data/scenes";

/**
 * Procedural, animated dioramas for the story hotspots on /map: a layered
 * steppe landscape with parallax depth, drawn entirely on a 2D canvas — no
 * image or video files to ship. Every scene is an artistic reconstruction
 * built from the same kit of silhouettes (gers, riders, camels, walls,
 * temples, trains…), lit by a sky that sets the mood.
 */

type Sky = "dawn" | "day" | "dusk" | "night" | "storm";
type Weather = "none" | "snow" | "dust" | "embers" | "fireflies";
type Palette = {
  top: string;
  mid: string;
  hor: string;
  /** Far ridge → near ridge. */
  ridges: [string, string, string];
  ground: [string, string];
  sil: string;
  sun: { x: number; y: number; r: number; core: string; glow: string } | null;
  stars: number;
};

const SKIES: Record<Sky, Palette> = {
  dawn: {
    top: "#16224f", mid: "#7a5687", hor: "#f6b26b",
    ridges: ["#8f6f93", "#5d4a73", "#3a3157"], ground: ["#3b3350", "#14121f"], sil: "#100e1a",
    sun: { x: 0.72, y: 0.56, r: 5, core: "#fff1cf", glow: "rgba(255, 190, 110, 0.55)" }, stars: 0.25,
  },
  day: {
    top: "#2f6fb3", mid: "#7fb4dc", hor: "#dcefe9",
    ridges: ["#9bb9c9", "#6f9a8c", "#55803f"], ground: ["#7b9440", "#2e431a"], sil: "#1c2a12",
    sun: { x: 0.24, y: 0.2, r: 4.2, core: "#fff3b0", glow: "rgba(255, 236, 170, 0.6)" }, stars: 0,
  },
  dusk: {
    top: "#170f33", mid: "#7c2f45", hor: "#f47b3c",
    ridges: ["#8c4250", "#562a44", "#301a35"], ground: ["#3a1f30", "#0e0812"], sil: "#0b0610",
    sun: { x: 0.3, y: 0.585, r: 6, core: "#ffe2a8", glow: "rgba(255, 130, 60, 0.6)" }, stars: 0.35,
  },
  night: {
    top: "#03060f", mid: "#0b1533", hor: "#22386b",
    ridges: ["#1b2c58", "#131f42", "#0c142d"], ground: ["#0f1a36", "#04070f"], sil: "#03050b",
    sun: { x: 0.78, y: 0.2, r: 3.2, core: "#f4f1e4", glow: "rgba(190, 210, 255, 0.35)" }, stars: 1,
  },
  storm: {
    top: "#12151d", mid: "#3b4252", hor: "#8a8f9c",
    ridges: ["#6a707d", "#474c59", "#2c303a"], ground: ["#3a3e48", "#101216"], sil: "#0a0b0e",
    sun: null, stars: 0,
  },
};

const DESERT: Pick<Palette, "ridges" | "ground" | "sil"> = {
  ridges: ["#d9b98c", "#c4955c", "#a8743d"], ground: ["#c98f4c", "#5c3a17"], sil: "#2b1a0a",
};

type Setup = { sky: Sky; weather: Weather; desert?: boolean; scroll?: number };

const SETUPS: Record<SceneId, Setup> = {
  camp: { sky: "dusk", weather: "embers" },
  battle: { sky: "dusk", weather: "dust" },
  charge: { sky: "dawn", weather: "dust" },
  caravan: { sky: "day", weather: "dust", desert: true },
  courier: { sky: "dawn", weather: "none", scroll: 46 },
  city: { sky: "day", weather: "none" },
  temple: { sky: "dawn", weather: "none" },
  monument: { sky: "night", weather: "fireflies" },
  migration: { sky: "storm", weather: "snow" },
  "modern-city": { sky: "dusk", weather: "none" },
  "modern-battle": { sky: "storm", weather: "dust" },
  train: { sky: "day", weather: "none", scroll: 0 },
  mine: { sky: "day", weather: "dust", desert: true },
  square: { sky: "night", weather: "snow" },
  ruin: { sky: "storm", weather: "snow" },
  "night-steppe": { sky: "night", weather: "fireflies" },
};

export type SceneCamera = { x: number; px: number; py: number };

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const TAU = Math.PI * 2;

export function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  camera: SceneCamera,
  id: SceneId,
) {
  const setup = SETUPS[id];
  const pal: Palette = setup.desert ? { ...SKIES[setup.sky], ...DESERT } : SKIES[setup.sky];
  const t = time / 1000;
  const u = Math.min(h / 100, w / 120);
  const hz = h * 0.6;
  const camX = camera.x + camera.px * 5 + (setup.scroll ?? 0) * t;
  const camY = camera.py * 1.2;
  const warm = "#ffc46b";

  /** World x (in units, 0 = centre) at a parallax depth → screen x. */
  const sx = (X: number, depth: number) => w / 2 + (X - camX * depth) * u;
  /** For endlessly scrolling scenes: wraps a prop back in front of the camera. */
  const wrap = (X: number, depth: number, span: number) => {
    const rel = (((X - camX * depth) % span) + span * 1.5) % span - span / 2;
    return w / 2 + rel * u;
  };
  const ROWS = {
    mid: { depth: 0.5, y: hz + 4 * u + camY * u * 0.5, s: 0.55 * u },
    front: { depth: 0.9, y: hz + 14 * u + camY * u, s: u },
    close: { depth: 1.25, y: hz + 31 * u + camY * u * 1.6, s: 1.9 * u },
  };
  type Row = (typeof ROWS)["mid"];

  // ---- Sky ----
  const sky = ctx.createLinearGradient(0, 0, 0, hz + 2);
  sky.addColorStop(0, pal.top);
  sky.addColorStop(0.62, pal.mid);
  sky.addColorStop(1, pal.hor);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (pal.stars > 0) {
    for (let i = 0; i < 170; i++) {
      const x = ((rand(i) * w * 1.3 - camX * 0.02 * u) % w + w) % w;
      const y = rand(i + 500) ** 1.6 * hz * 0.92;
      const tw = 0.55 + 0.45 * Math.sin(t * (0.6 + rand(i + 9) * 2) + i);
      ctx.globalAlpha = pal.stars * tw * (1 - y / hz) * 0.95;
      ctx.fillStyle = i % 9 === 0 ? "#ffdca0" : "#ffffff";
      ctx.fillRect(x, y, rand(i + 77) > 0.85 ? 2 : 1.2, rand(i + 77) > 0.85 ? 2 : 1.2);
    }
    ctx.globalAlpha = 1;
    if (pal.stars === 1) {
      // The Milky Way, and now and then a shooting star.
      const band = ctx.createLinearGradient(w * 0.1, 0, w * 0.7, hz);
      band.addColorStop(0.3, "rgba(150, 170, 255, 0)");
      band.addColorStop(0.5, "rgba(170, 185, 255, 0.11)");
      band.addColorStop(0.7, "rgba(150, 170, 255, 0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, w, hz);
      const s = (t % 9) / 0.9;
      if (s < 1) {
        const x0 = w * (0.2 + rand(Math.floor(t / 9)) * 0.5) + s * w * 0.18;
        const y0 = hz * 0.12 + s * hz * 0.14;
        const trail = ctx.createLinearGradient(x0 - w * 0.07, y0 - hz * 0.055, x0, y0);
        trail.addColorStop(0, "rgba(255,255,255,0)");
        trail.addColorStop(1, `rgba(255,255,255,${0.9 * (1 - s)})`);
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x0 - w * 0.07, y0 - hz * 0.055);
        ctx.lineTo(x0, y0);
        ctx.stroke();
      }
    }
  }

  if (pal.sun) {
    const x = pal.sun.x * w - camX * 0.03 * u;
    const y = pal.sun.y * h;
    const r = pal.sun.r * u;
    const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 9);
    glow.addColorStop(0, pal.sun.glow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, hz + 2);
    ctx.fillStyle = pal.sun.core;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  // Clouds
  for (let i = 0; i < 7; i++) {
    const span = w * 1.6;
    const x = (((rand(i + 40) * span + t * (4 + rand(i) * 5) - camX * 0.06 * u) % span) + span) % span - w * 0.3;
    const y = hz * (0.14 + rand(i + 60) * 0.5);
    const cw = (16 + rand(i + 80) * 26) * u;
    ctx.fillStyle = setup.sky === "night" ? "rgba(120,140,200,0.07)" : setup.sky === "storm" ? "rgba(20,22,30,0.4)" : "rgba(255,255,255,0.16)";
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(x + (k - 1.5) * cw * 0.32, y + Math.sin(k * 2.1) * u, cw * 0.36, cw * (0.07 + 0.03 * (k % 2)), 0, 0, TAU);
      ctx.fill();
    }
  }

  // ---- Ridges ----
  const ridge = (depth: number, base: number, amp: number, seed: number, color: string, freq: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 8; x += 8) {
      const X = (x - w / 2) / u + camX * depth;
      const n =
        Math.sin(X * freq + seed) * 0.55 +
        Math.sin(X * freq * 2.3 + seed * 1.7) * 0.28 +
        Math.sin(X * freq * 5.1 + seed * 2.9) * 0.12 +
        Math.sin(X * freq * 11 + seed * 4.1) * 0.05;
      ctx.lineTo(x, base - (n * 0.5 + 0.5) * amp + camY * depth * u);
    }
    ctx.lineTo(w, h);
    ctx.fill();
  };
  ridge(0.08, hz + u, 26 * u, 1.3, pal.ridges[0], 0.021);
  ridge(0.16, hz + 2 * u, 16 * u, 4.1, pal.ridges[1], 0.034);
  ridge(0.3, hz + 3 * u, 8 * u, 7.7, pal.ridges[2], 0.05);

  const ground = ctx.createLinearGradient(0, hz, 0, h);
  ground.addColorStop(0, pal.ground[0]);
  ground.addColorStop(1, pal.ground[1]);
  ctx.fillStyle = ground;
  ctx.fillRect(0, hz + 2 * u + camY * u * 0.4, w, h);

  // ---- Prop kit (all drawn as silhouettes in local units, feet at y = 0) ----
  const at = (x: number, row: Row, flip: number, draw: () => void) => {
    if (x < -40 * row.s || x > w + 40 * row.s) return;
    ctx.save();
    ctx.translate(x, row.y);
    ctx.scale(row.s * flip, row.s);
    ctx.fillStyle = pal.sil;
    ctx.strokeStyle = pal.sil;
    ctx.lineCap = "round";
    draw();
    ctx.restore();
  };
  const line = (x0: number, y0: number, x1: number, y1: number, width = 0.8) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  const glow = (x: number, y: number, r: number, color = "255, 190, 100", a = 0.5) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color}, ${a})`);
    g.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = pal.sil;
  };
  const smoke = (seed: number, x: number, y: number) => {
    for (let k = 0; k < 6; k++) {
      const p = (t * 0.16 + k / 6 + rand(seed)) % 1;
      ctx.globalAlpha = 0.2 * (1 - p);
      ctx.fillStyle = "#cfd3dc";
      ctx.beginPath();
      ctx.arc(x + Math.sin(p * 4 + seed) * 2 + p * 6, y - p * 20, 1 + p * 3.4, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.sil;
  };

  const ger = (seed: number, lit = true) => {
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-10, -6);
    ctx.quadraticCurveTo(-5, -12.5, 0, -13);
    ctx.quadraticCurveTo(5, -12.5, 10, -6);
    ctx.lineTo(10, 0);
    ctx.fill();
    ctx.fillRect(-1.6, -14.2, 3.2, 1.6);
    if (lit) {
      glow(0, -3, 9, "255, 190, 100", 0.35);
      ctx.fillStyle = warm;
      ctx.fillRect(-1.7, -5.4, 3.4, 5.4);
      ctx.fillStyle = pal.sil;
      smoke(seed, 0, -14);
    }
  };
  const tug = (seed: number) => {
    line(0, 0, 0, -24, 0.7);
    line(-1.6, -24, 1.6, -24, 0.6);
    line(0, -24, 0, -27, 0.6);
    for (let k = -3; k <= 3; k++) {
      const sway = Math.sin(t * 2.2 + seed + k * 0.4) * 1.6;
      line(k * 0.5, -23.5, k * 0.9 + sway, -17.5, 0.5);
    }
  };
  const flag = (seed: number, color: string, height = 20) => {
    line(0, 0, 0, -height, 0.6);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -height);
    for (let k = 1; k <= 6; k++) ctx.lineTo(k * 1.6, -height + Math.sin(t * 4 + seed + k * 0.9) * 0.9 + k * 0.1);
    for (let k = 6; k >= 0; k--) ctx.lineTo(k * 1.6, -height + 5 + Math.sin(t * 4 + seed + k * 0.9 + 0.5) * 0.9);
    ctx.fill();
    ctx.fillStyle = pal.sil;
  };
  const person = (seed: number, walking = 0, item: "none" | "torch" | "flag" | "candle" = "none") => {
    const step = Math.sin(t * 5 * walking + seed) * 1.6 * Math.min(1, walking);
    line(-0.4, -5, -0.4 - step, 0, 1.1);
    line(0.4, -5, 0.4 + step, 0, 1.1);
    ctx.beginPath();
    ctx.ellipse(0, -8, 1.9, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -12.6, 1.5, 0, TAU);
    ctx.fill();
    if (item === "torch" || item === "candle") {
      const top = item === "torch" ? -15 : -9.5;
      line(1.6, -8, 3.2, top, 0.6);
      glow(3.2, top - 1, item === "torch" ? 12 : 4.5, "255, 180, 90", 0.5 + 0.15 * Math.sin(t * 9 + seed));
      ctx.fillStyle = "#ffd68a";
      ctx.beginPath();
      ctx.arc(3.2, top - 0.8, item === "torch" ? 1.1 : 0.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = pal.sil;
    }
    if (item === "flag") {
      ctx.save();
      ctx.translate(1.8, -7);
      flag(seed, seed % 2 > 1 ? "#c9342c" : "#2a5fb0", 14);
      ctx.restore();
    }
  };
  /** A horse, galloping (`pace` 1), walking (0.3) or standing (0), with an optional rider. */
  const horse = (seed: number, pace: number, rider: "none" | "bow" | "spear" | "plain" | "banner" = "plain") => {
    const ph = t * (pace > 0.5 ? 11 : 4.5) + seed;
    const bob = pace > 0.5 ? Math.sin(ph) * 0.9 : 0;
    ctx.save();
    ctx.translate(0, bob);
    const swing = pace > 0.5 ? 0.85 : pace > 0 ? 0.3 : 0;
    const leg = (x: number, off: number) => {
      const a = Math.sin(ph + off) * swing;
      const kx = x + Math.sin(a) * 5;
      const ky = -8 + Math.cos(a) * 4.2;
      line(x, -9, kx, ky, 1.1);
      line(kx, ky, kx + Math.sin(a - 0.5 * swing) * 4.4, Math.min(0 - bob, ky + 4.6), 0.9);
    };
    leg(-6.5, 0);
    leg(-5, 1.5);
    leg(5, 3.1);
    leg(6.4, 4.4);
    ctx.beginPath();
    ctx.ellipse(0, -11.5, 9, 3.9, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath(); // neck and head
    ctx.moveTo(5, -13.5);
    ctx.lineTo(11, -21);
    ctx.lineTo(15.5, -19.4);
    ctx.lineTo(15.8, -17.6);
    ctx.lineTo(12.6, -17.8);
    ctx.lineTo(9.5, -10.5);
    ctx.fill();
    line(10.6, -21, 11, -22.6, 0.6);
    ctx.lineWidth = 1.3; // tail
    ctx.beginPath();
    ctx.moveTo(-8.6, -12.5);
    ctx.quadraticCurveTo(-14 - swing * 3, -12 + Math.sin(ph) * 1.5, -15 - swing * 2, -6);
    ctx.stroke();
    if (rider !== "none") {
      ctx.beginPath();
      ctx.ellipse(0.5, -18.5, 2.3, 4.6, 0.12, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1.2, -24.4, 1.7, 0, TAU);
      ctx.fill();
      ctx.beginPath(); // pointed hat
      ctx.moveTo(-0.8, -25.4);
      ctx.lineTo(1.2, -28.4);
      ctx.lineTo(3.2, -25.4);
      ctx.fill();
      line(0.5, -14.5, 2, -9, 1.3);
      if (rider === "bow") {
        line(1.5, -20.5, 7, -21.5, 0.8);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(5.4, -21.5, 4.6, -1.15, 1.15);
        ctx.stroke();
      } else if (rider === "spear") {
        line(-5, -15, 12, -27, 0.6);
      } else if (rider === "banner") {
        ctx.save();
        ctx.translate(-1.5, -15);
        ctx.scale(0.8, 0.8);
        tug(seed);
        ctx.restore();
      }
    }
    ctx.restore();
  };
  const camel = (seed: number, loaded = true) => {
    const ph = t * 3 + seed;
    const leg = (x: number, off: number) => {
      const a = Math.sin(ph + off) * 0.28;
      line(x, -11, x + Math.sin(a) * 6, -5, 1.1);
      line(x + Math.sin(a) * 6, -5, x + Math.sin(a) * 9, 0, 0.9);
    };
    leg(-6, 0);
    leg(-4.6, 1.6);
    leg(4.6, 3.1);
    leg(6, 4.6);
    ctx.beginPath();
    ctx.ellipse(0, -13.5, 8.5, 4, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-3, -17.6, 2.6, 3, 0, 0, TAU);
    ctx.ellipse(3, -17.6, 2.6, 3, 0, 0, TAU);
    ctx.fill();
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(7, -14.5);
    ctx.quadraticCurveTo(11.5, -13, 11.5, -22.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(13, -23.4, 2.4, 1.3, 0.1, 0, TAU);
    ctx.fill();
    if (loaded) {
      ctx.fillRect(-6.5, -18.5, 4.5, 6);
      ctx.fillRect(2, -18.5, 4.5, 6);
    }
  };
  const roof = (y: number, half: number, rise: number) => {
    ctx.beginPath();
    ctx.moveTo(-half - 2.5, y - 1.2);
    ctx.quadraticCurveTo(-half * 0.55, y - 0.4, -half * 0.38, y - rise);
    ctx.lineTo(half * 0.38, y - rise);
    ctx.quadraticCurveTo(half * 0.55, y - 0.4, half + 2.5, y - 1.2);
    ctx.lineTo(half + 1.5, y);
    ctx.lineTo(-half - 1.5, y);
    ctx.fill();
  };
  const temple = (tiers = 2, lit = true) => {
    let y = 0;
    let half = 13;
    ctx.fillRect(-half - 2, -2, half * 2 + 4, 2);
    y = -2;
    for (let k = 0; k < tiers; k++) {
      ctx.fillRect(-half, y - 7, half * 2, 7);
      if (lit) {
        ctx.fillStyle = warm;
        ctx.globalAlpha = 0.85;
        for (let c = -2; c <= 2; c++) ctx.fillRect(c * half * 0.36 - 0.8, y - 5.4, 1.6, k === 0 ? 5.4 : 3.2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = pal.sil;
      }
      roof(y - 7, half, 4.5);
      y -= 11.5;
      half *= 0.66;
    }
    ctx.fillRect(-0.5, y - 3.5, 1, 4);
  };
  const stupa = () => {
    ctx.fillRect(-3.4, -3, 6.8, 3);
    ctx.fillRect(-2.6, -4.6, 5.2, 1.6);
    ctx.beginPath();
    ctx.ellipse(0, -6.4, 2.3, 2.4, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.9, -8.2);
    ctx.lineTo(0, -13.2);
    ctx.lineTo(0.9, -8.2);
    ctx.fill();
  };
  const wall = (length: number, ruined = false) => {
    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    for (let x = -length / 2; x < length / 2; x += 3) {
      const top = ruined ? -9 + rand(x * 3.1) * 7 * (rand(x + 5) > 0.45 ? 1 : 0.2) : -9;
      const merlon = !ruined && Math.round(x / 3) % 2 === 0 ? -1.6 : 0;
      ctx.lineTo(x, top + merlon);
      ctx.lineTo(x + 3, top + merlon);
    }
    ctx.lineTo(length / 2, 0);
    ctx.fill();
  };
  const gate = (lit = true) => {
    ctx.fillRect(-9, -15, 18, 15);
    roof(-15, 10, 4);
    ctx.fillRect(-6, -22, 12, 4);
    roof(-22, 7, 3.5);
    if (lit) {
      glow(0, -3, 12, "255, 190, 100", 0.4);
      ctx.fillStyle = warm;
      ctx.beginPath();
      ctx.moveTo(-3.2, 0);
      ctx.lineTo(-3.2, -5);
      ctx.arc(0, -5, 3.2, Math.PI, 0);
      ctx.lineTo(3.2, 0);
      ctx.fill();
      ctx.fillStyle = pal.sil;
    }
  };
  const building = (seed: number, bw: number, bh: number, litShare = 0.5) => {
    ctx.fillRect(-bw / 2, -bh, bw, bh);
    for (let y = -bh + 2; y < -2.5; y += 3.4) {
      for (let x = -bw / 2 + 1.4; x < bw / 2 - 1.6; x += 2.8) {
        if (rand(seed + x * 7.3 + y * 3.1) > litShare) continue;
        ctx.fillStyle = rand(seed + x + y) > 0.25 ? warm : "#bfe0ff";
        ctx.globalAlpha = 0.55 + 0.4 * rand(seed + x * y);
        ctx.fillRect(x, y, 1.5, 1.9);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.sil;
  };
  const stele = (seed: number, tall = 22) => {
    ctx.beginPath(); // turtle base
    ctx.ellipse(0, -2.2, 8.5, 2.6, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(9.4, -2.6, 2.2, 1.5, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3.6, -3);
    ctx.lineTo(-3.2, -tall);
    ctx.quadraticCurveTo(0, -tall - 3.4, 3.2, -tall);
    ctx.lineTo(3.6, -3);
    ctx.fill();
    // Runes breathe with light, as if the stone were speaking.
    const pulse = 0.45 + 0.4 * Math.sin(t * 1.4 + seed);
    glow(0, -tall * 0.55, 13, "255, 205, 120", 0.22 * pulse);
    ctx.strokeStyle = `rgba(255, 214, 138, ${pulse})`;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 3; c++) {
        const x = -1.9 + c * 1.9;
        const y = -tall + 2.4 + r * ((tall - 7) / 7);
        const k = rand(seed + r * 5 + c);
        line(x - 0.5, y, x + 0.5, y + (k > 0.5 ? 1.2 : -0.2), 0.3);
        if (k > 0.3) line(x, y - 0.4, x, y + 1.4, 0.3);
      }
    }
    ctx.strokeStyle = pal.sil;
  };
  const fire = (seed: number) => {
    const f = 0.8 + 0.2 * Math.sin(t * 13 + seed) * Math.sin(t * 7.3);
    glow(0, -3, 26 * f, "255, 150, 60", 0.5);
    line(-3, 0, 3, -1.2, 0.9);
    line(3, 0, -3, -1.2, 0.9);
    for (const [dx, hh, c] of [[0, 7, "#ff8a2b"], [-1.2, 4.6, "#ffb23e"], [0.9, 3.6, "#ffe08a"]] as const) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(dx - 1.8, -0.8);
      ctx.quadraticCurveTo(dx + Math.sin(t * 9 + dx * 3) * 1.2, -hh * f * 1.25, dx + 1.8, -0.8);
      ctx.fill();
    }
    ctx.fillStyle = pal.sil;
  };
  const tank = (seed: number) => {
    ctx.beginPath();
    ctx.roundRect(-10, -4.6, 20, 4.6, 2.2);
    ctx.fill();
    ctx.fillRect(-7.5, -7.6, 14, 3.4);
    ctx.fillRect(-3.5, -11, 8, 4);
    line(4, -9.4, 15, -10.4, 1);
    const shot = (t * 0.45 + rand(seed)) % 1;
    if (shot < 0.07) {
      glow(16, -10.5, 16, "255, 220, 150", 0.95);
    }
  };
  const train = (cars: number) => {
    ctx.fillRect(0, -9, 15, 7.2);
    ctx.fillRect(9.5, -12.5, 5.5, 4);
    ctx.fillRect(2, -13, 2, 4.4);
    ctx.beginPath();
    ctx.moveTo(0, -1.8);
    ctx.lineTo(-3.2, -1.8);
    ctx.lineTo(0, -5.5);
    ctx.fill();
    for (let k = 1; k <= cars; k++) {
      ctx.fillRect(15.5 + (k - 1) * 14.5 + 1, -8.6, 13, 6.8);
      ctx.fillStyle = warm;
      ctx.globalAlpha = 0.75;
      for (let c = 0; c < 4; c++) ctx.fillRect(18.5 + (k - 1) * 14.5 + c * 3, -7.2, 1.7, 1.9);
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.sil;
    }
    for (let x = 2; x < 15 + cars * 14.5; x += 4.8) {
      ctx.beginPath();
      ctx.arc(x, -1.4, 1.5, 0, TAU);
      ctx.fill();
    }
    glow(-2, -5, 12, "255, 240, 190", 0.6);
    smoke(3, 3, -13.5);
  };
  const truck = () => {
    ctx.fillRect(-7, -6.6, 9.5, 4.4);
    ctx.fillRect(3, -8, 4.2, 5.8);
    ctx.beginPath();
    ctx.moveTo(-8, -6.6);
    ctx.lineTo(-6, -9.6);
    ctx.lineTo(2.5, -9.6);
    ctx.lineTo(2.5, -6.6);
    ctx.fill();
    for (const x of [-4.4, 4.2]) {
      ctx.beginPath();
      ctx.arc(x, -2, 2.1, 0, TAU);
      ctx.fill();
    }
    glow(8.5, -4.5, 7, "255, 240, 190", 0.5);
  };
  const headframe = () => {
    line(-7, 0, -1.5, -30, 1.3);
    line(7, 0, 1.5, -30, 1.3);
    line(-5, -10, 5, -10, 0.8);
    line(-3.4, -20, 3.4, -20, 0.8);
    line(-5, -10, 3.4, -20, 0.5);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, -31, 3, 0, TAU);
    ctx.stroke();
    line(0, -31, Math.cos(t * 2) * 3, -31 + Math.sin(t * 2) * 3, 0.5);
    line(2.6, -30, 30, 0, 0.9);
    glow(0, -31, 8, "255, 90, 70", 0.5 + 0.3 * Math.sin(t * 3));
  };
  const pole = () => {
    line(0, 0, 0, -17, 0.6);
    line(-3, -15, 3, -15, 0.5);
  };

  // ---- Composition ----
  const M = ROWS.mid;
  const F = ROWS.front;
  const C = ROWS.close;
  const put = (X: number, row: Row, draw: () => void, flip = 1) => at(sx(X, row.depth), row, flip, draw);
  /** A group that keeps moving and re-enters from the far side. */
  const moving = (X: number, speed: number, row: Row, span: number, draw: () => void) =>
    at(wrap(X + t * speed, row.depth, span), row, speed < 0 ? -1 : 1, draw);
  const hill = () => ridge(0.7, hz + 13 * u, 5 * u, 2.2, pal.ground[0], 0.045);

  const arrows = (count: number, dir: number) => {
    ctx.strokeStyle = "rgba(20, 10, 10, 0.85)";
    ctx.lineWidth = Math.max(1, u * 0.16);
    for (let i = 0; i < count; i++) {
      const p = (t * 0.42 + rand(i + 3) * 3) % 1;
      const x0 = w / 2 - dir * w * (0.38 + rand(i) * 0.1);
      const span = dir * w * (0.55 + rand(i + 20) * 0.25);
      const peak = (20 + rand(i + 9) * 14) * u;
      const point = (q: number): [number, number] => [x0 + span * q, hz + 2 * u - Math.sin(q * Math.PI) * peak];
      const [ax, ay] = point(p);
      const [bx, by] = point(Math.max(0, p - 0.03));
      ctx.globalAlpha = Math.sin(p * Math.PI);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ax, ay);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const riders = (n: number, row: Row, speed: number, seed: number, span: number, kinds: Parameters<typeof horse>[2][]) => {
    for (let i = 0; i < n; i++) {
      const X = (i / n) * span + rand(seed + i) * (span / n) * 0.7;
      const s = seed + i * 1.7;
      moving(X, speed * (0.85 + rand(s) * 0.3), row, span, () => horse(s, 1, kinds[i % kinds.length]));
    }
  };

  switch (id) {
    case "camp":
    case "night-steppe": {
      [-62, -40, -18, 30, 58].forEach((X, i) => put(X, M, () => ger(i)));
      put(10, M, () => tug(1));
      put(-80, M, () => horse(2, 0, "none"));
      put(74, M, () => horse(5, 0, "none"), -1);
      hill();
      put(22, F, () => ger(11));
      put(52, F, () => ger(12));
      put(37, F, () => tug(3));
      put(-34, F, () => horse(7, 0, "none"));
      put(-46, F, () => horse(8, 0, "none"), -1);
      put(-6, F, () => fire(1));
      put(-13, F, () => person(1));
      put(1, F, () => person(2), -1);
      put(-80, C, () => tug(9));
      break;
    }
    case "battle": {
      riders(9, M, 30, 10, 260, ["bow", "spear", "bow"]);
      riders(8, M, -26, 40, 260, ["spear", "plain"]);
      arrows(16, 1);
      arrows(9, -1);
      hill();
      riders(6, F, 38, 70, 300, ["bow", "banner", "spear", "bow"]);
      riders(3, F, -34, 90, 300, ["spear"]);
      put(-40, F, () => tug(4));
      riders(2, C, 52, 120, 420, ["bow", "spear"]);
      break;
    }
    case "charge": {
      riders(14, M, 30, 10, 260, ["bow", "spear", "plain", "banner"]);
      arrows(10, 1);
      hill();
      riders(8, F, 40, 70, 300, ["banner", "bow", "spear", "bow"]);
      riders(2, C, 54, 120, 420, ["spear", "bow"]);
      break;
    }
    case "courier": {
      for (let i = 0; i < 3; i++) {
        at(wrap(i * 150 + 40, M.depth, 450), M, 1, () => ger(i));
        at(wrap(i * 150 + 52, M.depth, 450), M, 1, () => horse(i, 0, "none"));
        at(wrap(i * 150 + 30, M.depth, 450), M, 1, () => tug(i));
      }
      hill();
      for (let i = 0; i < 9; i++) at(wrap(i * 50, F.depth, 450), F, 1, pole);
      // The relay rider holds the centre of the frame while the steppe races past.
      at(w / 2 + (camera.x * 0.3 - camera.px * 4) * u, F, 1, () => horse(1, 1, "plain"));
      at(w / 2 + (camera.x * 0.3 - camera.px * 4 - 15) * u, F, 1, () => horse(4, 1, "none"));
      break;
    }
    case "caravan":
    case "migration": {
      const walkers = id === "migration" ? 13 : 8;
      for (let i = 0; i < walkers; i++) {
        const X = i * 17;
        moving(X, 4.2, M, 300, () => (id === "migration" && i % 3 === 2 ? person(i, 1) : camel(i)));
      }
      if (id === "caravan") put(64, M, () => gate(false));
      hill();
      for (let i = 0; i < 5; i++) {
        moving(i * 24, 6, F, 340, () => (i === 0 ? horse(3, 0.3, "plain") : camel(i + 20)));
      }
      if (id === "migration") {
        for (let i = 0; i < 6; i++) moving(130 + i * 9, 6, F, 340, () => person(i + 3, 1));
        moving(200, 6, F, 340, () => horse(9, 0.3, "banner"));
      }
      break;
    }
    case "city": {
      put(-8, M, () => wall(150));
      put(-8, M, gate);
      [-62, 46].forEach((X) => put(X, M, () => { ctx.fillRect(-5, -14, 10, 14); roof(-14, 6.5, 3.5); }));
      [-40, -24, 14, 30].forEach((X, i) => put(X, { ...M, y: M.y - 9 * M.s }, () => temple(1 + (i % 2), true)));
      [84, 100, -94].forEach((X, i) => put(X, M, () => ger(i)));
      hill();
      moving(0, 5, F, 320, () => camel(1));
      moving(22, 5, F, 320, () => camel(2));
      moving(44, 5, F, 320, () => horse(3, 0.3, "plain"));
      moving(150, -5, F, 320, () => horse(6, 0.3, "spear"));
      [-30, -22, 18, 60].forEach((X, i) => put(X, F, () => person(i, i % 2 ? 0 : 0.4)));
      put(-58, F, () => ger(7));
      put(72, F, () => tug(2));
      break;
    }
    case "temple": {
      put(0, M, () => wall(120));
      for (let X = -57; X <= 57; X += 9.5) put(X, { ...M, y: M.y - 8.6 * M.s }, stupa);
      put(-20, { ...M, y: M.y - 3 * M.s }, () => temple(3));
      put(24, { ...M, y: M.y - 3 * M.s }, () => temple(2));
      put(0, M, gate);
      hill();
      [-48, -40, -32, -24].forEach((X, i) => moving(X + 40, 2.4, F, 300, () => person(i, 0.5)));
      put(40, F, () => ger(3));
      put(62, F, () => stupa());
      put(-70, F, () => flag(1, "#e8b04b", 22));
      put(-64, F, () => flag(2, "#c9342c", 18));
      break;
    }
    case "monument": {
      put(-52, M, () => stele(3, 18));
      put(60, M, () => ger(1));
      put(74, M, () => horse(2, 0, "none"));
      hill();
      put(4, F, () => stele(1, 27));
      put(34, F, () => stele(2, 20));
      put(-22, F, () => person(1, 0, "torch"));
      put(-60, F, () => { ctx.beginPath(); ctx.ellipse(0, -2, 5, 3, 0, 0, TAU); ctx.fill(); });
      break;
    }
    case "modern-city":
    case "square": {
      for (let i = 0; i < 12; i++) {
        put(-110 + i * 20, M, () => building(i, 12 + rand(i) * 8, 16 + rand(i + 3) * (id === "square" ? 10 : 26), 0.55));
      }
      if (id === "square") {
        put(0, M, () => {
          ctx.fillRect(-34, -17, 68, 17);
          ctx.fillRect(-38, -20, 76, 3.4);
          ctx.fillStyle = warm;
          ctx.globalAlpha = 0.7;
          for (let c = -30; c <= 30; c += 6) ctx.fillRect(c - 1.6, -15, 3.2, 15);
          ctx.globalAlpha = 1;
          ctx.fillStyle = pal.sil;
          line(0, -20, 0, -32, 0.6);
        });
      } else {
        [-76, -30, 44, 88].forEach((X, i) => put(X, M, () => ger(i)));
      }
      hill();
      if (id === "square") {
        for (let i = 0; i < 44; i++) {
          const X = -92 + i * 4.3 + rand(i) * 2;
          put(X, { ...F, y: F.y + (rand(i + 5) - 0.5) * 3 * u }, () => person(i * 1.3, 0, i % 7 === 0 ? "flag" : i % 2 ? "candle" : "none"));
        }
      } else {
        [-60, -20, 20, 60].forEach((X, i) => put(X, F, () => { line(0, 0, 0, -19, 0.6); line(0, -19, 3, -19, 0.6); glow(3, -18, 13, "255, 220, 160", 0.5); void i; }));
        [-44, -8, 31, 72].forEach((X, i) => moving(X + 100, i % 2 ? -3 : 3, F, 300, () => person(i, 0.6)));
        put(-84, F, () => ger(8));
      }
      break;
    }
    case "modern-battle": {
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.07 + i / 3) % 1;
        const x = p * (w + 200) - 100;
        const y = hz * (0.2 + i * 0.12);
        ctx.fillStyle = pal.sil;
        ctx.fillRect(x - 3 * u, y, 6.5 * u, 0.5 * u);
        ctx.fillRect(x - 0.4 * u, y - 2.6 * u, 0.8 * u, 5.6 * u);
        ctx.fillRect(x - 3 * u, y - 1.1 * u, 0.4 * u, 2.4 * u);
      }
      for (let i = 0; i < 5; i++) {
        const p = (t * 0.33 + rand(i + 50)) % 1;
        if (p < 0.2) {
          const x = sx(-80 + rand(i + Math.floor(t * 0.33 + rand(i + 50))) * 160, M.depth);
          glow(x, M.y - 2 * u, (8 + p * 90) * u * 0.55, "255, 170, 90", 0.75 * (1 - p / 0.2));
        }
      }
      for (let i = 0; i < 5; i++) moving(i * 44, 7, M, 260, () => tank(i));
      hill();
      moving(0, 9, F, 320, () => tank(7));
      moving(120, 9, F, 320, () => tank(8));
      riders(4, F, 30, 30, 320, ["plain", "spear"]);
      for (let i = 0; i < 7; i++) moving(190 + i * 6, 5, F, 320, () => person(i, 1));
      break;
    }
    case "train": {
      [-70, -52, 60].forEach((X, i) => put(X, M, () => ger(i)));
      put(-36, M, () => horse(1, 0, "none"));
      put(82, M, () => camel(2, false));
      hill();
      ctx.fillStyle = pal.sil;
      ctx.fillRect(0, F.y - 0.5 * u, w, 0.9 * u);
      for (let X = -140; X <= 140; X += 28) put(X, F, pole);
      at(wrap(-t * 34, F.depth, 420), F, 1, () => train(7));
      break;
    }
    case "mine": {
      put(-30, M, headframe);
      [-64, 8, 30, 52].forEach((X, i) => put(X, M, () => { ctx.beginPath(); ctx.moveTo(-12 - i * 2, 0); ctx.lineTo(0, -9 - i * 2); ctx.lineTo(12 + i * 2, 0); ctx.fill(); }));
      put(70, M, () => building(3, 22, 12, 0.6));
      for (let i = 0; i < 3; i++) moving(i * 90, 9, M, 280, truck);
      hill();
      moving(40, -11, F, 330, truck);
      moving(200, 11, F, 330, truck);
      put(46, F, () => ger(1));
      put(66, F, () => camel(4, false));
      put(-64, F, () => person(2, 0));
      break;
    }
    case "ruin": {
      put(-6, M, () => wall(110, true));
      for (let X = -50; X <= 40; X += 19) put(X, { ...M, y: M.y - 4 * M.s }, () => (rand(X) > 0.4 ? stupa() : undefined));
      put(18, M, () => { ctx.fillRect(-12, -7, 24, 7); ctx.beginPath(); ctx.moveTo(-12, -7); ctx.lineTo(-7, -15); ctx.lineTo(-2, -8); ctx.lineTo(4, -12); ctx.lineTo(12, -7); ctx.fill(); });
      hill();
      put(-44, F, () => ger(1, false));
      put(30, F, () => person(1, 0, "candle"));
      put(60, F, () => stupa());
      break;
    }
  }

  // ---- Foreground: grass in the wind, weather, lens ----
  ctx.strokeStyle = pal.sil;
  ctx.lineWidth = Math.max(1, u * 0.28);
  for (let i = 0; i < 90; i++) {
    const span = w * 1.5;
    const x = (((rand(i + 200) * span - camX * 1.6 * u) % span) + span) % span - w * 0.25;
    const len = (4 + rand(i + 300) * 9) * u;
    const sway = Math.sin(t * 1.7 + i * 0.7) * len * 0.3 + len * 0.15;
    ctx.beginPath();
    ctx.moveTo(x, h + 2);
    ctx.quadraticCurveTo(x + sway * 0.3, h - len * 0.6, x + sway, h - len);
    ctx.stroke();
  }

  const particles = (n: number, drawOne: (i: number, p: number) => void) => {
    for (let i = 0; i < n; i++) drawOne(i, (t * (0.05 + rand(i) * 0.09) + rand(i + 31)) % 1);
    ctx.globalAlpha = 1;
  };
  if (setup.weather === "snow") {
    ctx.fillStyle = "#ffffff";
    particles(220, (i, p) => {
      const x = ((rand(i + 7) * w + p * w * 0.35 + Math.sin(t + i) * 8 - camX * u * (0.4 + rand(i))) % w + w) % w;
      ctx.globalAlpha = 0.35 + rand(i + 2) * 0.55;
      ctx.beginPath();
      ctx.arc(x, ((p * 1.6 + rand(i + 90)) % 1) * h, (0.14 + rand(i + 4) * 0.34) * u, 0, TAU);
      ctx.fill();
    });
  } else if (setup.weather === "dust") {
    particles(46, (i, p) => {
      const y = hz + (rand(i + 12) * 0.38 - 0.02) * h;
      const x = (p * 1.4 - 0.2) * w;
      ctx.globalAlpha = 0.075 * Math.sin(p * Math.PI);
      ctx.fillStyle = setup.desert ? "#f3cf96" : "#d9b79c";
      ctx.beginPath();
      ctx.ellipse(x, y, (9 + rand(i) * 16) * u, (1.2 + rand(i + 1) * 2.2) * u, 0, 0, TAU);
      ctx.fill();
    });
  } else if (setup.weather === "embers" || setup.weather === "fireflies") {
    const rising = setup.weather === "embers";
    particles(rising ? 46 : 38, (i, p) => {
      const x = rising
        ? sx(-6, F.depth) + (rand(i + 5) - 0.5) * 30 * u * p + Math.sin(t * 2 + i) * u
        : rand(i + 5) * w + Math.sin(t * 0.5 + i) * 6 * u;
      const y = rising ? F.y - p * 46 * u : hz + (rand(i + 8) * 0.34 - 0.05) * h + Math.cos(t * 0.7 + i * 2) * 2 * u;
      ctx.globalAlpha = rising ? 1 - p : 0.35 + 0.6 * Math.max(0, Math.sin(t * 2 + i * 1.9));
      ctx.fillStyle = rising ? "#ffb04a" : "#ffe9a3";
      ctx.beginPath();
      ctx.arc(x, y, (rising ? 0.24 : 0.3) * u, 0, TAU);
      ctx.fill();
    });
  }

  const lens = ctx.createRadialGradient(w / 2, h * 0.52, Math.min(w, h) * 0.3, w / 2, h * 0.52, Math.max(w, h) * 0.75);
  lens.addColorStop(0, "rgba(0,0,0,0)");
  lens.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = lens;
  ctx.fillRect(0, 0, w, h);
}
