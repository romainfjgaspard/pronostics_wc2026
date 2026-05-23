# WC 2026 — Données & Statistiques

Site de données pour la **Coupe du Monde 2026** (Canada · États-Unis · Mexique, juin–juillet 2026).

**Objectif :** fournir aux participants d'un concours de pronostics une source de référence pour préparer leurs prédictions — historique des matchs, statistiques par équipe, classements officiels.

**Site :** https://romainfjgaspard.github.io/pronostics_wc2026/

---

## Ce que le site propose

- **Matchs WC 2026** — les 72 matchs de phase de groupes, organisés par groupe (A–L)
- **Fiche équipe** — stats par période (depuis 2022 / 2025 / 2026 / qualifs), forme récente, 30 derniers matchs
- **Classement Elo** — indicateur de niveau des 48 équipes qualifiées, calculé sur les résultats depuis 2022
- **Classement FIFA** — classement officiel des 211 sélections masculines
- **Téléchargement** — tous les datasets en JSON/CSV

---

## Stack

- Python 3.12 — scripts de collecte et génération de données
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
│   ├── teams.json              # Fiches équipes (généré)
│   ├── groups.json             # Composition des groupes (généré)
│   ├── rankings.json           # Classement Elo (généré)
│   ├── fifa_ranking.json       # Classement FIFA (généré)
│   ├── results.csv             # Historique matchs depuis 2022 (source)
│   ├── matches_enriched.json   # Historique enrichi (source)
│   └── uefa_qualifs_wc2026.csv # Qualifications UEFA (parsé)
├── fetch_data.py               # Télécharge les CSV depuis martj42
├── parse_uefa_qualifs.py       # Parse les qualifs UEFA
├── fetch_fifa_ranking.py       # Classement FIFA (API + fallback CSV)
└── generate_web_data.py        # Génère les JSON pour le site
```

---

## Mettre à jour les données

Lancer les scripts dans cet ordre depuis `~/projects/pronostics_wc2026/` :

```bash
# 1. Données historiques (résultats depuis 2022)
python fetch_data.py

# 2. Classement FIFA (API officielle + fallback CSV)
python fetch_fifa_ranking.py

# 3. Génération des JSON pour le site
python generate_web_data.py
```

> **Dépendances :** stdlib uniquement (pas de `pip install` requis).

---

## Format des données

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
      "all":    { "GP": 42, "W": 28, "D": 9, "L": 5, "GF": 89, ... },
      "2026":   { ... },
      "2025":   { ... },
      "qualifs":{ ... }
    },
    "matches": [
      { "date": "2026-03-25", "opponent": "...", "home": true, "scored": 2, "conceded": 0, "result": "W", ... }
    ]
  }
}
```

### `data/fifa_ranking.json`
```json
{
  "updated_at": "2026-05-23T...",
  "ranking_date": "2026-04-10",
  "source": "FIFA API",
  "count": 211,
  "rankings": [
    { "rank": 1, "previous_rank": 1, "change": 0, "name": "Spain", "iso2": "es", "confederation": "UEFA", "points": 1851.22 }
  ]
}
```

---

## Méthode Elo

Score de forme calculé à partir des matchs internationaux depuis le 1er janvier 2022.

| Type de match | K-factor |
|---|---|
| FIFA World Cup | 60 |
| Euro, Copa América, CAN, Coupe d'Asie | 50 |
| Qualifications, Nations League | 35 |
| Matchs amicaux | 20 |

- Avantage terrain : **+75 Elo** (neutralisé pour les matchs sur terrain neutre)
- Score initial : **1500**

---

## Sources

- Résultats historiques : [martj42/international_results](https://github.com/martj42/international_results) (CC0)
- Classement FIFA : [inside.fifa.com](https://inside.fifa.com/fr/fifa-world-ranking/men) + [cnc8/fifa-world-ranking](https://github.com/cnc8/fifa-world-ranking) (fallback)
