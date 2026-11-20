import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ApiStatusReporter from "@/components/ApiStatusReporter";
import CityRadar from "@/components/CityRadar";
import SectionShell from "@/components/SectionShell";
import SectionSkeleton from "@/components/SectionSkeleton";
import Timeline, { type TimelineItem } from "@/components/Timeline";
import styles from "@/components/sections.module.css";
import { getExperiences, getProfil } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Parcours",
  description: "Expériences et formations, ville par ville.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ParcoursPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <SectionShell id="parcours" kicker="La route jusqu'ici">
      <Suspense fallback={<SectionSkeleton />}>
        <ParcoursContent searchParams={searchParams} />
      </Suspense>
    </SectionShell>
  );
}

async function ParcoursContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const lieu = typeof sp.lieu === "string" && sp.lieu ? sp.lieu : undefined;

  // R1 (profil + formations) et R8 (expériences filtrées par lieu) en parallèle
  const [profil, experiences] = await Promise.all([getProfil(), getExperiences(lieu)]);
  const p = profil.data;

  const counts = new Map<string, number>();
  for (const x of [...p.experiences, ...p.formations]) {
    if (x.lieu) counts.set(x.lieu, (counts.get(x.lieu) ?? 0) + 1);
  }
  const villes = [...counts.entries()].map(([nom, count]) => ({ nom, count })).sort((a, b) => a.nom.localeCompare(b.nom));

  const items: TimelineItem[] = [
    ...experiences.data.map((e) => ({
      kind: "experience" as const,
      titre: e.poste,
      organisation: e.entreprise,
      lieu: e.lieu,
      debut: e.debut,
      fin: e.fin,
      description: e.description,
      competences: e.competences,
    })),
    ...p.formations
      .filter((f) => !lieu || f.lieu === lieu)
      .map((f) => ({
        kind: "formation" as const,
        titre: f.diplome,
        organisation: f.ecole,
        lieu: f.lieu,
        debut: f.debut,
        fin: f.fin,
      })),
  ].sort((a, b) => b.debut.localeCompare(a.debut));

  const skillNames = new Map(p.competences.map((c) => [c.skill_slug, c.nom]));

  return (
    <>
      <ApiStatusReporter offline={profil.offline || experiences.offline} />
      <div className={styles.parcoursGrid}>
        <aside className={`panel ${styles.radarBox}`} aria-label="Filtrer par ville">
          <h2 className="title" style={{ fontSize: "1.3rem" }}>
            Radar des villes
          </h2>
          <CityRadar villes={villes} active={lieu} />
          <ul className="chips">
            <li>
              <Link href="/parcours" className="chip" aria-current={!lieu ? "true" : undefined} scroll={false}>
                Toutes
              </Link>
            </li>
            {villes.map((v) => (
              <li key={v.nom}>
                <Link
                  href={`/parcours?lieu=${encodeURIComponent(v.nom)}`}
                  className="chip"
                  aria-current={v.nom === lieu ? "true" : undefined}
                  scroll={false}
                >
                  {v.nom} ({v.count})
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <section aria-label={lieu ? `Étapes à ${lieu}` : "Toutes les étapes"}>
          <Timeline items={items} skillNames={skillNames} />
        </section>
      </div>
    </>
  );
}
