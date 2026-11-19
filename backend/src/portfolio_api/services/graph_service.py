"""Service du graphe de compétences (R5) : transforme les lignes Neo4j en nodes / links."""

from __future__ import annotations


def construire_graphe(lignes: list[dict]) -> dict:
    """Transforme les lignes Neo4j en {"nodes": [...], "links": [...]} sans doublons."""
    nodes: dict[str, dict] = {}
    links: dict[tuple, dict] = {}

    def ajouter_noeud(id_noeud: str, type_noeud: str, label: str, **infos) -> None:
        if id_noeud not in nodes:
            nodes[id_noeud] = {"id": id_noeud, "type": type_noeud, "label": label, **infos}

    def ajouter_lien(source: str, target: str, type_lien: str) -> None:
        cle = (source, target, type_lien)
        if cle not in links:
            links[cle] = {"source": source, "target": target, "type": type_lien}

    for ligne in lignes:
        # 1. Le candidat (toujours présent)
        ca = ligne["candidat"]
        id_ca = f"candidat:{ca['candidat_slug']}"
        ajouter_noeud(id_ca, "candidat", f"{ca['prenom']} {ca['nom']}")

        # 2. Le projet (peut manquer si le candidat n'a aucun projet)
        p = ligne.get("projet")
        if p is None:
            continue
        id_p = f"projet:{p['projet_slug']}"
        ajouter_noeud(id_p, "projet", p["titre"], annee=p.get("annee"))
        ajouter_lien(id_ca, id_p, "A_REALISE")

        # 3. La compétence
        c = ligne.get("competence")
        if c is None:
            continue
        id_c = f"competence:{c['skill_slug']}"
        ajouter_noeud(id_c, "competence", c["nom"], niveau=c.get("niveau"))
        ajouter_lien(id_p, id_c, "UTILISE")

        # 4. Le domaine (peut manquer)
        d = ligne.get("domaine")
        if d is None:
            continue
        id_d = f"domaine:{d['domaine_slug']}"
        ajouter_noeud(id_d, "domaine", d["nom"])
        ajouter_lien(id_c, id_d, "APPARTIENT_A")

    return {"nodes": list(nodes.values()), "links": list(links.values())}