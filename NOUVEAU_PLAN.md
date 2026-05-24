# NOUVEAU PLAN — pronostics_wc2026
> Révisé le 2026-05-24 · Plan pragmatique orienté CDM readiness (12 juin 2026)
> Basé sur l'analyse critique de AUDIT.md + PLAN.md → voir ANALYSE_PLAN.md

---

## Contexte du projet

**Localisation :** `/home/pargass/projects/pronostics_wc2026/`
**Objectif :** Site de **données** pour la CDM 2026 — fournir des informations pertinentes pour que chaque participant se fasse son propre avis. Pas de pronostic imposé, pas de "recommandation" — des chiffres et des faits.
**Stack :** HTML/CSS/JS vanilla (SPA hash routing) + Python (génération de données)
**Hébergement :** GitHub Pages (branch `master`)
**Lancer localement :** `python -m http.server 8080` depuis le dossier du projet

**Deadline critique : 12 juin 2026** — début des matchs de la CDM 2026.

### Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `app.js` (~1 300 lignes) | Toute l'application frontend |
| `style.css` (~830 lignes) | Design system dark theme |
| `index.html` | SPA shell |
| `generate_web_data.py` | Génère les 4 JSON du site |
| `generate_elo_race.py` | Animation Bar Chart Race Elo |
| `fetch_data.py` | Récupère les données martj42 |
| `fetch_fifa_ranking.py` | Classement FIFA officiel |
| `data/teams.json` (4,6 MB) | 48 équipes + historique complet |
| `data/fixtures.json` | Matchs WC 2026 |
| `data/rankings.json` | Classement Elo + FIFA des 48 équipes |
| `data/fifa_ranking.json` | Classement FIFA actuel |
| `data/elo_race.mp4` | Animation BCR Elo |

### Prérequis systématiques avant chaque commit

```bash
git status
python -m http.server 8080   # tester manuellement les vues concernées
git fetch origin master && git merge origin/master --no-edit
git push
```

---

## Tier 0 — CDM Readiness (AVANT le 12 juin — non négociable)

> Sans ces tâches, le site ne remplit pas son rôle pendant le tournoi.

---

### T0-1 — GitHub Actions : mise à jour hebdomadaire des données

**Fichier à créer :** `.github/workflows/update-data.yml`

**Pourquoi :** La CDM se joue quotidiennement pendant 4 semaines. Sans automatisation, les résultats, classements et stats d'équipes deviennent obsolètes. **Coût : 0 € — les repos GitHub publics bénéficient de minutes illimitées.**

**Workflow :**
```yaml
name: Update data
on:
  schedule:
    - cron: '0 7 * * 1'   # chaque lundi à 7h UTC (ou quotidien pendant la CDM)
  workflow_dispatch:        # déclenchement manuel possible

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install requests

      - name: Fetch data
        run: python3 fetch_data.py

      - name: Fetch FIFA ranking
        run: python3 fetch_fifa_ranking.py

      - name: Generate web data
        run: python3 generate_web_data.py

      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "chore: mise à jour données $(date +%Y-%m-%d)"
          git push
```

**Ajuster le cron pendant la CDM** (12 juin – 19 juillet) : passer à `0 7 * * *` (quotidien) pour avoir les résultats du jour précédent chaque matin.

**Test :** Déclencher manuellement via "Run workflow" sur GitHub Actions et vérifier le commit de données.

**Commit :**
```bash
git add .github/workflows/update-data.yml
git commit -m "ci: mise à jour hebdomadaire des données CDM via GitHub Actions"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

### T0-2 — Probabilités Elo par match (données statistiques)

**Fichiers touchés :** `generate_web_data.py`, `app.js`, `style.css`

**Pourquoi :** Afficher pour chaque match WC les probabilités statistiques (basées sur les Elo des deux équipes) donne une **information factuelle** pour se forger un avis — sans imposer un "prono recommandé". Le framing est important : "Indicateur statistique, pas une prédiction."

**Étape 1 — Calculer dans `generate_web_data.py`**

```python
def elo_prob(ra: float, rb: float) -> dict:
    """Probabilités statistiques pour un match sur terrain neutre."""
    exp_a = elo_exp(ra, rb)  # utilise la fonction existante
    draw = max(0.15, 0.27 - 0.001 * abs(ra - rb))
    win_a = exp_a * (1 - draw)
    win_b = (1 - exp_a) * (1 - draw)
    return {
        "home": round(win_a, 3),
        "draw": round(draw, 3),
        "away": round(win_b, 3),
    }
