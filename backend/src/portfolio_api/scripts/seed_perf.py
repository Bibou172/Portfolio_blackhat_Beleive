"""Remplit une base de TEST pour valider les performances de R3 et R6.

Usage (depuis backend/) : uv run python src/portfolio_api/scripts/seed_perf.py
Variables (optionnelles) : MONGODB_URI, MONGODB_DB
"""

import os
import random

from pymongo import MongoClient

URI = os.getenv("MONGODB_URI", "mongodb://localhost:27018")
DB_NAME = os.getenv("MONGODB_DB", "portfolio_perf")  # base séparée : on ne touche pas aux données de l'équipe

SLUG = "exemple-candidat"
NB_AUTRES_CANDIDATS = 49
PROJETS_PAR_CANDIDAT = 400
SKILLS = [
    "python", "mongodb", "neo4j", "fastapi", "docker", "git", "sql", "pandas",
    "spark", "airflow", "kafka", "react", "typescript", "java", "linux",
    "pytest", "numpy", "scikit-learn", "tableau", "power-bi", "aws", "azure",
    "redis", "elasticsearch", "flask", "django", "bash", "html", "css", "cypher",
]


def main() -> None:
    random.seed(42)  # mêmes données à chaque exécution
    db = MongoClient(URI)[DB_NAME]
    db.drop_collection("projets")

    slugs = [SLUG] + [f"candidat-{i:03d}" for i in range(1, NB_AUTRES_CANDIDATS + 1)]
    docs = []
    for slug in slugs:
        for i in range(PROJETS_PAR_CANDIDAT):
            docs.append(
                {
                    "projet_slug": f"{slug}-projet-{i:04d}",
                    "candidat_slug": slug,
                    "titre": f"Projet {i}",
                    "annee": random.randint(2015, 2026),
                    "competences": random.sample(SKILLS, random.randint(2, 6)),
                }
            )
    db["projets"].insert_many(docs)

    # Index de la section 3.3 de l'ARCHITECTURE
    db["projets"].create_index("projet_slug", unique=True)
    db["projets"].create_index([("candidat_slug", 1), ("annee", -1)])
    db["projets"].create_index("competences")

    print(f"Base '{DB_NAME}' : {db['projets'].count_documents({})} projets, "
          f"dont {PROJETS_PAR_CANDIDAT} pour '{SLUG}'.")
    print("Index :", [ix["name"] for ix in db["projets"].list_indexes()])


if __name__ == "__main__":
    main()