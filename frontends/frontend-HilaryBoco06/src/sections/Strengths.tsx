import { CheckCircle2 } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { useRessource } from "@/lib/hooks";
import { getProjets } from "@/lib/portfolio";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import Motif from "@/components/Motif";

/** Chiffres et points forts — uniquement calculés à partir des données réelles du profil. */
export default function Strengths() {
  const { data: p } = useProfil();
  const projets = useRessource(() => getProjets(), []);
  if (!p) return null;

  const nbProjets = projets.data?.length ?? 0;
  const domaines = new Set(p.competences.map((c) => c.domaine)).size;
  const chiffres = [
    { valeur: nbProjets, label: nbProjets > 1 ? "projets réalisés" : "projet réalisé" },
    { valeur: p.competences.length, label: "compétences" },
    { valeur: domaines, label: domaines > 1 ? "domaines techniques" : "domaine technique" },
    { valeur: p.experiences.length, label: p.experiences.length > 1 ? "expériences" : "expérience" },
  ].filter((c) => c.valeur > 0);

  const points = p.points_forts ?? [];
  if (chiffres.length === 0 && points.length === 0) return null;

  return (
    <section id="points-forts" className="topo relative overflow-hidden py-24 sm:py-32">
      <Motif nom="bateau" className="right-[7%] top-16 w-32 lg:w-40" />
      <div className="conteneur relative">
        <SectionHeader
          etape="05"
          surtitre="Points forts"
          titre={
            <>
              Ce que je mets <span className="italic text-lagon-600">dans la valise</span>
            </>
          }
        />

        {chiffres.length > 0 && (
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {chiffres.map((c, i) => (
              <Reveal key={c.label} delai={i * 70} className="carte relative flex flex-col-reverse overflow-hidden p-6">
                <dt className="mt-1 text-sm text-ink/60">{c.label}</dt>
                <dd className="font-display text-5xl font-semibold text-ocean-900">{c.valeur}</dd>
                <span className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-lagon-600/10" aria-hidden />
              </Reveal>
            ))}
          </dl>
        )}

        {points.length > 0 && (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {points.map((pt, i) => (
              <Reveal as="li" key={pt} delai={i * 60} className="flex gap-3 rounded-2xl bg-white/70 p-5 ring-1 ring-ocean-900/[0.06]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lagon-600" aria-hidden />
                <span className="leading-relaxed text-ink/80">{pt}</span>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