```

Dans `build_fixtures()`, pour chaque match WC, ajouter `proba` et les Elo :
```python
proba = elo_prob(elo_home, elo_away)
match["proba"] = proba
match["elo_home"] = round(elo_home)
match["elo_away"] = round(elo_away)
```

**Étape 2 — Afficher dans `renderFixtures()` dans `app.js`**

Sous les noms d'équipes, ajouter une barre de probabilités :
```javascript
const p = m.proba;
if (p) {
  html += `
    <div class="proba-bar" title="${LANG==='fr'
      ? `Indicateur Elo — ${m.home_team} ${(p.home*100).toFixed(0)}% / Nul ${(p.draw*100).toFixed(0)}% / ${m.away_team} ${(p.away*100).toFixed(0)}%`
      : `Elo indicator — ${m.home_team} ${(p.home*100).toFixed(0)}% / Draw ${(p.draw*100).toFixed(0)}% / ${m.away_team} ${(p.away*100).toFixed(0)}%`}">
      <div class="proba-seg proba-home" style="width:${(p.home*100).toFixed(0)}%">
        ${(p.home*100).toFixed(0)}%
      </div>
      <div class="proba-seg proba-draw" style="width:${(p.draw*100).toFixed(0)}%">
        ${(p.draw*100).toFixed(0)}%
      </div>
      <div class="proba-seg proba-away" style="width:${(p.away*100).toFixed(0)}%">
        ${(p.away*100).toFixed(0)}%
      </div>
    </div>
    <p class="proba-note">⚡ ${LANG==='fr'
      ? 'Indicateur Elo — terrain neutre, basé sur l\'historique depuis 1872'
      : 'Elo indicator — neutral ground, based on history since 1872'}</p>
  `;
}
```

**CSS à ajouter dans `style.css` :**
```css
.proba-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0 4px;
  cursor: help;
}
.proba-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .6rem;
  font-weight: 700;
  color: rgba(255,255,255,.85);
  min-width: 24px;
  overflow: hidden;
}
.proba-home { background: var(--win); }
.proba-draw { background: var(--muted); }
.proba-away { background: var(--loss); }
.proba-note { font-size: .68rem; color: var(--muted); margin: 0 0 6px; text-align: center; }
```

**Régénérer + commit :**
```bash
python3 generate_web_data.py
git add generate_web_data.py app.js style.css data/fixtures.json
git commit -m "feat: probabilités Elo par match (indicateur statistique H/N/E)"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

### T0-3 — Meta OG + favicon

**Fichier touché :** `index.html`

Dans `<head>`, après `<title>` :
```html
<meta name="description" content="Données et statistiques WC 2026 — Elo depuis 1872, FIFA officiel, 48 équipes.">
<meta property="og:title" content="WC 2026 — Données &amp; Statistiques">
<meta property="og:description" content="48 équipes · Elo depuis 1872 · Classement FIFA officiel · Comparaisons directes">
<meta property="og:url" content="https://romainfjgaspard.github.io/pronostics_wc2026/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><text y='32' font-size='32'>⚽</text></svg>">
```

---

### T0-4 — Fix noms FIFA français → slugs anglais

**Fichier touché :** `fetch_fifa_ranking.py`

Dans l'URL de l'API FDCP, changer `language=fr` → `language=en`. Puis régénérer :
```bash
python3 fetch_fifa_ranking.py
```

Vérifier dans `data/fifa_ranking.json` : "South Korea", "Saudi Arabia", "Netherlands".

