import type Phaser from "phaser";
import type { CarStyle } from "@/lib/sections";
import { createAtlas } from "./pixel";

/**
 * Voitures ORIGINALES en pixel art, vues de profil (avant à droite).
 * Grille 64 x 29, agrandie x3. Une frame « fermée » et une « portière ouverte » par style.
 */
export const CARS_KEY = "cars";
const S = 3;
const GW = 64;
const GH = 29;
export const CAR_W = GW * S;
export const CAR_H = GH * S;

export const carFrame = (style: CarStyle, open: boolean) => `${style}-${open ? "open" : "closed"}`;

interface Palette {
  body: string;
  shade: string;
  light: string;
  accent: string;
}

const PALETTES: Record<CarStyle, Palette> = {
  suv: { body: "#2EE6D6", shade: "#17988e", light: "#9df7ef", accent: "#FFD166" },
  convertible: { body: "#FF3D8B", shade: "#b8215e", light: "#ff94c0", accent: "#FFF4E8" },
  muscle: { body: "#FF9F45", shade: "#c2651a", light: "#ffc993", accent: "#2a1250" },
  coupe: { body: "#B26BFF", shade: "#7a3fc4", light: "#dab6ff", accent: "#2EE6D6" },
  van: { body: "#FFD166", shade: "#c7962a", light: "#fff0bf", accent: "#FF3D8B" },
};

const GLASS = "#3a2a6b";
const GLASS_HI = "#9be7ff";
const DARK = "#0b0618";
const INTERIOR = "#1a1030";

interface Spec {
  body: [number, number]; // lignes y0..y1 de la caisse
  bodyX: [number, number];
  roof?: { y0: number; y1: number; xl: (y: number) => number; xr: (y: number) => number };
  windows?: { y0: number; y1: number; inset: number; pillars: number[] };
  door: { x0: number; x1: number; y0: number; y1: number };
  extras?: (d: Drawer, p: Palette) => void;
}

class Drawer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private ox: number,
  ) {}
  rect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.ox + x * S, y * S, w * S, h * S);
  }
  clear(x: number, y: number, w: number, h: number) {
    this.ctx.clearRect(this.ox + x * S, y * S, w * S, h * S);
  }
  rows(y0: number, y1: number, xl: (y: number) => number, xr: (y: number) => number, color: string, inset = 0) {
    for (let y = y0; y < y1; y++) {
      const l = Math.round(xl(y)) + inset;
      const r = Math.round(xr(y)) - inset;
      if (r > l) this.rect(l, y, r - l, 1, color);
    }
  }
  disc(cx: number, cy: number, r: number, color: string) {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.8) this.rect(cx + x, cy + y, 1, 1, color);
  }
}

const SPECS: Record<CarStyle, Spec> = {
  suv: {
    body: [11, 23],
    bodyX: [2, 62],
    roof: { y0: 3, y1: 11, xl: () => 8, xr: (y) => 46 + (y - 3) * 0.75 },
    windows: { y0: 5, y1: 10, inset: 2, pillars: [22, 36] },
    door: { x0: 22, x1: 36, y0: 5, y1: 21 },
    extras: (d, p) => {
      d.rect(10, 1, 36, 1, "#2a1250");
      d.rect(12, 2, 1, 1, "#2a1250");
      d.rect(42, 2, 1, 1, "#2a1250");
      d.rect(4, 17, 56, 1, p.light);
    },
  },
  convertible: {
    body: [14, 23],
    bodyX: [2, 62],
    door: { x0: 26, x1: 38, y0: 14, y1: 21 },
    extras: (d, p) => {
      for (let y = 8; y < 14; y++) d.rect(40 + Math.floor((y - 8) / 2), y, 2, 1, GLASS_HI);
      d.rect(22, 10, 4, 4, "#2b1d47");
      d.rect(30, 10, 4, 4, "#2b1d47");
      d.rect(4, 17, 56, 1, p.light);
    },
  },
  muscle: {
    body: [13, 23],
    bodyX: [2, 62],
    roof: { y0: 6, y1: 13, xl: (y) => 26 - (y - 6), xr: (y) => 38 + (y - 6) * 1.5 },
    windows: { y0: 7, y1: 12, inset: 2, pillars: [33] },
    door: { x0: 24, x1: 36, y0: 7, y1: 21 },
    extras: (d, p) => {
      d.rect(4, 15, 56, 2, p.accent);
      d.rect(46, 11, 6, 2, p.shade);
    },
  },
  coupe: {
    body: [13, 23],
    bodyX: [2, 62],
    roof: { y0: 6, y1: 13, xl: (y) => 24 - (y - 6) * 1.2, xr: (y) => 40 + (y - 6) * 1.6 },
    windows: { y0: 7, y1: 12, inset: 2, pillars: [32] },
    door: { x0: 24, x1: 38, y0: 7, y1: 21 },
    extras: (d, p) => {
      d.rect(2, 10, 7, 1, p.shade);
      d.rect(4, 11, 1, 2, p.shade);
      d.rect(4, 18, 56, 1, p.accent);
    },
  },
  van: {
    body: [4, 23],
    bodyX: [3, 61],
    door: { x0: 22, x1: 36, y0: 5, y1: 22 },
    extras: (d, p) => {
      for (let y = 4; y < 12; y++) d.clear(52 + (y - 4), y, 12, 1); // pare-brise incliné
      d.rect(6, 6, 12, 5, GLASS);
      d.rect(22, 6, 12, 5, GLASS);
      d.rows(6, 11, () => 40, (y) => 50 + (y - 4), GLASS);
      d.rect(7, 7, 2, 1, GLASS_HI);
      d.rect(23, 7, 2, 1, GLASS_HI);
      d.rect(3, 14, 58, 2, p.accent);
      d.rect(3, 16, 58, 2, "#2EE6D6");
    },
  },
};

