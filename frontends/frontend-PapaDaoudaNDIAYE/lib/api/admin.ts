/**
 * Appels d'écriture de la page /admin.
 *
 * ⚠️ Ces routes N'EXISTENT PAS ENCORE dans le backend (ARCHITECTURE.md ne liste
 * que des lectures R1…R8). Contrat proposé à l'équipe backend :
 *   POST /api/experiences  body = Experience  -> 201
 *   POST /api/formations   body = Formation   -> 201
 *   POST /api/projets      body = Projet      -> 201
 * Tant qu'elles manquent, l'API répond 404/405 et le formulaire l'explique.
 */
import { API_TIMEOUT_MS, API_URL } from "./config";
import type { Experience, Formation, Projet } from "./types";

export interface WriteResult {
  ok: boolean;
  status: number | null; // null = API injoignable
  message: string;
}

async function post(path: string, body: unknown): Promise<WriteResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(API_TIMEOUT_MS * 2),
    });
    if (res.ok) return { ok: true, status: res.status, message: "Enregistré dans la base." };
    if (res.status === 404 || res.status === 405) {
      return {
        ok: false,
        status: res.status,
        message: `La route POST ${path} n'existe pas encore dans le backend : rien n'a été enregistré.`,
      };
    }
    let detail = "";
    try {
      const data = (await res.json()) as { detail?: unknown };
      detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail ?? "");
    } catch {
      /* corps non JSON */
    }
    return { ok: false, status: res.status, message: `Refusé par l'API (${res.status}) ${detail}`.trim() };
  } catch {
    return { ok: false, status: null, message: "API injoignable (MODE HORS-LIGNE) : rien n'a été enregistré." };
  }
}

export const createExperience = (e: Experience) => post("/api/experiences", e);
export const createFormation = (f: Formation) => post("/api/formations", f);
export const createProjet = (p: Projet) => post("/api/projets", p);
