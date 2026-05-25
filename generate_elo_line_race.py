"""
generate_elo_line_race.py
Animation Line Chart Race du score Elo mondial depuis 1872.
Toutes les équipes jamais dans le top 10 mondial — drapeaux sur le top 10 courant.

Dépendances :
    pip install matplotlib numpy Pillow
    (MP4) : ffmpeg dans le PATH — sudo apt install ffmpeg

Source : data/elo_global_history.json (généré par generate_web_data.py)
Sortie : data/elo_line_race.mp4

Usage :
    python3 generate_elo_line_race.py           # animation complète MP4
    python3 generate_elo_line_race.py --test    # aperçu GIF (50 dernières années)
"""

import json
import sys
import numpy as np
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.image
from matplotlib.animation import FuncAnimation, FFMpegWriter, PillowWriter
from PIL import Image

ROOT     = Path(__file__).parent
FLAG_DIR = ROOT / "data" / "flags"

BG       = "#0f172a"
SURFACE2 = "#1e293b"
FG       = "#f1f5f9"
MUTED    = "#cbd5e1"
DIM      = "#64748b"

KEEP_TEAMS: set[str] = {
    "Argentina", "England", "Brazil", "Germany", "Italy",
    "Spain", "Netherlands", "Uruguay", "Belgium", "France",
    "Portugal",
}
TOP_HIGHLIGHT  = 10   # nb d'équipes avec flags+labels à chaque instant
STEPS_PER_YEAR = 8
FPS            = 24
FLAG_HEIGHT_PX = 11   # hauteur d'affichage des drapeaux en pixels
START_YEAR     = 1920

# ISO2 pour les drapeaux — équipes WC 2026 + équipes historiques
TEAM_ISO2: dict[str, str] = {
    "Argentina": "ar", "Brazil": "br", "Uruguay": "uy", "Colombia": "co",
    "Ecuador": "ec", "Chile": "cl", "Paraguay": "py", "Peru": "pe",
    "Mexico": "mx", "United States": "us", "Canada": "ca", "Panama": "pa",
    "Costa Rica": "cr", "Haiti": "ht", "Curaçao": "cw",
    "Trinidad and Tobago": "tt",
    "Germany": "de", "France": "fr", "Spain": "es", "Portugal": "pt",
    "Netherlands": "nl", "Belgium": "be", "Italy": "it", "England": "gb-eng",
    "Switzerland": "ch", "Croatia": "hr", "Denmark": "dk", "Poland": "pl",
    "Sweden": "se", "Norway": "no", "Austria": "at", "Czech Republic": "cz",
    "Scotland": "gb-sct", "Wales": "gb-wls", "Northern Ireland": "gb-nir",
    "Hungary": "hu", "Romania": "ro", "Russia": "ru",
    "Turkey": "tr",
    "Morocco": "ma", "Senegal": "sn", "Algeria": "dz", "Egypt": "eg",
    "Tunisia": "tn", "South Africa": "za", "DR Congo": "cd", "Ghana": "gh",
    "Ivory Coast": "ci",
    "Japan": "jp", "South Korea": "kr", "Australia": "au", "Iran": "ir",
    "Saudi Arabia": "sa", "Qatar": "qa", "Iraq": "iq", "Uzbekistan": "uz",
    "Jordan": "jo", "China PR": "cn", "Myanmar": "mm",
    "New Zealand": "nz", "Tahiti": "pf",
    # Équipes historiques sans ISO direct → meilleur fallback disponible
    "Yugoslavia":     "rs",   # Serbie (successeur principal)
    "Czechoslovakia": "cz",
    "German DR":      "de",
    "Basque Country": "es",
    "Guernsey":       "gb-eng",
    "Jersey":         "gb-eng",
}

