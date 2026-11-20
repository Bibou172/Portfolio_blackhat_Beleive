/** Client HTTP minimal vers l'API d'équipe (FastAPI). Seules les routes de API_ROUTES.md sont appelées. */

/**
 * URL de l'API d'équipe.
 * - Production (Vercel) : variable VITE_API_URL définie dans le projet Vercel (ex. https://xxx.vercel.app).
 * - Développement : http://localhost:8000 par défaut.
 * Sans URL en production, le site n'appelle pas l'API et affiche directement les données de data/.
 */
const URL_CONFIGUREE = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, "");
export const API_URL: string | null = URL_CONFIGUREE || (import.meta.env.DEV ? "http://localhost:8000" : null);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Après une première erreur réseau, l'API est considérée hors ligne pour la session : pas d'attente répétée. */
let apiHorsLigne = false;

export async function apiGet<T>(path: string, timeoutMs = 4000): Promise<T> {
  if (!API_URL || apiHorsLigne) throw new ApiError(0, "API indisponible");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).catch((erreur) => {
      apiHorsLigne = true; // serveur injoignable, CORS refusé ou délai dépassé
      throw erreur;
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        detail = (await res.json()).detail ?? detail;
      } catch {
        /* corps non JSON */
      }
      throw new ApiError(res.status, String(detail));
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
