import { useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { useRessource } from "@/lib/hooks";
import { getCompetencesDomaine, getStatsCompetences } from "@/lib/portfolio";
import { libelleDomaine, trierDomaines } from "@/lib/format";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import Motif from "@/components/Motif";
import type { Competence, StatCompetence } from "@/lib/types";

/** Niveau 1–5 représenté par des étapes sur un chemin. */
function Niveau({ niveau }: { niveau?: number }) {
  if (!niveau) return null;
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`Niveau ${niveau} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-4 rounded-full ${i <= niveau ? "bg-lagon-600" : "bg-ocean-900/10"}`} />
      ))}
    </span>
  );
}

function CarteCompetence({ c, stat }: { c: Competence; stat?: StatCompetence }) {
  return (
    <li className="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-ocean-900/10 hover:bg-ecume-50">
      <div className="min-w-0">
        <p className="truncate font-medium text-ocean-900">{c.nom}</p>
        {stat && (
          <p className="text-xs text-ink/55">
            {stat.nb_projets} projet{stat.nb_projets > 1 ? "s" : ""}
            {stat.derniere_annee ? ` · ${stat.derniere_annee}` : ""}
          </p>
        )}
      </div>
      <Niveau niveau={c.niveau} />
    </li>
  );
}

export default function Skills() {
  const { data: p } = useProfil();
  const stats = useRessource(() => getStatsCompetences(), []); // R3 : toutes les compétences
  const topN = useRessource(() => getStatsCompetences(5), []); // R6 : top 5 (?limit=5)
  const [domaine, setDomaine] = useState<string | null>(null);
  const filtre = useRessource(() => (domaine ? getCompetencesDomaine(domaine) : Promise.resolve({ data: null, source: "aucune" as const })), [domaine]);

  const parSlug = useMemo(() => new Map((stats.data ?? []).map((s) => [s.skill_slug, s])), [stats.data]);
  if (!p || p.competences.length === 0) return null;

  const domaines = trierDomaines(p.competences.map((c) => c.domaine));
  const top = topN.data ?? [];
  const slugsFiltres = domaine && filtre.data ? new Set(filtre.data.items.map((i) => i.skill_slug)) : null;
  const visibles = domaine ? [domaine] : domaines;

  return (
    <section id="competences" className="relative overflow-hidden bg-gradient-to-b from-ecume-100 to-ecume-50 py-24 sm:py-32">
      <Motif nom="avion" className="right-[6%] top-20 w-40 lg:w-48" />
      <div className="conteneur relative">
        <SectionHeader
          etape="03"
          surtitre="Compétences"
          titre={
            <>
              Mon équipement <span className="italic text-lagon-600">de voyage</span>
            </>
          }
          intro="Les technologies et pratiques que j'emporte sur chaque projet, classées par domaine. Le niveau est une auto-évaluation sur 5."
        />

        {top.length > 0 && (
          <Reveal className="mb-10 flex flex-wrap items-center gap-2.5">
            <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-semibold text-ocean-900">
              <Flame className="h-4 w-4 text-lagon-600" aria-hidden /> Les plus utilisées
            </span>
            {top.map((s) => (
              <span key={s.skill_slug} className="etiquette !bg-white !py-1.5 !text-sm">
                {s.nom}
                <span className="rounded-full bg-ocean-900 px-1.5 text-[10px] text-ecume-50">{s.nb_projets}</span>
              </span>
            ))}
          </Reveal>
        )}

        <Reveal className="mb-8 flex flex-wrap gap-2" as="div">
          <div role="group" aria-label="Filtrer par domaine" className="flex flex-wrap gap-2">
            {[null, ...domaines].map((d) => {
              const actif = d === domaine;
              return (
                <button
                  key={d ?? "tous"}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setDomaine(d)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    actif ? "bg-ocean-900 text-ecume-50 shadow-card" : "bg-white text-ocean-900/75 hover:bg-white hover:text-ocean-900 hover:shadow-card"
                  }`}
                >
                  {d ? libelleDomaine(d) : "Tous les domaines"}
                </button>
              );
            })}
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {visibles.map((d, i) => {
            const comps = p.competences
              .filter((c) => c.domaine === d && (!slugsFiltres || slugsFiltres.has(c.skill_slug)))
              .sort((a, b) => (b.niveau ?? 0) - (a.niveau ?? 0) || a.nom.localeCompare(b.nom));
            if (!comps.length) return null;
            return (
              <Reveal key={d} delai={i * 60} className="carte min-w-0 p-5">
                <div className="mb-3 flex items-center justify-between border-b border-dashed border-ocean-900/10 pb-3">
                  <h3 className="font-display text-lg font-semibold text-ocean-900">
                    {domaine && filtre.data ? filtre.data.domaine_nom : libelleDomaine(d)}
                  </h3>
                  <span className="font-mono text-xs text-ink/45">{comps.length}</span>
                </div>
                <ul className="-mx-3 space-y-0.5">
                  {comps.map((c) => (
                    <CarteCompetence key={c.skill_slug} c={c} stat={parSlug.get(c.skill_slug)} />
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
