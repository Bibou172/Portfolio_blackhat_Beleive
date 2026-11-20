import type { Metadata } from "next";
import { Suspense } from "react";
import ApiStatusReporter from "@/components/ApiStatusReporter";
import SectionShell from "@/components/SectionShell";
import SectionSkeleton from "@/components/SectionSkeleton";
import Stars from "@/components/Stars";
import styles from "@/components/sections.module.css";
import { getProfil } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Contact",
  description: "Profil, bio et liens : GitHub, LinkedIn, e-mail.",
};

export default function ContactPage() {
  return (
    <SectionShell id="contact" kicker="On roule ensemble ?">
      <Suspense fallback={<SectionSkeleton />}>
        <ContactContent />
      </Suspense>
    </SectionShell>
  );
}

async function ContactContent() {
  // R1 : profil
  const profil = await getProfil();
  const p = profil.data;
  const initiales = `${p.prenom[0] ?? ""}${p.nom[0] ?? ""}`.toUpperCase();
  const phares = [...p.competences].sort((a, b) => (b.niveau ?? 0) - (a.niveau ?? 0)).slice(0, 3);

  return (
    <>
      <ApiStatusReporter offline={profil.offline} />
      <article className={`panel ${styles.contactCard}`}>
        <div className={styles.avatar} aria-hidden="true">
          {initiales}
        </div>
        <div>
          <p className={`mono ${styles.dispo}`}>Dispo · stage / alternance</p>
          <h2 className="title" style={{ fontSize: "clamp(2rem, 6vw, 3rem)", margin: "0.4rem 0" }}>
            {p.prenom} {p.nom}
          </h2>
          {p.titre && <p className="mono" style={{ color: "var(--yellow)" }}>{p.titre}</p>}
          {p.bio && <p style={{ maxWidth: "60ch" }}>{p.bio}</p>}

          <ul className={styles.links}>
            {p.email && (
              <li>
                <a className="btn btn--solid" href={`mailto:${p.email}`}>
                  E-mail · {p.email}
                </a>
              </li>
            )}
            {p.liens?.github && (
              <li>
                <a className="btn" href={p.liens.github} target="_blank" rel="noopener noreferrer">
                  GitHub ↗
                </a>
              </li>
            )}
            {p.liens?.linkedin && (
              <li>
                <a className="btn" href={p.liens.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn ↗
                </a>
              </li>
            )}
            {p.liens?.site && (
              <li>
                <a className="btn" href={p.liens.site} target="_blank" rel="noopener noreferrer">
                  Site ↗
                </a>
              </li>
            )}
          </ul>

          {phares.length > 0 && (
            <>
              <h3 className="mono" style={{ margin: "1.6rem 0 0.6rem" }}>
                Compétences phares
              </h3>
              <ul className="chips">
                {phares.map((c) => (
                  <li key={c.skill_slug} className="chip" style={{ gap: "0.5rem" }}>
                    {c.nom} <Stars value={c.niveau} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </article>
    </>
  );
}
