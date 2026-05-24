"""
generate_fifa_race.py
Génère une animation Bar Chart Race du classement FIFA masculin (1992–2026).
Source : data/fifa_ranking_history.json (généré par fetch_fifa_ranking_history.py)

Dépendances :
    pip install bar_chart_race pandas matplotlib
    (MP4) : installer ffmpeg  — https://ffmpeg.org/download.html
    (GIF) : pip install Pillow  (généralement inclus avec matplotlib)

Sortie : data/fifa_race.mp4  (ou data/fifa_race.gif si ffmpeg absent)

Note : les points FIFA ont changé d'échelle lors des révisions méthodologiques
       (1993, 2006, 2018). La discontinuité visible dans l'animation reflète ces
       changements officiels — l'ordre relatif des équipes reste fiable.
"""

import copy
import json
import sys
from pathlib import Path

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import bar_chart_race as bcr

ROOT = Path(__file__).parent

CONF_COLORS = {
    "UEFA":     "#38bdf8",
    "CONMEBOL": "#22c55e",
    "CONCACAF": "#f59e0b",
    "CAF":      "#ef4444",
    "AFC":      "#a78bfa",
    "OFC":      "#fb923c",
}

SHORT_NAMES = {
    "Bosnia and Herzegovina": "Bosnia",
    "Serbia and Montenegro":  "Serb.&Mont.",
    "Trinidad and Tobago":    "T&T",
    "United States":          "USA",
    "Republic of Ireland":    "Ireland",
    "Northern Ireland":       "N. Ireland",
    "Korea Republic":         "South Korea",
    "Czech Republic":         "Czechia",
    "Czechoslovakia":         "Czechoslovakia",   # historique, nom court suffisant
    "Côte d'Ivoire":          "Ivory Coast",
    "South Africa":           "S. Africa",
    "Saudi Arabia":           "S. Arabia",
    "IR Iran":                "Iran",
    "DR Congo":               "DR Congo",
    "Costa Rica":             "Costa Rica",       # 10 chars OK
}


def main() -> None:
    test_mode = "--test" in sys.argv

    print("=" * 55)
    print("  Bar Chart Race — FIFA Ranking 1992–2026")
    if test_mode:
        print("  MODE TEST (10 premières années)")
    print("=" * 55)

    hist_path = ROOT / "data" / "fifa_ranking_history.json"
    if not hist_path.exists():
        print(f"\n❌ {hist_path} introuvable.")
        print("   Lancez d'abord : python3 fetch_fifa_ranking_history.py")
        return

    with open(hist_path, encoding="utf-8") as f:
        history = json.load(f)

    snapshots = history["snapshots"]
    print(f"\n  {len(snapshots)} snapshots chargés ({snapshots[0]['year']} → {snapshots[-1]['year']})")

    # Construire team → confederation depuis les données
    team_conf: dict[str, str] = {}
    for snap in snapshots:
        for team in snap["rankings"]:
            name = SHORT_NAMES.get(team["name"], team["name"])
            if name not in team_conf and team["confederation"]:
                team_conf[name] = team["confederation"]

    # Construire le DataFrame : index=années, colonnes=équipes, valeurs=points
    all_teams: set[str] = set()
    for snap in snapshots:
        for team in snap["rankings"]:
            all_teams.add(SHORT_NAMES.get(team["name"], team["name"]))

    teams_sorted = sorted(all_teams)
    years = [s["year"] for s in snapshots]

    data_dict: dict[str, list[float]] = {team: [] for team in teams_sorted}
    for snap in snapshots:
        pts_this_year = {
            SHORT_NAMES.get(t["name"], t["name"]): t["points"]
            for t in snap["rankings"]
        }
        for team in teams_sorted:
            data_dict[team].append(pts_this_year.get(team, 0.0))

    df = pd.DataFrame(data_dict, index=years)
    df.index.name = "Année"
    print(f"  DataFrame : {len(df)} années × {len(df.columns)} équipes")

    colors = [CONF_COLORS.get(team_conf.get(col, ""), "#64748b") for col in df.columns]

    race_kwargs = dict(
        df=df,
        orientation="h",
        sort="desc",
        n_bars=10,
        fixed_order=False,
        fixed_max=False,
        steps_per_period=8,
        period_length=1000,
        interpolate_period=True,
        label_bars=True,
        bar_size=0.85,
        period_label={
            "x": 0.97, "y": 0.04,
            "ha": "right", "va": "bottom",
            "size": 18, "fontweight": "bold",
            "color": "#f1f5f9",
            "bbox": {"facecolor": "#0f172a", "edgecolor": "none", "pad": 4, "alpha": 0.85},
            "zorder": 5,
        },
        period_summary_func=None,
        cmap=colors,
        title="FIFA Ranking Evolution 1992–2026 (Top 10)",
        title_size=14,
        bar_label_size=9,
        tick_label_size=10,
        bar_kwargs={"alpha": 0.88, "ec": "none"},
        period_fmt='{x:.0f}',
        filter_column_colors=True,
    )

    if test_mode:
        test_kw = copy.deepcopy(race_kwargs)
        test_kw["df"] = df.iloc[:10]
        test_kw["steps_per_period"] = 1
        test_kw["period_length"] = 100
        output_test = ROOT / "data" / "fifa_race_test.gif"
        print("\n⬡ Génération du test GIF (10 premières années)…")
        bcr.bar_chart_race(filename=str(output_test), **test_kw)
        print(f"\n  ✓ Test sauvegardé → {output_test}")
        print("  Valider visuellement avant de lancer la génération complète.")
        return

    output_mp4 = ROOT / "data" / "fifa_race.mp4"
    output_gif = ROOT / "data" / "fifa_race.gif"

    print("\n⬡ Génération de l'animation complète…")
    try:
        bcr.bar_chart_race(filename=str(output_mp4), **copy.deepcopy(race_kwargs))
        size_mb = output_mp4.stat().st_size / 1024 / 1024
        print(f"\n  ✓ Sauvegardé → {output_mp4}  ({size_mb:.1f} MB)")
    except Exception as e:
        print(f"  ⚠ MP4 échoué ({e!r}) → fallback GIF")
        bcr.bar_chart_race(filename=str(output_gif), **copy.deepcopy(race_kwargs))
        size_mb = output_gif.stat().st_size / 1024 / 1024
        print(f"\n  ✓ Sauvegardé → {output_gif}  ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
