# WC 2026 — Données & Statistiques

Site de données pour la **Coupe du Monde 2026** (Canada · États-Unis · Mexique, juin–juillet 2026).

**Objectif :** fournir aux participants d'un concours de pronostics une source de référence pour préparer leurs prédictions — historique des matchs, statistiques par équipe, classements officiels.

**Site :** https://romainfjgaspard.github.io/pronostics_wc2026/

---

## Ce que le site propose

- **Matchs WC 2026** — les 72 matchs de phase de groupes, organisés par groupe (A–L) · clic → vue comparative
- **Équipes** — tableau trié/filtré des 48 équipes qualifiées (stats, Elo, différentes périodes)
- **Fiche équipe** — stats par période (depuis 2022 / 2025 / 2026 / qualifs), forme récente, 30 derniers matchs
- **Comparaison** — stats côte-à-côte, confrontations directes, forme récente des deux équipes
- **Classement FIFA** — classement officiel des 211 sélections (API officielle FIFA, mise à jour automatique)
- **Classement Elo** — indicateur de niveau des 48 équipes qualifiées, calculé sur les résultats depuis 2022
- **Téléchargement** — tous les datasets en JSON/CSV

---

## Stack

- Python 3.12 — scripts de collecte et génération de données (stdlib uniquement)
- HTML/CSS/JS vanilla — SPA statique avec hash-routing
- GitHub Pages — hébergement (branche `master`, dossier racine)

---

## Structure

```
├── index.html                  # Page principale
├── style.css
├── app.js                      # SPA (routing, vues)
├── data/
│   ├── fixtures.json           # Matchs WC 2026 (généré)
│   ├── teams.json              # Fiches équipes 48 pays (généré)
│   ├── groups.json             # Composition des 12 groupes (généré)
│   ├── rankings.json           # Classement Elo 48 équipes (généré)
│   ├── fifa_ranking.json       # Classement FIFA officiel 211 sélections (généré)
│   ├── results.csv             # 3 970 matchs internationaux depuis jan 2022 (source)
│   ├── matches_enriched.json   # Historique enrichi (source)
│   └── uefa_qualifs_wc2026.csv # Qualifications UEFA (parsé)
├── fetch_data.py               # Télécharge les résultats depuis martj42/international_results
├── parse_uefa_qualifs.py       # Parse les qualifs UEFA
├── fetch_fifa_ranking.py       # Classement FIFA via API officielle FIFA (FDCP)
└── generate_web_data.py        # Génère les JSON pour le site (Elo, stats, fiches)
```

---

## Mettre à jour les données

Lancer les scripts dans cet ordre depuis `~/projects/pronostics_wc2026/` :

```bash
# 1. Données historiques (résultats depuis 2022)
python3 fetch_data.py

# 2. Classement FIFA (API officielle)
python3 fetch_fifa_ranking.py

# 3. Génération des JSON pour le site (Elo, stats, fiches équipes)
python3 generate_web_data.py
```

> **Dépendances :** stdlib uniquement (`urllib`, `csv`, `json`, `re`) — aucun `pip install` requis.

---

## Données — sources et plus-value

### Résultats historiques (`results.csv`)

Source : [martj42/international_results](https://github.com/martj42/international_results) (CC0, mis à jour en continu)

- **3 970 matchs** depuis le 1er janvier 2022
- Couvre : WC 2022, Euro 2024, Copa América 2024, CAN 2023/2024, Nations League, qualifications WC 2026, matchs amicaux
- Champs : date, domicile, extérieur, score, compétition, ville, terrain neutre

### Classement FIFA (`fifa_ranking.json`)

Source : **API officielle FIFA** — endpoint `api.fifa.com/api/v3/fifarankings/rankings/rankingsbyschedule`

> Le script récupère dynamiquement l'identifiant de la dernière date publiée via `__NEXT_DATA__` de `inside.fifa.com`, puis interroge l'API FDCP directement. Le repo GitHub [cnc8/fifa-world-ranking](https://github.com/cnc8/fifa-world-ranking) est conservé comme **filet de secours** uniquement — il n'est plus maintenu depuis janvier 2021 et ne contient que des données de décembre 2020 (Belgique #1).

| | cnc8 (fallback) | Notre fetch |
|---|---|---|
| Date des données | 2020-12-10 | **2026-04-01** |
| #1 mondial | Belgique (1 780 pts) | **France (1 877 pts)** |
| Équipes | 210 | **211** |
| Champs | rank, name, conf, points | + `previous_rank`, `change`, `rated_matches`, `iso2`, `country_code` |
| Maintenance | Abandonné jan 2021 | **API officielle FIFA, toujours à jour** |

### Score Elo (`rankings.json`, `teams.json`)

Calcul maison — **absent des sources externes**.

Score de forme calculé à partir des 3 970 matchs depuis janvier 2022 :

| Type de match | K-factor |
|---|---|
| FIFA World Cup | 60 |
| Euro, Copa América, CAN, Coupe d'Asie | 50 |
| Qualifications, Nations League | 35 |
| Matchs amicaux | 20 |

- Avantage terrain : **+75 Elo** (neutralisé sur terrain neutre)
- Score initial : **1 500** par équipe

### Fiches équipes (`teams.json`)

Données **générées et non disponibles dans les sources brutes** :

- Stats agrégées par période (depuis 2022 / 2025 / 2026 / qualifs CDM) : MJ, V, N, D, Buts+, Buts−, Diff, moy. buts
- 30 derniers matchs avec adversaire, score, résultat, compétition
- Score Elo calculé et iso2 pour les drapeaux

---

## Format des fichiers JSON

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
      "2026":   { ... },
      "2025":   { ... },
      "qualifs":{ ... }
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
