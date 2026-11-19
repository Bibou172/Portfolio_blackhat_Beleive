import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import type { Graphe, GraphNode } from "@/lib/types";

type Noeud = GraphNode & SimulationNodeDatum;
type Lien = { source: Noeud; target: Noeud; type: string };

const STYLE: Record<GraphNode["type"], { r: number; fill: string; label: string }> = {
  candidat: { r: 22, fill: "#F1E6D2", label: "Moi" },
  projet: { r: 13, fill: "#18A7B5", label: "Projet" },
  competence: { r: 7, fill: "#A9DDEB", label: "Compétence" },
  domaine: { r: 11, fill: "#2b7fa8", label: "Domaine" },
};

const L = 900;
const H = 600;

/** Calcule la disposition une seule fois (simulation statique), puis rend un SVG léger. */
function disposer(g: Graphe): { noeuds: Noeud[]; liens: Lien[] } {
  const noeuds: Noeud[] = g.nodes.map((n) => ({ ...n }));
  const parId = new Map(noeuds.map((n) => [n.id, n]));
  const liensBruts = g.links
    .filter((l) => parId.has(l.source) && parId.has(l.target))
    .map((l) => ({ source: l.source, target: l.target, type: l.type }));
  const sim = forceSimulation(noeuds)
    .force(
      "link",
      forceLink<Noeud, { source: string; target: string }>(liensBruts)
        .id((d) => d.id)
        .distance((l) => ((l.source as unknown as Noeud).type === "candidat" ? 110 : 70)),
    )
    .force("charge", forceManyBody().strength(-260))
    .force("collide", forceCollide<Noeud>().radius((d) => STYLE[d.type].r + 14))
    .force("x", forceX(L / 2).strength(0.04))
    .force("y", forceY(H / 2).strength(0.07))
    .force("center", forceCenter(L / 2, H / 2))
    .stop();
  for (let i = 0; i < 320; i++) sim.tick();
  return { noeuds, liens: liensBruts as unknown as Lien[] };
}

export default function SkillGraph({ graphe }: { graphe: Graphe }) {
  const navigate = useNavigate();
  const [survol, setSurvol] = useState<string | null>(null);
  const { noeuds, liens } = useMemo(() => disposer(graphe), [graphe]);

  // Cadre ajusté au contenu
  const xs = noeuds.map((n) => n.x ?? 0);
  const ys = noeuds.map((n) => n.y ?? 0);
  const marge = 60;
  const vb = noeuds.length
    ? `${Math.min(...xs) - marge} ${Math.min(...ys) - marge} ${Math.max(...xs) - Math.min(...xs) + 2 * marge} ${Math.max(...ys) - Math.min(...ys) + 2 * marge}`
    : `0 0 ${L} ${H}`;

  const voisins = useMemo(() => {
    if (!survol) return null;
    const s = new Set([survol]);
    liens.forEach((l) => {
      if (l.source.id === survol) s.add(l.target.id);
      if (l.target.id === survol) s.add(l.source.id);
    });
    return s;
  }, [survol, liens]);

  const peu = noeuds.length <= 28;

  return (
    <figure>
      <div className="overflow-hidden rounded-3xl border border-ciel/15 bg-ocean-950/40">
        <svg viewBox={vb} className="h-[440px] w-full sm:h-[560px]" role="img" aria-label="Graphe reliant le candidat, ses projets, ses compétences et leurs domaines">
          <g>
            {liens.map((l, i) => {
              const actif = voisins && voisins.has(l.source.id) && voisins.has(l.target.id);
              return (
                <line
                  key={i}
                  x1={l.source.x}
                  y1={l.source.y}
                  x2={l.target.x}
                  y2={l.target.y}
                  stroke={actif ? "#55C9D0" : "#A9DDEB"}
                  strokeOpacity={voisins ? (actif ? 0.9 : 0.06) : 0.22}
                  strokeWidth={actif ? 2 : 1.2}
                  strokeDasharray={l.type === "APPARTIENT_A" ? "4 4" : undefined}
                  style={{ transition: "stroke-opacity .25s" }}
                />
              );
            })}
          </g>
          <g>
            {noeuds.map((n) => {
              const st = STYLE[n.type];
              const r = n.type === "competence" ? st.r + (n.niveau ?? 0) * 1.2 : st.r;
              const attenue = voisins && !voisins.has(n.id);
              const afficherLabel = n.type !== "competence" || peu || voisins?.has(n.id);
              const cliquable = n.type === "projet";
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  opacity={attenue ? 0.18 : 1}
                  style={{ transition: "opacity .25s", cursor: cliquable ? "pointer" : "default" }}
                  onMouseEnter={() => setSurvol(n.id)}
                  onMouseLeave={() => setSurvol(null)}
                  onFocus={() => setSurvol(n.id)}
                  onBlur={() => setSurvol(null)}
                  onClick={() => cliquable && navigate(`/projets/${n.id.split(":")[1]}`)}
                  onKeyDown={(e) => cliquable && e.key === "Enter" && navigate(`/projets/${n.id.split(":")[1]}`)}
                  tabIndex={cliquable ? 0 : -1}
                  role={cliquable ? "link" : undefined}
                  aria-label={cliquable ? `Projet ${n.label}` : undefined}
                >
                  {n.type === "candidat" && <circle r={r + 8} fill="none" stroke="#55C9D0" strokeOpacity={0.6} strokeDasharray="3 4" />}
                  <circle r={r} fill={st.fill} stroke="#051f33" strokeWidth={2} />
                  {afficherLabel && (
                    <text
                      y={r + 14}
                      textAnchor="middle"
                      fontSize={n.type === "candidat" ? 15 : n.type === "competence" ? 11 : 12.5}
                      fontWeight={n.type === "competence" ? 400 : 600}
                      fill="#F4FAFC"
                      stroke="#051f33"
                      strokeWidth={3}
                      paintOrder="stroke"
                      style={{ fontFamily: "Inter, sans-serif", pointerEvents: "none" }}
                    >
                      {n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <figcaption className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-sand-200/80">
        {(Object.keys(STYLE) as GraphNode["type"][]).map((t) => (
          <span key={t} className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: STYLE[t].fill, boxShadow: "0 0 0 2px rgba(169,221,235,.3)" }} />
            {STYLE[t].label}
          </span>
        ))}
        <span className="text-sand-200/50">Survolez un nœud pour suivre ses liens · cliquez sur un projet pour l'ouvrir</span>
      </figcaption>
    </figure>
  );
}
