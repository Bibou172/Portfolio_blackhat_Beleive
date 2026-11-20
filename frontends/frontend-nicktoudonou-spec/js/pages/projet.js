/* ==========================================================================
   PAGE PROJET — étude de cas (route 3) + projets similaires (route 6).
   Les similaires se chargent à part : si Neo4j tombe, le projet s'affiche quand même.
   ========================================================================== */

import { esc, pad, safeUrl, ARROW, stateBlock, guardImages } from "../dom.js";
import { loadProjet, loadProjets, loadSimilaires, loadProfil } from "../data.js";
import { reveal } from "../motion.js";
import { cover } from "../sections/work.js";

const ETUDE = [
  ["contexte", "Contexte"],
  ["probleme", "Problème"],
  ["objectifs", "Objectifs"],
  ["donnees", "Données"],
  ["methodologie", "Méthodologie"],
  ["resultats", "Résultats"],
  ["enseignements", "Enseignements"],
];

function texte(value) {
  if (Array.isArray(value)) return value.join("\n");
  return value ?? "";
}

export function renderProjet(app, slug) {
  let alive = true;
  app.innerHTML = `
    <article class="projet" data-section="P" data-label="Étude de cas">
      <div class="container">
        <a class="projet__back mono" href="#/work">${ARROW}Selected work</a>
        <div class="js-projet"><div class="skeleton" style="height:60vh;margin-top:40px"></div></div>
      </div>
    </article>`;

  const box = app.querySelector(".js-projet");

  Promise.all([
    loadProjet(slug),
    loadProjets().catch(() => []),
    loadProfil().catch(() => ({ competences: [] })),
  ]).then(([p, tous, profil]) => {
    if (!alive) return;
    document.title = `${p.titre} — Cédric Akle`;
    const labels = new Map((profil.competences ?? []).map((c) => [c.skill_slug, c.nom]));
    const index = Math.max(0, tous.findIndex((x) => x.slug === p.slug));
    const suivant = tous.length > 1 ? tous[(index + 1) % tous.length] : null;

    const repo = safeUrl(p.repo);
    const demo = safeUrl(p.demo);
    const metriques = Object.entries(p.metriques ?? {});

    const blocs = ETUDE.filter(([key]) => texte(p.etude[key]).trim())
      .map(([key, label], i) => `
        <section class="study__block" data-reveal>
          <span class="mono">${pad(i + 1)} — ${label}</span>
          <h2>${label}</h2>
          <p>${esc(texte(p.etude[key]))}</p>
        </section>`).join("");

    const corps = blocs || `
      <section class="study__block" data-reveal>
        <span class="mono">01 — Le projet</span>
        <h2>Le projet</h2>
        <p>${esc(p.descriptionLongue || p.description || "Description à venir.")}</p>
      </section>`;

    box.innerHTML = `
      <div class="projet__meta mono">
        <span>P.${pad(index + 1)}</span>
        <span>${p.annee ?? "—"}</span>
        <span>${esc(p.slug)}</span>
      </div>
      <h1 class="projet__title display" data-reveal>${esc(p.titre)}</h1>
      ${p.description ? `<p class="projet__lead" data-reveal style="--d:120ms">${esc(p.description)}</p>` : ""}

      <figure class="projet__cover" data-reveal>
        ${p.image ? `<img class="photo" data-optional src="${esc(p.image)}" alt="" decoding="async">` : ""}
        ${cover(index + 1, p.competences, labels)}
      </figure>

      <div class="grid projet__body">
        <dl class="facts">
          <div><dt class="mono">Année</dt><dd>${p.annee ?? "—"}</dd></div>
          <div><dt class="mono">Compétences</dt><dd><ul class="tags">${p.competences.map((s) => `<li>${esc(labels.get(s) ?? s)}</li>`).join("")}</ul></dd></div>
          ${repo ? `<div><dt class="mono">Code</dt><dd><a class="link" href="${esc(repo)}" target="_blank" rel="noopener">${esc(repo.replace(/^https?:\/\//, ""))}</a></dd></div>` : ""}
          ${demo ? `<div><dt class="mono">Démo</dt><dd><a class="link" href="${esc(demo)}" target="_blank" rel="noopener">Voir la démo</a></dd></div>` : ""}
          ${metriques.map(([k, v]) => `<div><dt class="mono">${esc(k.replace(/_/g, " "))}</dt><dd class="metric">${esc(v)}</dd></div>`).join("")}
        </dl>
        <div class="study">${corps}</div>
      </div>
    `;
    guardImages(box);
    reveal(box);

    // Bloc sombre : similaires + projet suivant
    const dark = document.createElement("section");
    dark.className = "dark similar-wrap";
    dark.innerHTML = `
      <div class="container similar">
        <header class="sec-head grid" style="margin-bottom:40px">
          <span class="sec-num mono">Neo4j</span>
          <h2 class="sec-title" data-reveal>Related<br><em class="serif">work</em></h2>
          <p class="sec-intro" data-reveal>Projets qui partagent le plus de compétences avec celui-ci, calculés en parcourant le graphe.</p>
        </header>
        <div class="similar__list js-similar"><div class="skeleton" style="height:220px"></div></div>
      </div>
      ${suivant && suivant.slug !== p.slug ? `
      <div class="container">
        <a class="next" href="#/projet/${encodeURIComponent(suivant.slug)}" style="margin-top:clamp(80px,10vw,140px)">
          <span class="mono">Projet suivant</span>
          <strong><span>${esc(suivant.titre)}</span>${ARROW}</strong>
        </a>
      </div>` : `<div style="height:clamp(80px,10vw,140px)"></div>`}`;
    app.querySelector(".projet").appendChild(dark);
    dark.style.paddingTop = "clamp(80px,10vw,140px)";
    dark.style.marginTop = "clamp(96px,12vw,176px)";
    reveal(dark);

    const sim = dark.querySelector(".js-similar");
    loadSimilaires(p.slug).then((items) => {
      if (!alive) return;
      sim.innerHTML = items.length
        ? items.map((s) => `
          <a class="mini" href="#/projet/${encodeURIComponent(s.projet_slug)}">
            <span class="mini__score mono"><strong>${s.nb_communes ?? (s.competences_communes ?? []).length}</strong>compétence(s) en commun</span>
            <div>
              <h3>${esc(s.titre ?? s.projet_slug)}</h3>
              <ul class="tags" style="margin-top:12px">${(s.competences_communes ?? []).map((c) => `<li>${esc(labels.get(c) ?? c)}</li>`).join("")}</ul>
            </div>
          </a>`).join("")
        : stateBlock(null, { empty: true, hint: "Aucun autre projet ne partage de compétence avec celui-ci." });
    }).catch((error) => {
      if (alive) sim.innerHTML = stateBlock(error, { hint: "Les projets similaires viennent de Neo4j (route 6)." });
    });
  }).catch((error) => {
    if (!alive) return;
    document.title = "Projet introuvable — Cédric Akle";
    box.innerHTML = `<h1 class="projet__title display">Projet introuvable</h1>${stateBlock(error, { hint: "Vérifie le slug du projet, ou relance « just seed »." })}<div style="height:120px"></div>`;
  });

  return () => { alive = false; };
}
