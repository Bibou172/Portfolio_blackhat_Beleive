import type { Profil } from "@/lib/api/types";
import type { SectionId } from "@/lib/sections";
import { createStore } from "./createStore";

export type TransitionPhase = "idle" | "cover" | "covered" | "reveal";

interface UiState {
  /** null = pas encore vérifié ; true = données de démo (API éteinte). */
  offline: boolean | null;
  /** Mode classique : navigation HTML sans le jeu. */
  classic: boolean;
  profil: Profil | null;
  transition: { phase: TransitionPhase; href: string; label: string };
  /** Section quittée avec « Sortir du véhicule » : sa voiture revient se garer. */
  returnFrom: SectionId | null;
  /** L'écran de chargement du démarrage a déjà été vu (session en cours). */
  introSeen: boolean;
}

const CLASSIC_KEY = "portfolio:mode-classique";

export const ui = createStore<UiState>({
  offline: null,
  classic: false,
  profil: null,
  transition: { phase: "idle", href: "/", label: "" },
  returnFrom: null,
  introSeen: false,
});

// Côté navigateur : on relit la préférence « Mode classique ».
if (typeof window !== "undefined") {
  try {
    if (window.localStorage.getItem(CLASSIC_KEY) === "1") ui.set({ classic: true });
  } catch {
    /* stockage indisponible (navigation privée) */
  }
}

export function setClassic(value: boolean) {
  ui.set({ classic: value });
  try {
    window.localStorage.setItem(CLASSIC_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Lance la transition plein écran puis la navigation (gérée par <TransitionOverlay />). */
export function startWipe(href: string, label: string) {
  if (ui.get().transition.phase !== "idle") return;
  ui.set({ transition: { phase: "cover", href, label } });
}

export function reportOffline(offline: boolean) {
  if (ui.get().offline !== offline) ui.set({ offline });
}
