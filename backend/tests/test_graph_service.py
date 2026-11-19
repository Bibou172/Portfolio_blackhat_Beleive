"""Tests de la transformation du graphe de compétences (R5)."""

from portfolio_api.services.graph_service import construire_graphe

CANDIDAT = {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin"}
PROJET_A = {"projet_slug": "dashboard-ventes", "titre": "Dashboard des ventes", "annee": 2026}
PROJET_B = {"projet_slug": "portfolio-api", "titre": "Portfolio API", "annee": 2026}
MONGODB = {"skill_slug": "mongodb", "nom": "MongoDB", "niveau": 3}
BDD = {"domaine_slug": "bases-de-donnees", "nom": "Bases de données"}


def test_pas_de_doublons():
    """2 projets utilisent MongoDB : MongoDB ne doit apparaître qu'une fois."""
    lignes = [
        {"candidat": CANDIDAT, "projet": PROJET_A, "competence": MONGODB, "domaine": BDD},
        {"candidat": CANDIDAT, "projet": PROJET_B, "competence": MONGODB, "domaine": BDD},
    ]
    graphe = construire_graphe(lignes)
    ids = [n["id"] for n in graphe["nodes"]]

    assert ids.count("competence:mongodb") == 1
    assert ids.count("candidat:alice-martin") == 1
    assert len(graphe["nodes"]) == 5   # candidat + 2 projets + mongodb + domaine
    assert len(graphe["links"]) == 5   # 2 A_REALISE + 2 UTILISE + 1 APPARTIENT_A


def test_competence_sans_domaine():
    """Une compétence sans domaine est gardée, mais sans lien APPARTIENT_A."""
    lignes = [{"candidat": CANDIDAT, "projet": PROJET_A, "competence": MONGODB, "domaine": None}]
    graphe = construire_graphe(lignes)
    types_liens = [l["type"] for l in graphe["links"]]

    assert "competence:mongodb" in [n["id"] for n in graphe["nodes"]]
    assert "APPARTIENT_A" not in types_liens


def test_candidat_sans_projet():
    """Un candidat sans projet : seulement son point, et aucun fil."""
    lignes = [{"candidat": CANDIDAT, "projet": None, "competence": None, "domaine": None}]
    graphe = construire_graphe(lignes)

    assert graphe["nodes"] == [{"id": "candidat:alice-martin", "type": "candidat", "label": "Alice Martin"}]
    assert graphe["links"] == []