"""
generate_elo_line_race.py
Génère une animation Line Chart Race du score Elo des 48 équipes WC 2026 (1872–2026).
Source : data/elo_ranking_history.json

Dépendances :
    pip install matplotlib numpy
    (MP4) : ffmpeg disponible dans le PATH  — sudo apt install ffmpeg
    (GIF) : pip install Pillow

Sortie : data/elo_line_race.mp4  (ou data/elo_line_race_test.gif avec --test)

Usage :
    python3 generate_elo_line_race.py           # animation complète MP4 (~52s)
    python3 generate_elo_line_race.py --test    # aperçu GIF rapide (30 premières années)
"""

import json
import sys
import numpy as np
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation, FFMpegWriter, PillowWriter

ROOT = Path(__file__).parent

BG          = "#0f172a"
SURFACE2    = "#1e293b"
FG          = "#f1f5f9"
MUTED       = "#cbd5e1"   # slate-300, lisible sur fond sombre
DIM         = "#64748b"   # slate-500, pour éléments secondaires (grid, refline)

TOP_N           = 10
STEPS_PER_YEAR  = 8
FPS             = 36   # 24 × 1.5 — vitesse d'origine accélérée par 1.5

# Couleurs maillot domicile (mêmes que generate_fifa_race.py)
JERSEY_COLORS: dict[str, str] = {
    "Spain": "#C62828", "Argentina": "#6EC6FF", "France": "#1D4ED8",
    "England": "#F5F5F5", "Brazil": "#EAB308", "Portugal": "#9B1C1C",
    "Colombia": "#FACC15", "Netherlands": "#F97316", "Ecuador": "#D4A017",
    "Germany": "#E5E7EB", "Morocco": "#B91C1C", "Japan": "#2563EB",
    "Croatia": "#DC2626", "Mexico": "#15803D", "Uruguay": "#7DD3FC",
    "Turkey": "#DC2626", "Senegal": "#16A34A", "Belgium": "#DC2626",
    "Switzerland": "#DC2626", "Australia": "#D4A017", "Norway": "#DC2626",
    "Paraguay": "#DC2626", "Iran": "#F3F4F6", "Canada": "#DC2626",
    "Austria": "#DC2626", "South Korea": "#DC2626", "Algeria": "#16A34A",
    "Panama": "#DC2626", "Uzbekistan": "#2563EB", "United States": "#1E3A8A",
    "Egypt": "#DC2626", "Scotland": "#1E40AF", "Ivory Coast": "#EA580C",
    "Sweden": "#FACC15", "Jordan": "#DC2626", "Czech Republic": "#DC2626",
    "Iraq": "#15803D", "DR Congo": "#38BDF8", "New Zealand": "#111827",
    "Tunisia": "#DC2626", "Saudi Arabia": "#15803D", "Haiti": "#2563EB",
    "South Africa": "#CA8A04", "Cape Verde": "#2563EB",
    "Bosnia and Herzegovina": "#2563EB", "Qatar": "#7C2D5C",
    "Ghana": "#F9FAFB", "Curaçao": "#2563EB",
}

SHORT_NAMES: dict[str, str] = {
    "Bosnia and Herzegovina": "Bosnia",
    "United States":          "USA",
    "South Africa":           "S. Africa",
    "Saudi Arabia":           "S. Arabia",
    "Czech Republic":         "Czechia",
    "DR Congo":               "DR Congo",
    "New Zealand":            "N. Zealand",
    "South Korea":            "S. Korea",
}

# Couleurs quasi-blanches illisibles sur fond sombre → gris clair
WHITE_JERSEYS = {"#F5F5F5", "#E5E7EB", "#F3F4F6", "#F9FAFB", "#F1F5F9"}


def _team_color(name: str) -> str:
    c = JERSEY_COLORS.get(name, "#94a3b8")
    return "#cbd5e1" if c in WHITE_JERSEYS else c


