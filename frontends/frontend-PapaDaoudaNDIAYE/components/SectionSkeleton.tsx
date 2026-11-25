import styles from "./sections.module.css";

/** Affiché pendant que les données de la section arrivent de l'API. */
export default function SectionSkeleton({ label = "Chargement des données…" }: { label?: string }) {
  return (
    <div className={styles.skeleton} role="status" aria-live="polite">
      <span className="mono muted">{label}</span>
      <div className={styles.skeletonBar} />
      <div className={styles.skeletonBar} />
    </div>
  );
}
