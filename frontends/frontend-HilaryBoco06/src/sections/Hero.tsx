import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Download, Github, Linkedin, Mail, Sparkles } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { useFichierDisponible } from "@/lib/hooks";
import { nomComplet } from "@/lib/format";
import { SITE } from "@/lib/site";
import { OBJETS, objet, type IdObjet } from "@/scene/objets";
import Panneau from "@/components/Panneau";
import { ContenuPanneau } from "@/panels/Panneaux";

// La 3D (Three.js) est chargée à part : le reste du site s'affiche sans l'attendre.
const IleScene = lazy(() => import("@/scene/IleScene"));

function peut3D(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function IllustrationRepli() {
  return (
    <img
      src="/illustrations/hero-ocean.svg"
      alt=""
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
      {...{ fetchpriority: "high" }}
    />
  );
}

export default function Hero() {
  const { data: p, chargement } = useProfil();
  const cvDispo = useFichierDisponible(SITE.cvUrl, "pdf");
  const avec3D = useMemo(peut3D, []);
  const [pret, setPret] = useState(false);
  const [ouvert, setOuvert] = useState<IdObjet | null>(null);
  const nom = p ? nomComplet(p.prenom, p.nom) : SITE.nomParDefaut;
  const [prenom, ...reste] = nom.split(" ");

  const fermer = useCallback(() => setOuvert(null), []);
  const sectionComplete = useCallback(() => {
    if (!ouvert) return;
    const section = objet(ouvert).section;
    setOuvert(null);
    setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" }), 380);
  }, [ouvert]);
  const courant = ouvert ? objet(ouvert) : null;

  return (
    <section id="accueil" className="relative isolate h-[100svh] min-h-[600px] overflow-hidden bg-ocean-950 text-ecume-50">
      {/* Scène : 3D si possible, illustration sinon (et pendant le chargement) */}
      <div className="absolute inset-0 -z-10">
        {(!avec3D || !pret) && <IllustrationRepli />}
        {avec3D && (
          <Suspense fallback={null}>
            <div className={`absolute inset-0 transition-opacity duration-1000 ${pret ? "opacity-100" : "opacity-0"}`}>
              <IleScene focus={ouvert} onChoisir={setOuvert} onPret={() => setPret(true)} />
            </div>
          </Suspense>
        )}
      </div>
      {/* Voile pour la lisibilité du texte */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ouvert ? "opacity-0" : "opacity-100"}`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/70 via-transparent to-ocean-950/60 lg:bg-gradient-to-r lg:from-ocean-950/85 lg:via-ocean-950/20 lg:to-transparent" />
      </div>

      {/* Présentation */}
      <div className="pointer-events-none relative z-10 h-full">
        {/* Le texte s'efface quand un panneau est ouvert : la scène laisse toute la place à l'objet. */}
        <div
          className={`conteneur pt-24 transition-all duration-500 sm:pt-28 lg:pt-32 ${ouvert ? "pointer-events-none -translate-x-6 opacity-0" : ""}`}
          {...(ouvert ? { inert: "" } : {})}
        >
          <div className="max-w-xl text-center lg:text-left">
            <p className="surtitre animate-fade-up !text-lagon-400">Portfolio · Carnet de voyage</p>
            <h1 className="mt-3 animate-fade-up text-[2.6rem] font-semibold leading-[0.98] sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
              {prenom} <span className="italic text-sand-200">{reste.join(" ")}</span>
            </h1>
            <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
              {p?.titre ? (
                <p className="mt-4 text-base font-medium text-ecume-100 sm:text-xl">{p.titre}</p>
              ) : chargement ? (
                <div className="mx-auto mt-4 h-6 w-64 animate-pulse rounded bg-white/10 lg:mx-0" />
              ) : null}
              {p?.bio && <p className="mt-3 hidden max-w-lg text-[15px] leading-relaxed text-ecume-100/80 sm:block">{p.bio}</p>}
            </div>
            <div
              className="pointer-events-auto mt-6 flex animate-fade-up flex-wrap items-center justify-center gap-2.5 lg:justify-start"
              style={{ animationDelay: "240ms" }}
            >
              <Link to={{ hash: "projets" }} className="btn-lumineux group !px-4 !py-2.5 sm:!px-5 sm:!py-3">
                Découvrir mes projets
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              {cvDispo && (
                <a href={SITE.cvUrl} download className="btn-clair !px-4 !py-2.5 sm:!px-5 sm:!py-3">
                  <Download className="h-4 w-4" aria-hidden /> CV
                </a>
              )}
              <button type="button" onClick={() => setOuvert("bouteille")} className="btn-contour !px-4 !py-2.5 text-ecume-50 sm:!px-5 sm:!py-3">
                <Mail className="h-4 w-4" aria-hidden /> Me contacter
              </button>
              <span className="ml-1 hidden items-center gap-3 text-ecume-100/70 sm:inline-flex">
                {p?.liens?.linkedin && (
                  <a href={p.liens.linkedin} target="_blank" rel="noreferrer" className="hover:text-white" aria-label="Profil LinkedIn">
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                <a
                  href={p?.liens?.github ?? `https://github.com/${SITE.githubPseudo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                  aria-label="Profil GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* Barre « Explorer » : accès clavier / lecteur d'écran aux objets de l'île */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-5 flex flex-col items-center gap-3 px-4">
          {avec3D && (
            <p className="hidden animate-fade-up items-center gap-2 rounded-full bg-ocean-950/50 px-3 py-1 text-xs font-medium text-lagon-300 backdrop-blur sm:flex" style={{ animationDelay: "700ms" }}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Cliquez sur les objets de l'île pour explorer
            </p>
          )}
          <nav aria-label="Explorer l'île" className="max-w-full overflow-x-auto rounded-full border border-ciel/15 bg-ocean-950/70 p-1.5 shadow-lift backdrop-blur-md">
            <ul className="flex w-max items-center gap-1">
              <li className="hidden px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-lagon-300 md:block" aria-hidden>
                Explorer
              </li>
              {OBJETS.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setOuvert(o.id)}
                    aria-haspopup="dialog"
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 ${
                      ouvert === o.id ? "bg-lagon-400 text-ocean-950" : "text-ecume-100/85 hover:bg-ciel/10 hover:text-white"
                    }`}
                  >
                    <o.icone className="h-4 w-4" aria-hidden />
                    {o.titre}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            to={{ hash: "parcours" }}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ecume-100/70 hover:text-white"
          >
            Commencer le voyage <ArrowDown className="h-4 w-4 animate-drift" aria-hidden />
          </Link>
        </div>
      </div>

      <Panneau
        ouvert={ouvert !== null}
        surtitre={courant ? `${courant.label} · ${courant.sousTitre}` : ""}
        titre={courant?.titre ?? ""}
        onFermer={fermer}
        onSectionComplete={sectionComplete}
      >
        {ouvert && <ContenuPanneau id={ouvert} fermer={fermer} />}
      </Panneau>
    </section>
  );
}
