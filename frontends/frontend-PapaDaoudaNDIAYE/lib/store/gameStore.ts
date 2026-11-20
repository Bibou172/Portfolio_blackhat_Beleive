import { PLAYER_START_X } from "@/game/layout";
import type { SectionId } from "@/lib/sections";
import { createStore } from "./createStore";

interface GameState {
  /** Progression du chargement (0 à 1). */
  progress: number;
  ready: boolean;
  /** Voiture devant laquelle se trouve le joueur. */
  nearCar: SectionId | null;
  playerX: number;
  /** Animation en cours (entrée / sortie de voiture) : contrôles bloqués. */
  busy: boolean;
}

export const gameStore = createStore<GameState>({
  progress: 0,
  ready: false,
  nearCar: null,
  playerX: PLAYER_START_X,
  busy: false,
});

/** Entrées tactiles (joystick React) lues à chaque frame par la scène Phaser. */
export const touchInput = { left: false, right: false, jump: false };

type Command = "enter";
const commandListeners = new Set<(c: Command) => void>();

/** Commande envoyée par l'interface React (bouton « Entrer ») à la scène. */
export function sendCommand(c: Command) {
  commandListeners.forEach((l) => l(c));
}

export function onCommand(listener: (c: Command) => void) {
  commandListeners.add(listener);
  return () => {
    commandListeners.delete(listener);
  };
}