**Commit T0-3 + T0-4 :**
```bash
git add index.html fetch_fifa_ranking.py data/fifa_ranking.json
git commit -m "fix: meta OG/favicon, noms FIFA en anglais (liens fiche équipe corrigés)"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

## Tier 1 — Quick wins groupés (session unique)

**Fichiers touchés :** `app.js`, `style.css`, `index.html`

---

### T1-1 — Fix race condition FIFA (`app.js`)

Ajouter dans `// ── State ──` :
```javascript
let navToken = 0;
```

Dans `route()`, première instruction :
```javascript
navToken++;
```

Dans `renderFifaRankings()`, après `const app = document.getElementById('app')` :
```javascript
const myToken = navToken;
// ... après chaque await fetch(...) :
if (navToken !== myToken) return;
```

---

### T1-2 — Reset sliders entre équipes (`app.js`)

Au tout début de `renderTeam(slug)` :
```javascript
function renderTeam(slug) {
  teamYearMin = 1872;
  teamYearMax = 2026;
  teamQualifsMode = false;
  // ... reste inchangé
```

---

### T1-3 — Vidéo : contrôles + boutons vitesse + lien ancre (`app.js`, `style.css`)

**Balise vidéo** : ajouter `controls` et `id` :
```html
<video class="elo-race-video" id="elo-race-video" autoplay loop muted playsinline controls
       src="./data/elo_race.mp4" onerror="this.closest('.race-section').style.display='none'">
</video>
```

**Boutons vitesse** (après `app.innerHTML = ...`) :
```javascript
const video = app.querySelector('#elo-race-video');
app.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (video) video.playbackRate = parseFloat(btn.dataset.rate);
    app.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
```

**Lien ancre depuis le header de la page :**
```javascript
// Dans le h2 ou subtitle de renderRankings, ajouter :
<a href="#elo-race-video" class="race-anchor">
  ▶ ${LANG==='fr' ? 'Voir l\'évolution historique' : 'See historical evolution'}
</a>
```

CSS :
```css
.race-speed-btns { display: flex; align-items: center; gap: 6px; margin: 8px 0; }
.speed-btn { padding: 4px 10px; border-radius: 20px; background: var(--surface); color: var(--muted); font-size: .78rem; border: 1px solid var(--border); }
.speed-btn.active { background: rgba(34,197,94,.15); color: var(--win); border-color: var(--win); }
.race-anchor { font-size: .85rem; color: var(--accent); margin-left: 12px; }
```

---

### T1-4 — Fix CSS mobile + UX sliders (`style.css`, `app.js`)

**Alignement thumb slider :**
```css
.year-slider {
  position: absolute;
  width: 100%;
  top: 50%;
  transform: translateY(-50%);
  /* ... reste inchangé */
}
```

**Slider pleine largeur page Équipes :**
```css
.teams-controls {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  margin-bottom: 20px;
}
.teams-controls .year-slider-wrap { width: 100%; }
.teams-controls .teams-search { align-self: flex-start; max-width: 280px; }
```

**Throttle sliders page Équipes** (`app.js`) :
```javascript
let teamsSliderTimer = null;
// Sur les event listeners input des sliders renderTeams :
slider.addEventListener('input', () => {
  clearTimeout(teamsSliderTimer);
  teamsSliderTimer = setTimeout(() => renderTeamsBody(), 60);
});
```

---

### T1-5 — Bouton "Partager" natif (`app.js`, `index.html`)

Ajouter dans la nav un bouton partage (visible surtout sur mobile) :
```javascript
// Dans index.html, dans .nav-links :
<button class="share-btn" id="share-btn" onclick="sharesite()">🔗</button>

// Dans app.js :
function sharesite() {
  if (navigator.share) {
    navigator.share({
      title: 'WC 2026 — Données & Statistiques',
      text: 'Stats CDM 2026 : Elo depuis 1872, classements FIFA, comparaisons équipes',
      url: 'https://romainfjgaspard.github.io/pronostics_wc2026/',
    });
  } else {
    navigator.clipboard.writeText('https://romainfjgaspard.github.io/pronostics_wc2026/');
    // Feedback visuel : changer temporairement le bouton
    const btn = document.getElementById('share-btn');
    btn.textContent = '✓';
    setTimeout(() => btn.textContent = '🔗', 2000);
  }
}
```

