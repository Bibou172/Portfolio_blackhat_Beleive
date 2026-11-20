/* ==========================================================================
   ROUTER — lit l'adresse après le # et affiche la bonne page.

   #/                  → accueil (toutes les sections)
   #/work, #/about ... → accueil, défile jusqu'à la section
   #/projet/<slug>     → étude de cas d'un projet
   #/admin             → ajout de données (page cachée)
   ========================================================================== */

import { renderHome, scrollToSection, SECTIONS } from "./pages/home.js";
import { renderProjet } from "./pages/projet.js";
import { renderAdmin } from "./pages/admin.js";
import { wipe, resetReveal } from "./motion.js";

let current = null;
let dispose = () => {};
let chrome = null;

function parse() {
  const [a, b] = location.hash.replace(/^#\/?/, "").split("/");
  if (a === "projet" && b) return { view: "projet", slug: decodeURIComponent(b) };
  if (a === "admin") return { view: "admin" };
  return { view: "home", section: SECTIONS.includes(a) ? a : null };
}

async function go() {
  const route = parse();
  const app = document.getElementById("app");

  // Déjà sur l'accueil : on défile simplement, sans transition.
  if (current?.view === "home" && route.view === "home") {
    scrollToSection(route.section);
    current = route;
    return;
  }

  const render = () => {
    dispose();
    resetReveal();
    window.scrollTo(0, 0);
    if (route.view === "projet") dispose = renderProjet(app, route.slug);
    else if (route.view === "admin") dispose = renderAdmin(app);
    else {
      dispose = renderHome(app);
      if (route.section) requestAnimationFrame(() => scrollToSection(route.section, true));
    }
    app.focus({ preventScroll: true });
    chrome?.refresh();
  };

  if (current === null) render();
  else await wipe(render);
  current = route;
}

export function initRouter(chromeApi) {
  chrome = chromeApi;
  addEventListener("hashchange", go);

  // Clic sur un lien vers la section déjà dans l'adresse : on défile quand même.
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (a && a.getAttribute("href") === location.hash && current?.view === "home") {
      e.preventDefault();
      scrollToSection(parse().section);
    }
  });

  go();
}
