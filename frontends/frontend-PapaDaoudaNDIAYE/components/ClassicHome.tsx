import Link from "next/link";
import type { CSSProperties } from "react";
import { SECTIONS } from "@/lib/sections";
import styles from "./game.module.css";

/** Accueil du « Mode classique » : navigation HTML simple vers toutes les sections, sans jeu. */
export default function ClassicHome() {
  return (
    <div className={styles.classic}>
      <div className="sunset-bg" aria-hidden="true" />
      <p className="mono muted">Mode classique</p>
      <h1 className="title" style={{ fontSize: "clamp(2.2rem, 7vw, 4rem)" }}>
        Papa Daouda Ndiaye
      </h1>
      <p className="neon" style={{ fontSize: "1.8rem", margin: "0.2rem 0 0" }}>
        Élève-ingénieur Big Data
      </p>
      <nav aria-label="Sections du portfolio">
        <ul className={styles.classicGrid}>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className={`panel ${styles.classicCard}`}
                style={{ "--accent": s.color } as CSSProperties}
              >
                <span className="title" style={{ fontSize: "1.6rem", color: s.color }}>
                  {s.label}
                </span>
                <span>{s.description}</span>
                <span className="mono muted">Voiture : {s.carName}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
