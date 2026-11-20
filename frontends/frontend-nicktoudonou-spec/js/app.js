import { api } from "./api.js";

const page = document.getElementById("page");

// Quelle fonction affiche quelle page
const pages = {
  "/": pageAccueil,
  "/parcours": () => enConstruction("Parcours"),
  "/projets": () => enConstruction("Projets"),
  "/competences": () => enConstruction("Compétences"),
  "/graphe": () => enConstruction("Graphe"),
};

// Protège l'affichage : un texte ne peut pas devenir du code HTML
function e(texte) {
  return String(texte ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function afficher() {
  const chemin = location.hash.slice(1) || "/";
  const fonction = pages[chemin] || pageAccueil;
  marquerLienActif(chemin);
  page.innerHTML = `<p class="chargement">Chargement…</p>`;
  try {
    page.innerHTML = await fonction();
  } catch (erreur) {
    page.innerHTML = `
      <div class="erreur">
        <h2>Impossible de charger la page</h2>
        <p>${e(erreur.message)}</p>
        <p>Vérifiez que l'API tourne (<code>just dev</code>) et que la base est remplie (<code>just seed</code>).</p>
      </div>`;
  }
}

function marquerLienActif(chemin) {
  document.querySelectorAll(".menu a").forEach((lien) => {
    lien.classList.toggle("actif", lien.getAttribute("href") === `#${chemin}`);
  });
}

// ── Page Accueil : routes 1 (profil) et 5 (top 5 des compétences) ──
async function pageAccueil() {
  const [profil, stats] = await Promise.all([
    api("/api/profil"),
    api("/api/stats/competences?limit=5"),
  ]);

  const liens = Object.entries(profil.liens || {})
    .map(([nom, url]) => `<a class="bouton" href="${e(url)}" target="_blank" rel="noopener">${e(nom)}</a>`)
    .join("");

  const competences = stats.items
    .map((c) => `<li class="pastille">${e(c.nom)}<span>${c.nb_projets} projet(s)</span></li>`)
    .join("");

  return `
    <section class="hero">
      <p class="surtitre">${e(profil.titre)}</p>
      <h1>${e(profil.prenom)} ${e(profil.nom)}</h1>
      <p class="bio">${e(profil.bio)}</p>
      <div class="liens">${liens}</div>
    </section>
    <section>
      <h2>Compétences phares</h2>
      <ul class="pastilles">${competences}</ul>
    </section>`;
}

function enConstruction(titre) {
  return `<h1>${e(titre)}</h1><p class="chargement">Page en construction.</p>`;
}

window.addEventListener("hashchange", afficher);
afficher();