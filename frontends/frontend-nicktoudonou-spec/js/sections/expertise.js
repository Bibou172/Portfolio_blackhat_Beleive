/* ==========================================================================
   03 — EXPERTISE (route 5 : statistiques, agrégation MongoDB)
   Aucun pourcentage inventé : chaque barre = nombre réel de projets.
   ========================================================================== */

import { esc, domaineLabel, stateBlock } from "../dom.js";
import { loadStats } from "../data.js";
import { reveal } from "../motion.js";

export function template() {
  return `
  <section class="section dark expertise" id="expertise" data-section="03" data-label="Expertise">
    <span class="bignum" aria-hidden="true">03</span>
    <div class="container">
      <header class="sec-head grid">
        <span class="sec-num mono">03 / Expertise</span>
        <h2 class="sec-title" data-reveal>Measured,<br><em class="serif">not claimed</em></h2>
        <p class="sec-intro" data-reveal style="--d:120ms">
          Pas de jauges inventées. Chaque compétence est mesurée par son usage réel
          dans mes projets, calculé par une agrégation MongoDB.
        </p>
      </header>
      <div class="grid expertise__grid js-expertise">
        <div class="domain"><div class="skeleton" style="height:220px"></div></div>
        <div class="domain"><div class="skeleton" style="height:220px"></div></div>
      </div>
    </div>
  </section>`;
}

export function mount(root) {
  const box = root.querySelector(".js-expertise");
  let alive = true;

  loadStats().then(({ items, autres, source }) => {
    if (!alive) return;
    if (!items.length && !autres.length) {
      box.innerHTML = stateBlock(null, { empty: true, hint: "Ajoute des compétences à tes projets puis relance « just seed »." });
      return;
    }

    const max = Math.max(1, ...items.map((s) => s.nb_projets));
    const groups = new Map();
    for (const s of items) {
      const key = s.domaine ?? "autres";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    }
    const ordered = [...groups.entries()].sort((a, b) =>
      b[1].reduce((n, s) => n + s.nb_projets, 0) - a[1].reduce((n, s) => n + s.nb_projets, 0));

    const domains = ordered.map(([slug, skills], gi) => `
      <div class="domain" data-reveal style="--d:${(gi % 2) * 120}ms">
        <div class="domain__head">
          <h3>${esc(domaineLabel(slug))}</h3>
          <span class="mono">${skills.length} compétence${skills.length > 1 ? "s" : ""}</span>
        </div>
        ${skills.map((s, i) => `
          <div class="skill">
            <span class="skill__name">${esc(s.nom)}</span>
            <span class="skill__bar" aria-hidden="true"><i style="--w:${(s.nb_projets / max) * 100}%;--d:${200 + i * 80}ms"></i></span>
            <span class="skill__facts mono"><strong>${s.nb_projets}</strong>projet${s.nb_projets > 1 ? "s" : ""}${s.derniere_annee ? ` · ${s.derniere_annee}` : ""}</span>
          </div>`).join("")}
      </div>`).join("");

    const also = autres.length ? `
      <div class="expertise__also" data-reveal>
        <h3 class="mono">Également pratiqué</h3>
        <ul class="tags">${autres.map((c) => `<li>${esc(c.nom)}</li>`).join("")}</ul>
      </div>` : "";

    box.innerHTML = `${domains}${also}
      <p class="expertise__note mono" data-reveal>
        <span>Barre = nombre de projets utilisant la compétence</span>
        <span>src: ${esc(source)}</span>
      </p>`;
    reveal(box);
  }).catch((error) => {
    if (alive) box.innerHTML = stateBlock(error, { hint: "Les statistiques viennent de GET /api/stats/competences." });
  });

  return () => { alive = false; };
}
