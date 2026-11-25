import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, X } from "lucide-react";

interface Props {
  ouvert: boolean;
  surtitre: string;
  titre: string;
  onFermer: () => void;
  onSectionComplete: () => void;
  children: ReactNode;
}

/**
 * Panneau ouvert depuis un objet de l'île : tiroir à droite (bureau), feuille par le bas (mobile).
 * Dialogue modal accessible : Échap, clic à l'extérieur, focus piégé puis rendu.
 */
export default function Panneau({ ouvert, surtitre, titre, onFermer, onSectionComplete, children }: Props) {
  const boite = useRef<HTMLDivElement>(null);
  const fermer = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const precedent = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => fermer.current?.focus(), 60);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
      if (e.key !== "Tab" || !boite.current) return;
      const f = boite.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const premier = f[0];
      const dernier = f[f.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      precedent?.focus?.();
    };
  }, [ouvert, onFermer]);

  return createPortal(
    <div className={`fixed inset-0 z-[55] ${ouvert ? "" : "pointer-events-none"}`} aria-hidden={!ouvert} {...(ouvert ? {} : { inert: "" })}>
      <div
        className={`absolute inset-0 bg-ocean-950/30 transition-opacity duration-500 lg:bg-gradient-to-r lg:from-transparent lg:to-ocean-950/40 ${ouvert ? "opacity-100" : "opacity-0"}`}
        onClick={onFermer}
      />
      <div
        ref={boite}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-panneau"
        className={`absolute inset-x-0 bottom-0 flex max-h-[78vh] flex-col overflow-hidden rounded-t-[2rem] bg-ecume-50 shadow-lift transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]
          lg:inset-y-3 lg:left-auto lg:right-3 lg:max-h-none lg:w-[460px] lg:rounded-[2rem]
          ${ouvert ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-x-[110%] lg:translate-y-0"}`}
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-ocean-900 to-lagon-600 px-6 pb-6 pt-5 text-ecume-50">
          <div className="topo-clair absolute inset-0" aria-hidden />
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ecume-50/40 lg:hidden" aria-hidden />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lagon-300">{surtitre}</p>
              <h2 id="titre-panneau" className="mt-1.5 text-3xl font-semibold">
                {titre}
              </h2>
            </div>
            <button
              ref={fermer}
              type="button"
              onClick={onFermer}
              className="rounded-full bg-ecume-50/10 p-2 transition hover:bg-ecume-50/20"
              aria-label="Fermer le panneau"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">{ouvert && children}</div>
        <div className="shrink-0 border-t border-ocean-800/10 bg-white/70 px-6 py-4">
          <button type="button" onClick={onSectionComplete} className="btn-primaire w-full">
            Voir la section complète <ArrowDown className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