SHORT_NAMES: dict[str, str] = {
    "Bosnia and Herzegovina": "Bosnia",
    "United States":          "USA",
    "South Africa":           "S. Africa",
    "Saudi Arabia":           "S. Arabia",
    "Czech Republic":         "Czechia",
    "Czechoslovakia":         "Czechoslov.",
    "DR Congo":               "DR Congo",
    "New Zealand":            "N. Zealand",
    "South Korea":            "S. Korea",
    "Northern Ireland":       "N. Ireland",
    "Trinidad and Tobago":    "T&T",
    "Basque Country":         "Basque C.",
    "German DR":              "E. Germany",
    "China PR":               "China",
}

JERSEY_COLORS: dict[str, str] = {
    # WC 2026
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
    "Sweden": "#FACC15", "Czech Republic": "#DC2626",
    "DR Congo": "#38BDF8", "New Zealand": "#111827",
    "Tunisia": "#DC2626", "Saudi Arabia": "#15803D", "Haiti": "#2563EB",
    "South Africa": "#CA8A04", "Cape Verde": "#2563EB",
    "Bosnia and Herzegovina": "#2563EB", "Qatar": "#7C2D5C",
    "Ghana": "#F9FAFB", "Curaçao": "#2563EB",
    # Historiques
    "Italy":              "#1E3A8A",
    "Hungary":            "#DC2626",
    "Yugoslavia":         "#2563EB",
    "Czechoslovakia":     "#DC2626",
    "German DR":          "#F59E0B",
    "Romania":            "#FACC15",
    "Poland":             "#DC2626",
    "Denmark":            "#DC2626",
    "Chile":              "#DC2626",
    "Russia":             "#DC2626",
    "Wales":              "#DC2626",
    "Northern Ireland":   "#15803D",
    "Peru":               "#DC2626",
    "Costa Rica":         "#DC2626",
    "Trinidad and Tobago":"#DC2626",
    "China PR":           "#DC2626",
    "Myanmar":            "#FACC15",
    "Tahiti":             "#2563EB",
    "Basque Country":     "#DC2626",
    "Guernsey":           "#1D4ED8",
    "Jersey":             "#DC2626",
}

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


def _gaussian_smooth(arr: list[float], sigma: float = 2.5) -> list[float]:
    """Lissage gaussien sur les données annuelles (numpy pur, sans scipy)."""
    a = np.array(arr, dtype=float)
    radius = int(3 * sigma)
    x = np.arange(-radius, radius + 1)
    kernel = np.exp(-x ** 2 / (2 * sigma ** 2))
    kernel /= kernel.sum()
    padded = np.pad(a, radius, mode='reflect')
    return np.convolve(padded, kernel, mode='valid').tolist()


def _load_flag(name: str) -> np.ndarray | None:
    iso = TEAM_ISO2.get(name)
    if not iso:
        return None
    path = FLAG_DIR / f"{iso}.png"
    if not path.exists():
        return None
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    new_w = max(1, int(w * FLAG_HEIGHT_PX / h))
    return np.array(img.resize((new_w, FLAG_HEIGHT_PX), Image.LANCZOS))


