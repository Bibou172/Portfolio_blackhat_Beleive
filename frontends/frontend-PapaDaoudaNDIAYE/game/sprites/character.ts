import type Phaser from "phaser";
import { createAtlas, drawPixels } from "./pixel";

/**
 * Avatar ORIGINAL du candidat, vu de profil (regarde vers la droite).
 * Grille 16 x 24, agrandie x3 -> frame de 48 x 72 px.
 */
export const PLAYER_KEY = "player";
export const PLAYER_SCALE = 3;
export const PLAYER_W = 16 * PLAYER_SCALE;
export const PLAYER_H = 24 * PLAYER_SCALE;

const PALETTE: Record<string, string> = {
  h: "#120a12", // cheveux
  s: "#7a4a2a", // peau
  S: "#5a341c", // peau ombrée
  g: "#2EE6D6", // lunettes
  w: "#FFF4E8", // reflet / baskets
  t: "#FF3D8B", // chemise
  T: "#c42a6a", // chemise ombrée
  k: "#FFD166", // ceinture
  p: "#2b2250", // pantalon
  P: "#1d1638", // jambe arrière
};

const UPPER = [
  "................",
  ".....hhhhhh.....",
  "....hhhhhhhh....",
  "....hhhsssss....",
  "....hhssgggg....",
  "....hsssssss....",
  ".....sssssSs....",
  ".....ssssss.....",
  "......SSSS......",
  "....tttttttt....",
  "...tttttttttt...",
  "...ttTtttttttt..",
  "...ttTttttttt...",
  "...sTTtttttts...",
  "...s.tttttttts..",
  ".....kkkkkkk....",
];

// Reflet sur les lunettes (2e frame d'attente).
const UPPER_GLINT = UPPER.map((r, i) => (i === 4 ? "....hhssgwgg...." : r));

const LEGS: Record<string, string[]> = {
  stand: [
    "......pppppp....",
    "......ppPppp....",
    "......pp..pp....",
    "......pp..pp....",
    "......pp..pp....",
    "......pp..pp....",
    ".....www..www...",
    ".....www..www...",
  ],
  walk1: [
    "......pppppp....",
    ".....ppp..ppp...",
    "....pp.....pp...",
    "....pp......pp..",
    "...pp.......pp..",
    "...pp........pp.",
    "..www........www",
    "..www........www",
  ],
  walk2: [
    "......pppppp....",
    "......pppppp....",
    ".......pppp.....",
    ".......pp.pp....",
    ".......pp.pp....",
    ".......pp.www...",
    "......www.......",
    "......www.......",
  ],
  walk3: [
    "......pppppp....",
    ".....PPp..ppp...",
    "....PP.....pp...",
    "....PP......pp..",
    "...PP.......pp..",
    "...PP........pp.",
    "..www........www",
    "..www........www",
  ],
  walk4: [
    "......pppppp....",
    "......pppppp....",
    ".......pppp.....",
    "......pp..PP....",
    "......pp..PP....",
    "......pp.www....",
    ".....www........",
    ".....www........",
  ],
  jump: [
    "......pppppp....",
    "......pppppp....",
    ".....pp...ppp...",
    "....pp.....pp...",
    "....www...www...",
    "................",
    "................",
    "................",
  ],
};

const FRAMES: Record<string, string[]> = {
  "idle-0": [...UPPER, ...LEGS.stand],
  "idle-1": [...UPPER_GLINT, ...LEGS.stand],
  "walk-0": [...UPPER, ...LEGS.walk1],
  "walk-1": [...UPPER, ...LEGS.walk2],
  "walk-2": [...UPPER, ...LEGS.walk3],
  "walk-3": [...UPPER, ...LEGS.walk4],
  jump: [...UPPER, ...LEGS.jump],
};

export function createPlayerTextures(scene: Phaser.Scene) {
  createAtlas(scene, PLAYER_KEY, PLAYER_W, PLAYER_H, Object.keys(FRAMES), (ctx, frame, ox) =>
    drawPixels(ctx, FRAMES[frame], PALETTE, ox, 0, PLAYER_SCALE),
  );

  const anims = scene.anims;
  if (!anims.exists("player-walk")) {
    anims.create({
      key: "player-walk",
      frames: ["walk-0", "walk-1", "walk-2", "walk-3"].map((f) => ({ key: PLAYER_KEY, frame: f })),
      frameRate: 10,
      repeat: -1,
    });
  }
  if (!anims.exists("player-idle")) {
    anims.create({
      key: "player-idle",
      frames: [
        { key: PLAYER_KEY, frame: "idle-0", duration: 1800 },
        { key: PLAYER_KEY, frame: "idle-1", duration: 160 },
      ],
      repeat: -1,
    });
  }
  if (!anims.exists("player-jump")) {
    anims.create({ key: "player-jump", frames: [{ key: PLAYER_KEY, frame: "jump" }], frameRate: 1 });
  }
}
