"use client";

import { motion } from "framer-motion";
import { type CSSProperties, type ReactNode, useCallback, useEffect } from "react";
import { getSection, type SectionId } from "@/lib/sections";
import { useStore } from "@/lib/store/createStore";
import { startWipe, ui } from "@/lib/store/uiStore";
import styles from "./sections.module.css";

interface Props {
  id: SectionId;
  kicker: string;
  children: ReactNode;
}

/** Cadre commun des sections : titre néon, bouton « Sortir du véhicule » et touche Échap. */
export default function SectionShell({ id, kicker, children }: Props) {
  const section = getSection(id);
  const classic = useStore(ui, (s) => s.classic);

  const exit = useCallback(() => {
    // En mode jeu, la voiture de cette section revient se garer dans la rue.
    if (!ui.get().classic) ui.set({ returnFrom: id });
    startWipe("/", "Retour à la rue");
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit]);

  return (
    <div className={styles.page} style={{ "--accent": section.color } as CSSProperties}>
      <div className="sunset-bg" aria-hidden="true" />
      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <p className={`mono ${styles.headerMeta}`}>
          Véhicule : {section.carName} · {section.routes.map((r) => r.split(" ")[0]).join(" · ")}
        </p>
        <h1 className={`title ${styles.headerTitle}`}>{section.label}</h1>
        <p className={`neon ${styles.headerNeon}`}>{kicker}</p>
        <div className={styles.headerActions}>
          <button type="button" className="btn" onClick={exit}>
            ← {classic ? "Retour à l'accueil" : "Sortir du véhicule"} <span className={styles.kbd}>Échap</span>
          </button>
        </div>
      </motion.header>
      {children}
    </div>
  );
}
