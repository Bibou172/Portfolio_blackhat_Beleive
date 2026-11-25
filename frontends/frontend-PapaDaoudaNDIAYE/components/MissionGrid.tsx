"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Projet } from "@/lib/api/types";
import { pad2 } from "@/lib/format";
import styles from "./sections.module.css";

const GRADIENTS: [string, string][] = [
  ["#FF3D8B", "#FF9F45"],
  ["#2EE6D6", "#B26BFF"],
  ["#FF9F45", "#FFD166"],
  ["#B26BFF", "#FF3D8B"],
  ["#FFD166", "#2EE6D6"],
];

interface Props {
  projets: Projet[];
  skillNames: Record<string, string>;
}

/** Cartes « MISSION 01, 02… » inclinées avec dégradé, apparition en cascade. */
export default function MissionGrid({ projets, skillNames }: Props) {
  return (
    <motion.ul
      className={styles.missionGrid}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      {projets.map((p, i) => {
        const [g1, g2] = GRADIENTS[i % GRADIENTS.length];
        return (
          <motion.li
            key={p.projet_slug}
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Link
              href={`/projets/${p.projet_slug}`}
              className={styles.mission}
              style={{ "--g1": g1, "--g2": g2, "--tilt": i % 2 ? "1.4deg" : "-1.4deg" } as CSSProperties}
            >
              <p className={`mono ${styles.missionNum}`}>Mission {pad2(i + 1)}</p>
              <h2 className={`title ${styles.missionTitle}`}>{p.titre}</h2>
              {p.description && <p className={styles.missionDesc}>{p.description}</p>}
              <ul className="chips" aria-label="Compétences">
                {p.competences.map((c) => (
                  <li key={c} className="chip">
                    {skillNames[c] ?? c}
                  </li>
                ))}
              </ul>
              <span className={`mono ${styles.missionFoot}`}>
                <span>{p.annee ?? ""}</span>
                <span>Briefing →</span>
              </span>
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
