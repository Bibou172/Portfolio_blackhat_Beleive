"""Service : synchronisation des données vers le graphe Neo4j et rapport de cohérence.

À appeler depuis le seed (scripts/seed.py) ou les routes d'administration (POST/DELETE /api/projets) :
MongoDB est la source de vérité, Neo4j est mis à jour ensuite (ARCHITECTURE.md §5).
"""

from __future__ import annotations


class CompetencesInconnues(ValueError):
    """Un projet cite des compétences absentes du graphe (règle de API_ROUTES.md : 422)."""

    def __init__(self, slugs: list[str]):
        self.slugs = slugs
        super().__init__(f"Compétences inconnues : {', '.join(slugs)}")


class CandidatInconnu(LookupError):
    """Le nœud Candidat n'existe pas : le projet ne peut pas être rattaché par A_REALISE."""


async def synchroniser_candidat(repository, candidat: dict) -> None:
    """Crée ou met à jour le Candidat, ses Competence et leurs Domaine (relations APPARTIENT_A)."""
    await repository.merge_candidat(candidat["candidat_slug"], candidat.get("prenom", ""), candidat.get("nom", ""))
    for c in candidat.get("competences", []):
        await repository.merge_competence(
            skill_slug=c["skill_slug"],
            nom=c.get("nom", c["skill_slug"]),
            domaine_slug=c.get("domaine", "autres"),
            niveau=c.get("niveau"),
            domaine_nom=c.get("domaine_nom"),
        )


async def synchroniser_projet(repository, projet: dict, candidat_slug: str | None = None) -> int:
    """Crée ou met à jour un Projet et ses relations A_REALISE / UTILISE.

    Vérifie d'abord que toutes les compétences existent (sinon CompetencesInconnues, rien n'est écrit).
    Renvoie le nombre de relations UTILISE posées.
    """
    slug_candidat = candidat_slug or projet.get("candidat_slug") or (projet.get("candidat_slugs") or [None])[0]
    if not slug_candidat:
        raise CandidatInconnu("Aucun candidat_slug pour ce projet")
    competences = list(dict.fromkeys(projet.get("competences", [])))  # sans doublons, ordre conservé
    inconnues = sorted(set(competences) - await repository.competences_connues(competences))
    if inconnues:
        raise CompetencesInconnues(inconnues)
    nb = await repository.merge_projet(slug_candidat, projet["projet_slug"], projet["titre"], projet.get("annee"), competences)
    if nb is None:
        raise CandidatInconnu(f"Candidat '{slug_candidat}' introuvable dans Neo4j")
    return nb


async def supprimer_projet(repository, projet_slug: str) -> bool:
    """Supprime le Projet et ses relations ; Competence et Domaine restent (ARCHITECTURE.md §5)."""
    return await repository.supprimer_projet(projet_slug)


async def rapport_coherence(repository, slugs_projets_mongo: set[str] | None = None) -> dict:
    """Vérifie les nœuds Candidat / Projet / Competence / Domaine et leurs relations.

    Si les slugs des projets de MongoDB sont fournis, compare aussi les deux bases (slugs pivots, §5).
    Renvoie {"comptes", "anomalies" (seulement celles non vides), "coherent"}.
    """
    comptes = {label: 0 for label in ("Candidat", "Projet", "Competence", "Domaine")}
    comptes.update(await repository.comptes())
    anomalies = {nom: valeur for nom, valeur in (await repository.controles()).items() if valeur}

    if comptes["Candidat"] == 0:
        anomalies["aucun_candidat"] = True
    elif comptes["Candidat"] > 1:
        # Un backend = un candidat (API_ROUTES.md, conventions)
        anomalies["plusieurs_candidats"] = comptes["Candidat"]

    if slugs_projets_mongo is not None:
        dans_neo4j = await repository.slugs_projets()
        manquants = sorted(slugs_projets_mongo - dans_neo4j)
        en_trop = sorted(dans_neo4j - slugs_projets_mongo)
        if manquants:
            anomalies["projets_absents_de_neo4j"] = manquants
        if en_trop:
            anomalies["projets_absents_de_mongodb"] = en_trop

    return {"comptes": comptes, "anomalies": anomalies, "coherent": not anomalies}
