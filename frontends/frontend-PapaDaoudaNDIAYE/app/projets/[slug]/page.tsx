import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ApiStatusReporter from "@/components/ApiStatusReporter";
import SectionShell from "@/components/SectionShell";
import SectionSkeleton from "@/components/SectionSkeleton";
import styles from "@/components/sections.module.css";
import { getProfil, getProjet, getProjetsSimilaires } from "@/lib/api/client";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const titre = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: `Mission ${titre}`, description: `Briefing de la mission ${titre} et missions similaires.` };
}

export default function ProjetPage({ params }: { params: Params }) {
  return (
    <SectionShell id="projets" kicker="Briefing de mission">
      <Suspense fallback={<SectionSkeleton label="Réception du briefing…" />}>
        <Briefing params={params} />
      </Suspense>
    </SectionShell>
  );
}

async function Briefing({ params }: { params: Params }) {
  const { slug } = await params;
  // Détail du projet + R4 (missions similaires, Neo4j)
  const [projet, similaires, profil] = await Promise.all([getProjet(slug), getProjetsSimilaires(slug, 4), getProfil()]);
  const p = projet.data;
  if (!p) notFound();
  const skillNames = new Map(profil.data.competences.map((c) => [c.skill_slug, c.nom]));

  return (
    <>
      <ApiStatusReporter offline={projet.offline || similaires.offline || profil.offline} />
      <p>
        <Link href="/projets" className="btn">
          ← Toutes les missions
        </Link>
      </p>
      <div className={styles.briefing} style={{ marginTop: "1.2rem" }}>
        <article className={`panel ${styles.briefingMain}`}>
          <p className="mono" style={{ color: "var(--pink)" }}>
            Briefing · {p.annee ?? "année inconnue"}
          </p>
          <h2 className="title" style={{ fontSize: "clamp(2rem, 6vw, 3rem)" }}>
            {p.titre}
          </h2>
          {p.description && <p style={{ fontSize: "1.1rem" }}>{p.description}</p>}
          {p.description_longue && <p className="muted">{p.description_longue}</p>}
          <div>
            <h3 className="mono" style={{ margin: "0 0 0.6rem" }}>
              Équipement (compétences)
            </h3>
            <ul className="chips">
              {p.competences.map((c) => (
                <li key={c}>
                  <Link href={`/projets?competence=${encodeURIComponent(c)}`} className="chip">
                    {skillNames.get(c) ?? c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {(p.lien_repo || p.lien_demo) && (
            <div className="chips">
              {p.lien_repo && (
                <a className="btn" href={p.lien_repo} target="_blank" rel="noopener noreferrer">
                  Code source ↗
                </a>
              )}
              {p.lien_demo && (
                <a className="btn btn--solid" href={p.lien_demo} target="_blank" rel="noopener noreferrer">
                  Démo ↗
                </a>
              )}
            </div>
          )}
        </article>

        <aside aria-labelledby="similaires">
          <h2 id="similaires" className={`title ${styles.sectionTitle}`}>
            Missions similaires
          </h2>
          {similaires.data.length === 0 ? (
            <p className={`panel ${styles.empty}`}>Aucune mission ne partage de compétence avec celle-ci.</p>
          ) : (
            <ul className={styles.similar}>
              {similaires.data.map((s) => (
                <li key={s.projet_slug}>
                  <Link href={`/projets/${s.projet_slug}`} className={`panel ${styles.similarCard}`}>
                    <strong>{s.titre}</strong>
                    <span className="mono" style={{ color: "var(--orange)" }}>
                      {s.nb_communes} compétence{s.nb_communes > 1 ? "s" : ""} en commun
                    </span>
                    <span className="muted">
                      {s.competences_communes.map((c) => skillNames.get(c) ?? c).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}
