import Phaser from "phaser";
import { type SceneData, type SceneOptions, StreetScene } from "./StreetScene";

/**
 * Crée le jeu Phaser dans `parent`. Ce module n'est importé QUE côté navigateur
 * (import dynamique depuis components/GameStage.tsx) : Phaser accède à window/document.
 */
export async function createGame(
  parent: HTMLElement,
  opts: Omit<SceneOptions, "fonts">,
  data: SceneData,
): Promise<Phaser.Game> {
  const css = getComputedStyle(document.documentElement);
  const title = css.getPropertyValue("--font-anton").trim() || "Impact, sans-serif";
  const mono = css.getPropertyValue("--font-jetbrains").trim() || "monospace";
  try {
    // Les textes Phaser sont dessinés dans un canvas : la police doit être chargée avant.
    await Promise.all([document.fonts.load(`26px ${title}`), document.fonts.load(`12px ${mono}`)]);
  } catch {
    /* police de secours */
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#0E0820",
    pixelArt: true,
    banner: false,
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth || 800,
      height: parent.clientHeight || 600,
    },
    scene: [],
  });
  game.scene.add("street", new StreetScene({ ...opts, fonts: { title, mono } }), true, data);
  return game;
}

/**
 * Détruit le jeu proprement au changement de page. Phaser détruit à l'image suivante :
 * entre-temps React a déjà retiré le conteneur, et Phaser tenterait de redimensionner
 * le rendu WebGL à 0 x 0 (« Framebuffer incomplete »). On coupe donc la mesure du parent.
 */
export function destroyGame(game: Phaser.Game) {
  game.scale.stopListeners();
  game.scale.parent = null;
  game.destroy(true);
}
