"""
Récupération des données football pour le concours de pronostics WC 2026
Source principale : https://github.com/martj42/international_results (CC0)
Toutes les données depuis 1872 — aucun filtre de date ou de compétition.
"""

import csv
import io
import json
import os
import urllib.request

# ── Configuration ────────────────────────────────────────────────────────────

BASE_URL = "https://raw.githubusercontent.com/martj42/international_results/master"

FILES = {
    "results":     f"{BASE_URL}/results.csv",
    "shootouts":   f"{BASE_URL}/shootouts.csv",
    "goalscorers": f"{BASE_URL}/goalscorers.csv",
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")

# ── Helpers ──────────────────────────────────────────────────────────────────

def download_csv(url: str) -> list[dict]:
    """Télécharge un CSV depuis une URL et retourne une liste de dicts."""
    print(f"  Téléchargement : {url}")
    with urllib.request.urlopen(url, timeout=120) as resp:
        content = resp.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    return list(reader)



def save_csv(rows: list[dict], path: str):
    if not rows:
        print(f"  ⚠️  Aucune ligne à écrire dans {path}")
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"  ✅ {len(rows)} lignes → {path}")


def save_json(obj, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    print(f"  ✅ JSON → {path}")


# ── Traitement principal ──────────────────────────────────────────────────────

def build_match_index(results: list[dict], shootouts: list[dict]) -> list[dict]:
    """
    Fusionne résultats + tirs au but en un objet unique par match.
    """
    # Index des séances de tirs au but
    so_index = {
        (s["date"], s["home_team"], s["away_team"]): s
        for s in shootouts
    }

    enriched = []
    for r in results:
        key = (r["date"], r["home_team"], r["away_team"])
        so = so_index.get(key)
        entry = {
            "date":        r["date"],
            "home_team":   r["home_team"],
            "away_team":   r["away_team"],
            "home_score":  r["home_score"],
            "away_score":  r["away_score"],
            "tournament":  r["tournament"],
            "city":        r["city"],
            "country":     r["country"],
            "neutral":     r["neutral"],
            "shootout":    so["winner"] if so else None,
            "first_shooter": so["first_shooter"] if so else None,
        }
        enriched.append(entry)
    return enriched


def stats_by_tournament(results: list[dict]) -> dict:
    """Résumé : nb matchs par compétition."""
    counts: dict[str, int] = {}
    for r in results:
        t = r["tournament"]
        counts[t] = counts.get(t, 0) + 1
    return dict(sorted(counts.items(), key=lambda x: -x[1]))


def stats_by_team(results: list[dict]) -> dict:
    """
    Pour chaque équipe : victoires, nuls, défaites, buts marqués/encaissés.
    """
    teams: dict[str, dict] = {}

    def get(team):
        if team not in teams:
            teams[team] = {"W": 0, "D": 0, "L": 0, "GF": 0, "GA": 0, "GP": 0}
        return teams[team]

    for r in results:
        try:
            hs = int(r["home_score"])
        except (ValueError, TypeError):
            continue  # match annulé / futur (score "NA" ou vide)
        try:
            as_ = int(r["away_score"])
        except (ValueError, TypeError):
            continue
        h, a = r["home_team"], r["away_team"]
        get(h)["GP"] += 1
        get(a)["GP"] += 1
        get(h)["GF"] += hs
        get(h)["GA"] += as_
        get(a)["GF"] += as_
        get(a)["GA"] += hs
        if hs > as_:
            get(h)["W"] += 1
            get(a)["L"] += 1
        elif hs < as_:
            get(a)["W"] += 1
            get(h)["L"] += 1
        else:
            get(h)["D"] += 1
            get(a)["D"] += 1

    # Calcul du win-rate
    for t, s in teams.items():
        s["win_rate"] = round(s["W"] / s["GP"], 3) if s["GP"] else 0

    return dict(sorted(teams.items(), key=lambda x: -x[1]["W"]))


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Récupération données WC 2026 — concours de pronostics")
    print("=" * 60)

    # 1. Téléchargement
    print("\n[1/4] Téléchargement des CSV depuis GitHub...")
    raw_results     = download_csv(FILES["results"])
    raw_shootouts   = download_csv(FILES["shootouts"])
    raw_goalscorers = download_csv(FILES["goalscorers"])
    print(f"  Brut : {len(raw_results)} résultats, "
          f"{len(raw_shootouts)} tirs au but, "
          f"{len(raw_goalscorers)} buteurs")

    # 2. Aucun filtre — on garde tout (depuis 1872)
    print("\n[2/4] Aucun filtrage (historique complet depuis 1872)...")
    results     = raw_results
    shootouts   = raw_shootouts
    goalscorers = raw_goalscorers

    # 3. Enrichissement
    print("\n[3/4] Enrichissement et calcul des stats...")
    matches = build_match_index(results, shootouts)
    by_tournament = stats_by_tournament(results)
    by_team = stats_by_team(results)

    # 4. Export
    print(f"\n[4/4] Export dans {OUTPUT_DIR}/")
    save_csv(results,     os.path.join(OUTPUT_DIR, "results.csv"))
    save_csv(shootouts,   os.path.join(OUTPUT_DIR, "shootouts.csv"))
    save_csv(goalscorers, os.path.join(OUTPUT_DIR, "goalscorers.csv"))
    save_json(matches,       os.path.join(OUTPUT_DIR, "matches_enriched.json"))
    save_json(by_tournament, os.path.join(OUTPUT_DIR, "stats_tournaments.json"))
    save_json(by_team,       os.path.join(OUTPUT_DIR, "stats_teams.json"))

    # Résumé
    print("\n" + "=" * 60)
    print("  Résumé par compétition :")
    for t, n in by_tournament.items():
        print(f"    {n:>4} matchs  {t}")

    print("\n  Top 10 équipes (victoires) :")
    for team, s in list(by_team.items())[:10]:
        print(f"    {team:<25}  {s['GP']} matchs  {s['W']}V {s['D']}N {s['L']}D  "
              f"win={s['win_rate']:.0%}")

    print("\n✅ Terminé !")


if __name__ == "__main__":
    main()
