/** Petits motifs illustrés (décoratifs, ignorés par les lecteurs d'écran) : avion en papier, voilier, boussole. */

type Nom = "avion" | "bateau" | "boussole";

const DESSINS: Record<Nom, JSX.Element> = {
  avion: (
    <svg viewBox="0 0 160 110" fill="none">
      <path d="M8 96C40 80 60 92 84 70" stroke="#063B5C" strokeOpacity=".35" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
      <path d="M86 64L150 14 70 40z" fill="#F4FAFC" stroke="#063B5C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M150 14L96 50l-6 26z" fill="#55C9D0" stroke="#063B5C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M150 14L86 64l10-14z" fill="#18A7B5" stroke="#063B5C" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  ),
  bateau: (
    <svg viewBox="0 0 140 130" fill="none">
      <path d="M22 96h96l-14 18H36z" fill="#F4FAFC" stroke="#063B5C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M70 90V14" stroke="#063B5C" strokeWidth="3" strokeLinecap="round" />
      <path d="M74 18c26 22 34 48 32 72H74z" fill="#55C9D0" stroke="#063B5C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M66 30c-18 18-26 38-28 60h28z" fill="#F1E6D2" stroke="#063B5C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M70 10l14 6-14 6z" fill="#18A7B5" />
      <path d="M8 122q12-8 24 0t24 0 24 0 24 0 24 0" stroke="#18A7B5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  boussole: (
    <svg viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="52" fill="#F4FAFC" stroke="#063B5C" strokeWidth="3" />
      <circle cx="60" cy="60" r="40" stroke="#063B5C" strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 6" />
      <path d="M60 16l9 44-9 44-9-44z" fill="#063B5C" />
      <path d="M60 16l9 44H51z" fill="#18A7B5" />
      <circle cx="60" cy="60" r="5" fill="#F4FAFC" stroke="#063B5C" strokeWidth="2" />
    </svg>
  ),
};

/** Le dessin seul, pour l'utiliser dans le flux de la page. */
export function Dessin({ nom }: { nom: Nom }) {
  return DESSINS[nom];
}

export default function Motif({ nom, className = "" }: { nom: Nom; className?: string }) {
  return (
    <div className={`pointer-events-none absolute hidden animate-float md:block ${className}`} aria-hidden>
      {DESSINS[nom]}
    </div>
  );
}
