"""Validation des performances de R3 et R6 avec explain("executionStats").

Usage (depuis backend/) : uv run python src/portfolio_api/scripts/check_perf_stats.py
Variables d'environnement : MONGODB_URI, MONGODB_DB, CANDIDAT_SLUG
"""

import os
import sys
import time

from pymongo import MongoClient

from portfolio_api.repositories.mongo_stats import build_competences_pipeline


def find_stages(node, key="stage"):
    """Parcourt récursivement le plan d'exécution et renvoie tous les noms de stages."""
    found = []
    if isinstance(node, dict):
        if key in node:
            found.append(node[key])
        for value in node.values():
            found.extend(find_stages(value, key))
    elif isinstance(node, list):
        for item in node:
            found.extend(find_stages(item, key))
    return found


def explain_pipeline(db, pipeline):
    return db.command(
        {
            "explain": {"aggregate": "projets", "pipeline": pipeline, "cursor": {}},
            "verbosity": "executionStats",
        }
    )


def main() -> int:
    uri = os.environ["MONGODB_URI"]
    db = MongoClient(uri)[os.getenv("MONGODB_DB", "portfolio")]
    slug = os.getenv("CANDIDAT_SLUG", "exemple-candidat")

    cases = {
        "R3 - stats compétences": build_competences_pipeline(slug),
        "R6 - top 5": build_competences_pipeline(slug, 5),
    }

    ok = True
    for name, pipeline in cases.items():
        plan = explain_pipeline(db, pipeline)
        stages = find_stages(plan)
        uses_index = "IXSCAN" in stages
        collscan = "COLLSCAN" in stages

        stats = plan.get("executionStats", {})
        if not stats:  # autre format de réponse : stats dans le 1er stage
            stats = plan.get("stages", [{}])[0].get("$cursor", {}).get("executionStats", {})
        docs_examined = stats.get("totalDocsExamined")
        keys_examined = stats.get("totalKeysExamined")
        millis = stats.get("executionTimeMillis")

        # Mesure réelle côté client (moyenne sur 20 exécutions)
        start = time.perf_counter()
        for _ in range(20):
            list(db["projets"].aggregate(pipeline))
        avg_ms = (time.perf_counter() - start) / 20 * 1000

        print(f"\n=== {name} ===")
        print(f"Stages          : {sorted(set(stages))}")
        print(f"IXSCAN          : {'OUI' if uses_index else 'NON'}")
        print(f"COLLSCAN        : {'OUI (à corriger)' if collscan else 'non'}")
        print(f"Keys examinées  : {keys_examined}")
        print(f"Docs examinés   : {docs_examined}")
        print(f"executionTime   : {millis} ms (serveur)")
        print(f"Temps moyen     : {avg_ms:.1f} ms (x20, client)")

        if collscan or not uses_index:
            ok = False

    print("\nRésultat global :", "OK" if ok else "À CORRIGER (vérifier les index)")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())