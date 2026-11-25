import { Link } from "react-router-dom";
import { ArrowUp, Compass, Github, Linkedin, Mail, Phone } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { emailsDe, nomComplet } from "@/lib/format";
import { SITE } from "@/lib/site";
import { LIENS_NAV } from "./Navbar";

export default function Footer() {
  const { data: p } = useProfil();
  const nom = p ? nomComplet(p.prenom, p.nom) : SITE.nomParDefaut;
  const github = p?.liens?.github ?? `https://github.com/${SITE.githubPseudo}`;

  return (
    <footer className="fond-abysse relative overflow-hidden text-sand-200">
      <div className="topo-clair absolute inset-0" aria-hidden />
      <div className="conteneur relative grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2.5 font-display text-xl font-semibold text-ecume-50">
            <Compass className="h-5 w-5 text-lagon-400" aria-hidden /> {nom}
          </p>
          {p?.titre && <p className="mt-2 text-sm text-sand-200/70">{p.titre}</p>}
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-sand-200/60">
            Chaque projet est une étape. Merci d'avoir fait un bout de chemin avec moi.
          </p>
        </div>

        <nav aria-label="Plan du site">
          <p className="surtitre !text-lagon-400">Itinéraire</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {LIENS_NAV.map((l) => (
              <li key={l.id}>
                <Link to={{ pathname: "/", hash: l.id }} className="text-sand-200/75 transition hover:text-ecume-50">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="surtitre !text-lagon-400">Me retrouver</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {emailsDe(p).map((email) => (
              <li key={email}>
                <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-sand-200/75 hover:text-ecume-50">
                  <Mail className="h-4 w-4" aria-hidden /> {email}
                </a>
              </li>
            ))}
            {p?.telephone && (
              <li>
                <a href={`tel:${p.telephone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-sand-200/75 hover:text-ecume-50">
                  <Phone className="h-4 w-4" aria-hidden /> {p.telephone}
                </a>
              </li>
            )}
            {p?.liens?.linkedin && (
              <li>
                <a href={p.liens.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sand-200/75 hover:text-ecume-50">
                  <Linkedin className="h-4 w-4" aria-hidden /> LinkedIn
                </a>
              </li>
            )}
            <li>
              <a href={github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sand-200/75 hover:text-ecume-50">
                <Github className="h-4 w-4" aria-hidden /> GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-sand-200/10">
        <div className="conteneur flex flex-col items-start justify-between gap-3 py-5 text-xs text-sand-200/50 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {nom} · Illustrations originales
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 hover:text-ecume-50"
          >
            Retour au départ <ArrowUp className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </footer>
  );
}
