"use client";

import { type KeyboardEvent, useMemo, useState } from "react";
import type { Graph, GraphNode, NodeType } from "@/lib/api/types";
import styles from "./graph.module.css";

const RING: Record<NodeType, number> = { Candidat: 0, Projet: 165, Competence: 315, Domaine: 430 };
const RADIUS: Record<NodeType, number> = { Candidat: 36, Projet: 22, Competence: 15, Domaine: 26 };
const COLOR: Record<NodeType, string> = {
  Candidat: "#FFD166",
  Projet: "#FF3D8B",
  Competence: "#2EE6D6",
  Domaine: "#B26BFF",
};
const TYPE_LABEL: Record<NodeType, string> = {
  Candidat: "Candidat",
  Projet: "Projet",
  Competence: "Compétence",
  Domaine: "Domaine",
};

/** Libellé court sur le radar (le libellé complet reste dans aria-label et le panneau latéral). */
const MAX_LABEL = 20;
const shortLabel = (label: string) => (label.length > MAX_LABEL ? `${label.slice(0, MAX_LABEL - 1).trimEnd()}…` : label);

interface Positioned extends GraphNode {
  x: number;
  y: number;
}

const circularMean = (angles: number[]) =>
  Math.atan2(
    angles.reduce((s, a) => s + Math.sin(a), 0),
    angles.reduce((s, a) => s + Math.cos(a), 0),
  );