```css
.share-btn { background: none; border: none; color: var(--text); font-size: 1rem; cursor: pointer; padding: 6px 8px; }
```

**Commit Tier 1 :**
```bash
git add app.js style.css index.html
git commit -m "fix: race condition FIFA, reset sliders, vidéo controls+vitesse, CSS sliders mobile, bouton partage"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

## Tier 2 — Lazy loading teams.json (session dédiée)

**Fichier touché :** `app.js`

Ce refactor touche `init()`, `route()`, et 3 fonctions `render*`. À faire en session dédiée avec tests complets.

### T2-1 — `init()` : ne charger que les 3 petits JSON

```javascript
async function init() {
  try {
    const [fixtures, groups, rankings] = await Promise.all([
      fetch('./data/fixtures.json').then(r => r.json()),
      fetch('./data/groups.json').then(r => r.json()),
      fetch('./data/rankings.json').then(r => r.json()),
    ]);
    DATA = { fixtures, teams: null, groups, rankings };
    initLang();
    window.addEventListener('hashchange', route);
    route();
  } catch (e) {
    document.getElementById('app').innerHTML =
      `<div class="splash"><p>${t('load_error')}</p></div>`;
    console.error(e);
  }
}
```

### T2-2 — Helper `ensureTeams()`

```javascript
async function ensureTeams() {
  if (DATA.teams) return;
  const appEl = document.getElementById('app');
  appEl.innerHTML = `<div class="splash"><div class="spinner"></div><p>${LANG === 'fr' ? 'Chargement des équipes…' : 'Loading teams…'}</p></div>`;
  DATA.teams = await fetch('./data/teams.json').then(r => r.json());
}
```

### T2-3 — Rendre `renderTeam`, `renderTeams`, `renderCompare` async

Ajouter `async` devant les trois fonctions et `await ensureTeams();` en première ligne de chacune.

### T2-4 — `route()` async avec await sur les fonctions concernées

```javascript
async function route() {
  navToken++;
  window.scrollTo({ top: 0, behavior: 'instant' });
  const hash = location.hash.slice(1) || '/';
  if (hash.startsWith('/team/')) {
    await renderTeam(decodeURIComponent(hash.slice(6)));
  } else if (hash.startsWith('/compare/')) {
    const parts = hash.slice(9).split('/');
    await renderCompare(decodeURIComponent(parts[0] || ''), decodeURIComponent(parts[1] || ''));
  } else if (hash === '/teams') {
    await renderTeams();
  } else if (hash === '/rankings') {
    renderRankings();
  } else if (hash === '/fifa-ranking') {
    renderFifaRankings();
  } else if (hash === '/data') {
    renderData();
  } else {
    renderFixtures();
  }
}
```

### Scénarios de test obligatoires

1. Cache vide → `#/` s'affiche en < 500ms (fixtures + groups + rankings)
2. `#/teams` → spinner puis table équipes
3. `#/team/france` → spinner puis fiche France
4. Retour `#/teams` → immédiat (teams.json déjà en mémoire)
5. `#/rankings` → immédiat (rankings.json chargé dès le départ)

