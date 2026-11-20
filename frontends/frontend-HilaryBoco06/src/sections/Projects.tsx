import { useState } from "react";
import { useProfil } from "@/lib/ProfilContext";
import { useRessource } from "@/lib/hooks";
import { getProjets } from "@/lib/portfolio";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import ProjectCard from "@/components/ProjectCard";

export default function Projects() {
  const { data: p } = useProfil();
  const tous = useRessource(() => getProjets(), []);
  const [competence, setCompetence] = useState<string | null>(null);
  // R2 avec filtre : l'API fait le filtrage (?competence=slug)
  const filtres = useRessource(() => getProjets(competence ?? undefined), [competence]);

  const nomCompetence = (slug: string) => p?.competences.find((c) => c.skill_slug === slug)?.nom ?? slug;
  if (!tous.chargement && !tous.data?.length) return null;

  // Filtres proposés : compétences réellement utilisées par au moins un projet, triées par fréquence.
  const freq = new Map<string, number>();
  (tous.data ?? []).forEach((pr) => pr.competences.forEach((c) => freq.set(c, (freq.get(c) ?? 0) + 1)));
  const options = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([s]) => s);
  const liste = filtres.data ?? [];

  return (
    <section id="projets" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-[38%] lg:block" aria-hidden>
        <img src="/illustrations/phare.svg" alt="" loading="lazy" className="h-full w-full object-cover object-bottom opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-ecume-50 via-ecume-50/50 to-transparent" />
      </div>

      <div className="conteneur">
        <SectionHeader
          etape="04"
          surtitre="Projets"
          titre={
            <>
              Les destinations <span className="italic text-lagon-600">explorées</span>
            </>
          }
          intro="Chaque projet est présenté comme une étude de cas : le contexte, le problème, les choix techniques et mon rôle. Filtrez par technologie pour trouver ce qui vous intéresse."
        />

        {options.length > 1 && (
          <Reveal className="-mx-5 mb-10 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
            <div role="group" aria-label="Filtrer les projets par compétence" className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {[null, ...options].map((s) => {
                const actif = s === competence;
                return (
                  <button
                    key={s ?? "tous"}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => setCompetence(s)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                      actif
                        ? "border-lagon-500 bg-lagon-600 text-white"
                        : "border-ocean-900/10 bg-white text-ocean-900/75 hover:border-ocean-900/25 hover:text-ocean-900"
                    }`}
                  >
                    {s ? nomCompetence(s) : `Tous (${tous.data?.length ?? 0})`}
                  </button>
                );
              })}
            </div>
          </Reveal>
        )}

        {filtres.chargement && !liste.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="carte h-80 animate-pulse bg-white/60" />
            ))}
          </div>
        ) : (
          <ul className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${filtres.chargement ? "opacity-60" : ""}`} aria-live="polite">
            {liste.map((projet, i) => (
              <Reveal as="li" key={projet.projet_slug} delai={(i % 3) * 80}>
                <ProjectCard projet={projet} index={i} nomCompetence={nomCompetence} />
              </Reveal>
            ))}
          </ul>
        )}
        {!filtres.chargement && competence && liste.length === 0 && (
          <p className="text-ink/60">Aucun projet n'utilise encore cette compétence.</p>
        )}
      </div>
    </section>
  );
}