/** Place les nœuds en anneaux : candidat au centre, puis projets, compétences, domaines. */
function layout(graph: Graph): { nodes: Positioned[]; links: { source: string; target: string; type: string }[] } {
  const ids = new Set(graph.nodes.map((n) => n.id));
  const links = graph.links.filter((l) => ids.has(l.source) && ids.has(l.target));
  const label = new Map(graph.nodes.map((n) => [n.id, n.label]));
  const domaineOf = new Map(links.filter((l) => l.type === "APPARTIENT_A").map((l) => [l.source, l.target]));
  const angle = new Map<string, number>();
  const evenly = (list: GraphNode[]) =>
    list.forEach((n, i) => angle.set(n.id, -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, list.length)));

  // Compétences regroupées par domaine, réparties sur l'anneau
  const comps = graph.nodes
    .filter((n) => n.type === "Competence")
    .sort(
      (a, b) =>
        (label.get(domaineOf.get(a.id) ?? "") ?? "").localeCompare(label.get(domaineOf.get(b.id) ?? "") ?? "") ||
        a.label.localeCompare(b.label),
    );
  evenly(comps);

  // Domaines : au milieu de leurs compétences
  for (const d of graph.nodes.filter((n) => n.type === "Domaine")) {
    const a = comps.filter((c) => domaineOf.get(c.id) === d.id).map((c) => angle.get(c.id) ?? 0);
    angle.set(d.id, a.length ? circularMean(a) : 0);
  }

  // Projets : triés selon la direction moyenne de leurs compétences, puis répartis
  const projets = graph.nodes.filter((n) => n.type === "Projet");
  const projetDir = new Map(
    projets.map((p) => {
      const a = links.filter((l) => l.source === p.id && angle.has(l.target)).map((l) => angle.get(l.target) ?? 0);
      return [p.id, a.length ? circularMean(a) : 0];
    }),
  );
  projets.sort((a, b) => (projetDir.get(a.id) ?? 0) - (projetDir.get(b.id) ?? 0));
  const offset = projets.length ? (projetDir.get(projets[0].id) ?? 0) : 0;
  projets.forEach((p, i) => angle.set(p.id, offset + (i * 2 * Math.PI) / projets.length));

  const nodes = graph.nodes.map((n) => {
    const a = angle.get(n.id) ?? 0;
    const r = RING[n.type] ?? 0;
    return { ...n, x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
  return { nodes, links };
}

/** Radar circulaire animé : clic (ou Entrée) sur un nœud = ses liens s'illuminent (R5). */
export default function RadarGraph({ graph }: { graph: Graph }) {
  const { nodes, links } = useMemo(() => layout(graph), [graph]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [selected, setSelected] = useState<string | null>(null);

  const neighbors = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected]);
    for (const l of links) {
      if (l.source === selected) set.add(l.target);
      if (l.target === selected) set.add(l.source);
    }
    return set;
  }, [selected, links]);

  const toggle = (id: string) => setSelected((cur) => (cur === id ? null : id));
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(id);
    }
  };
  const sel = selected ? byId.get(selected) : null;
  const linkCount = (id: string) => links.filter((l) => l.source === id || l.target === id).length;

  return (
    <div className={styles.layout}>
      <div className={styles.radarWrap}>
        <div className={styles.sweep} aria-hidden="true" />
        <svg
          className={styles.svg}
          viewBox="-500 -500 1000 1000"
          role="group"
          aria-label="Graphe des compétences : candidat, projets, compétences et domaines"
          onKeyDown={(e) => {
            if (e.key === "Escape" && selected) {
              e.preventDefault(); // Échap désélectionne avant de quitter la section
              setSelected(null);
            }
          }}
        >
          {[RING.Projet, RING.Competence, RING.Domaine].map((r) => (
            <circle key={r} r={r} className={styles.ring} />
          ))}
          <g aria-hidden="true">
            {links.map((l, i) => {
              const a = byId.get(l.source);
              const b = byId.get(l.target);
              if (!a || !b) return null;
              const on = selected !== null && (l.source === selected || l.target === selected);
              const cls = selected ? (on ? styles.linkOn : styles.linkDim) : "";
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`${styles.link} ${cls}`} />;
            })}
          </g>
          {nodes.map((n) => {
            const isOn = selected === n.id;
            const dim = neighbors && !neighbors.has(n.id);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                className={`${styles.node} ${isOn ? styles.nodeOn : ""} ${dim ? styles.nodeDim : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={isOn}
                aria-label={`${TYPE_LABEL[n.type]} : ${n.label}, ${linkCount(n.id)} lien(s)`}
                onClick={() => toggle(n.id)}
                onKeyDown={(e) => onKey(e, n.id)}
                style={{ color: COLOR[n.type] }}
              >
                <circle r={RADIUS[n.type]} fill={COLOR[n.type]} className={styles.dot} />
                <text className={styles.label} y={RADIUS[n.type] + 22} textAnchor="middle">
                  {shortLabel(n.label)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.side}>
        <section className={`panel ${styles.box}`} aria-live="polite">
          <h2 className="title" style={{ fontSize: "1.3rem" }}>
            {sel ? sel.label : "Sélectionne un nœud"}
          </h2>
          {sel ? (
            <>
              <p className="mono" style={{ color: COLOR[sel.type] }}>
                {TYPE_LABEL[sel.type]} · {linkCount(sel.id)} lien(s)
              </p>
              <ul className={styles.neighbors}>
                {[...(neighbors ?? [])]
                  .filter((id) => id !== sel.id)
                  .map((id) => byId.get(id))
                  .filter((n): n is Positioned => Boolean(n))
                  .map((n) => (
                    <li key={n.id}>
                      <button type="button" className={`chip ${styles.chipBtn}`} onClick={() => setSelected(n.id)}>
                        {n.label}
                      </button>
                    </li>
                  ))}
              </ul>
              <button type="button" className="btn" style={{ marginTop: "1rem" }} onClick={() => setSelected(null)}>
                Tout afficher
              </button>
            </>
          ) : (
            <p className="muted">
              Clique (ou Tab + Entrée) sur un nœud du radar : ses liens s&apos;illuminent et ses voisins s&apos;affichent ici.
            </p>
          )}
        </section>

        <section className={`panel ${styles.box}`} aria-label="Légende">
          <ul className={styles.legend}>
            {(Object.keys(COLOR) as NodeType[]).map((t) => (
              <li key={t}>
                <span className={styles.swatch} style={{ background: COLOR[t] }} aria-hidden="true" />
                {TYPE_LABEL[t]} ({nodes.filter((n) => n.type === t).length})
              </li>
            ))}
          </ul>
        </section>

        <details className={`panel ${styles.box} ${styles.textVersion}`}>
          <summary className="mono">Version texte du graphe</summary>
          <ul>
            {nodes
              .filter((n) => n.type === "Projet")
              .map((p) => (
                <li key={p.id}>
                  <strong>{p.label}</strong> utilise :{" "}
                  {links
                    .filter((l) => l.source === p.id)
                    .map((l) => byId.get(l.target)?.label)
                    .filter(Boolean)
                    .join(", ")}
                </li>
              ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