**Commit Tier 2 :**
```bash
git add app.js
git commit -m "perf: lazy loading teams.json — chargement initial < 500ms au lieu de ~4s"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

## Tier 3 — BCR Elo : améliorations visuelles (session dédiée + regen)

**Fichier touché :** `generate_elo_race.py`

> ⚠️ La génération complète prend ~5 minutes. Toujours valider sur un test rapide (5 premières années) avant la génération complète.

### T3-1 — Noms abrégés (supprimer la marge blanche gauche)

```python
SHORT_NAMES = {
    "Bosnia and Herzegovina": "Bosnia",
    "Trinidad and Tobago":    "T&T",
    "United States":          "USA",
    "Republic of Ireland":    "Ireland",
}
# Dans main(), après construction de df :
df.rename(columns=SHORT_NAMES, inplace=True)
TEAM_CONF_SHORT = {SHORT_NAMES.get(k, k): v for k, v in TEAM_CONF.items()}
colors = [CONF_COLORS.get(TEAM_CONF_SHORT.get(col, ""), "#64748b") for col in df.columns]
```

### T3-2 — Top 10 + lissage

```python
n_bars=10,
steps_per_period=8,
period_length=500,
interpolate_period=True,
```

### T3-3 — Labels repositionnés (VALIDATION SCREENSHOT REQUISE)

```python
period_label={
    "x": 1.01, "y": 0.02,
    "ha": "left", "va": "bottom",
    "size": 18, "fontweight": "bold",
    "color": "#f1f5f9",
},
period_summary_func=lambda v, r: {
    "x": 1.01, "y": 0.10,
    "ha": "left", "va": "bottom",
    "s": f"Top : {v.idxmax()}  ({v.max():.0f})",
    "size": 9,
    "color": "#94a3b8",
},
```

**Test rapide obligatoire avant génération complète :**
```python
# Tester sur les 5 premières années avec steps_per_period=1
df_test = df.iloc[:5]
test_kw = {**race_kwargs, 'steps_per_period': 1, 'period_length': 100}
bcr.bar_chart_race(df=df_test, filename="data/elo_race_test.gif", **test_kw)
```

→ Valider le GIF de test visuellement avant de lancer la génération complète.

### T3-4 — Génération complète

```bash
python3 generate_elo_race.py
ls -lh data/elo_race.mp4
git add data/elo_race.mp4 generate_elo_race.py
git commit -m "fix: BCR Elo — Top 10 + lissage, noms abrégés, labels repositionnés"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

## Tier 4 — Navigation mobile (session dédiée)

**Fichiers touchés :** `index.html`, `app.js`, `style.css`

Avec les futures pages (classement FIFA historique, Palmarès…), la nav actuelle deviendra ingérable sur mobile. Le `<select>` natif est la solution la plus simple et la plus UX-friendly sur téléphone.

```javascript
// Dans app.js, générer le select depuis les routes définies :
const pages = [
  { hash: '#/',             label: () => LANG === 'fr' ? 'Matchs' : 'Matches' },
  { hash: '#/teams',        label: () => LANG === 'fr' ? 'Équipes' : 'Teams' },
  { hash: '#/rankings',     label: () => 'Classement Elo' },
  { hash: '#/fifa-ranking', label: () => 'Classement FIFA' },
  { hash: '#/data',         label: () => LANG === 'fr' ? 'Données' : 'Data' },
];
```

```css
.nav-select {
  display: none;
  width: 100%;
  padding: 8px 12px;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
}
@media (max-width: 640px) {
  .nav-links { display: none; }
  .nav-select { display: block; }
}
```

**Commit Tier 4 nav :**
```bash
git add index.html app.js style.css
git commit -m "feat: navigation déroulante mobile — select natif sous 640px"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

## Tier 5 — Classement FIFA historique (session dédiée)

**Fichiers à créer :** `fetch_fifa_ranking_history.py`, `generate_fifa_race.py`, `data/fifa_race.mp4`
**Fichiers modifiés :** `app.js`, `style.css`

**Objectif :** Page `#/fifa-ranking` enrichie avec un slider d'année (1993–2026) pour naviguer dans l'historique du classement FIFA, plus une BCR FIFA (plus stable et reconnaissable que l'Elo).

### T5-1 — Identifier et valider la source de données

**Priorité 1 : l'endpoint FIFA officiel (api.fifa.com) supporte-t-il les IDs historiques ?**

L'endpoint actuel : `https://api.fifa.com/api/v3/fifarankings/rankings/rankingsbyschedule?rankingScheduleId=FRS_Male_Football_20260119`

Vérifier si des IDs plus anciens fonctionnent, par exemple `FRS_Male_Football_20230101` ou `FRS_Male_Football_20091001`. Si le pattern est régulier, on peut énumérer tous les IDs de classement depuis 1993.

```python
# Test manuel à faire en premier :
import requests
test_id = "FRS_Male_Football_20230101"
r = requests.get(
    "https://api.fifa.com/api/v3/fifarankings/rankings/rankingsbyschedule",
    params={"rankingScheduleId": test_id, "count": 10, "language": "en"}
)
print(r.status_code, r.json().get("Results", [])[:2])
```

