"""Tests de l'écriture des relations A_REALISE / UTILISE / APPARTIENT_A et du rapport de cohérence (faux Neo4j)."""

import asyncio
import re

import pytest

from faux_neo4j import FauxDriver
from portfolio_api.repositories import graph_relations_repository as R
from portfolio_api.repositories.graph_relations_repository import GraphRelationsRepository
from portfolio_api.services.graph_relations_service import (
    CandidatInconnu,
    CompetencesInconnues,
    rapport_coherence,
    supprimer_projet,
    synchroniser_candidat,
    synchroniser_projet,
)

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


def run(coro):
    return asyncio.run(coro)


def requetes(driver):
    return [q for q, _ in driver.appels]


# ───────────── Cypher : conformité au schéma (ARCHITECTURE.md §4) ─────────────
@pytest.mark.parametrize("requete", [R.MERGE_CANDIDAT, R.MERGE_COMPETENCE, R.MERGE_PROJET])
def test_ecritures_idempotentes_merge_jamais_create(requete):
    assert "MERGE" in requete
    assert not re.search(r"\bCREATE\b", requete)


def test_relations_dans_le_bon_sens():
    assert "MERGE (ca)-[:A_REALISE]->(p)" in R.MERGE_PROJET
    assert "MERGE (p)-[:UTILISE]->(x)" in R.MERGE_PROJET
    assert "MERGE (s)-[:APPARTIENT_A]->(d)" in R.MERGE_COMPETENCE


def test_merge_sur_les_slugs_pivots():
    assert "MERGE (ca:Candidat {candidat_slug: $candidat_slug})" in R.MERGE_CANDIDAT
    assert "MERGE (p:Projet {projet_slug: $projet_slug})" in R.MERGE_PROJET
    assert "MERGE (s:Competence {skill_slug: $skill_slug})" in R.MERGE_COMPETENCE
    assert "MERGE (d:Domaine {domaine_slug: $domaine_slug})" in R.MERGE_COMPETENCE


def test_suppression_garde_competences_et_domaines():
    assert "DETACH DELETE p" in R.SUPPRIMER_PROJET
    assert "Competence" not in R.SUPPRIMER_PROJET and "Domaine" not in R.SUPPRIMER_PROJET


def test_controles_en_lecture_seule():
    for requete in [R.COMPTES, R.SLUGS_PROJETS, *R.CONTROLES.values()]:
        assert not re.search(r"\b(CREATE|MERGE|DELETE|SET|REMOVE)\b", requete)


# ───────────── Repository : paramètres transmis ─────────────
def test_merge_competence_parametres():
    d = FauxDriver()
    run(GraphRelationsRepository(driver=d).merge_competence("java", "Java", "langages", 3))
    assert d.appels == [
        (R.MERGE_COMPETENCE, {"skill_slug": "java", "nom": "Java", "niveau": 3, "domaine_slug": "langages", "domaine_nom": None})
    ]


def test_merge_projet_renvoie_none_si_candidat_absent():
    assert run(GraphRelationsRepository(driver=FauxDriver()).merge_projet("x", "p", "P", 2025, [])) is None


def test_supprimer_projet():
    d = FauxDriver(lambda q, p: [{"supprimes": 1}])
    assert run(supprimer_projet(GraphRelationsRepository(driver=d), "p")) is True
    d0 = FauxDriver(lambda q, p: [{"supprimes": 0}])
    assert run(supprimer_projet(GraphRelationsRepository(driver=d0), "inconnu")) is False


# ───────────── Service : synchronisation ─────────────
def test_synchroniser_candidat_cree_competences_et_domaines():
    d = FauxDriver()
    run(synchroniser_candidat(GraphRelationsRepository(driver=d), CANDIDAT))
    assert requetes(d) == [R.MERGE_CANDIDAT, R.MERGE_COMPETENCE, R.MERGE_COMPETENCE]
    assert d.appels[0][1] == {"candidat_slug": "hilary-boco", "prenom": "Hilary", "nom": "Boco"}
    assert d.appels[2][1]["domaine_slug"] == "bases-de-donnees"


