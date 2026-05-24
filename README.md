# WC 2026 — Data & Statistics

Data site for the **2026 FIFA World Cup** (Canada · United States · Mexico, June–July 2026).

**Goal:** give participants of a prediction contest a reference source to prepare their forecasts — match history, team statistics, official rankings.

**Site:** https://romainfjgaspard.github.io/pronostics_wc2026/

---

## Features

- **WC 2026 Matches** — all 72 group stage matches, organized by group (A–L) · click → comparison view
- **Teams** — sortable/filterable table of all 48 qualified teams (stats, Elo, multiple time periods)
- **Team profile** — stats by period (since 2022 / 2025 / 2026 / WC qualifiers), recent form, last 30 matches
- **Comparison** — side-by-side stats, head-to-head record, recent form for both teams
- **FIFA Ranking** — official ranking of 211 national teams (live FIFA API, auto-updated)
- **Elo Ranking** — form indicator for the 48 qualified teams, computed from results since 2022
- **Download** — all datasets as JSON/CSV
- **FR / EN toggle** — full bilingual interface

---

## Stack

- Python 3.12 — data collection and generation scripts (stdlib only)
- Vanilla HTML/CSS/JS — static SPA with hash-routing
- GitHub Pages — hosting (branch `master`, root folder)

---

## Structure

```
├── index.html                  # Main page
├── style.css
├── app.js                      # SPA (routing, views, i18n)
├── data/
│   ├── fixtures.json           # WC 2026 matches (generated)
│   ├── teams.json              # 48 team profiles (generated)
│   ├── groups.json             # 12 group compositions (generated)
│   ├── rankings.json           # Elo ranking — 48 teams (generated)
│   ├── fifa_ranking.json       # Official FIFA ranking — 211 teams (generated)
│   ├── results.csv             # 3,970 international matches since Jan 2022 (source)
│   ├── matches_enriched.json   # Enriched match history (source)
│   └── uefa_qualifs_wc2026.csv # UEFA WC 2026 qualifiers (parsed)
├── fetch_data.py               # Downloads results from martj42/international_results
├── parse_uefa_qualifs.py       # Parses UEFA qualifiers
├── fetch_fifa_ranking.py       # FIFA ranking via official FIFA API (FDCP)
└── generate_web_data.py        # Generates site JSON files (Elo, stats, team profiles)
```

---

## Updating the data

Run the scripts in order from `~/projects/pronostics_wc2026/`:

```bash
# 1. Historical results (matches since 2022)
python3 fetch_data.py

# 2. FIFA ranking (official API)
python3 fetch_fifa_ranking.py

# 3. Generate site JSON files (Elo, stats, team profiles)
python3 generate_web_data.py
```

> **Dependencies:** stdlib only (`urllib`, `csv`, `json`, `re`) — no `pip install` required.

---

## Data — sources and added value

### Historical results (`results.csv`)

Source: [martj42/international_results](https://github.com/martj42/international_results) (CC0) — **active repo**, last commit May 12, 2026.

- **3,970 matches** since January 1, 2022
- **108 matches in 2026** with real scores (qualifiers, friendlies through March 2026)
- **72 WC 2026 fixtures** included (score `NA` = matches not yet played at fetch time)
- Covers: WC 2022, Euro 2024, Copa América 2024, AFCON 2023/2024, Nations League, WC 2026 qualifiers, friendlies
- Fields: date, home, away, score, tournament, city, neutral ground

### FIFA Ranking (`fifa_ranking.json`)

Source: **official FIFA API** — endpoint `api.fifa.com/api/v3/fifarankings/rankings/rankingsbyschedule`

> The script dynamically retrieves the latest published date ID from `__NEXT_DATA__` on `inside.fifa.com`, then queries the FDCP API directly.
> The [cnc8/fifa-world-ranking](https://github.com/cnc8/fifa-world-ranking) GitHub repo is kept as **fallback only** — abandoned since January 2021, December 2020 data (Belgium #1). This is the **main differentiator** vs. existing public datasets.

| | cnc8 (fallback, abandoned) | This project (FDCP API) |
|---|---|---|
| Data date | 2020-12-10 | **2026-04-01** |
| #1 | Belgium (1,780 pts) | **France (1,877 pts)** |
| Teams | 210 | **211** |
| Fields | rank, name, conf, points | + `previous_rank`, `change`, `rated_matches`, `iso2`, `country_code` |
| Maintenance | Dead since Jan 2021 | **Live official FIFA API** |

### Elo Score (`rankings.json`, `teams.json`)

Custom calculation — **not available in any public source**.

Form score computed from the 3,970 matches since January 2022:

| Match type | K-factor |
|---|---|
| FIFA World Cup | 60 |
| Euro, Copa América, AFCON, Asian Cup | 50 |
| Qualifiers, Nations League | 35 |
| Friendlies | 20 |

- Home advantage: **+75 Elo** (neutralized on neutral ground)
- Initial score: **1,500** per team

### Team profiles (`teams.json`)

Data **generated and not available in raw sources**:

- Aggregated stats by period (since 2022 / 2025 / 2026 / WC qualifiers): GP, W, D, L, GF, GA, GD, avg goals
- Last 30 matches with opponent, score, result, competition
- Computed Elo score and iso2 code for flags

---

## JSON file formats

### `data/fixtures.json`
```json
[
  {
    "date": "2026-06-11",
    "stage": "group",
    "group": "A",
    "home": "Mexico",
    "away": "...",
    "home_iso2": "mx",
    "away_iso2": "...",
    "home_elo": 1742,
    "away_elo": 1685,
    "city": "Mexico City"
  }
]
```

### `data/teams.json`
```json
{
  "france": {
    "name": "France",
    "slug": "france",
    "group": "E",
    "iso2": "fr",
    "elo": 1895,
    "stats": {
      "all":    { "GP": 53, "W": 33, "D": 10, "L": 10, "GF": 113, "GA": 48, "GD": 65, "avg_gf": "2.13", "avg_ga": "0.91", "win_pct": "62.3" },
      "2026":   { "...": "..." },
      "2025":   { "...": "..." },
      "qualifs":{ "...": "..." }
    },
    "matches": [
      { "date": "2026-03-29", "opponent": "Colombia", "opp_iso2": "co", "home": false, "scored": 3, "conceded": 1, "result": "W", "tournament": "Friendly" }
    ]
  }
}
```

### `data/fifa_ranking.json`
```json
{
  "updated_at": "2026-05-24T08:38:03",
  "ranking_date": "2026-04-01",
  "source": "FIFA API (FDCP)",
  "count": 211,
  "rankings": [
    {
      "rank": 1,
      "previous_rank": 3,
      "change": 2,
      "name": "France",
      "iso2": "fr",
      "country_code": "FRA",
      "confederation": "UEFA",
      "points": 1877.32,
      "rated_matches": 56
    }
  ]
}
```
