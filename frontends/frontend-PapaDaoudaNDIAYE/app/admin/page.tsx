import type { Metadata } from "next";
import Link from "next/link";
import AdminForms from "@/components/AdminForms";
import styles from "@/components/admin.module.css";

export const metadata: Metadata = {
  title: "Admin",
  description: "Ajouter une expérience, un projet ou une formation.",
  robots: { index: false, follow: false },
};

/** Page sans voiture, accessible uniquement par l'URL /admin. */
export default function AdminPage() {
  return (
    <div className={styles.page}>
      <div className="sunset-bg" aria-hidden="true" />
      <p className="mono" style={{ color: "var(--pink)" }}>
        Garage · zone réservée au candidat
      </p>
      <h1 className="title" style={{ fontSize: "clamp(2.4rem, 8vw, 4.4rem)" }}>
        Admin
      </h1>
      <p className="neon" style={{ fontSize: "1.8rem", margin: "0.2rem 0 0" }}>
        Ajouter au portfolio
      </p>
      <p className={`panel ${styles.warning}`}>
        Les routes d&apos;écriture (<code>POST /api/experiences</code>, <code>/api/projets</code>,{" "}
        <code>/api/formations</code>) ne sont pas encore dans le backend : le formulaire valide les champs et prépare
        l&apos;envoi, mais l&apos;API refusera l&apos;enregistrement tant qu&apos;elles n&apos;existent pas.
      </p>
      <AdminForms />
      <p style={{ marginTop: "2rem" }}>
        <Link href="/" className="btn">
          ← Retour à la rue
        </Link>
      </p>
    </div>
  );
}
