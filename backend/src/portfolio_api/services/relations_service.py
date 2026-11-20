"""Service : synchronisation des données vers le graphe Neo4j et rapport de cohérence des nœuds.

À appeler depuis le seed (scripts/seed.py) ou les routes d'administration (POST/DELETE /api/projets) :
MongoDB est la source de vérité, Neo4j est mis à jour ensuite (ARCHITECTURE.md §5).
"""

from typing import Any

from portfolio_api.repositories.neo4j_relations import CONTROLES, Neo4jRelationsRepository

LABELS = ("Candidat", "Projet", "Competence", "Domaine")


class CompetencesInconnues(ValueError):
    """Un projet cite des compétences absentes du graphe (règle de API_ROUTES.md : 422)."""

    def __init__(self, slugs: list[str]):
        self.slugs = slugs
        super().__init__(f"Compétences inconnues : {', '.join(slugs)}")


class CandidatIntrouvable(LookupError):
    """Le nœud Candidat n'existe pas : le projet ne peut pas être rattaché par A_REALISE."""


class RelationsService:
    def __init__(self, repository: Neo4jRelationsRepository):
        self._repo = repository

    async def synchroniser_candidat(self, candidat: dict[str, Any]) -> None:
        """Crée ou met à jour le Candidat, ses Competence et leurs Domaine (relations APPARTIENT_A)."""
        await self._repo.merge_candidat(candidat["candidat_slug"], candidat.get("prenom", ""), candidat.get("nom", ""))
        for c in candidat.get("competences", []):
            await self._repo.merge_competence(
                skill_slug=c["skill_slug"],
                nom=c.get("nom", c["skill_slug"]),
                domaine_slug=c.get("domaine", "autres"),
                niveau=c.get("niveau"),
                domaine_nom=c.get("domaine_nom"),
            )

    async def synchroniser_projet(self, projet: dict[str, Any], candidat_slug: str | None = None) -> int:
        """Crée ou met à jour un Projet et ses relations A_REALISE / UTILISE.

        Vérifie d'abord que toutes les compétences existent (sinon rien n'est écrit).
        Renvoie le nombre de relations UTILISE posées.
        """
        # candidat_slug (ARCHITECTURE.md) ou candidat_slugs (format de data/projets/_exemple.json)
        slug_candidat = candidat_slug or projet.get("candidat_slug") or (projet.get("candidat_slugs") or [None])[0]
        if not slug_candidat:
            raise CandidatIntrouvable("Aucun candidat_slug pour ce projet")

        competences = list(dict.fromkeys(projet.get("competences", [])))  # sans doublons, ordre conservé
        lignes = await self._repo.competences_connues(competences)
        connues = set(lignes[0]["connues"]) if lignes else set()
        inconnues = sorted(set(competences) - connues)
        if inconnues:
            raise CompetencesInconnues(inconnues)

        lignes = await self._repo.merge_projet(slug_candidat, projet["projet_slug"], projet["titre"], projet.get("annee"), competences)
        if not lignes:
            raise CandidatIntrouvable(f"Candidat '{slug_candidat}' introuvable dans Neo4j")
        return lignes[0]["nb_utilise"]

    async def supprimer_projet(self, projet_slug: str) -> bool:
        """Supprime le Projet et ses relations ; Competence et Domaine restent (ARCHITECTURE.md §5)."""
        lignes = await self._repo.supprimer_projet(projet_slug)
        return bool(lignes and lignes[0]["supprimes"])

    async def rapport_coherence(self, slugs_projets_mongo: set[str] | None = None) -> dict[str, Any]:
        """Vérifie les nœuds Candidat / Projet / Competence / Domaine et leurs relations.

        Si les slugs des projets MongoDB sont fournis, compare aussi les deux bases (slugs pivots, §5).
        Renvoie {"comptes", "anomalies" (seulement celles non vides), "coherent"}.
        """
        comptes = dict.fromkeys(LABELS, 0) | {l["label"]: l["nb"] for l in await self._repo.comptes()}

        anomalies: dict[str, Any] = {}
        for nom in CONTROLES:
            lignes = await self._repo.controle(nom)
            if lignes and lignes[0]["valeur"]:
                anomalies[nom] = lignes[0]["valeur"]

        if comptes["Candidat"] == 0:
            anomalies["aucun_candidat"] = True
        elif comptes["Candidat"] > 1:
            anomalies["plusieurs_candidats"] = comptes["Candidat"]  # un backend = un candidat

        if slugs_projets_mongo is not None:
            lignes = await self._repo.slugs_projets()
            dans_neo4j = set(lignes[0]["slugs"]) if lignes else set()
            if manquants := sorted(slugs_projets_mongo - dans_neo4j):
                anomalies["projets_absents_de_neo4j"] = manquants
            if en_trop := sorted(dans_neo4j - slugs_projets_mongo):
                anomalies["projets_absents_de_mongodb"] = en_trop

        return {"comptes": comptes, "anomalies": anomalies, "coherent": not anomalies}
