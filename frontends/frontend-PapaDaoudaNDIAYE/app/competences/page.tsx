import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ApiStatusReporter from "@/components/ApiStatusReporter";
import SectionShell from "@/components/SectionShell";
import SectionSkeleton from "@/components/SectionSkeleton";
import Stars from "@/components/Stars";
import styles from "@/components/sections.module.css";
import { DOMAINES, domaineNom, getCompetencesDomaine, getProfil, getStatsCompetences, getTopCompetences } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Compétences",
  description: "Statistiques par compétence, top 5 et compétences par domaine.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const SEGMENTS = 10;

export default function CompetencesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <SectionShell id="competences" kicker="Fiche de stats">
      <Suspense fallback={<SectionSkeleton />}>
        <CompetencesContent searchParams={searchParams} />
      </Suspense>
    </SectionShell>
  );
}

async function CompetencesContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  // R3 (stats), R6 (top 5), R1 (niveaux et domaines du profil)
  const [stats, top, profil] = await Promise.all([getStatsCompetences(), getTopCompetences(5), getProfil()]);

  const bySlug = new Map(profil.data.competences.map((c) => [c.skill_slug, c]));
  const nom = (s: { skill_slug: string; nom?: string | null }) => s.nom || bySlug.get(s.skill_slug)?.nom || s.skill_slug;
  const domainOrder = Object.keys(DOMAINES);
  const rank = (d: string) => (domainOrder.includes(d) ? domainOrder.indexOf(d) : domainOrder.length);
  const domaines = [...new Set(profil.data.competences.map((c) => c.domaine).filter((d): d is string => Boolean(d)))].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  );
  const requested = typeof sp.domaine === "string" ? sp.domaine : undefined;
  const actif = requested && domaines.includes(requested) ? requested : domaines[0];
  // R7 : compétences du domaine actif (Neo4j)
  const domaine = actif ? await getCompetencesDomaine(actif) : null;

  const max = Math.max(1, ...stats.data.map((s) => s.nb_projets));

  return (
    <>
      <ApiStatusReporter offline={stats.offline || top.offline || profil.offline || Boolean(domaine?.offline)} />
      <div className={styles.skillsGrid}>
        <section className={`panel ${styles.box}`} aria-labelledby="stats-title">
          <h2 id="stats-title" className={`title ${styles.sectionTitle}`}>
            Utilisation dans les projets
          </h2>
          <ul className={styles.statList}>
            {stats.data.map((s) => {
              const on = Math.max(1, Math.round((s.nb_projets / max) * SEGMENTS));
              return (
                <li key={s.skill_slug} className={styles.statRow}>
                  <div className={styles.statHead}>
                    <span className={styles.statName}>{nom(s)}</span>
                    <span className="mono muted">
                      {s.nb_projets} projet{s.nb_projets > 1 ? "s" : ""}
                      {s.derniere_annee ? ` · ${s.derniere_annee}` : ""}
                    </span>
                  </div>
                  <div
                    className={styles.segments}
                    role="meter"
                    aria-label={`${nom(s)} : ${s.nb_projets} projet(s)`}
                    aria-valuemin={0}
                    aria-valuemax={max}
                    aria-valuenow={s.nb_projets}
                  >
                    {Array.from({ length: SEGMENTS }, (_, i) => (
                      <span key={i} className={`${styles.segment} ${i < on ? styles.segmentOn : ""}`} />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="top-title">
          <h2 id="top-title" className={`title ${styles.sectionTitle}`}>
            Top 5
          </h2>
          <ol className={styles.top}>
            {top.data.map((s, i) => (
              <li key={s.skill_slug} className={`panel ${styles.topItem}`}>
                <span className={`title ${styles.rank}`} aria-hidden="true">
                  {i + 1}
                </span>
                <span>
                  <strong>{nom(s)}</strong>
                  <br />
                  <span className="mono muted">
                    {s.nb_projets} projet{s.nb_projets > 1 ? "s" : ""}
                  </span>
                </span>
                <Stars value={s.niveau ?? bySlug.get(s.skill_slug)?.niveau} />
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className={`panel ${styles.domainPanel}`} aria-labelledby="domaines-title">
        <h2 id="domaines-title" className={`title ${styles.sectionTitle}`}>
          Par domaine
        </h2>
        <nav aria-label="Domaines">
          <ul className="chips">
            {domaines.map((d) => (
              <li key={d}>
                <Link
                  href={`/competences?domaine=${encodeURIComponent(d)}`}
                  className="chip"
                  aria-current={d === actif ? "true" : undefined}
                  scroll={false}
                >
                  {domaineNom(d)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {domaine && (
          <ul className={styles.domainList} aria-label={`Compétences du domaine ${domaine.data.domaine_nom}`}>
            {domaine.data.items.map((c) => (
              <li key={c.skill_slug} className={styles.domainItem}>
                <span>{c.nom}</span>
                <Stars value={bySlug.get(c.skill_slug)?.niveau} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
