import { Link } from "react-router-dom";
import { ArrowUpRight, Plane } from "lucide-react";
import type { Projet } from "@/lib/types";

interface Props {
  projet: Projet;
  index: number;
  nomCompetence: (slug: string) => string;
}

/** Carte projet façon « carte d'embarquement » : destination, année, stack. */
export default function ProjectCard({ projet, index, nomCompetence }: Props) {
  const code = projet.projet_slug.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "PRJ";
  return (
    <Link
      to={`/projets/${projet.projet_slug}`}
      className="carte group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-ocean-900 to-ocean-800 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-sand-200">
        <span>Vol {String(index + 1).padStart(2, "0")}</span>
        <span className="flex items-center gap-2">
          <Plane className="h-3.5 w-3.5 text-lagon-400 transition-transform duration-500 group-hover:translate-x-1" aria-hidden />
          {code}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-2xl font-semibold leading-tight text-ocean-900">{projet.titre}</h3>
          <ArrowUpRight
            className="mt-1 h-5 w-5 shrink-0 text-ink/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lagon-600"
            aria-hidden
          />
        </div>
        {projet.contexte && <p className="mt-1 text-sm text-lagon-700">{projet.contexte}</p>}
        <p className="mt-3 line-clamp-3 leading-relaxed text-ink/70">{projet.description}</p>

        <div className="mt-auto pt-6">
          <div className="flex flex-wrap gap-1.5">
            {projet.competences.slice(0, 6).map((c) => (
              <span key={c} className="etiquette">
                {nomCompetence(c)}
              </span>
            ))}
            {projet.competences.length > 6 && <span className="etiquette">+{projet.competences.length - 6}</span>}
          </div>
        </div>
      </div>

      {/* Talon perforé */}
      <div className="relative flex items-center justify-between border-t-2 border-dashed border-ocean-900/10 px-6 py-3 text-xs">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-ecume-50" aria-hidden />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-ecume-50" aria-hidden />
        <span className="font-mono uppercase tracking-widest text-ink/45">{projet.annee ?? "—"}</span>
        <span className="font-medium text-ocean-800 group-hover:text-lagon-700">Lire l'étude de cas</span>
      </div>
    </Link>
  );
}
