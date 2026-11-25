/** Client HTTP minimal vers l'API d'équipe (FastAPI). Seules les routes de API_ROUTES.md sont appelées. */

/**
 * URL de l'API d'équipe.
 * - Production (Vercel) : variable VITE_API_URL définie dans le projet Vercel (ex. https://xxx.vercel.app).
 * - Développement : http://localhost:8000 par défaut.
 * Sans URL en production, le site n'appelle pas l'API et affiche directement les données de data/.
 */
const URL_CONFIGUREE = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, "");
export const API_URL: string | null = URL_CONFIGUREE || (import.meta.env.DEV ? "http://localhost:8000" : null);

/** Délai maximal : le premier appel réveille la fonction Vercel et ouvre la connexion à la base (démarrage à froid). */
const DELAI_MS = 12000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * API hors ligne pour la session (pas d'attente répétée) — décidé UNE fois, par /api/health.
 * Une erreur réseau sur une seule route ne suffit pas : une erreur 500 de FastAPI part sans en-têtes CORS
 * et le navigateur la présente comme une panne réseau, alors que les autres routes fonctionnent.
 */
let apiHorsLigne = false;
let verificationSante: Promise<void> | null = null;

function verifierSante(): Promise<void> {
  verificationSante ??= fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(DELAI_MS) })
    .then((r) => {
      apiHorsLigne = !r.ok;
    })
    .catch(() => {
      apiHorsLigne = true; // serveur injoignable, CORS refusé ou délai dépassé
    });
  return verificationSante;
}

export async function apiGet<T>(path: string, timeoutMs = DELAI_MS): Promise<T> {
  if (!API_URL || apiHorsLigne) throw new ApiError(0, "API indisponible");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).catch(async (erreur) => {
      await verifierSante(); // la route a échoué : l'API entière est-elle injoignable ?
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
