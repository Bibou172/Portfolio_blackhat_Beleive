const API_URL = "http://localhost:8000";
const CANDIDAT_SLUG = "cedric-akle";

export async function api(chemin) {
  const url = new URL(chemin, API_URL);
  url.searchParams.set("candidat_slug", CANDIDAT_SLUG);

  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error(`Erreur ${reponse.status} sur ${chemin}`);
  }
  return reponse.json();
}