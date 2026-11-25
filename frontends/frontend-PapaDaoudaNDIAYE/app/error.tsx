"use client"; // Les error boundaries sont des composants client.

import Link from "next/link";
import { useEffect } from "react";
import styles from "@/components/sections.module.css";

/** Erreur inattendue dans une page (Next.js 16 : props { error, retry }). */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.page}>
      <div className="sunset-bg" aria-hidden="true" />
      <div role="alert" className="panel" style={{ padding: "1.6rem", display: "grid", gap: "1rem" }}>
        <p className="mono" style={{ color: "var(--orange)" }}>
          Panne moteur
        </p>
        <h1 className="title" style={{ fontSize: "clamp(2.2rem, 8vw, 4rem)" }}>
          Mission échouée
        </h1>
        <p>Une erreur inattendue est survenue pendant l&apos;affichage de cette zone.</p>
        <div className="chips">
          <button type="button" className="btn btn--solid" onClick={() => retry()}>
            Réessayer
          </button>
          <Link href="/" className="btn">
            Retour à la rue
          </Link>
        </div>
      </div>
    </div>
  );
}
