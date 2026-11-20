/** URL de base de l'API FastAPI (variable publique : lisible côté serveur ET navigateur). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

/** Au-delà de ce délai, on considère l'API éteinte et on passe sur les mocks. */
export const API_TIMEOUT_MS = 2500;
