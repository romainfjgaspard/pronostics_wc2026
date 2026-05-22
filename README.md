# Pronostics WC 2026

Concours de pronostics pour la Coupe du Monde 2026.

## Stack

- **Python** — scripts de collecte et génération de données
- **Web statique** — interface HTML/CSS/JS publiée via GitHub Pages

## Structure

```
├── index.html              # Interface web principale
├── style.css
├── app.js
├── data/                   # Données source (Python) + données web (JSON)
├── fetch_data.py           # Collecte des données brutes
├── parse_uefa_qualifs.py   # Parsing des qualifications UEFA
└── generate_web_data.py    # Génération des JSON pour l'interface
```

## Lancer les scripts

```bash
pip install -r requirements.txt   # si besoin
python fetch_data.py
python parse_uefa_qualifs.py
python generate_web_data.py
```

## GitHub Pages

Le site est publié sur `https://romainfjgaspard.github.io/pronostics_wc2026/`  
Source : branche `master`, dossier racine.
