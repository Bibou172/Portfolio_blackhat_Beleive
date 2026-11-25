import { useRessource } from "@/lib/hooks";
import { getGraphe } from "@/lib/portfolio";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import SkillGraph from "@/components/SkillGraph";

export default function GraphSection() {
  const g = useRessource(getGraphe, []);
  // Rien à montrer si le graphe ne contient que le candidat.
  if (!g.chargement && (!g.data || g.data.nodes.length < 2)) return null;

  return (
    <section id="graphe" className="fond-abysse relative overflow-hidden py-24 text-ecume-50 sm:py-32">
      <div className="conteneur">
        <SectionHeader
          etape="06"
          surtitre="Graphe de compétences"
          clair
          titre={
            <>
              La carte <span className="italic text-lagon-400">des connexions</span>
            </>
          }
          intro="Comment mes projets, mes compétences et leurs domaines se relient : une vue issue de la base graphe Neo4j du projet (Candidat → Projet → Compétence → Domaine)."
        />
        <Reveal>
          {g.chargement || !g.data ? (
            <div className="h-[440px] animate-pulse rounded-3xl bg-ocean-900 sm:h-[560px]" />
          ) : (
            <SkillGraph graphe={g.data} />
          )}
        </Reveal>
      </div>
    </section>
  );
}
