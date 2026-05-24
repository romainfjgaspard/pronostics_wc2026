"""
generate_elo_race.py
Génère une animation Bar Chart Race de l'évolution Elo des 48 équipes WC 2026.

Dépendances :
    pip install bar_chart_race pandas matplotlib
    (MP4) : installer ffmpeg  — https://ffmpeg.org/download.html
    (GIF) : pip install Pillow  (généralement inclus avec matplotlib)

Sortie : data/elo_race.mp4  (ou data/elo_race.gif si ffmpeg absent)
"""

import csv, json, shutil
from collections import defaultdict
from pathlib import Path

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import bar_chart_race as bcr

ROOT = Path(__file__).parent

# ── Confédérations et couleurs ────────────────────────────────────────────────
CONF_COLORS = {
    "UEFA":     "#38bdf8",   # bleu ciel
    "CONMEBOL": "#22c55e",   # vert
    "CONCACAF": "#f59e0b",   # ambre
    "CAF":      "#ef4444",   # rouge
    "AFC":      "#a78bfa",   # violet
    "OFC":      "#fb923c",   # orange
}

TEAM_CONF = {
    "Algeria": "CAF", "Argentina": "CONMEBOL", "Australia": "AFC",
    "Austria": "UEFA", "Belgium": "UEFA", "Bosnia and Herzegovina": "UEFA",
    "Brazil": "CONMEBOL", "Canada": "CONCACAF", "Cape Verde": "CAF",
    "Colombia": "CONMEBOL", "Croatia": "UEFA", "Curaçao": "CONCACAF",
    "Czech Republic": "UEFA", "DR Congo": "CAF", "Ecuador": "CONMEBOL",
    "Egypt": "CAF", "England": "UEFA", "France": "UEFA", "Germany": "UEFA",
    "Ghana": "CAF", "Haiti": "CONCACAF", "Iran": "AFC", "Iraq": "AFC",
    "Ivory Coast": "CAF", "Japan": "AFC", "Jordan": "AFC",
    "Mexico": "CONCACAF", "Morocco": "CAF", "Netherlands": "UEFA",
    "New Zealand": "OFC", "Norway": "UEFA", "Panama": "CONCACAF",
    "Paraguay": "CONMEBOL", "Portugal": "UEFA", "Qatar": "AFC",
    "Saudi Arabia": "AFC", "Scotland": "UEFA", "Senegal": "CAF",
    "South Africa": "CAF", "South Korea": "AFC", "Spain": "UEFA",
    "Sweden": "UEFA", "Switzerland": "UEFA", "Tunisia": "CAF",
    "Turkey": "UEFA", "United States": "CONCACAF", "Uruguay": "CONMEBOL",
    "Uzbekistan": "AFC",
}

# ── Calcul Elo (identique à generate_web_data.py) ────────────────────────────
def get_k(tournament: str) -> int:
    t = tournament.lower()
    if "world cup" in t and "qualif" not in t: return 60
    if any(x in t for x in ["euro", "copa am", "african cup", "asian cup", "gold cup", "oceania"]): return 50
    if "qualif" in t or "nations league" in t: return 35
    if "friendly" in t: return 20
    return 28

def elo_exp(ra, rb):
    return 1.0 / (1.0 + 10.0 ** ((rb - ra) / 400.0))


