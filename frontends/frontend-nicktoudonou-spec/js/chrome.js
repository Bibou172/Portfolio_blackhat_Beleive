/* ==========================================================================
   CHROME — tout ce qui reste à l'écran : en-tête, menu mobile,
   barre de progression, indicateur de section.
   Un seul écouteur de scroll (regroupé avec requestAnimationFrame).
   ========================================================================== */

import { CONFIG } from "./config.js";

export function initChrome() {
  const header = document.querySelector(".site-header");
  const bar = document.querySelector(".progress span");
  const siNum = document.querySelector(".js-si-num");
  const siLabel = document.querySelector(".js-si-label");
  const navLinks = [...document.querySelectorAll(".nav a")];

  /* Disponibilité */
  const status = document.querySelector(".js-status");
  if (CONFIG.disponibilite) status.querySelector("span").textContent = CONFIG.disponibilite;
  else status.remove();

  /* ---------- Menu mobile ---------- */
  const menu = document.getElementById("menu");
  const btn = document.querySelector(".menu-btn");
  const label = btn.querySelector(".menu-btn__label");

  const setMenu = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Fermer" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
      header.classList.add("is-dark");
    } else {
      menu.classList.remove("is-open");
      setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 650);
      update();
    }
  };
  btn.addEventListener("click", () => setMenu(btn.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") setMenu(false);
  });

  /* ---------- Scroll : progression, couleur de l'en-tête, section active ---------- */
  let ticking = false;
  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;

    if (btn.getAttribute("aria-expanded") !== "true") {
      header.classList.toggle("is-scrolled", scrollY > 8);
      const under = document.elementFromPoint(innerWidth / 2, header.offsetHeight + 2);
      header.classList.toggle("is-dark", Boolean(under?.closest(".dark")));
    }

    const mid = document.elementFromPoint(innerWidth / 2, innerHeight * 0.45)?.closest("[data-section]");
    if (mid) {
      siNum.textContent = mid.dataset.section;
      siLabel.textContent = mid.dataset.label;
      siNum.parentElement.classList.toggle("is-hidden", mid.dataset.section === "00");
      const id = mid.id;
      navLinks.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === `#/${id}`)));
    }
  }
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);

  /* Les pages appellent ceci après leur affichage */
  return { refresh: onScroll };
}
