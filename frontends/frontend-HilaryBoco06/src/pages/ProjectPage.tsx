import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, ExternalLink, Github, Lightbulb, ListChecks, Target, UserRound, Wrench } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { useRessource } from "@/lib/hooks";
import { getProjet, getProjetsSimilaires } from "@/lib/portfolio";
import { libelleDomaine } from "@/lib/format";
import Reveal from "@/components/Reveal";

function Bloc({ icone: Icone, titre, children }: { icone: typeof Target; titre: string; children: ReactNode }) {
  return (
    <Reveal className="carte p-6 sm:p-7">
      <h2 className="mb-3 flex items-center gap-2.5 font-display text-xl font-semibold text-ocean-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ecume-100 text-lagon-700">
          <Icone className="h-4 w-4" aria-hidden />
        </span>
        {titre}
      </h2>
      <div className="leading-relaxed text-ink/75">{children}</div>
    </Reveal>
  );
}

function Liste({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lagon-600" aria-hidden />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

function Similaires({ slug, nomCompetence }: { slug: string; nomCompetence: (s: string) => string }) {
  const sim = useRessource(() => getProjetsSimilaires(slug, 5), [slug]);
  if (sim.chargement) return <div className="h-40 animate-pulse rounded-2xl bg-white/60" />;
  if (!sim.data?.length) return null;
  return (
    <Reveal as="aside" className="fond-ocean rounded-2xl p-6 text-ecume-50" aria-label="Projets similaires">
      <p className="surtitre !text-lagon-400">Correspondances</p>
      <h2 className="mt-2 font-display text-xl font-semibold">Projets similaires</h2>
      <p className="mt-1 text-sm text-sand-200/65">Ils partagent des compétences avec celui-ci.</p>
      <ul className="mt-5 space-y-3">
        {sim.data.map((s) => (
          <li key={s.projet_slug}>
            <Link to={`/projets/${s.projet_slug}`} className="group block rounded-xl border border-sand-200/10 p-4 transition hover:border-sand-200/30 hover:bg-ocean-800">
              <p className="flex items-center justify-between gap-2 font-medium">
                {s.titre}
                <ArrowRight className="h-4 w-4 shrink-0 text-lagon-400 transition-transform group-hover:translate-x-1" aria-hidden />
              </p>
              <p className="mt-2 text-xs text-sand-200/60">
                {s.nb_communes} en commun : {s.competences_communes.map(nomCompetence).join(", ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export default function ProjectPage() {
  const { slug = "" } = useParams();
  const { data: profil } = useProfil();
  const projet = useRessource(() => getProjet(slug), [slug]);
  const comp = (s: string) => profil?.competences.find((c) => c.skill_slug === s);
  const nomCompetence = (s: string) => comp(s)?.nom ?? s;

  if (projet.chargement) {
    return (
      <div className="conteneur pb-24 pt-32">
        <div className="h-10 w-2/3 animate-pulse rounded bg-sand-200" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  const p = projet.data;
  if (!p) {
    return (
      <div className="conteneur flex min-h-[70vh] flex-col items-start justify-center pt-24">
        <p className="surtitre">Destination inconnue</p>
        <h1 className="mt-3 text-4xl font-semibold text-ocean-900">Ce projet est introuvable.</h1>
        <Link to={{ pathname: "/", hash: "projets" }} className="btn-sombre mt-8">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voir tous les projets
        </Link>
      </div>
    );
  }

  const metriques = Object.entries(p.metriques ?? {});

  return (
    <article>
      <header className="relative isolate overflow-hidden bg-ocean-950 pb-16 pt-28 text-ecume-50 sm:pb-20 sm:pt-36">
        <img src={p.images?.[0] ?? "/illustrations/hero-ocean.svg"} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover object-[75%_center] opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ocean-950 via-ocean-950/60 to-ocean-950/20" aria-hidden />
        <div className="conteneur">
          <Link to={{ pathname: "/", hash: "projets" }} className="inline-flex items-center gap-2 text-sm text-sand-200/80 hover:text-ecume-50">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Tous les projets
          </Link>
          <p className="surtitre mt-8 !text-lagon-400">Étude de cas{p.contexte ? ` · ${p.contexte}` : ""}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] sm:text-6xl">{p.titre}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-sand-200/85">{p.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {p.annee && (
              <span className="inline-flex items-center gap-2 rounded-full border border-sand-200/20 px-4 py-2 text-sm">
                <Calendar className="h-4 w-4" aria-hidden /> {p.annee}
              </span>
            )}
            {p.lien_repo && (
              <a href={p.lien_repo} target="_blank" rel="noreferrer" className="btn-clair !py-2">
                <Github className="h-4 w-4" aria-hidden /> Voir le code
              </a>
            )}
            {p.lien_demo && (
              <a href={p.lien_demo} target="_blank" rel="noreferrer" className="btn-lumineux !py-2">
                <ExternalLink className="h-4 w-4" aria-hidden /> Voir la démo
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="topo">
        <div className="conteneur grid gap-6 py-14 lg:grid-cols-[1fr_340px] lg:gap-10 lg:py-20">
          <div className="space-y-6">
            {!p.description_longue && !p.probleme && !p.role && !p.fonctionnalites?.length && !p.decisions?.length && (
              <Bloc icone={Target} titre="En bref">
                <p>{p.description}</p>
              </Bloc>
            )}
            {p.description_longue && (
              <Bloc icone={Target} titre="Objectif">
                <p>{p.description_longue}</p>
              </Bloc>
            )}
            {p.probleme && (
              <Bloc icone={Lightbulb} titre="Le problème">
                <p>{p.probleme}</p>
              </Bloc>
            )}
            {p.role && (
              <Bloc icone={UserRound} titre="Mon rôle">
                <p>{p.role}</p>
              </Bloc>
            )}
            {p.fonctionnalites && p.fonctionnalites.length > 0 && (
              <Bloc icone={ListChecks} titre="Fonctionnalités principales">
                <Liste items={p.fonctionnalites} />
              </Bloc>
            )}
            {p.decisions && p.decisions.length > 0 && (
              <Bloc icone={Wrench} titre="Décisions techniques">
                <Liste items={p.decisions} />
              </Bloc>
            )}
            {p.images && p.images.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {p.images.map((src, i) => (
                  <Reveal key={src} delai={i * 60}>
                    <img src={src} alt={`Capture ${i + 1} du projet ${p.titre}`} loading="lazy" className="w-full rounded-2xl border border-ocean-900/10 shadow-card" />
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Reveal className="carte p-6">
              <p className="surtitre">Stack technique</p>
              <ul className="mt-4 space-y-2">
                {p.competences.map((s) => {
                  const c = comp(s);
                  return (
                    <li key={s} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-ocean-900">{c?.nom ?? s}</span>
                      {c?.domaine && <span className="text-xs text-ink/50">{libelleDomaine(c.domaine)}</span>}
                    </li>
                  );
                })}
              </ul>
            </Reveal>
            {metriques.length > 0 && (
              <Reveal className="carte grid grid-cols-2 gap-4 p-6">
                {metriques.map(([k, v]) => (
                  <div key={k}>
                    <p className="font-display text-2xl font-semibold text-ocean-900">{v}</p>
                    <p className="text-xs text-ink/55">{k.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </Reveal>
            )}
            <Similaires slug={p.projet_slug} nomCompetence={nomCompetence} />
          </div>
        </div>
      </div>
    </article>
  );
}
