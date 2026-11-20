import type { Metadata } from "next";
import { Suspense } from "react";
import ApiStatusReporter from "@/components/ApiStatusReporter";
import RadarGraph from "@/components/RadarGraph";
import SectionShell from "@/components/SectionShell";
import SectionSkeleton from "@/components/SectionSkeleton";
import { getGraphCompetences } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Graphe",
  description: "Radar des liens entre projets, compétences et domaines (Neo4j).",
};

export default function GraphePage() {
  return (
    <SectionShell id="graphe" kicker="Radar des connexions">
      <Suspense fallback={<SectionSkeleton label="Balayage du radar…" />}>
        <GrapheContent />
      </Suspense>
    </SectionShell>
  );
}

async function GrapheContent() {
  // R5 : graphe {nodes, links} venant de Neo4j
  const graph = await getGraphCompetences();
  return (
    <>
      <ApiStatusReporter offline={graph.offline} />
      <RadarGraph graph={graph.data} />
    </>
  );
}
