import type Phaser from "phaser";

/** Textures de décor et d'effets générées dans le code (aucun fichier à télécharger). */

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  draw(tex.getContext());
  tex.refresh();
}

function vertical(ctx: CanvasRenderingContext2D, w: number, h: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function createFxTextures(scene: Phaser.Scene) {
  // Ciel : violet -> rose -> orange
  canvas(scene, "fx-sky", 4, 512, (ctx) =>
    vertical(ctx, 4, 512, [
      [0, "#1a0b3a"],
      [0.35, "#4a1868"],
      [0.62, "#c42a7a"],
      [0.82, "#ff6f6a"],
      [1, "#ff9f45"],
    ]),
  );

  // Océan
  canvas(scene, "fx-ocean", 4, 256, (ctx) =>
    vertical(ctx, 4, 256, [
      [0, "#5a2a7a"],
      [0.25, "#3b1d6e"],
      [1, "#140a30"],
    ]),
  );

  // Soleil rayé façon synthwave
  canvas(scene, "fx-sun", 256, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#FFD166");
    g.addColorStop(0.55, "#FF9F45");
    g.addColorStop(1, "#FF3D8B");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(128, 128, 126, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) ctx.clearRect(0, 150 + i * 18, 256, 3 + i * 2);
  });

  // Faisceau des phares
  canvas(scene, "fx-beam", 260, 110, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 260, 0);
    g.addColorStop(0, "rgba(255, 209, 102, 0.95)");
    g.addColorStop(1, "rgba(255, 209, 102, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(260, 0);
    ctx.lineTo(260, 110);
    ctx.lineTo(0, 62);
    ctx.closePath();
    ctx.fill();
  });

  // Bouffée de fumée
  canvas(scene, "fx-smoke", 32, 32, (ctx) => {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255, 228, 244, 0.85)");
    g.addColorStop(1, "rgba(255, 228, 244, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  });
}