def driver_projet(connues, nb_utilise=2):
    def repondre(q, p):
        if q == R.COMPETENCES_CONNUES:
            return [{"connues": [s for s in p["slugs"] if s in connues]}]
        if q == R.MERGE_PROJET:
            return [] if nb_utilise is None else [{"projet_slug": p["projet_slug"], "nb_utilise": nb_utilise}]
        raise AssertionError(q)

    return FauxDriver(repondre)


def test_synchroniser_projet_ok_et_competences_dedoublonnees():
    d = driver_projet({"java", "oracle-db"})
    assert run(synchroniser_projet(GraphRelationsRepository(driver=d), PROJET)) == 2
    params = d.appels[-1][1]
    assert params["competences"] == ["java", "oracle-db"]
    assert params["candidat_slug"] == "hilary-boco"


def test_synchroniser_projet_competence_inconnue_n_ecrit_rien():
    d = driver_projet({"java"})
    with pytest.raises(CompetencesInconnues) as e:
        run(synchroniser_projet(GraphRelationsRepository(driver=d), PROJET))
    assert e.value.slugs == ["oracle-db"]
    assert R.MERGE_PROJET not in requetes(d)


def test_synchroniser_projet_candidat_absent():
    d = driver_projet({"java", "oracle-db"}, nb_utilise=None)
    with pytest.raises(CandidatInconnu):
        run(synchroniser_projet(GraphRelationsRepository(driver=d), PROJET))


def test_synchroniser_projet_format_data_exemple():
    """Accepte aussi candidat_slugs (format de data/projets/_exemple.json)."""
    d = driver_projet({"java", "oracle-db"})
    projet = {k: v for k, v in PROJET.items() if k != "candidat_slug"} | {"candidat_slugs": ["hilary-boco"]}
    run(synchroniser_projet(GraphRelationsRepository(driver=d), projet))
    assert d.appels[-1][1]["candidat_slug"] == "hilary-boco"


# ───────────── Service : rapport de cohérence ─────────────
def driver_coherence(comptes, controles=None, slugs=()):
    controles = controles or {}

    def repondre(q, p):
        if q == R.COMPTES:
            return [{"label": l, "nb": n} for l, n in comptes.items()]
        if q == R.SLUGS_PROJETS:
            return [{"slugs": list(slugs)}]
        for nom, requete in R.CONTROLES.items():
            if q == requete:
                return [{"valeur": controles.get(nom, 0 if nom in ("noeuds_sans_slug", "relations_mal_orientees") else [])}]
        raise AssertionError(q)

    return FauxDriver(repondre)


GRAPHE_SAIN = {"Candidat": 1, "Projet": 2, "Competence": 5, "Domaine": 3}


def test_rapport_graphe_coherent():
    r = run(rapport_coherence(GraphRelationsRepository(driver=driver_coherence(GRAPHE_SAIN))))
    assert r == {"comptes": GRAPHE_SAIN, "anomalies": {}, "coherent": True}


def test_rapport_signale_les_anomalies():
    d = driver_coherence(
        GRAPHE_SAIN,
        {"projets_sans_candidat": ["orphelin"], "competences_sans_domaine": ["git"], "relations_mal_orientees": 2},
    )
    r = run(rapport_coherence(GraphRelationsRepository(driver=d)))
    assert r["coherent"] is False
    assert r["anomalies"] == {"projets_sans_candidat": ["orphelin"], "competences_sans_domaine": ["git"], "relations_mal_orientees": 2}


def test_rapport_base_vide():
    r = run(rapport_coherence(GraphRelationsRepository(driver=driver_coherence({}))))
    assert r["comptes"] == {"Candidat": 0, "Projet": 0, "Competence": 0, "Domaine": 0}
    assert r["anomalies"] == {"aucun_candidat": True}


def test_rapport_un_seul_candidat_par_backend():
    r = run(rapport_coherence(GraphRelationsRepository(driver=driver_coherence(GRAPHE_SAIN | {"Candidat": 2}))))
    assert r["anomalies"] == {"plusieurs_candidats": 2}


def test_rapport_compare_avec_mongodb():
    d = driver_coherence(GRAPHE_SAIN, slugs=["a", "b", "fantome"])
    r = run(rapport_coherence(GraphRelationsRepository(driver=d), slugs_projets_mongo={"a", "b", "nouveau"}))
    assert r["anomalies"] == {"projets_absents_de_neo4j": ["nouveau"], "projets_absents_de_mongodb": ["fantome"]}
