import Link from "next/link";
import styles from "@/components/sections.module.css";
import { SECTIONS } from "@/lib/sections";

export const metadata = { title: "Zone inconnue" };

/** 404 thématique. */
export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className="sunset-bg" aria-hidden="true" />
      <div className="panel" style={{ padding: "1.6rem", display: "grid", gap: "1rem" }}>
        <p className="mono" style={{ color: "var(--pink)" }}>
          Erreur 404 · hors de la carte
        </p>
        <h1 className="title" style={{ fontSize: "clamp(2.4rem, 9vw, 4.6rem)" }}>
          Zone inconnue
        </h1>
        <p className="neon" style={{ fontSize: "1.8rem", margin: 0 }}>
          retour à la rue
        </p>
        <p>Cette route n&apos;existe pas (ou plus). Les voitures t&apos;attendent sur la côte.</p>
        <p>
          <Link href="/" className="btn btn--solid">
            ← Retour à la rue
          </Link>
        </p>
        <nav aria-label="Sections">
          <ul className="chips">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link href={s.href} className="chip">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
