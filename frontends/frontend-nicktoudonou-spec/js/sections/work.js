/* ==========================================================================
   01 — SELECTED WORK (routes 2 et 3)
   Grille asymétrique de projets, filtrable par compétence via l'API.
   ========================================================================== */

import { esc, pad, ARROW_UP, stateBlock, guardImages } from "../dom.js";
import { loadProjets, loadProfil } from "../data.js";
import { reveal } from "../motion.js";

export function template() {
  return `
  <section class="section work" id="work" data-section="01" data-label="Selected Work">
    <span class="bignum" aria-hidden="true">01</span>
    <div class="container">
      <header class="sec-head grid">
        <span class="sec-num mono">01 / Work</span>
        <h2 class="sec-title" data-reveal>Selected<br><em class="serif">work</em></h2>
        <p class="sec-intro" data-reveal style="--d:120ms">
          Des projets présentés comme des études de cas. Chaque fiche vient de MongoDB ;
          les projets voisins sont calculés par Neo4j.
        </p>
        <div class="work__filters chips js-filters" role="toolbar" aria-label="Filtrer par compétence"></div>
      </header>
      <div class="grid work__list js-work" aria-live="polite">
        ${skeleton()}
      </div>
    </div>
  </section>`;
}

function skeleton() {
  return [1, 2].map(() => `<div class="card"><div class="card__media skeleton"></div></div>`).join("");
}

/* Couverture générée : numéro géant en contour + compétences */
export function cover(index, competences, labels) {
  const tags = competences.slice(0, 4).map((s) => `<li>${esc(labels.get(s) ?? s)}</li>`).join("");
  return `<div class="cover">
    <span class="cover__mark" aria-hidden="true"></span>
    <span class="cover__num" aria-hidden="true">${pad(index)}</span>
    <ul class="tags">${tags}</ul>
  </div>`;
}

function card(p, i, labels) {
  const media = p.image
    ? `<img class="photo" data-optional src="${esc(p.image)}" alt="" loading="lazy" decoding="async">${cover(i + 1, p.competences, labels)}`
    : cover(i + 1, p.competences, labels);
  const tags = p.competences.map((s) => `<li>${esc(labels.get(s) ?? s)}</li>`).join("");
  return `
  <a class="card" href="#/projet/${encodeURIComponent(p.slug)}" data-reveal style="--d:${(i % 2) * 120}ms">
    <div class="card__media">${media}</div>
    <div class="card__meta mono">
      <span>P.${pad(i + 1)}</span>
      <span>${p.annee ?? "—"}</span>
      <span>${p.competences.length} compétence${p.competences.length > 1 ? "s" : ""}</span>
    </div>
    <h3 class="card__title"><span>${esc(p.titre)}</span>${ARROW_UP}</h3>
    ${p.description ? `<p class="card__desc">${esc(p.description)}</p>` : ""}
    <ul class="tags">${tags}</ul>
  </a>`;
}

export function mount(root) {
  const list = root.querySelector(".js-work");
  const filters = root.querySelector(".js-filters");
  let alive = true;
  let labels = new Map();
  let all = [];

  const draw = (projets) => {
    if (!alive) return;
    list.innerHTML = projets.length
      ? projets.map((p) => card(p, all.findIndex((x) => x.slug === p.slug), labels)).join("")
      : stateBlock(null, { empty: true, hint: "Aucun projet pour ce filtre." });
    // l'image (si elle existe) recouvre la couverture générée ; si elle échoue, la couverture reste
    guardImages(list);
    reveal(list);
  };

  const setFilter = async (slug, button) => {
    filters.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    list.style.opacity = "0.35";
    try {
      draw(await loadProjets(slug));
    } catch {
      // repli : filtrage local si la route avec ?competence= échoue
      draw(slug ? all.filter((p) => p.competences.includes(slug)) : all);
    } finally {
      list.style.transition = "opacity .4s";
      list.style.opacity = "1";
    }
  };

  Promise.all([loadProjets(), loadProfil().catch(() => ({ competences: [] }))])
    .then(([projets, profil]) => {
      if (!alive) return;
      all = projets;
      labels = new Map((profil.competences ?? []).map((c) => [c.skill_slug, c.nom]));

      // filtres : compétences les plus utilisées dans les projets
      const usage = new Map();
      projets.forEach((p) => p.competences.forEach((s) => usage.set(s, (usage.get(s) ?? 0) + 1)));
      const top = [...usage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s]) => s);
      if (projets.length > 1 && top.length) {
        filters.innerHTML = [`<button class="chip" type="button" data-skill="" aria-pressed="true">Tout · ${projets.length}</button>`,
          ...top.map((s) => `<button class="chip" type="button" data-skill="${esc(s)}" aria-pressed="false">${esc(labels.get(s) ?? s)}</button>`)].join("");
        filters.addEventListener("click", (e) => {
          const b = e.target.closest(".chip");
          if (b) setFilter(b.dataset.skill, b);
        });
      }
      draw(projets);
    })
    .catch((error) => {
      if (alive) list.innerHTML = stateBlock(error, { hint: "Les projets viennent de GET /api/projets." });
    });

  return () => { alive = false; };
}
