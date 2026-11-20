const API_URL = "http://localhost:8000";

export async function api(chemin) {
  const reponse = await fetch(`${API_URL}${chemin}`);
  if (!reponse.ok) {
    throw new Error(`Erreur ${reponse.status} sur ${chemin}`);
  }
  return reponse.json();
}