"use client";

import styles from "./game.module.css";

const SEGMENTS = 20;

interface Props {
  /** 0 à 1 */
  progress: number;
  tip: string;
}

/** Écran de chargement du démarrage : illustration, titre néon, barre segmentée, astuce. */
export default function LoadingScreen({ progress, tip }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const on = Math.round((pct / 100) * SEGMENTS);
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <div className={styles.loadingInner}>
        <p className="mono muted">Côte néon · portfolio jouable</p>
        <h1 className={`title ${styles.loadingTitle}`}>Papa Daouda Ndiaye</h1>
        <p className={`neon ${styles.loadingNeon}`}>Sunset Drive</p>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="Chargement de la rue"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span key={i} className={`${styles.seg} ${i < on ? styles.segOn : ""}`} />
          ))}
        </div>
        <p className="mono">Chargement {pct} %</p>
        <p className={styles.tip}>{tip}</p>
      </div>
    </div>
  );
}
