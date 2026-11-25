import styles from "@/components/sections.module.css";

/** Affiché pendant le chargement d'une route. */
export default function Loading() {
  return (
    <div className={styles.page}>
      <div className="sunset-bg" aria-hidden="true" />
      <div role="status" aria-live="polite" style={{ display: "grid", gap: "1rem" }}>
        <p className="mono muted">Chargement de la zone…</p>
        <p className="title" style={{ fontSize: "clamp(2.2rem, 8vw, 4rem)" }}>
          En route
        </p>
        <div className={styles.skeletonBar} />
        <div className={styles.skeletonBar} />
      </div>
    </div>
  );
}