def main() -> None:
    test_mode = "--test" in sys.argv

    print("=" * 55)
    print("  Line Chart Race — Elo Score mondial 1872–2026")
    if test_mode:
        print("  MODE TEST (50 dernières années, GIF)")
    print("=" * 55)

    path = ROOT / "data" / "elo_global_history.json"
    if not path.exists():
        print(f"\n❌ {path} introuvable.")
        print("   Lancez d'abord : python3 generate_web_data.py")
        return

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    years_all = data["years"]   # list[int]
    raw_hist  = data["teams"]   # dict[str, list[int]]

    histories = {t: _gaussian_smooth(v) for t, v in raw_hist.items() if t in KEEP_TEAMS}
    top_teams = sorted(histories.keys())

    years_arr = np.array(years_all, dtype=float)

    if test_mode:
        # Test : 50 dernières années
        years_arr = years_arr[-50:]
        histories = {t: histories[t][-50:] for t in top_teams}
    else:
        # Production : démarrer à START_YEAR
        start_idx = next((i for i, y in enumerate(years_all) if y >= START_YEAR), 0)
        years_arr = years_arr[start_idx:]
        histories = {t: histories[t][start_idx:] for t in top_teams}

    print(f"\n  {len(top_teams)} équipes sélectionnées : {', '.join(top_teams)}")
    print(f"  Période : {int(years_arr[0])} → {int(years_arr[-1])}")

    n_snap       = len(years_arr)
    n_intervals  = n_snap - 1
    total_frames = n_intervals * STEPS_PER_YEAR + 1

    # Précomputer séries interpolées
    xs = np.empty(total_frames)
    ys: dict[str, np.ndarray] = {t: np.empty(total_frames) for t in top_teams}

    for i in range(n_intervals):
        for step in range(STEPS_PER_YEAR):
            fi = i * STEPS_PER_YEAR + step
            t_frac = step / STEPS_PER_YEAR
            xs[fi] = years_arr[i] + t_frac
            for team in top_teams:
                ys[team][fi] = (histories[team][i]
                                + t_frac * (histories[team][i + 1] - histories[team][i]))
    xs[-1] = years_arr[-1]
    for team in top_teams:
        ys[team][-1] = histories[team][-1]

    print(f"  {total_frames} frames ({total_frames / FPS:.1f}s à {FPS} fps)")

    all_elos   = np.concatenate([ys[t] for t in top_teams])
    y_min_fixed = 1600.0
    y_max_fixed = 2100.0
    x_min       = float(years_arr[0])
    x_max       = float(years_arr[-1])

    dpi = 80 if test_mode else 120

    # Précharger les drapeaux
    flag_imgs: dict[str, np.ndarray] = {}
    for team in top_teams:
        arr = _load_flag(team)
        if arr is not None:
            flag_imgs[team] = arr
    print(f"  {len(flag_imgs)}/{len(top_teams)} drapeaux chargés")

    # Largeur/hauteur des drapeaux en coordonnées de données (fixe — xlim et ylim fixes)
    fig_w_px    = 16 * dpi
    fig_h_px    = 9  * dpi
    ax_w_px     = fig_w_px * 0.88
    ax_h_px     = fig_h_px * 0.82
    x_range     = (x_max + 1) - (x_min - 2)
    px_per_year = ax_w_px / x_range
    y_range_fixed = y_max_fixed - y_min_fixed
    h_elo_fixed   = FLAG_HEIGHT_PX * y_range_fixed / ax_h_px

    flag_w_years: dict[str, float] = {}
    for team, arr in flag_imgs.items():
        _, w_px = arr.shape[:2]
        flag_w_years[team] = w_px / px_per_year

    fig = plt.figure(figsize=(16, 9), dpi=dpi)
    fig.patch.set_facecolor(BG)
    ax = fig.add_axes([0.06, 0.09, 0.88, 0.82])
    ax.set_facecolor(BG)

    fig.text(0.02, 0.97, "Elo Score Evolution — Greatest Football Nations 1920–2026",
             color=FG, fontsize=13, fontweight="bold", va="top", ha="left")
    fig.text(0.02, 0.945,
             "romainfjgaspard.github.io/pronostics_wc2026  ·  Elo calculated from all international matches since 1872",
             color=MUTED, fontsize=8.5, va="top", ha="left", alpha=0.85)

    team_colors = {t: _team_color(t) for t in top_teams}

    lines:    dict[str, plt.Line2D]             = {}
    dots:     dict[str, plt.Line2D]             = {}
    lbls:     dict[str, plt.Text]               = {}
    flag_ims: dict[str, matplotlib.image.AxesImage] = {}

    OFF_X = x_min - 5000   # position hors champ pour masquer

    for team in top_teams:
        c = team_colors[team]
        line, = ax.plot([], [], color=c, linewidth=2.0, solid_capstyle="round",
                        alpha=0.8, zorder=2)
        dot,  = ax.plot([], [], "o", color=c, markersize=5, zorder=4)
        lbl   = ax.text(OFF_X, y_min_fixed, SHORT_NAMES.get(team, team),
                        color=c, fontsize=8.5, fontweight="bold",
                        va="center", ha="left", clip_on=False, zorder=6)
        lines[team] = line
        dots[team]  = dot
        lbls[team]  = lbl

        if team in flag_imgs:
            fim = ax.imshow(flag_imgs[team], aspect="auto", zorder=5,
                            extent=[OFF_X, OFF_X + 1, 0, 1],
                            clip_on=False, interpolation="lanczos")
            flag_ims[team] = fim

    year_txt = ax.text(0.985, 0.06, "", transform=ax.transAxes,
                       ha="right", va="bottom", fontsize=26, fontweight="bold",
                       color=FG, alpha=0.8, zorder=20)

    def _style_axes() -> None:
        ax.set_xlim(x_min - 2, x_max + 1)
        ax.set_ylim(y_min_fixed, y_max_fixed)
        ax.autoscale(False)
        ax.set_facecolor(BG)
        ax.tick_params(colors=MUTED, labelsize=9)
        for spine in ax.spines.values():
            spine.set_color(SURFACE2)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.set_xlabel("Year", color=MUTED, fontsize=10)
        ax.set_ylabel("Elo Score", color=MUTED, fontsize=10)
        ax.grid(True, color=SURFACE2, linewidth=0.7, linestyle="--", alpha=0.6)
        ax.axhline(1500, color=DIM, linewidth=0.6, linestyle=":", alpha=0.5, zorder=1)

    def init():
        _style_axes()
        for team in top_teams:
            lines[team].set_data([], [])
            dots[team].set_data([], [])
            lbls[team].set_position((OFF_X, y_min_fixed))
            if team in flag_ims:
                flag_ims[team].set_extent([OFF_X, OFF_X + 1, 0, 1])
        year_txt.set_text("")
        return [*lines.values(), *dots.values(), *lbls.values(),
                *flag_ims.values(), year_txt]

    def update(frame: int):
        x_cur  = xs[frame]
        scores = {team: float(ys[team][frame]) for team in top_teams}

        # Tri par score courant (z-order)
        by_score = sorted(top_teams, key=lambda t: scores[t], reverse=True)
        adj_y    = _nudge_labels(by_score, scores, y_min_fixed, y_max_fixed)

        n = len(top_teams)
        for rank, team in enumerate(by_score):
            z = n - rank   # plus le score est haut, plus le zorder est élevé
            lines[team].set_data(xs[:frame + 1], ys[team][:frame + 1])
            lines[team].set_zorder(z)
            dots[team].set_data([x_cur], [scores[team]])
            dots[team].set_zorder(z + n)

            visible = frame > 0 and scores[team] >= y_min_fixed
            if visible:
                if team in flag_ims:
                    w_y = flag_w_years[team]
                    x_f, y_f = x_cur + 0.8, scores[team]
                    flag_ims[team].set_extent([x_f, x_f + w_y,
                                               y_f - h_elo_fixed / 2,
                                               y_f + h_elo_fixed / 2])
                    flag_ims[team].set_zorder(z + 2 * n)
                    lbls[team].set_position((x_cur + 0.8 + flag_w_years[team] + 0.2,
                                             adj_y[team]))
                    lbls[team].set_zorder(z + 3 * n)
                else:
                    lbls[team].set_position((x_cur + 0.8, adj_y[team]))
                    lbls[team].set_zorder(z + 3 * n)
            else:
                lbls[team].set_position((OFF_X, y_min_fixed))
                if team in flag_ims:
                    flag_ims[team].set_extent([OFF_X, OFF_X + 1, 0, 1])

        year_txt.set_text(f"{int(x_cur)}")
        return [*lines.values(), *dots.values(), *lbls.values(),
                *flag_ims.values(), year_txt]

    anim = FuncAnimation(
        fig, update,
        frames=total_frames,
        init_func=init,
        interval=1000 / FPS,
        blit=False,   # AnnotationBbox requiert blit=False
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
