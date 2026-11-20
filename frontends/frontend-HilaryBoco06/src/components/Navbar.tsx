import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, Download, Menu, X } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { nomComplet } from "@/lib/format";
import { SITE } from "@/lib/site";
import { useFichierDisponible } from "@/lib/hooks";

export const LIENS_NAV = [
  { id: "parcours", label: "Parcours" },
  { id: "a-propos", label: "À propos" },
  { id: "competences", label: "Compétences" },
  { id: "projets", label: "Projets" },
  { id: "graphe", label: "Graphe" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { data: profil } = useProfil();
  const [defile, setDefile] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [apresHero, setApresHero] = useState(false);
  const cvDispo = useFichierDisponible(SITE.cvUrl, "pdf");
  const surHero = pathname === "/" && !defile && !ouvert;
  const pilule = pathname !== "/" || apresHero;

  useEffect(() => {
    const onScroll = () => {
      setDefile(window.scrollY > 40);
      setApresHero(window.scrollY > window.innerHeight * 0.75);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOuvert(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert]);

  const nom = profil ? nomComplet(profil.prenom, profil.nom) : SITE.nomParDefaut;

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        surHero ? "bg-transparent text-ecume-50" : "border-b border-ocean-900/[0.06] bg-ecume-50/85 text-ocean-900 shadow-sm backdrop-blur-md"
      }`}
    >
      <nav className="conteneur flex h-16 items-center justify-between" aria-label="Navigation principale">
        <Link to="/" className="group flex items-center gap-2.5 font-display text-lg font-semibold">
          <Compass className="h-5 w-5 text-lagon-600 transition-transform duration-500 group-hover:rotate-[135deg]" aria-hidden />
          <span>{nom}</span>
        </Link>

        <ul className="hidden items-center gap-2 lg:flex">
          {cvDispo && (
            <li>
              <a href={SITE.cvUrl} download className={`${surHero ? "btn-contour text-ecume-50" : "btn-sombre"} !py-2`}>
                CV <Download className="h-4 w-4" aria-hidden />
              </a>
            </li>
          )}
          <li>
            <Link to={{ pathname: "/", hash: "contact" }} className={`${surHero ? "btn-lumineux" : "btn-primaire"} !py-2`}>
              Me contacter
            </Link>
          </li>
        </ul>

        <button
          type="button"
          className="-mr-2 rounded-full p-2 lg:hidden"
          aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={ouvert}
          aria-controls="menu-mobile"
          onClick={() => setOuvert((o) => !o)}
        >
          {ouvert ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {ouvert && (
        <div id="menu-mobile" className="topo h-[calc(100dvh-4rem)] overflow-y-auto bg-ecume-50 lg:hidden">
          <ul className="conteneur flex flex-col gap-1 py-6">
            {LIENS_NAV.map((l, i) => (
              <li key={l.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <Link
                  to={{ pathname: "/", hash: l.id }}
                  onClick={() => setOuvert(false)}
                  className="flex items-baseline gap-4 rounded-xl px-3 py-3.5 font-display text-2xl text-ocean-900 hover:bg-white"
                >
                  <span className="font-mono text-xs text-lagon-600">0{i + 1}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>

    {/* Menu flottant en pilule (bureau), comme sur un carnet de bord */}
    <nav
      aria-label="Sections"
      className={`fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 transition-all duration-500 lg:block ${
        pilule ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
      {...(pilule ? {} : { inert: "" })}
    >
      <ul className="flex items-center gap-1 rounded-full border border-ciel/15 bg-ocean-950/75 p-1.5 shadow-lift backdrop-blur-md">
        {LIENS_NAV.map((l) => (
          <li key={l.id}>
            <Link
              to={{ pathname: "/", hash: l.id }}
              className="block rounded-full px-4 py-2 text-sm font-medium text-ecume-100/85 transition hover:bg-lagon-400 hover:text-ocean-950"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
    </>
  );
}
