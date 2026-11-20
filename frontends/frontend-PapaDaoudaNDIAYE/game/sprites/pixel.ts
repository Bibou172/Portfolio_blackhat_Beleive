import type Phaser from "phaser";

/** Dessine une grille de caractères (ex. "..hh..") avec une palette, à l'échelle `scale`. */
export function drawPixels(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  ox: number,
  oy: number,
  scale: number,
) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  });
}

/** Crée (une seule fois) une texture canvas découpée en frames horizontales : un atlas. */
export function createAtlas(
  scene: Phaser.Scene,
  key: string,
  frameW: number,
  frameH: number,
  frames: string[],
  draw: (ctx: CanvasRenderingContext2D, frame: string, ox: number) => void,
) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, frameW * frames.length, frameH);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  frames.forEach((name, i) => {
    draw(ctx, name, i * frameW);
    tex.add(name, 0, i * frameW, 0, frameW, frameH);
  });
  tex.refresh();
}
