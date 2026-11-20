"use client";

import { Suspense, useEffect } from "react";
import { getProfil } from "@/lib/api/client";
import { useStore } from "@/lib/store/createStore";
import { reportOffline, setClassic, ui } from "@/lib/store/uiStore";
import Minimap from "./Minimap";
import styles from "./hud.module.css";

/** HUD permanent : Mode classique, badge hors-ligne, identité du candidat, mini-carte. */
export default function Hud() {
  const classic = useStore(ui, (s) => s.classic);
  const offline = useStore(ui, (s) => s.offline);
  const profil = useStore(ui, (s) => s.profil);

  // Profil chargé une fois côté navigateur (nom + compétence phare du HUD).
  useEffect(() => {
    if (ui.get().profil) return;
    let cancelled = false;
    getProfil().then((r) => {
      if (cancelled) return;
      ui.set({ profil: r.data });
      reportOffline(r.offline);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const name = profil ? `${profil.prenom} ${profil.nom}` : "Papa Daouda Ndiaye";
  const phare = profil?.competences.reduce<(typeof profil.competences)[number] | null>(
    (best, c) => (!best || (c.niveau ?? 0) > (best.niveau ?? 0) ? c : best),
    null,
  );
  const niveau = Math.max(0, Math.min(5, Math.round(phare?.niveau ?? 4)));

  return (
    <>
      <header className={styles.top}>
        <div className={styles.left}>
          <button
            type="button"
            className={`btn ${styles.classicBtn}`}
            aria-pressed={classic}
            onClick={() => setClassic(!classic)}
          >
            {classic ? "Mode jeu" : "Mode classique"}
          </button>
          {offline && (
            <span className={styles.offline} role="status" title="API injoignable : données de démonstration">
              MODE HORS-LIGNE
            </span>
          )}
        </div>
        <div className={styles.player}>
          <span className={styles.name}>{name}</span>
          <span className="mono">
            <span className={`${styles.skillLabel} muted`}>{phare ? `${phare.nom} ` : ""}</span>
            <span className={styles.stars} role="img" aria-label={`Compétence phare : niveau ${niveau} sur 5`}>
              {"★".repeat(niveau)}
              {"☆".repeat(5 - niveau)}
            </span>
          </span>
          <span className={styles.dispo}>DISPO · CDI</span>
        </div>
      </header>
      <Suspense fallback={null}>
        <Minimap />
      </Suspense>
    </>
  );
}
