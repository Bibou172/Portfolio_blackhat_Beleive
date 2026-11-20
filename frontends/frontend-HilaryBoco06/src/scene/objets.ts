import { Anchor, Compass, Mail, Map as IconeCarte, Sailboat, Wind } from "lucide-react";

/**
 * Les objets cliquables de l'île : chacun ouvre le panneau d'une section du portfolio.
 * azimut / elevation (degrés) : direction d'où la caméra cadre l'objet (0 = de face, > 0 = depuis la droite).
 */
export const OBJETS = [
  { id: "phare", section: "parcours", label: "Le phare", titre: "Parcours", sousTitre: "Formations et expériences", icone: Compass, azimut: -25, elevation: 20 },
  { id: "voilier", section: "projets", label: "Le voilier", titre: "Projets", sousTitre: "Les destinations explorées", icone: Sailboat, azimut: 30, elevation: 10 },
  { id: "malle", section: "competences", label: "La malle d'exploratrice", titre: "Compétences", sousTitre: "Mon équipement de voyage", icone: Anchor, azimut: -20, elevation: 25 },
  { id: "carte", section: "a-propos", label: "La carte", titre: "À propos", sousTitre: "Le point de départ", icone: IconeCarte, azimut: -17, elevation: 20 },
  { id: "montgolfiere", section: "graphe", label: "La montgolfière", titre: "Graphe", sousTitre: "La carte des connexions", icone: Wind, azimut: 0, elevation: 2 },
  { id: "bouteille", section: "contact", label: "La bouteille à la mer", titre: "Contact", sousTitre: "Écrivez-moi", icone: Mail, azimut: -20, elevation: 15 },
] as const;

export type IdObjet = (typeof OBJETS)[number]["id"];
export type Objet = (typeof OBJETS)[number];

export function objet(id: IdObjet): Objet {
  return OBJETS.find((o) => o.id === id)!;
}
