import { useEffect, useRef, useState } from "react";
import type { Resultat, Source } from "./types";

export interface Etat<T> {
  data: T | null;
  source: Source;
  chargement: boolean;
}

/** Charge une ressource asynchrone ; relance quand les dépendances changent. */
export function useRessource<T>(charger: () => Promise<Resultat<T | null>>, deps: unknown[]): Etat<T> {
  const [etat, setEtat] = useState<Etat<T>>({ data: null, source: "aucune", chargement: true });
  useEffect(() => {
    let actif = true;
    setEtat((e) => ({ ...e, chargement: true }));
    charger().then((r) => {
      if (actif) setEtat({ data: r.data, source: r.source, chargement: false });
    });
    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return etat;
}

/** Ajoute la classe « visible » quand l'élément entre dans l'écran (animations au scroll). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("visible");
      return;
    }
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/** Vérifie qu'un fichier statique existe vraiment (le serveur de dev renvoie index.html sinon). */
export function useFichierDisponible(url: string, typeAttendu: string): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    fetch(url, { method: "HEAD" })
      .then((r) => setOk(r.ok && (r.headers.get("content-type") ?? "").includes(typeAttendu)))
      .catch(() => setOk(false));
  }, [url, typeAttendu]);
  return ok;
}