function drawCar(ctx: CanvasRenderingContext2D, ox: number, style: CarStyle, open: boolean) {
  const spec = SPECS[style];
  const p = PALETTES[style];
  const d = new Drawer(ctx, ox);
  const [y0, y1] = spec.body;
  const [bx0, bx1] = spec.bodyX;

  // Toit + vitres
  if (spec.roof) {
    const { roof } = spec;
    d.rows(roof.y0, roof.y1, roof.xl, roof.xr, p.body);
    d.rows(roof.y0, roof.y0 + 1, roof.xl, roof.xr, p.light, 1);
    if (spec.windows) {
      const w = spec.windows;
      d.rows(w.y0, w.y1, roof.xl, roof.xr, GLASS, w.inset);
      for (const px of w.pillars) d.rect(px, w.y0, 2, w.y1 - w.y0, p.shade);
      d.rect(Math.round(roof.xl(w.y0)) + w.inset + 1, w.y0, 2, 1, GLASS_HI);
    }
  }

  // Caisse
  d.rect(bx0, y0, bx1 - bx0, y1 - y0, p.body);
  d.rect(bx0 + 2, y0, bx1 - bx0 - 4, 1, p.light);
  d.clear(bx0, y0, 1, 1);
  d.clear(bx1 - 1, y0, 1, 1);
  d.rect(bx0, y1 - 2, bx1 - bx0, 2, p.shade);
  // Phares / feux / pare-chocs
  d.rect(bx1 - 3, y0 + 1, 3, 2, "#FFF4E8");
  d.rect(bx1 - 2, y0 + 1, 2, 2, "#FFD166");
  d.rect(bx0, y0 + 1, 2, 2, "#ff2a55");
  d.rect(bx0 - 1, y1 - 3, 3, 2, "#C9B8E8");
  d.rect(bx1 - 2, y1 - 3, 3, 2, "#C9B8E8");

  spec.extras?.(d, p);

  // Portière
  const door = spec.door;
  const dy0 = Math.max(door.y0, y0);
  d.rect(door.x0, dy0, 1, door.y1 - dy0, p.shade);
  d.rect(door.x1, dy0, 1, door.y1 - dy0, p.shade);
  d.rect(door.x1 - 3, y0 + 2, 2, 1, p.light);

  if (open) {
    d.rect(door.x0 + 1, door.y0, door.x1 - door.x0 - 1, door.y1 - door.y0, INTERIOR);
    d.rect(door.x0 + 3, Math.round((door.y0 + door.y1) / 2), 4, 4, "#3b2a66");
    d.rect(door.x1, door.y0 - 1, 4, door.y1 - door.y0 + 1, p.shade);
    d.rect(door.x1 + 3, door.y0 - 1, 1, door.y1 - door.y0 + 1, p.light);
  }

  // Passages de roue + roues
  for (const cx of [14, 50]) {
    d.disc(cx, 23, 6, DARK);
    d.disc(cx, 23, 5, "#120a1e");
    d.disc(cx, 23, 3, "#C9B8E8");
    d.disc(cx, 23, 1, p.accent === "#2a1250" ? "#FFD166" : p.accent);
  }
}

const STYLES: CarStyle[] = ["suv", "convertible", "muscle", "coupe", "van"];

export function createCarTextures(scene: Phaser.Scene) {
  const frames = STYLES.flatMap((s) => [carFrame(s, false), carFrame(s, true)]);
  createAtlas(scene, CARS_KEY, CAR_W, CAR_H, frames, (ctx, frame, ox) => {
    const [style, state] = frame.split("-") as [CarStyle, string];
    drawCar(ctx, ox, style, state === "open");
  });
}
