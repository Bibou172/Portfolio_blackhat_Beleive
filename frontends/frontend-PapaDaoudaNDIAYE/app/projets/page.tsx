import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ApiStatusReporter from "@/components/ApiStatusReporter";
import MissionGrid from "@/components/MissionGrid";
import SectionShell from "@/components/SectionShell";
import SectionSkeleton from "@/components/SectionSkeleton";
import styles from "@/components/sections.module.css";
import { getProfil, getProjets } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Projets",
  description: "Missions réalisées, filtrables par compétence.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ProjetsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <SectionShell id="projets" kicker="Missions accomplies">
      <Suspense fallback={<SectionSkeleton />}>
        <ProjetsContent searchParams={searchParams} />
      </Suspense>
    </SectionShell>
  );
}

async function ProjetsContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const competence = typeof sp.competence === "string" && sp.competence ? sp.competence : undefined;

  // R2 filtré + liste complète (pour proposer toutes les compétences en filtre)
  const [projets, tous, profil] = await Promise.all([
    getProjets(competence),
    competence ? getProjets() : null,
    getProfil(),
  ]);
  const all = tous?.data ?? projets.data;
  const skillNames: Record<string, string> = Object.fromEntries(profil.data.competences.map((c) => [c.skill_slug, c.nom]));
  const skills = [...new Set(all.flatMap((p) => p.competences))].sort((a, b) =>
    (skillNames[a] ?? a).localeCompare(skillNames[b] ?? b),
  );

  return (
    <>
      <ApiStatusReporter offline={projets.offline || profil.offline || Boolean(tous?.offline)} />
      <nav className={styles.filters} aria-label="Filtrer les missions par compétence">
        <ul className="chips">
          <li>
            <Link href="/projets" className="chip" aria-current={!competence ? "true" : undefined} scroll={false}>
              Toutes ({all.length})
            </Link>
          </li>
          {skills.map((s) => (
            <li key={s}>
              <Link
                href={`/projets?competence=${encodeURIComponent(s)}`}
                className="chip"
                aria-current={s === competence ? "true" : undefined}
                scroll={false}
              >
                {skillNames[s] ?? s}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {projets.data.length === 0 ? (
        <p className={`panel ${styles.empty}`}>Aucune mission avec cette compétence.</p>
      ) : (
        <MissionGrid projets={projets.data} skillNames={skillNames} />
      )}
    </>
  );
}
