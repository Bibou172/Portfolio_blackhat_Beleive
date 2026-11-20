import styles from "./sections.module.css";

/** Jauge ★★★★☆ (niveau 1 à 5), lisible par les lecteurs d'écran. */
export default function Stars({ value, max = 5 }: { value?: number | null; max?: number }) {
  const v = Math.max(0, Math.min(max, Math.round(value ?? 0)));
  return (
    <span className={styles.stars} role="img" aria-label={`Niveau ${v} sur ${max}`}>
      {"★".repeat(v)}
      {"☆".repeat(max - v)}
    </span>
  );
}