**Priorité 2 : fifaranking.net ou équivalent**

Si l'API officielle ne couvre pas l'historique, scraper un site tiers :
- `fifaranking.net` : classements mensuels depuis 1993 (à inspecter manuellement)
- `football-rankings.info` : alternative à vérifier
- Identifier la structure HTML avant de coder le scraper (requests + BeautifulSoup)

```python
# Inspection manuelle d'abord :
import requests
from bs4 import BeautifulSoup
r = requests.get("https://www.fifaranking.net/rankings/", headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.text, 'html.parser')
# Identifier les sélecteurs de la table + le filtre date
```

**Priorité 3 : données compilées dans des repos GitHub**

Chercher sur GitHub des datasets "FIFA ranking history CSV" sous licence CC0/MIT — évite le scraping.

### T5-2 — Script `fetch_fifa_ranking_history.py`

Une fois la source validée, construire un CSV :
```
date,rank,team_name,points
1993-08,1,Germany,832
1993-08,2,Italy,757
...
```

Format cible : `data/fifa_ranking_history.csv` — 1 ligne par équipe par snapshot mensuel.

### T5-3 — Page avec slider d'année dans `renderFifaRankings`

Ajouter un slider d'année (1993–2026) qui filtre `fifa_ranking_history.csv` chargé en lazy :
```javascript
async function ensureFifaHistory() {
  if (DATA.fifaHistory) return;
  DATA.fifaHistory = await fetch('./data/fifa_ranking_history.json').then(r => r.json());
}
```

Dans `renderFifaRankings`, ajouter un dual-slider ou un select d'année, et filtrer le classement par la date sélectionnée.

### T5-4 — BCR FIFA `generate_fifa_race.py`

Adapter `generate_elo_race.py` en `generate_fifa_race.py` :
- Source : `data/fifa_ranking_history.csv`
- Paramètres : `n_bars=10`, `steps_per_period=2`, `period_length=200` (mois → vidéo ~2 min)
- Sortie : `data/fifa_race.mp4`

Intégrer dans `renderFifaRankings` avec le même lien ancre que pour l'Elo.

**Commit Tier 5 :**
```bash
git add fetch_fifa_ranking_history.py generate_fifa_race.py data/fifa_ranking_history.* data/fifa_race.mp4 app.js style.css
git commit -m "feat: classement FIFA historique (1993–2026) — slider années + bar chart race"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

## Tier 6 — BCR Elo : drapeaux + couleurs (session dédiée, après T3)

**Fichier touché :** `generate_elo_race.py`

**Drapeaux :** faisable via `matplotlib.offsetbox.AnnotationBbox + OffsetImage` dans un callback de frame. La lib `bar_chart_race` expose un paramètre `filter_column_colors` mais pas de callback image natif — il faut soit utiliser l'API matplotlib post-frame, soit patcher la lib.

**Couleur dominante par drapeau :** faisable avec Pillow ou `colorthief` :
```python
from PIL import Image
import urllib.request

def dominant_color(flag_url: str) -> str:
    with urllib.request.urlopen(flag_url) as r:
        img = Image.open(r).convert('RGB').resize((50, 50))
    colors = img.getcolors(maxcolors=2500)
    if not colors:
        return "#64748b"
    r, g, b = max(colors, key=lambda c: c[0])[1]
    return f"#{r:02x}{g:02x}{b:02x}"
```

**Sources de drapeaux :**
- `flagcdn.com/w80/{code}.png` (code ISO 3166-1 alpha-2)
- `upload.wikimedia.org` — SVG Wikipedia (haute qualité)

**Approche recommandée :**
1. Construire un dict `TEAM_FLAG_URL` pour les 48 équipes (codes ISO manuels)
2. Calculer les couleurs dominantes une fois (dict `TEAM_COLOR`) et les sauvegarder
3. Remplacer les couleurs par confédération par les couleurs de drapeau dans `bar_chart_race`
4. Les drapeaux en superposition nécessitent un callback matplotlib — à tester sur un prototype avant la génération complète

> ⚠️ Cette phase est complexe (incompatible avec bar_chart_race standard). Prototyper d'abord sur 10 frames avant de committer l'approche.

### T6-FINAL — Régénération des deux BCR (après validation T6)

Une fois les couleurs de drapeau intégrées dans `generate_elo_race.py`, régénérer les deux animations dans l'ordre :

```bash
# 1. BCR Elo (avec drapeaux + couleurs dominantes)
python3 generate_elo_race.py --test   # valider visuellement sur 5 ans
python3 generate_elo_race.py          # génération complète (~5 min)
ls -lh data/elo_race.mp4

