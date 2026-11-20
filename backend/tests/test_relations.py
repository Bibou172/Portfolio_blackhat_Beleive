"""Tests de l'écriture des relations A_REALISE / UTILISE / APPARTIENT_A et du rapport de cohérence.

Le repository est remplacé par un faux qui enregistre les écritures et renvoie des lignes toutes prêtes :
ces tests tournent donc partout (poste local, CI GitHub) sans Neo4j.
"""

import re

import pytest

from portfolio_api.repositories import neo4j_relations as cypher
from portfolio_api.services.relations_service import CandidatIntrouvable, CompetencesInconnues, RelationsService

CANDIDAT = {
    "candidat_slug": "hilary-boco",
    "prenom": "Hilary",
    "nom": "Boco",
    "competences": [
        {"skill_slug": "java", "nom": "Java", "domaine": "langages", "niveau": 3},
        {"skill_slug": "oracle-db", "nom": "Oracle Database", "domaine": "bases-de-donnees", "niveau": 3},
    ],
}
PROJET = {
    "projet_slug": "logiciel-affectation-dominante",
    "candidat_slug": "hilary-boco",
    "titre": "Logiciel de gestion d'affectation en dominante",
    "annee": 2025,
    "competences": ["java", "oracle-db", "java"],
}
GRAPHE_SAIN = {"Candidat": 1, "Projet": 2, "Competence": 5, "Domaine": 3}


class FauxRepository:
    def __init__(self, connues=("java", "oracle-db"), candidat_existe=True, comptes=GRAPHE_SAIN, anomalies=None, slugs=()):
        self.connues = set(connues)
        self.candidat_existe = candidat_existe
        self._comptes = comptes
        self.anomalies = anomalies or {}
        self.slugs = list(slugs)
        self.ecritures = []

    async def merge_candidat(self, candidat_slug, prenom, nom):
        self.ecritures.append(("candidat", candidat_slug))

    async def merge_competence(self, skill_slug, nom, domaine_slug, niveau=None, domaine_nom=None):
        self.ecritures.append(("competence", skill_slug, domaine_slug))

    async def competences_connues(self, slugs):
        return [{"connues": [s for s in slugs if s in self.connues]}]

    async def merge_projet(self, candidat_slug, projet_slug, titre, annee, competences):
        self.ecritures.append(("projet", candidat_slug, projet_slug, competences))
        return [{"projet_slug": projet_slug, "nb_utilise": len(competences)}] if self.candidat_existe else []

    async def supprimer_projet(self, projet_slug):
        return [{"supprimes": 1 if projet_slug == PROJET["projet_slug"] else 0}]

    async def comptes(self):
        return [{"label": l, "nb": n} for l, n in self._comptes.items()]

    async def slugs_projets(self):
        return [{"slugs": self.slugs}]

    async def controle(self, nom):
        return [{"valeur": self.anomalies.get(nom, [])}]


# ---------- Cypher (ARCHITECTURE.md §4 et §5) ----------

@pytest.mark.parametrize("requete", [cypher.MERGE_CANDIDAT, cypher.MERGE_COMPETENCE, cypher.MERGE_PROJET])
def test_ecritures_idempotentes(requete):
    """MERGE sur les slugs pivots, jamais CREATE : relancer le seed ne crée pas de doublon."""
    assert "MERGE" in requete
    assert not re.search(r"\bCREATE\b", requete)


def test_relations_dans_le_bon_sens():
    assert "MERGE (ca)-[:A_REALISE]->(p)" in cypher.MERGE_PROJET
    assert "MERGE (p)-[:UTILISE]->(x)" in cypher.MERGE_PROJET
    assert "MERGE (s)-[:APPARTIENT_A]->(d)" in cypher.MERGE_COMPETENCE


def test_suppression_garde_competences_et_domaines():
    assert "DETACH DELETE p" in cypher.SUPPRIMER_PROJET
    assert "Competence" not in cypher.SUPPRIMER_PROJET


def test_controles_en_lecture_seule():
    for requete in [cypher.COMPTES, cypher.SLUGS_PROJETS, *cypher.CONTROLES.values()]:
        assert not re.search(r"\b(CREATE|MERGE|DELETE|SET|REMOVE)\b", requete)


# ---------- Synchronisation ----------

async def test_candidat_competences_et_domaines():
    repo = FauxRepository()
    await RelationsService(repo).synchroniser_candidat(CANDIDAT)
    assert repo.ecritures == [
        ("candidat", "hilary-boco"),
        ("competence", "java", "langages"),
        ("competence", "oracle-db", "bases-de-donnees"),
    ]


async def test_projet_competences_dedoublonnees():
    repo = FauxRepository()
    assert await RelationsService(repo).synchroniser_projet(PROJET) == 2
    assert repo.ecritures == [("projet", "hilary-boco", "logiciel-affectation-dominante", ["java", "oracle-db"])]


async def test_projet_format_data_exemple():
    """Accepte aussi candidat_slugs (format de data/projets/_exemple.json)."""
    repo = FauxRepository()
    projet = {k: v for k, v in PROJET.items() if k != "candidat_slug"} | {"candidat_slugs": ["hilary-boco"]}
    await RelationsService(repo).synchroniser_projet(projet)
    assert repo.ecritures[0][1] == "hilary-boco"


async def test_projet_competence_inconnue_rien_n_est_ecrit():
    repo = FauxRepository(connues=["java"])
    with pytest.raises(CompetencesInconnues) as erreur:
        await RelationsService(repo).synchroniser_projet(PROJET)
    assert erreur.value.slugs == ["oracle-db"]
    assert repo.ecritures == []


async def test_projet_candidat_absent():
    with pytest.raises(CandidatIntrouvable):
        await RelationsService(FauxRepository(candidat_existe=False)).synchroniser_projet(PROJET)


async def test_suppression():
    service = RelationsService(FauxRepository())
    assert await service.supprimer_projet("logiciel-affectation-dominante") is True
    assert await service.supprimer_projet("inconnu") is False


# ---------- Rapport de cohérence ----------

async def test_graphe_coherent():
    assert await RelationsService(FauxRepository()).rapport_coherence() == {
        "comptes": GRAPHE_SAIN,
        "anomalies": {},
        "coherent": True,
    }


async def test_anomalies_signalees():
    anomalies = {"projets_sans_candidat": ["orphelin"], "competences_sans_domaine": ["git"], "relations_mal_orientees": 2}
    res = await RelationsService(FauxRepository(anomalies=anomalies)).rapport_coherence()
    assert res["coherent"] is False
    assert res["anomalies"] == anomalies


@pytest.mark.parametrize(
    "comptes, attendu",
    [({}, {"aucun_candidat": True}), (GRAPHE_SAIN | {"Candidat": 2}, {"plusieurs_candidats": 2})],
)
async def test_un_seul_candidat_par_backend(comptes, attendu):
    assert (await RelationsService(FauxRepository(comptes=comptes)).rapport_coherence())["anomalies"] == attendu


async def test_comparaison_avec_mongodb():
    repo = FauxRepository(slugs=["a", "b", "fantome"])
    res = await RelationsService(repo).rapport_coherence(slugs_projets_mongo={"a", "b", "nouveau"})
    assert res["anomalies"] == {"projets_absents_de_neo4j": ["nouveau"], "projets_absents_de_mongodb": ["fantome"]}
