import type { ReactNode } from "react";
import Reveal from "./Reveal";

interface Props {
  etape: string; // « 01 »
  surtitre: string; // « À propos »
  titre: ReactNode;
  intro?: ReactNode;
  clair?: boolean; // texte clair sur fond sombre
}

/** En-tête de section façon carnet de route : « Étape 02 · Compétences ». */
export default function SectionHeader({ etape, surtitre, titre, intro, clair }: Props) {
  return (
    <Reveal className="mb-12 max-w-2xl md:mb-16">
      <p className={`surtitre flex items-center gap-3 ${clair ? "text-lagon-400" : ""}`}>
        <span>Étape {etape}</span>
        <span className={`h-px w-10 ${clair ? "bg-sand-200/40" : "bg-lagon-600/40"}`} aria-hidden />
        <span>{surtitre}</span>
      </p>
      <h2 className={`mt-4 text-3xl font-semibold leading-[1.1] sm:text-[2.6rem] ${clair ? "text-ecume-50" : "text-ocean-900"}`}>
        {titre}
      </h2>
      {intro && <p className={`mt-5 text-base leading-relaxed sm:text-lg ${clair ? "text-sand-200/80" : "text-ink/70"}`}>{intro}</p>}
    </Reveal>
  );
}
