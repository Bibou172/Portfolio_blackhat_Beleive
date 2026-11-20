import { Briefcase, GraduationCap, Layers, MapPin } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { libelleDomaine, trierDomaines } from "@/lib/format";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";

export default function About() {
  const { data: p } = useProfil();
  if (!p) return null;

  const derniereFormation = [...p.formations].sort((a, b) => b.debut.localeCompare(a.debut))[0];
  const derniereExperience = [...p.experiences].sort((a, b) => b.debut.localeCompare(a.debut))[0];
  const domaines = trierDomaines(p.competences.map((c) => c.domaine));
  const lieux = [...new Set([...p.experiences, ...p.formations].map((e) => e.lieu).filter(Boolean))] as string[];

  const reperes = [
    derniereFormation && {
      icone: GraduationCap,
      titre: derniereFormation.ecole,
      texte: derniereFormation.diplome,
    },
    derniereExperience && {
      icone: Briefcase,
      titre: derniereExperience.poste,
      texte: derniereExperience.entreprise,
    },
    domaines.length > 0 && {
      icone: Layers,
      titre: `${p.competences.length} compétence${p.competences.length > 1 ? "s" : ""}`,
      texte: domaines.map(libelleDomaine).join(" · "),
    },
    lieux.length > 0 && {
      icone: MapPin,
      titre: lieux.length > 1 ? "Escales" : "Escale",
      texte: lieux.join(" · "),
    },
  ].filter(Boolean) as { icone: typeof MapPin; titre: string; texte: string }[];

  return (
    <section id="a-propos" className="topo relative py-24 sm:py-32">
      <div className="conteneur grid items-start gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <SectionHeader
            etape="02"
            surtitre="À propos"
            titre={
              <>
                Le point de départ <span className="italic text-lagon-600">du voyage</span>
              </>
            }
          />
          <Reveal className="space-y-5 text-lg leading-relaxed text-ink/80">
            {p.bio && <p>{p.bio}</p>}
            {p.recherche && (
              <p className="border-l-2 border-lagon-500 pl-5 font-display text-xl italic text-ocean-900">{p.recherche}</p>
            )}
          </Reveal>

          {reperes.length > 0 && (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {reperes.map((r, i) => (
                <Reveal as="li" key={r.titre} delai={i * 70} className="carte flex gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ecume-100 text-lagon-700">
                    <r.icone className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ocean-900">{r.titre}</p>
                    <p className="mt-0.5 text-sm text-ink/65">{r.texte}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          )}
        </div>

        <Reveal delai={120} className="relative hidden lg:block">
          <div className="relative overflow-hidden rounded-[2rem] shadow-lift">
            <img src="/illustrations/carte-voyage.svg" alt="Carte de voyage illustrée : îles, itinéraire en pointillés, rose des vents, avion et bateau" loading="lazy" className="aspect-[4/5] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/85 via-ocean-900/10 to-transparent" aria-hidden />
            <p className="absolute bottom-6 left-6 right-6 font-display text-2xl italic leading-snug text-ecume-50">
              « Préparer l'itinéraire, puis avancer étape par étape. »
            </p>
          </div>
          <div className="absolute -bottom-6 -left-6 -z-10 h-full w-full rounded-[2rem] border-2 border-dashed border-lagon-500/30" aria-hidden />
        </Reveal>
      </div>
    </section>
  );
}
