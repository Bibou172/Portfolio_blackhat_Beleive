import Link from "next/link";
import { hashString } from "@/lib/format";
import styles from "./sections.module.css";

interface Props {
  villes: { nom: string; count: number }[];
  active?: string;
}

/** Mini-carte radar : un repère par ville (position stable), cliquable pour filtrer (R8). */
export default function CityRadar({ villes, active }: Props) {
  return (
    <div className={styles.radar}>
      <div className={styles.sweep} aria-hidden="true" />
      {villes.map((v) => {
        const h = hashString(v.nom);
        const angle = ((h % 360) * Math.PI) / 180;
        const radius = 18 + ((h >>> 9) % 22); // en % du rayon
        const left = 50 + radius * Math.cos(angle);
        const top = 50 + radius * Math.sin(angle);
        const isActive = v.nom === active;
        return (
          <Link
            key={v.nom}
            href={isActive ? "/parcours" : `/parcours?lieu=${encodeURIComponent(v.nom)}`}
            className={`${styles.blip} ${isActive ? styles.blipActive : ""}`}
            style={{ left: `${left}%`, top: `${top}%` }}
            aria-label={`${v.nom} : ${v.count} étape(s)${isActive ? " (filtre actif, cliquer pour retirer)" : ""}`}
            aria-current={isActive ? "true" : undefined}
            scroll={false}
          >
            <span className={styles.blipDot} />
            <span className={styles.blipLabel}>{v.nom}</span>
          </Link>
        );
      })}
    </div>
  );
}
