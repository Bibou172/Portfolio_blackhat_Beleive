import { useState } from "react";
import { Briefcase, GraduationCap, MapPin } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { useRessource } from "@/lib/hooks";
import { getExperiences } from "@/lib/portfolio";
import { periode } from "@/lib/format";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";

type Etape =
  | { type: "experience"; debut: string; fin?: string | null; titre: string; lieuOrga: string; lieu?: string; description?: string; competences?: string[] }
  | { type: "formation"; debut: string; fin?: string | null; titre: string; lieuOrga: string; lieu?: string };

export default function Journey() {
  const { data: p } = useProfil();
  const [lieu, setLieu] = useState<string | null>(null);
  // R8 : l'API filtre les expériences par lieu (appel seulement quand un lieu est choisi ; sinon R1 suffit)
  const exps = useRessource(
    () => (lieu ? getExperiences(lieu) : Promise.resolve({ data: null, source: "aucune" as const })),
    [lieu],
  );
  if (!p || (p.experiences.length === 0 && p.formations.length === 0)) return null;

  const nomCompetence = (slug: string) => p.competences.find((c) => c.skill_slug === slug)?.nom ?? slug;
  const lieux = [...new Set(p.experiences.map((e) => e.lieu).filter(Boolean))] as string[];
  const experiences = lieu ? (exps.data ?? []) : p.experiences;

  const etapes: Etape[] = [
    ...experiences.map((e) => ({
      type: "experience" as const,
      debut: e.debut,
      fin: e.fin,
      titre: e.poste,
      lieuOrga: e.entreprise,
      lieu: e.lieu,
      description: e.description,
      competences: e.competences,
    })),
    ...(lieu
      ? []
      : p.formations.map((f) => ({ type: "formation" as const, debut: f.debut, fin: f.fin, titre: f.diplome, lieuOrga: f.ecole, lieu: f.lieu }))),
  ].sort((a, b) => b.debut.localeCompare(a.debut));

  return (
    <section id="parcours" className="fond-ocean relative overflow-hidden py-24 text-ecume-50 sm:py-32">
      <div className="topo-clair absolute inset-0" aria-hidden />
      <div className="conteneur relative">
        <SectionHeader
          etape="01"
          surtitre="Parcours"
          clair
          titre={
            <>
              L'itinéraire <span className="italic text-lagon-400">jusqu'ici</span>
            </>
          }
          intro="Formations et expériences, de la plus récente à la plus ancienne."
        />

        {lieux.length > 1 && (
          <Reveal className="mb-12 flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-sm text-sand-200/70">
              <MapPin className="h-4 w-4" aria-hidden /> Expériences à
            </span>
            {[null, ...lieux].map((l) => (
              <button
                key={l ?? "tous"}
                type="button"
                aria-pressed={l === lieu}
                onClick={() => setLieu(l)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                  l === lieu ? "border-ecume-50 bg-ecume-50 text-ocean-900" : "border-sand-200/25 text-ecume-100 hover:border-sand-200/60"
                }`}
              >
                {l ?? "Partout"}
              </button>
            ))}
          </Reveal>
        )}

        <ol className="relative ml-3 border-l-2 border-dashed border-sand-200/25 md:ml-0 md:border-0" aria-live="polite">
          {/* Route centrale sur grand écran */}
          <span className="absolute bottom-0 left-1/2 top-0 hidden -translate-x-1/2 border-l-2 border-dashed border-sand-200/25 md:block" aria-hidden />
          {etapes.map((e, i) => {
            const Icone = e.type === "experience" ? Briefcase : GraduationCap;
            const gauche = i % 2 === 0;
            return (
              <li key={`${e.type}-${e.debut}-${e.titre}`} className="relative mb-10 pl-8 last:mb-0 md:grid md:grid-cols-2 md:gap-14 md:pl-0">
                <span
                  className="absolute -left-[13px] top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-lagon-400 bg-ocean-800 md:left-1/2 md:-translate-x-1/2"
                  aria-hidden
                >
                  <span className="h-2 w-2 rounded-full bg-lagon-400" />
                </span>
                <Reveal delai={60} className={gauche ? "md:col-start-1 md:text-right" : "md:col-start-2"}>
                  <article className="rounded-2xl border border-sand-200/10 bg-ocean-800/60 p-6 backdrop-blur transition hover:border-sand-200/25 hover:bg-ocean-800">
                    <p className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-lagon-400 ${gauche ? "md:justify-end" : ""}`}>
                      <Icone className="h-3.5 w-3.5" aria-hidden />
                      {e.type === "experience" ? "Expérience" : "Formation"} · {periode(e.debut, e.fin)}
                    </p>
                    <h3 className="mt-3 font-display text-xl font-semibold text-ecume-50">{e.titre}</h3>
                    <p className="mt-1 text-sand-200/80">
                      {e.lieuOrga}
                      {e.lieu && <span className="text-sand-200/55"> · {e.lieu}</span>}
                    </p>
                    {e.type === "experience" && e.description && <p className="mt-3 text-sm leading-relaxed text-sand-200/75">{e.description}</p>}
                    {e.type === "experience" && e.competences && e.competences.length > 0 && (
                      <div className={`mt-4 flex flex-wrap gap-1.5 ${gauche ? "md:justify-end" : ""}`}>
                        {e.competences.map((c) => (
                          <span key={c} className="rounded-full bg-ecume-50/10 px-2.5 py-1 text-xs text-ecume-100">
                            {nomCompetence(c)}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
        {lieu && !exps.chargement && etapes.length === 0 && <p className="text-sand-200/70">Aucune expérience à {lieu}.</p>}
      </div>
    </section>
  );
}
