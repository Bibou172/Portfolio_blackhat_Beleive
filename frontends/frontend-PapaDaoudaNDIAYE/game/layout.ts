/**
 * Géométrie du monde (en pixels « monde »), sans dépendance à Phaser :
 * utilisée par la scène ET par la mini-carte du HUD.
 */
import { SECTIONS } from "@/lib/sections";

export const CAR_START_X = 700;
export const CAR_GAP = 560;
export const PLAYER_START_X = 260;
/** Distance à laquelle la bulle « Appuie sur E » apparaît. */
export const NEAR_DISTANCE = 120;

export const WORLD_WIDTH = CAR_START_X + (SECTIONS.length - 1) * CAR_GAP + 620;

export const carX = (index: number) => CAR_START_X + index * CAR_GAP;