# 2. BCR FIFA (noms abrégés + vitesse déjà corrigés en T5)
python3 generate_fifa_race.py --test  # valider visuellement sur 10 ans
python3 generate_fifa_race.py         # génération complète (~3 min)
ls -lh data/fifa_race.mp4

git add data/elo_race.mp4 data/fifa_race.mp4 generate_elo_race.py generate_fifa_race.py
git commit -m "fix: régénération BCR Elo + FIFA — couleurs drapeaux (T6)"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

## Tier 7 — Maintenance Python (après le tournoi)

### T7-1 — Créer `elo_utils.py`

```python
"""Fonctions Elo partagées entre generate_web_data.py et generate_elo_race.py."""

def get_k(tournament: str) -> int:
    t = tournament.lower()
    if 'world cup' in t and 'qualif' not in t: return 60
    if any(x in t for x in ['euro','copa am','african cup','asian cup','gold cup','oceania']): return 50
    if 'qualif' in t or 'nations league' in t: return 35
    if 'friendly' in t: return 20
    return 28

def elo_exp(ra: float, rb: float) -> float:
    return 1.0 / (1.0 + 10.0 ** ((rb - ra) / 400.0))
```

Dans les deux scripts : `from elo_utils import get_k, elo_exp`.

### T7-2 — Nettoyage divers

- Créer `requirements-race.txt` (`bar_chart_race>=0.3`, `pandas>=2.0`, `matplotlib>=3.7`, `Pillow>=10.0`)
- Supprimer les blocs CSS orphelins `.prono-bar`, `.prono-seg`, `.prono-labels` (remplacés par les nouvelles classes)
- Supprimer `let currentSlug = null;` de `app.js`
- Documenter `parse_uefa_qualifs.py` dans le README ou le supprimer

**Commit Tier 7 :**
```bash
git add elo_utils.py generate_web_data.py generate_elo_race.py requirements-race.txt style.css app.js README.md
git commit -m "chore: extraction elo_utils.py, nettoyage CSS orphelin, suppression currentSlug"
git fetch origin master && git merge origin/master --no-edit && git push
```

---

## Récapitulatif des tiers

| Tier | Contenu | Priorité | Deadline |
|------|---------|----------|----------|
| **T0** | GitHub Actions + probabilités Elo + OG tags + fix FIFA | Critique | Avant 12 juin |
| **T1** | Race condition, reset sliders, vidéo controls, CSS mobile, partage | Haute | Avant 12 juin |
| **T2** | Lazy loading teams.json | Haute | Avant 12 juin |
| **T3** | BCR Elo : Top 10 + noms courts + labels (avec test screenshot) | Moyenne | Avant/pendant tournoi |
| **T4** | Navigation mobile déroulante | Moyenne | Avant ajout nouvelles pages |
| **T5** | Classement FIFA historique (slider années + BCR) | Moyenne | Après tournoi ou avant si sources validées rapidement |
| **T6** | BCR Elo : drapeaux + couleurs dominantes | Basse | Session dédiée, après T3 |
| **T7** | Maintenance Python (elo_utils, cleanup) | Basse | Post-tournoi |

**Ordre recommandé :**
1. **T0** (bloquant pour le tournoi)
2. **T1** (quick wins groupés)
3. **T2** (session dédiée, tests complets)
4. **T3** (session dédiée, validation screenshot)
5. **T4** (avant d'ajouter T5)
6. **T5** (après validation des sources — commencer par T5-1)
7. **T6** (prototype d'abord)
8. **T7** (post-tournoi)