def _nudge_labels(
    sorted_teams: list[str],
    raw_y: dict[str, float],
    y_min: float,
    y_max: float,
) -> dict[str, float]:
    """Évite le chevauchement vertical des labels (tri décroissant par score)."""
    min_sep = (y_max - y_min) * 0.028
    result: dict[str, float] = {}
    prev = None
    for team in sorted_teams:
        y = raw_y[team]
        if prev is not None and prev - y < min_sep:
            y = prev - min_sep
        result[team] = max(y_min, min(y_max, y))
        prev = y
    return result


def main() -> None:
    test_mode = "--test" in sys.argv

    print("=" * 55)
    print("  Line Chart Race — Elo Score 1872–2026")
    if test_mode:
        print("  MODE TEST (30 premières années, GIF)")
    print("=" * 55)

    path = ROOT / "data" / "elo_ranking_history.json"
    if not path.exists():
        print(f"\n❌ {path} introuvable.")
        print("   Vérifiez que fetch_elo_history.py a bien tourné.")
        return

    with open(path, encoding="utf-8") as f:
        history = json.load(f)

    snapshots = history["snapshots"]
    years     = [s["year"] for s in snapshots]
    print(f"\n  {len(snapshots)} snapshots chargés ({years[0]} → {years[-1]})")

    # Top N par Elo final
    final_elos   = {r["name"]: r["elo"] for r in snapshots[-1]["rankings"]}
    top_teams    = sorted(final_elos, key=lambda t: final_elos[t], reverse=True)[:TOP_N]
    print(f"  Top {TOP_N} : {', '.join(top_teams)}")

    # Matrices Elo : shape (n_snapshots, TOP_N)
    elo_matrix: dict[str, list[float]] = {team: [] for team in top_teams}
    for snap in snapshots:
        snap_elos = {r["name"]: r["elo"] for r in snap["rankings"]}
        for team in top_teams:
            elo_matrix[team].append(float(snap_elos.get(team, 1500.0)))

    years_arr = np.array(years, dtype=float)

    if test_mode:
        n = 30
        years_arr = years_arr[:n]
        for team in top_teams:
            elo_matrix[team] = elo_matrix[team][:n]

    n_snap         = len(years_arr)
    n_intervals    = n_snap - 1
    total_frames   = n_intervals * STEPS_PER_YEAR + 1

    # Précomputer les séries interpolées
    xs = np.empty(total_frames)
    ys: dict[str, np.ndarray] = {team: np.empty(total_frames) for team in top_teams}

    for i in range(n_intervals):
        for step in range(STEPS_PER_YEAR):
            fi = i * STEPS_PER_YEAR + step
            t  = step / STEPS_PER_YEAR
            xs[fi] = years_arr[i] + t
            for team in top_teams:
                ys[team][fi] = elo_matrix[team][i] + t * (elo_matrix[team][i + 1] - elo_matrix[team][i])
    xs[-1] = years_arr[-1]
    for team in top_teams:
        ys[team][-1] = elo_matrix[team][-1]

    print(f"  {total_frames} frames ({total_frames / FPS:.1f}s à {FPS} fps)")

    all_elos = np.concatenate([ys[t] for t in top_teams])
    y_min    = max(1400.0, float(all_elos.min()) - 60)
    y_max    = float(all_elos.max()) + 90
    x_min    = float(years_arr[0])
    x_max    = float(years_arr[-1])
    x_pad    = (x_max - x_min) * 0.14  # marge pour les labels à droite

    dpi = 80 if test_mode else 120
    fig = plt.figure(figsize=(16, 9), dpi=dpi)
    fig.patch.set_facecolor(BG)

    # Sous-plot avec marge droite pour les labels
    ax = fig.add_axes([0.06, 0.09, 0.74, 0.82])
    ax.set_facecolor(BG)

    # Titres fixes
    fig.text(0.02, 0.97,
             "Elo Score Evolution — Top 10 WC 2026 Teams",
             color=FG, fontsize=13, fontweight="bold", va="top", ha="left")
    fig.text(0.02, 0.93,
             "Source: eloratings.net · 48 qualified teams for the 2026 World Cup",
             color=MUTED, fontsize=8.5, va="top", ha="left", alpha=0.85)

    # Artistes par équipe (créés une seule fois)
    team_colors = {t: _team_color(t) for t in top_teams}
    lines:  dict[str, plt.Line2D] = {}
    dots:   dict[str, plt.Line2D] = {}
    lbls:   dict[str, plt.Text]   = {}

    for team in top_teams:
        c = team_colors[team]
        line, = ax.plot([], [], color=c, linewidth=2.4, solid_capstyle="round", alpha=0.92, zorder=3)
        dot,  = ax.plot([], [], "o", color=c, markersize=6, zorder=5)
        lbl   = ax.text(0, 0, SHORT_NAMES.get(team, team),
                        color=c, fontsize=9, fontweight="bold",
                        va="center", ha="left", clip_on=False, zorder=6)
        lines[team] = line
        dots[team]  = dot
        lbls[team]  = lbl

    year_txt = ax.text(0.985, 0.06, "", transform=ax.transAxes,
                       ha="right", va="bottom", fontsize=26, fontweight="bold",
                       color=FG, alpha=0.8, zorder=7)

    def _style_axes() -> None:
        ax.set_xlim(x_min - 2, x_max + x_pad)
        ax.set_ylim(y_min, y_max)
        ax.set_facecolor(BG)
        ax.tick_params(colors=MUTED, labelsize=9)
        for spine in ax.spines.values():
            spine.set_color(SURFACE2)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.set_xlabel("Year", color=MUTED, fontsize=10)
        ax.set_ylabel("Elo Score", color=MUTED, fontsize=10)
        ax.grid(True, color=SURFACE2, linewidth=0.7, linestyle="--", alpha=0.6)
        # Ligne de référence à 1500 (score initial)
        ax.axhline(1500, color=DIM, linewidth=0.6, linestyle=":", alpha=0.5, zorder=1)

    def init():
        _style_axes()
        for team in top_teams:
            lines[team].set_data([], [])
            dots[team].set_data([], [])
            lbls[team].set_visible(False)
        year_txt.set_text("")
        return [*lines.values(), *dots.values(), *lbls.values(), year_txt]

    def update(frame: int):
        x_cur  = xs[frame]
        x_data = xs[:frame + 1]

        scores = {team: ys[team][frame] for team in top_teams}
        by_score = sorted(top_teams, key=lambda t: scores[t], reverse=True)
        adj_y = _nudge_labels(by_score, scores, y_min, y_max)

        for team in top_teams:
            y_data = ys[team][:frame + 1]
            lines[team].set_data(x_data, y_data)
            dots[team].set_data([x_cur], [scores[team]])
            lbls[team].set_position((x_cur + 1.5, adj_y[team]))
            lbls[team].set_visible(frame > 0)

        year_txt.set_text(f"{int(x_cur)}")
        return [*lines.values(), *dots.values(), *lbls.values(), year_txt]

    anim = FuncAnimation(
        fig, update,
        frames=total_frames,
        init_func=init,
        interval=1000 / FPS,
        blit=True,
    )

    if test_mode:
        output = ROOT / "data" / "elo_line_race_test.gif"
        print(f"\n⬡ Sauvegarde GIF test…")
        anim.save(str(output), writer=PillowWriter(fps=FPS), dpi=dpi)
        size_mb = output.stat().st_size / 1024 / 1024
        print(f"\n  ✓ Sauvegardé → {output}  ({size_mb:.1f} MB)")
        print("  Valider visuellement avant de lancer la génération complète.")
    else:
        output = ROOT / "data" / "elo_line_race.mp4"
        print(f"\n⬡ Génération MP4 complète ({total_frames} frames)…")
        writer = FFMpegWriter(
            fps=FPS, bitrate=2500, codec="libx264",
            extra_args=["-pix_fmt", "yuv420p"],
        )
        anim.save(str(output), writer=writer, dpi=dpi)
        size_mb = output.stat().st_size / 1024 / 1024
        print(f"\n  ✓ Sauvegardé → {output}  ({size_mb:.1f} MB)")

    plt.close(fig)


if __name__ == "__main__":
    main()
