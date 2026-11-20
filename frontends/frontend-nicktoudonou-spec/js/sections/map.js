/* ==========================================================================
   05 — MAP (route 7 : graphe de compétences, Neo4j)
   Le graphe complet et interactif. Une liste cachée reprend les mêmes
   informations pour les lecteurs d'écran et la navigation au clavier.
   ========================================================================== */

import { esc, stateBlock } from "../dom.js";
import { loadGraph } from "../data.js";
import { GraphView, TYPE_LABEL } from "../graph.js";

export function template() {
  return `
  <section class="section dark map" id="map" data-section="05" data-label="Map">
    <span class="bignum" aria-hidden="true">05</span>
    <div class="container">
      <header class="sec-head grid">
        <span class="sec-num mono">05 / Map</span>
        <h2 class="sec-title" data-reveal>The<br><em class="serif">graph</em></h2>
        <p class="sec-intro" data-reveal style="--d:120ms">
          Mon parcours tel qu'il est stocké dans Neo4j : candidat → projets → compétences → domaines.
          Survolez un nœud, glissez-le, cliquez sur un projet.
        </p>
      </header>

      <div class="map__stage" data-reveal>
        <canvas class="map__canvas" role="img" aria-label="Graphe interactif des projets et compétences. Une version texte suit."></canvas>
      </div>

      <div class="map__bar mono">
        <div class="legend">
          <span><i class="l-candidat"></i>Candidat</span>
          <span><i class="l-projet"></i>Projet</span>
          <span><i class="l-competence"></i>Compétence</span>
          <span><i class="l-domaine"></i>Domaine</span>
        </div>
        <span class="js-map-count">src: neo4j · GET /api/graph/competences</span>
        <button class="map__reset mono" type="button">Réorganiser</button>
      </div>

      <div class="sr-only js-map-text"></div>
    </div>
  </section>`;
}

export function mount(root) {
  const stage = root.querySelector(".map__stage");
  const canvas = root.querySelector(".map__canvas");
  const tip = document.querySelector(".graph-tip");
  let alive = true;
  let view = null;

  loadGraph().then((g) => {
    if (!alive) return;
    if (!g.nodes.length) {
      stage.insertAdjacentHTML("beforeend", stateBlock(null, { empty: true, hint: "Le graphe est vide : lance « just seed »." }));
      return;
    }
    view = new GraphView(canvas, g, {
      mode: "map",
      tip,
      onSelect: (node) => { location.hash = `#/projet/${encodeURIComponent(node.id.replace(/^projet:/, ""))}`; },
    });
    root.querySelector(".map__reset").addEventListener("click", () => view.reheat());

    const count = (t) => g.nodes.filter((n) => n.type === t).length;
    root.querySelector(".js-map-count").textContent =
      `${count("projet")} projets · ${count("competence")} compétences · ${count("domaine")} domaines · ${g.links.length} liens`;

    // Version texte accessible
    const projets = g.nodes.filter((n) => n.type === "projet");
    root.querySelector(".js-map-text").innerHTML = `<h3>Version texte du graphe</h3><ul>${projets.map((p) => {
      const skills = g.links.filter((l) => l.source === p.id).map((l) => g.nodes.find((n) => n.id === l.target)?.label).filter(Boolean);
      return `<li><a href="#/projet/${encodeURIComponent(p.id.replace(/^projet:/, ""))}">${esc(TYPE_LABEL.projet)} ${esc(p.label)}</a> : ${esc(skills.join(", "))}</li>`;
    }).join("")}</ul>`;
  }).catch((error) => {
    if (alive) stage.insertAdjacentHTML("beforeend", stateBlock(error, { hint: "Vérifie que Neo4j répond (instance Aura « Running »)." }));
  });

  return () => { alive = false; view?.destroy(); };
}
