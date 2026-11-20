/* ==========================================================================
   00 — HERO + bande de chiffres
   Le visuel n'est pas décoratif : c'est TON graphe de compétences (Neo4j),
   qui s'assemble à l'arrivée sur le site.
   ========================================================================== */

import { CONFIG } from "../config.js";
import { esc, ARROW, guardImages } from "../dom.js";
import { loadProfil, loadProjets, loadGraph } from "../data.js";
import { GraphView, grapheDeSecours } from "../graph.js";
import { countUp } from "../motion.js";

export function template() {
  const year = new Date().getFullYear();
  const dispo = CONFIG.disponibilite
    ? `<span class="status mono"><i aria-hidden="true"></i>${esc(CONFIG.disponibilite)}</span>`
    : "";
  return `
  <section class="hero" id="intro" data-section="00" data-label="Intro">
    <div class="container hero__grid">
      <div class="hero__meta mono">
        <span>N° 01 — Portfolio ${year}</span>
        <span>Data · BI · Visualisation</span>
        <span>${esc(CONFIG.ville)}</span>
      </div>

      <h1 class="hero__title display" aria-label="I turn complex data into clarity.">
        <span class="line" aria-hidden="true"><span style="--i:0">I turn</span></span>
        <span class="line" aria-hidden="true"><span style="--i:1">complex data</span></span>
        <span class="line" aria-hidden="true"><span style="--i:2">into <em class="serif">clarity.</em></span></span>
      </h1>

      <div class="hero__aside">
        <p class="hero__role" data-reveal style="--d:500ms">
          Data Analyst — Big Data &amp; Digital Transformation
          <span class="muted js-hero-who">Cédric Akle</span>
        </p>
        <div class="hero__cta" data-reveal style="--d:620ms">
          ${dispo}
          <a class="btn btn--ink" href="#/work">Voir les projets ${ARROW}</a>
        </div>
      </div>

      <figure class="hero__visual" data-has-photo>
        <img class="photo" data-optional src="${esc(CONFIG.images.hero)}" alt="" decoding="async" fetchpriority="high">
        <canvas class="hero__graph" role="img" aria-label="Graphe de compétences : candidat, projets, compétences et domaines, chargé depuis Neo4j."></canvas>
        <span class="corner corner--tl" aria-hidden="true"></span>
        <span class="corner corner--tr" aria-hidden="true"></span>
        <figcaption class="mono">
          <span>Fig. 01 — Graphe de compétences</span>
          <span class="js-hero-count">Neo4j</span>
        </figcaption>
      </figure>

      <div class="hero__foot mono">
        <span>Explore. Discover. Understand.</span>
        <span class="scroll-cue">Scroll <i aria-hidden="true"></i></span>
      </div>
    </div>
  </section>

  <section class="ledger" aria-label="Le portfolio en chiffres">
    <div class="container ledger__row">
      ${cell("projets", "Projets", "mongodb · projets")}
      ${cell("competences", "Compétences", "mongodb · candidats")}
      ${cell("domaines", "Domaines", "neo4j · :Domaine")}
      ${cell("liens", "Relations", "neo4j · graphe")}
    </div>
  </section>`;
}

function cell(key, label, src) {
  return `<div class="ledger__cell" data-reveal>
    <span class="ledger__num js-n-${key}" aria-live="polite">—</span>
    <span class="ledger__label">${label}</span>
    <span class="ledger__src mono">src: ${src}</span>
  </div>`;
}

export function mount(root) {
  const hero = root.querySelector("#intro");
  let alive = true;
  let view = null;

  guardImages(hero);
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("is-ready")));

  const setNum = (key, value) => {
    const el = root.querySelector(`.js-n-${key}`);
    if (el && alive) countUp(el, value);
  };

  loadProfil().then((p) => {
    if (!alive) return;
    const who = [p.prenom, p.nom].filter(Boolean).join(" ");
    root.querySelector(".js-hero-who").textContent = [who, p.titre].filter(Boolean).join(" · ");
    const comps = p.competences ?? [];
    setNum("competences", comps.length);
  }).catch(() => {});

  loadProjets().then((list) => setNum("projets", list.length)).catch(() => {});

  const canvas = hero.querySelector(".hero__graph");
  const count = hero.querySelector(".js-hero-count");

  loadGraph()
    .then((g) => {
      if (!g.nodes.length) throw new Error("graphe vide");
      setNum("domaines", g.nodes.filter((n) => n.type === "domaine").length);
      setNum("liens", g.links.length);
      count.textContent = `${g.nodes.length} nœuds · ${g.links.length} liens`;
      return g;
    })
    .catch(async () => {
      count.textContent = "Aperçu · Neo4j indisponible";
      const profil = await loadProfil().catch(() => null);
      return grapheDeSecours(profil);
    })
    .then((g) => {
      if (alive) view = new GraphView(canvas, g, { mode: "hero" });
    });

  return () => { alive = false; view?.destroy(); };
}
