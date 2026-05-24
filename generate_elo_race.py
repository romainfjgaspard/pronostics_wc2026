"""
generate_elo_race.py
Génère une animation Bar Chart Race de l'évolution Elo des 48 équipes WC 2026.

Dépendances :
    pip install bar_chart_race pandas matplotlib Pillow
    (MP4) : installer ffmpeg  — https://ffmpeg.org/download.html

Sortie : data/elo_race.mp4  (ou data/elo_race.gif si ffmpeg absent)
"""

import copy, csv, io, json, sys, urllib.request
from collections import defaultdict
from pathlib import Path
from PIL import Image

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

# Codes ISO 3166-1 alpha-2 pour flagcdn.com (gb-eng / gb-sct pour les nations britanniques)
TEAM_ISO = {
    "Algeria": "dz", "Argentina": "ar", "Australia": "au",
    "Austria": "at", "Belgium": "be", "Bosnia and Herzegovina": "ba",
    "Brazil": "br", "Canada": "ca", "Cape Verde": "cv",
    "Colombia": "co", "Croatia": "hr", "Curaçao": "cw",
    "Czech Republic": "cz", "DR Congo": "cd", "Ecuador": "ec",
    "Egypt": "eg", "England": "gb-eng", "France": "fr",
    "Germany": "de", "Ghana": "gh", "Haiti": "ht",
    "Iran": "ir", "Iraq": "iq", "Ivory Coast": "ci",
    "Japan": "jp", "Jordan": "jo", "Mexico": "mx",
    "Morocco": "ma", "Netherlands": "nl", "New Zealand": "nz",
    "Norway": "no", "Panama": "pa", "Paraguay": "py",
    "Portugal": "pt", "Qatar": "qa", "Saudi Arabia": "sa",
    "Scotland": "gb-sct", "Senegal": "sn", "South Africa": "za",
    "South Korea": "kr", "Spain": "es", "Sweden": "se",
    "Switzerland": "ch", "Tunisia": "tn", "Turkey": "tr",
    "United States": "us", "Uruguay": "uy", "Uzbekistan": "uz",
}

# Noms abrégés pour les barres (réduit la marge blanche à gauche)
SHORT_NAMES = {
    "Bosnia and Herzegovina": "Bosnia",
    "Trinidad and Tobago":    "T&T",
    "United States":          "USA",
    "Republic of Ireland":    "Ireland",
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


def dominant_color(flag_url: str) -> str:
    """Couleur dominante d'un drapeau (flagcdn.com + Pillow).

    Filtre les couleurs trop claires (blanc) ou trop sombres (noir),
    non lisibles sur le fond sombre de la BCR.
    """
    with urllib.request.urlopen(flag_url) as r:
        data = r.read()
    img = Image.open(io.BytesIO(data)).convert("RGB").resize((50, 50))
    colors = img.getcolors(maxcolors=2500)
    if not colors:
        return "#64748b"

    def luma(rgb: tuple) -> float:
        return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255

    # Exclure les pixels trop clairs (fond blanc) ou trop sombres (fond noir)
    filtered = [(cnt, rgb) for cnt, rgb in colors if 0.12 < luma(rgb) < 0.82]
    if not filtered:
        filtered = colors  # fallback si le drapeau est monochrome
    r, g, b = max(filtered, key=lambda c: c[0])[1]
    return f"#{r:02x}{g:02x}{b:02x}"


def load_flag_colors(
    teams: list[str],
    iso_map: dict[str, str],
    conf_map: dict[str, str],
) -> dict[str, str]:
    """Charge les couleurs dominantes de drapeaux depuis le cache ou les recalcule."""
    cache_path = ROOT / "data" / "flag_colors.json"
    if cache_path.exists():
        with open(cache_path, encoding="utf-8") as f:
            cached = json.load(f)
        if all(t in cached for t in teams):
            return cached

    print("  Téléchargement des drapeaux (flagcdn.com) et calcul des couleurs…")
    result: dict[str, str] = {}
    for team in teams:
        iso = iso_map.get(team)
        fallback = CONF_COLORS.get(conf_map.get(team, ""), "#64748b")
        if not iso:
            result[team] = fallback
            print(f"    {team}: pas de code ISO → conf")
            continue
        url = f"https://flagcdn.com/w80/{iso}.png"
        try:
            result[team] = dominant_color(url)
            print(f"    {team}: {result[team]}")
        except Exception as e:
            result[team] = fallback
            print(f"    ⚠ {team}: {e!r} → conf")

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"  Cache sauvegardé → {cache_path.name}")
    return result


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
    test_mode = "--test" in sys.argv

    print("=" * 55)
    print("  Bar Chart Race — Elo WC 2026")
    if test_mode:
        print("  MODE TEST (5 premières années)")
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
    df.index = [int(y) for y in years_raw]
    df.index.name = "Année"

    # T3-1 — Noms abrégés (réduit la marge blanche à gauche)
    df.rename(columns=SHORT_NAMES, inplace=True)
    TEAM_CONF_SHORT = {SHORT_NAMES.get(k, k): v for k, v in TEAM_CONF.items()}
    TEAM_ISO_SHORT  = {SHORT_NAMES.get(k, k): v for k, v in TEAM_ISO.items()}

    # T6 — Couleurs dominantes par drapeau (avec cache data/flag_colors.json)
    flag_colors = load_flag_colors(list(df.columns), TEAM_ISO_SHORT, TEAM_CONF_SHORT)
    colors = [flag_colors.get(col, CONF_COLORS.get(TEAM_CONF_SHORT.get(col, ""), "#64748b"))
              for col in df.columns]

    print("\n⬡ Génération de l'animation …")

    # T3-2 — Top 10 + lissage ; T3-3 — Labels repositionnés
    race_kwargs = dict(
        df=df,
        orientation="h",
        sort="desc",
        n_bars=10,
        fixed_order=False,
        fixed_max=False,
        steps_per_period=8,
        period_length=500,
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
        title="Elo Rating Evolution 1872–2026 (Top 10)",
        title_size=14,
        bar_label_size=9,
        tick_label_size=10,
        bar_kwargs={"alpha": 0.88, "ec": "none"},
        period_fmt='{x:.0f}',
        filter_column_colors=True,
    )

    # T3-4 — Test rapide : 5 premières années, steps=1 → valider visuellement avant regen complète
    if test_mode:
        test_kw = copy.deepcopy(race_kwargs)
        test_kw["df"] = df.iloc[:5]
        test_kw["steps_per_period"] = 1
        test_kw["period_length"] = 100
        output_test = ROOT / "data" / "elo_race_test.gif"
        bcr.bar_chart_race(filename=str(output_test), **test_kw)
        print(f"\n  ✓ Test sauvegardé → {output_test}")
        print("  Valider visuellement avant de lancer la génération complète.")
        return

    output_mp4 = ROOT / "data" / "elo_race.mp4"
    output_gif = ROOT / "data" / "elo_race.gif"

    try:
        bcr.bar_chart_race(filename=str(output_mp4), **copy.deepcopy(race_kwargs))
        print(f"\n  ✓ Sauvegardé → {output_mp4}")
    except Exception as e:
        print(f"  ⚠ MP4 échoué ({e!r}) → fallback GIF")
        bcr.bar_chart_race(filename=str(output_gif), **copy.deepcopy(race_kwargs))
        print(f"\n  ✓ Sauvegardé → {output_gif}")


if __name__ == "__main__":
    main()
