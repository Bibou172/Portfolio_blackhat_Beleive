/** Contenus compacts des panneaux de l'île — mêmes données que les sections (API d'abord, repli data/). */
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, CheckCircle2, Github, GraduationCap, Linkedin, Mail, Phone } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { useRessource } from "@/lib/hooks";
import { getGraphe, getProjets, getStatsCompetences } from "@/lib/portfolio";
import { libelleDomaine, periode, trierDomaines } from "@/lib/format";
import { SITE } from "@/lib/site";
import SkillGraph from "@/components/SkillGraph";
import type { IdObjet } from "@/scene/objets";

function Chargement() {
  return <div className="h-40 animate-pulse rounded-2xl bg-ecume-100" />;
}

function Vide() {
  return <p className="text-ink/60">Contenu bientôt disponible.</p>;
}

function PanneauParcours() {
  const { data: p } = useProfil();
  if (!p) return <Vide />;
  const etapes = [
    ...p.experiences.map((e) => ({ type: "exp" as const, debut: e.debut, fin: e.fin, titre: e.poste, sous: e.entreprise, lieu: e.lieu })),
    ...p.formations.map((f) => ({ type: "form" as const, debut: f.debut, fin: f.fin, titre: f.diplome, sous: f.ecole, lieu: f.lieu })),
  ].sort((a, b) => b.debut.localeCompare(a.debut));
  return (
    <ol className="relative ml-3 border-l-2 border-dashed border-lagon-500/40">
      {etapes.map((e) => {
        const Icone = e.type === "exp" ? Briefcase : GraduationCap;
        return (
          <li key={`${e.type}-${e.debut}-${e.titre}`} className="relative mb-6 pl-6 last:mb-0">
            <span className="absolute -left-[11px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ocean-800 text-ecume-50">
              <Icone className="h-3 w-3" aria-hidden />
            </span>
            <p className="font-mono text-[11px] uppercase tracking-widest text-lagon-700">{periode(e.debut, e.fin)}</p>
            <p className="mt-1 font-semibold leading-snug text-ocean-900">{e.titre}</p>
            <p className="text-sm text-ink/65">
              {e.sous}
              {e.lieu ? ` · ${e.lieu}` : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function PanneauProjets({ fermer }: { fermer: () => void }) {
  const { data: p } = useProfil();
  const projets = useRessource(() => getProjets(), []);
  if (projets.chargement) return <Chargement />;
  if (!projets.data?.length) return <Vide />;
  const nom = (s: string) => p?.competences.find((c) => c.skill_slug === s)?.nom ?? s;
  return (
    <ul className="space-y-3">
      {projets.data.map((pr) => (
        <li key={pr.projet_slug}>
          <Link to={`/projets/${pr.projet_slug}`} onClick={fermer} className="carte group block p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
            <p className="flex items-center justify-between gap-3 font-display text-lg font-semibold text-ocean-900">
              {pr.titre}
              <ArrowRight className="h-4 w-4 shrink-0 text-lagon-600 transition-transform group-hover:translate-x-1" aria-hidden />
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-ink/70">{pr.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {pr.competences.slice(0, 5).map((c) => (
                <span key={c} className="etiquette">
                  {nom(c)}
                </span>
              ))}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PanneauCompetences() {
  const { data: p } = useProfil();
  const stats = useRessource(() => getStatsCompetences(5), []);
  if (!p) return <Vide />;
  return (
    <div className="space-y-6">
      {!!stats.data?.length && (
        <div>
          <p className="surtitre mb-2">Les plus utilisées</p>
          <div className="flex flex-wrap gap-2">
            {stats.data.map((s) => (
              <span key={s.skill_slug} className="etiquette !py-1.5 !text-sm">
                {s.nom}
                <span className="rounded-full bg-ocean-800 px-1.5 text-[10px] text-ecume-50">{s.nb_projets}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {trierDomaines(p.competences.map((c) => c.domaine)).map((d) => (
        <div key={d}>
          <p className="mb-2 font-display text-base font-semibold text-ocean-900">{libelleDomaine(d)}</p>
          <div className="flex flex-wrap gap-1.5">
            {p.competences
              .filter((c) => c.domaine === d)
              .map((c) => (
                <span key={c.skill_slug} className="rounded-full border border-ocean-800/10 bg-white px-3 py-1 text-sm text-ocean-800">
                  {c.nom}
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PanneauAPropos() {
  const { data: p } = useProfil();
  if (!p) return <Vide />;
  return (
    <div className="space-y-5">
      {p.titre && <p className="font-display text-xl font-semibold text-ocean-900">{p.titre}</p>}
      {p.bio && <p className="leading-relaxed text-ink/80">{p.bio}</p>}
      {!!p.points_forts?.length && (
        <ul className="space-y-2">
          {p.points_forts.map((pt) => (
            <li key={pt} className="flex gap-2.5 text-ink/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lagon-600" aria-hidden />
              {pt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PanneauGraphe() {
  const g = useRessource(getGraphe, []);
  if (g.chargement) return <Chargement />;
  if (!g.data || g.data.nodes.length < 2) return <Vide />;
  return (
    <div className="fond-abysse -mx-2 rounded-3xl p-3 text-ecume-50">
      <SkillGraph graphe={g.data} />
    </div>
  );
}

function PanneauContact() {
  const { data: p } = useProfil();
  const github = p?.liens?.github ?? `https://github.com/${SITE.githubPseudo}`;
  const lien = "carte flex items-center gap-3 p-4 font-medium text-ocean-900 transition hover:-translate-y-0.5 hover:shadow-lift";
  const pastille = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white";
  return (
    <div className="space-y-3">
      <p className="mb-4 leading-relaxed text-ink/75">Une opportunité, une question, un projet ? Je réponds rapidement.</p>
      {p?.email && (
        <a href={`mailto:${p.email}`} className={lien}>
          <span className={`${pastille} bg-gradient-to-br from-ocean-800 to-lagon-600`}>
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 truncate">{p.email}</span>
        </a>
      )}
      {p?.telephone && (
        <a href={`tel:${p.telephone.replace(/\s/g, "")}`} className={lien}>
          <span className={`${pastille} bg-gradient-to-br from-lagon-600 to-lagon-400`}>
            <Phone className="h-5 w-5" aria-hidden />
          </span>
          {p.telephone}
        </a>
      )}
      {p?.liens?.linkedin && (
        <a href={p.liens.linkedin} target="_blank" rel="noreferrer" className={lien}>
          <span className={`${pastille} bg-[#0a66c2]`}>
            <Linkedin className="h-5 w-5" aria-hidden />
          </span>
          LinkedIn
        </a>
      )}
      <a href={github} target="_blank" rel="noreferrer" className={lien}>
        <span className={`${pastille} bg-ink`}>
          <Github className="h-5 w-5" aria-hidden />
        </span>
        GitHub
      </a>
    </div>
  );
}

export function ContenuPanneau({ id, fermer }: { id: IdObjet; fermer: () => void }) {
  switch (id) {
    case "phare":
      return <PanneauParcours />;
    case "voilier":
      return <PanneauProjets fermer={fermer} />;
    case "malle":
      return <PanneauCompetences />;
    case "carte":
      return <PanneauAPropos />;
    case "montgolfiere":
      return <PanneauGraphe />;
    case "bouteille":
      return <PanneauContact />;
  }
}
