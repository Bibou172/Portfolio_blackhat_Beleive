/**
 * Jetons de design (direction artistique « côte au coucher du soleil »).
 * Les mêmes valeurs existent en variables CSS dans app/globals.css (:root).
 * Pour changer une couleur partout : modifie-la ici ET dans globals.css.
 */
export const colors = {
  night: "#0E0820", // fond principal
  panel: "#160C2E", // panneaux / cartes
  pink: "#FF3D8B", // rose néon
  orange: "#FF9F45",
  yellow: "#FFD166",
  teal: "#2EE6D6", // turquoise
  violet: "#B26BFF",
  text: "#FFF4E8",
  muted: "#C9B8E8", // texte secondaire
} as const;

export type ColorName = keyof typeof colors;

/** "#FF3D8B" -> 0xff3d8b (format attendu par Phaser). */
export function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

/** Variables CSS posées par next/font dans app/layout.tsx. */
export const fontVars = {
  title: "--font-anton",
  neon: "--font-yellowtail",
  body: "--font-inter",
  mono: "--font-jetbrains",
} as const;
