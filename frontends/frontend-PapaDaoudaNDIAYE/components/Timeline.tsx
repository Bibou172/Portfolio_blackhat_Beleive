import type { CSSProperties } from "react";
import { formatPeriode } from "@/lib/format";
import styles from "./sections.module.css";

export interface TimelineItem {
  kind: "experience" | "formation";
  titre: string;
  organisation: string;
  lieu?: string | null;
  debut: string;
  fin?: string | null;
  description?: string | null;
  competences?: string[];
}

const KIND = {
  experience: { label: "Expérience", color: "var(--pink)" },
  formation: { label: "Formation", color: "var(--teal)" },
};

/** Frise verticale avec losanges lumineux (R1). */
export default function Timeline({ items, skillNames }: { items: TimelineItem[]; skillNames: Map<string, string> }) {
  if (items.length === 0) {
    return <p className={`panel ${styles.empty}`}>Aucune étape dans cette ville.</p>;
  }
  return (
    <ol className={styles.timeline}>
      {items.map((it, i) => (
        <li
          key={`${it.kind}-${it.organisation}-${it.debut}-${i}`}
          className={styles.timelineItem}
          style={{ "--kind": KIND[it.kind].color } as CSSProperties}
        >
          <span className={styles.diamond} aria-hidden="true" />
          <article className={`panel ${styles.timelineCard}`}>
            <p className="mono" style={{ color: KIND[it.kind].color }}>
              {KIND[it.kind].label} · {formatPeriode(it.debut, it.fin)}
            </p>
            <h3>{it.titre}</h3>
            <p className="muted">
              {it.organisation}
              {it.lieu ? ` · ${it.lieu}` : ""}
            </p>
            {it.description && <p>{it.description}</p>}
            {it.competences && it.competences.length > 0 && (
              <ul className="chips" aria-label="Compétences">
                {it.competences.map((c) => (
                  <li key={c} className="chip">
                    {skillNames.get(c) ?? c}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </li>
      ))}
    </ol>
  );
}
