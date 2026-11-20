import { useProfil } from "@/lib/ProfilContext";
import { API_URL } from "@/lib/api";

/** Indicateur visible UNIQUEMENT en développement : d'où viennent les données affichées. */
export default function SourceBadge() {
  const { source, chargement } = useProfil();
  if (!import.meta.env.DEV || chargement) return null;
  const texte =
    source === "api"
      ? `Données : API ${API_URL}`
      : source === "local"
        ? "Données : data/ (API indisponible)"
        : "Aucune donnée : ajoutez data/candidats/HilaryBoco06.json";
  const couleur = source === "api" ? "bg-lagon-400" : source === "local" ? "bg-sand-500" : "bg-red-400";
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-full bg-ocean-950/85 px-3 py-1.5 font-mono text-[11px] text-ecume-100 shadow-lift backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${couleur}`} aria-hidden />
      {texte} <span className="opacity-50">· dev</span>
    </div>
  );
}