def build_snapshots(wc_teams: set) -> dict[str, dict]:
    """Rejoue le calcul Elo année par année et retourne les snapshots."""
    with open(ROOT / "data" / "results.csv", encoding="utf-8") as f:
        results = list(csv.DictReader(f))

    history = sorted(
        [r for r in results
         if r["date"] >= "1872-01-01"
         and not (r["tournament"] == "FIFA World Cup" and r["date"] >= "2026-06-01")],
        key=lambda x: x["date"],
    )

    elo = defaultdict(lambda: 1500.0)
    snapshots: dict[str, dict] = {}
    current_year = None

    for m in history:
        year = m["date"][:4]
        if year != current_year:
            if current_year:
                snapshots[current_year] = {t: round(elo[t]) for t in wc_teams}
            current_year = year

        h, a = m["home_team"], m["away_team"]
        try:
            hs, as_ = int(m["home_score"]), int(m["away_score"])
        except (ValueError, TypeError):
            continue

        neutral = str(m.get("neutral", "FALSE")).upper() == "TRUE"
        ha = 0 if neutral else 75
        k = get_k(m.get("tournament", ""))
        ea = elo_exp(elo[h] + ha, elo[a])
        sa = 1.0 if hs > as_ else (0.5 if hs == as_ else 0.0)
        elo[h] += k * (sa - ea)
        elo[a] += k * ((1 - sa) - (1 - ea))

    if current_year:
        snapshots[current_year] = {t: round(elo[t]) for t in wc_teams}

    return snapshots


def main():
    print("=" * 55)
    print("  Bar Chart Race — Elo WC 2026")
    print("=" * 55)

    # WC teams from rankings.json
    with open(ROOT / "data" / "rankings.json", encoding="utf-8") as f:
        rankings = json.load(f)
    wc_teams = set(r["name"] for r in rankings)
    print(f"\n  {len(wc_teams)} équipes qualifiées chargées")

    # Elo snapshots annuels
    snapshots = build_snapshots(wc_teams)
    years_raw = sorted(snapshots.keys())
    print(f"  {len(years_raw)} snapshots annuels ({years_raw[0]} → {years_raw[-1]})")

    # DataFrame : lignes = années, colonnes = équipes (tri alphabétique)
    teams_sorted = sorted(wc_teams)
    df = pd.DataFrame(
        {t: [snapshots[y].get(t, 1500) for y in years_raw] for t in teams_sorted},
        index=years_raw,
    )
    df.index.name = "Année"

    # Couleurs dans l'ordre des colonnes
    colors = [CONF_COLORS.get(TEAM_CONF.get(t, ""), "#64748b") for t in df.columns]

    # Légende des confédérations dans le titre
    conf_legend = "  ".join(
        f"■ {conf}" for conf, color in CONF_COLORS.items()
    )

    print("\n⬡ Génération de l'animation …")

    race_kwargs = dict(
        df=df,
        orientation="h",
        sort="desc",
        n_bars=12,
        fixed_order=False,
        fixed_max=False,
        steps_per_period=4,
        period_length=300,
        interpolate_period=False,
        label_bars=True,
        bar_size=0.85,
        period_label={
            "x": 0.97, "y": 0.04,
            "ha": "right", "va": "bottom",
            "size": 20, "fontweight": "bold",
        },
        period_summary_func=lambda v, r: {
            "x": 0.97, "y": 0.13,
            "ha": "right", "va": "bottom",
            "s": f"Top: {v.idxmax()}  {v.max():.0f} pts",
            "size": 10,
        },
        cmap=colors,
        title="WC 2026 — Elo Rating Evolution 1872–2026 (Top 12)",
        title_size=14,
        bar_label_size=9,
        tick_label_size=10,
        bar_kwargs={"alpha": 0.88, "ec": "none"},
        filter_column_colors=True,
    )

    output_mp4 = ROOT / "data" / "elo_race.mp4"
    output_gif = ROOT / "data" / "elo_race.gif"

    if shutil.which("ffmpeg"):
        bcr.bar_chart_race(filename=str(output_mp4), **race_kwargs)
        print(f"\n  ✓ Sauvegardé → {output_mp4}")
    else:
        print("  ℹ️  ffmpeg absent → génération GIF (plus lent, fichier plus lourd)")
        bcr.bar_chart_race(filename=str(output_gif), **race_kwargs)
        print(f"\n  ✓ Sauvegardé → {output_gif}")
        print("  ℹ️  Pour un MP4 : installer ffmpeg puis relancer")


if __name__ == "__main__":
    main()
