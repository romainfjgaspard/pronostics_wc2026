# Status — pronostics_wc2026

Site de **données** pour la Coupe du Monde 2026 : historique des équipes, matchs WC 2026, classements.
(Ce n'est PAS un site de pronostics — il fournit les données pour que les participants fassent leurs propres pronostics.)

**Stack** : Python + web statique (HTML/CSS/JS) + GitHub Pages
**Repo** : https://github.com/romainfjgaspard/pronostics_wc2026
**Site** : https://romainfjgaspard.github.io/pronostics_wc2026/

**Dernière session** : 2026-05-25 (Line Chart Race Elo + ajustements vidéos)
**État** : T0 ✅ T1 ✅ T2 ✅ T3 ✅ T4 ✅ T5 ✅ T6 ✅ T6-FINAL ✅ — T7 à faire — P1 ✅ P2 ✅ P3 ✅ P4 ✅ P5 ✅ P6 ✅ P7 ✅ P8 ✅ P9 ✅ P10 ✅ — Line Race ✅

---

## Ce qui a été fait

### Session 2026-05-23

- Repo GitHub créé et pushé (`romainfjgaspard/pronostics_wc2026`)
- Structure GitHub Pages : `index.html`, `style.css`, `app.js` à la racine
- `data/` unifié (données Python + JSON web)
- Scripts présents : `fetch_data.py`, `parse_uefa_qualifs.py`, `fetch_fifa_ranking.py`, `generate_web_data.py`
- SPA avec hash-routing (`#/`, `#/team/{slug}`, `#/rankings`, `#/fifa-ranking`, `#/data`)
- Calcul Elo maison (K×60 WC, ×50 tournois, ×35 qualifs, ×20 amicaux)
- Page équipe : stats par période (all/2025/2026/qualifs), slider, forme récente
- GA4 intégré (G-VXYD6995KY)
- Page classement FIFA (`#/fifa-ranking`)
- Page téléchargement (`#/data`)
- `README.md` réécrit en anglais

### Session 2026-05-24 (partie 1)

- `fetch_fifa_ranking.py` réécrit avec le **vrai endpoint FIFA FDCP** :
  `https://api.fifa.com/api/v3/fifarankings/rankings/rankingsbyschedule`
  - `rankingScheduleId` extrait dynamiquement depuis `__NEXT_DATA__` de `inside.fifa.com`
  - Résultat : **211 équipes, France #1, date 2026-04-01**
  - Fallback CSV cnc8 conservé (données 2020 uniquement)
- Toggle FR/EN avec persistance localStorage
- `TEAM_FR_NAMES` dict (37 entrées) + `dn(name)` helper pour l'affichage
- Noms équipes traduits côté affichage (pas dans les slugs/données)
- Footer traduit FR/EN via `data-i18n`
- Bug scroll-to-top corrigé (`behavior: 'instant'`)
- Bug toggle FR/EN mobile corrigé (onclick → addEventListener)
- Bloc explicatif Elo sur la page classement (K-factors, paramètres)
- `.elo-note` : couleur corrigée (`var(--border)` trop sombre → `var(--muted)`)

### Session 2026-05-24 (partie 2) — Historique complet depuis 1872

- `fetch_data.py` : suppression de tous les filtres date/tournoi → historique complet (49 329 matchs)
- `generate_web_data.py` :
  - Calcul Elo sur tout l'historique (Spain 2087, Argentina 2068, France 2023)
  - Ajout période `all_time` (stats sans filtre de date)
  - Suppression de la limite sur `team_recent` → liste complète de tous les matchs par équipe
- `generate_elo_race.py` créé (bar chart race Elo, à partir de 1930)
- `app.js` :
  - Bouton période **"Historique / All time"** → stats all_time + liste complète + masque le slider
  - Slider matchs : max = nb réel de matchs de l'équipe, défaut 50
  - Toutes les références "depuis 2022" mises à jour (Elo depuis 1872, 49 329 matchs)
  - H2H : suppression du filtre "depuis 2022" dans les labels
- `data/results.csv` : 49 329 lignes (vs 3 970 avant)
- `data/teams.json` : 4,6 MB avec historique complet par équipe (600–1100 matchs selon l'équipe)
- `.gitignore` : `matches_enriched.json`, `stats_teams.json`, `stats_tournaments.json` exclus
- **Bugs corrigés** :
  - `getTeamStats` ne gérait pas `all_time` → "Aucune donnée" au clic Historique
  - `sliderPeriod = 15` (régression) → 50

---

## Comment mettre à jour les données

```bash
# Depuis ~/projects/pronostics_wc2026/

# 1. Données historiques (tous les matchs depuis 1872)
python3 fetch_data.py

# 2. Classement FIFA (API officielle + fallback CSV)
python3 fetch_fifa_ranking.py

# 3. Génération des JSON pour le site
python3 generate_web_data.py
```

---

## Architecture technique

### Endpoint FIFA découvert (2026-05-24)

```
# Étape 1 — récupérer le dateId depuis __NEXT_DATA__
GET https://inside.fifa.com/fr/fifa-world-ranking/men
→ JSON props.pageProps.pageData.ranking.dates[0].dates[0].id
→ ex: "FRS_Male_Football_20260119" (classement du 01/04/2026)

# Étape 2 — récupérer le classement
GET https://api.fifa.com/api/v3/fifarankings/rankings/rankingsbyschedule
    ?rankingScheduleId=FRS_Male_Football_20260119&count=211&language=en
→ { Results: [ { IdCountry, TeamName, Rank, PrevRank, TotalPoints, RatedMatches, ... } ] }
```

> Les anciens endpoints `inside.fifa.com/api/client/ranking/men` sont en **404** depuis 2025.

### Calcul Elo

| Type de match | K-facteur |
|---------------|-----------|
| FIFA World Cup | ×60 |
| Euro, Copa América, CAN, Coupe d'Asie | ×50 |
| Qualifications, Nations League | ×35 |
| Matchs amicaux | ×20 |
| Autres | ×28 |

- Avantage domicile : **+75 pts** (annulé sur terrain neutre)
- Score initial : **1 500** par équipe
- Calculé depuis **1872** (historique complet martj42)

### Données disponibles

| Fichier | Description | Taille |
|---------|-------------|--------|
| `data/fixtures.json` | 72 matchs WC 2026 (groupes, dates, villes, Elo) | 15 KB |
| `data/teams.json` | 48 équipes : stats par période + tous les matchs historiques | 4,6 MB |
| `data/groups.json` | Composition des 12 groupes (A–L) | 3 KB |
| `data/rankings.json` | Classement Elo 48 équipes WC | 4 KB |
| `data/fifa_ranking.json` | Classement FIFA officiel, 211 équipes, avril 2026 | 33 KB |
| `data/results.csv` | 49 329 matchs depuis 1872 (source martj42) | 3,6 MB |
| `data/goalscorers.csv` | 47 601 buteurs depuis 1872 | 3,2 MB |
| `data/shootouts.csv` | 677 séances de tirs au but | 29 KB |

Fichiers exclus du repo (trop lourds, non utilisés par le site) :
- `data/matches_enriched.json` — 15 MB
- `data/stats_teams.json`, `data/stats_tournaments.json`

---

### Session 2026-05-24 (partie 3) — Audit + plan d'action

- Audit complet du projet (structure, données, frontend, état git)
- `PLAN.md` créé avec 5 phases auto-suffisantes, exécutables indépendamment

---

### Session 2026-05-24 (partie 4) — Phase 1 : diagnostic et validation

**Diagnostic réalisé :**
- `teams.json` : historique complet confirmé (England 1088 matchs depuis 1872-11-30, France 933, Brazil 1057)
- Bugs déjà corrigés en partie 2 (commit ff42033) : `getTeamStats` gérait pas `all_time`, `sliderPeriod` régressé à 15
- Colonne "Compétition" : champ `m.tournament` bien rempli jusqu'aux années 1900
- `updateMatchList('all_time')` correct : affiche bien tous les matchs via `buildMatchesTable(team.matches || [])`

**Fix cosmétique appliqué :**
- `app.js` : en mode `all_time`, le titre de section passe de "Résultats récents (933)" à "Historique (933)" — utilise la clé i18n `period_all_time` existante

**PLAN.md :** Phase 1 marquée ✅

---

### Session 2026-05-24 (partie 5) — Phase 2 : Slider années sur les fiches équipes

**Implémentation :**
- `app.js` :
  - Helpers ajoutés : `filterMatchesByYears(matches, minYear, maxYear)` et `filterMatchesQualifs(matches)`
  - État global : `teamYearMin = 1872`, `teamYearMax = 2026`, `teamQualifsMode = false`
  - i18n ajoutée (FR + EN) : `year_slider_label`, `btn_qualifs_cdm`
  - `renderTeam` : les 5 boutons période + slider "N matchs" remplacés par dual-slider années (1872–2026) + bouton "Qualifs CDM 2026"
  - Nouvelle fonction locale `applyTeamFilters()` (stats + table + label)
- `style.css` : styles `.year-slider-wrap`, `.dual-slider-row`, `.year-slider`, `.year-edge`, `.dual-slider-track`

**Code orphelin (laissé pour Phase 3 — nettoyage) :**
- `updateStats()` — fonction déclarée mais plus appelée
- `sliderPeriod` — variable globale plus utilisée dans `renderTeam`
- `getPeriods()` — toujours utilisée par `renderTeams` et `renderCompare`

### Session 2026-05-24 (partie 6) — Phase 3 : Slider années sur page équipes + comparaison

**Implémentation :**
- `app.js` :
  - État global ajouté : `teamsYearMin/Max/QualifsMode` + `cmpYearMin/Max/QualifsMode`
  - `renderTeams` : period-btns + slider N matchs remplacés par dual-slider années (1872–2026) + bouton "Qualifs CDM 2026"
  - `renderTeamsBody` : filtre via `filterMatchesByYears`/`filterMatchesQualifs` (au lieu de `getTeamStats`/`teamsSlider`), label mis à jour avec total matchs filtrés
  - `renderCompare` : 5 period-btns remplacés par dual-slider années + bouton Qualifs CDM ; `buildContent(period)` → `buildContent(matches1, matches2)` ; H2H reste sur historique complet
- Nettoyage orphelins : `sliderPeriod`, `teamsSlider`, `teamsPeriod`, `getPeriods()`, `getTeamStats()`, `updateStats()` supprimés

**Aucun changement touché aux autres phases (renderTeam, renderFixtures, renderRankings, renderFifaRankings, renderData).**

---

### Session 2026-05-24 (partie 9) — Phase 5 : Améliorations diverses

- `app.js` :
  - `TEAM_FR_NAMES` : 37 → 51 entrées — Turkey→Turquie, Nigeria→Nigéria, Trinité-et-Tobago, Irlande, + 10 équipes WC identiques en FR (Canada, Curaçao, France, Ghana, Iran, Panama, Paraguay, Portugal, Qatar, Uruguay)
  - `TOURNAMENT_FR_NAMES` + `dt()` : 29 tournois traduits en FR (Friendly→Amical, FIFA WC→CDM, CAN, UEFA Euro, etc.)
  - `buildMatchesTable` : colonne Compétition traduite via `dt()` (tooltip garde l'anglais via `title`)
  - `renderCompare`/`buildContent` : résumé H2H W/D/L (`.h2h-summary`) avant la table des confrontations directes
- `style.css` :
  - `.nav-links` : `overflow-x: auto + scrollbar-width: none` → onglet "Données" accessible sur mobile
  - `.h2h-summary` / `.h2h-score` / `.h2h-sep` : styles du résumé H2H
  - `.lang-btn` mobile : `min-height/width: 32px` pour tap target correct
- **Commit** : `4674332`

---

### Session 2026-05-24 (partie 7 + 8) — Phase 4 : Bar Chart Race Elo depuis 1872

**Implémentation finale :**
- `generate_elo_race.py` :
  - Date de départ : `"1930-01-01"` → `"1872-01-01"` (155 snapshots annuels)
  - Snapshots mensuels → **annuels** (format YYYY)
  - `steps_per_period=4`, `period_length=300` ms
  - Titre : "WC 2026 — Elo Rating Evolution 1872–2026 (Top 12)"
  - Méthodo alignée sur `ecl_ds/race_bcr.py` : `bcr.bar_chart_race(filename=str(output_mp4))` direct, `try/except` pour fallback GIF, `copy.deepcopy(race_kwargs)` à chaque appel (bug mutation `bar_kwargs` corrigé)
- `app.js` : section `<div class="race-section">` dans `renderRankings` — titre bilingue FR/EN + `<video autoplay loop muted playsinline>`
- `style.css` : `.race-section` + `.elo-race-video` ajoutés
- `data/elo_race.mp4` : **2.9 MB**, 155 années, Top 12 par confédération

**Problèmes rencontrés et résolus :**
- `bar_chart_race` incompatible pandas 3.0 → patch `fillna(method=...)` → `.ffill()` sur la librairie locale
- `shutil.which("ffmpeg")` retournait `None` même avec ffmpeg installable → supprimé, approche directe
- ffmpeg absent sur WSL → installé via `sudo apt install ffmpeg`
- Mutation de `bar_kwargs` par la lib entre deux appels → `copy.deepcopy(race_kwargs)`

**Commits :** `2b1af4f`, `22d162f`, `ec5648b`, `49b5fea`

---

---

### Session 2026-05-24 (partie 10) — Analyse critique audit + plan révisé

- `AUDIT.md` analysé de façon critique (pertinence, surengineering, oublis, ROI)
- `ANALYSE_PLAN.md` créé : analyse complète avec verdict par recommandation
- `NOUVEAU_PLAN.md` créé : plan révisé en 7 tiers, orienté CDM readiness

**Principaux ajustements par rapport au plan initial :**
- Lazy loading (Phase E) remplacé en Tier 2 (avant les améliorations BCR)
- GitHub Actions auto-update ajouté en Tier 0 (manquant dans l'audit — critique pour le tournoi)
- Probabilités Elo par match (indicateur statistique) ajouté en Tier 0
- Phase H (drapeaux BCR) conservée — couleur dominante faisable avec Pillow
- Phase I (FIFA historique) conservée — vérifier API officielle avant scraping
- Phase K (navigation mobile) conservée
- Abandonné : M5 (onclick), SE2 (meta SPA), V2 (radar), C3 (équipes similaires), P3 (précomputation), M8 (noscript)

### Session 2026-05-24 (partie 11) — Tier 0 CDM readiness

**T0-1 — GitHub Actions :**
- `.github/workflows/update-data.yml` créé : cron lundi 7h UTC + `workflow_dispatch`
- Pipeline : `fetch_data.py` → `fetch_fifa_ranking.py` → `generate_web_data.py` → commit `data/`
- ⚠️ À ajuster pendant la CDM (12 juin–19 juillet) : passer le cron à `0 7 * * *` (quotidien)

**T0-2 — Probabilités Elo :**
- `generate_web_data.py` : fonction `elo_prob(ra, rb)` ajoutée + champ `proba` dans chaque fixture
- `app.js` : barre H/N/D (`.proba-bar`) dans les match cards de `renderFixtures()`
- `style.css` : classes `.proba-bar`, `.proba-seg`, `.proba-home`, `.proba-draw`, `.proba-away`, `.proba-note`
- `data/fixtures.json` régénéré (18 KB, 72 fixtures avec proba)

**T0-3 — Meta OG + favicon :**
- `index.html` : 6 balises meta OG/Twitter + favicon ⚽ SVG inline ajoutés

**T0-4 — Noms FIFA en anglais :**
- `fetch_fifa_ranking.py` : `language=fr` → `language=en`
- `data/fifa_ranking.json` régénéré : noms en anglais (Netherlands, Saudi Arabia…)
- Note : FIFA retourne "Korea Republic" (pas "South Korea") — nom officiel FIFA

**Point de vigilance :**
- `data/teams.json` (4,6 MB) n'est PAS inclus dans le commit (régénéré mais identique en substance — trop lourd, non modifié dans sa structure)
- Les classes `.prono-bar/.prono-seg/.prono-labels` (CSS orphelins) restent en place → nettoyage prévu en T7

---

### Session 2026-05-24 (partie 13) — Tier 2 : lazy loading teams.json

**Objectif :** Réduire le temps de chargement initial de ~4s à <500ms en ne chargeant `teams.json` (4,6 MB) qu'à la demande.

**Implémentation :**
- `app.js` :
  - `init()` : retire `teams.json` du `Promise.all` initial ; `DATA = { ..., teams: null, ... }`
  - `ensureTeams()` : nouveau helper async — si `DATA.teams` est null, affiche un spinner puis charge `teams.json` ; idempotent (no-op si déjà chargé)
  - `route()` : passé `async` + `await` sur `renderTeam`, `renderTeams`, `renderCompare`
  - `renderTeam()`, `renderTeams()`, `renderCompare()` : passés `async` + `await ensureTeams()` en tête
- `renderFifaRankings()` non modifié : déjà null-safe ligne 1196 (`DATA.teams && DATA.teams[teamSlug]`)
- `renderFixtures`, `renderRankings`, `renderData` non modifiés

**Scénarios couverts :**
1. `#/` (Matchs) → immédiat, teams.json non chargé
2. `#/rankings` → immédiat, teams.json non chargé
3. `#/teams` → spinner, puis table équipes (teams.json chargé une fois)
4. `#/team/france` → spinner, puis fiche France
5. Retour `#/teams` → immédiat (teams.json déjà en mémoire)

---

### Session 2026-05-24 (partie 12) — Tier 1 : quick wins groupés

**T1-1 — Race condition FIFA :**
- `app.js` : `let navToken = 0` ajouté en State, `navToken++` en début de `route()`, guard `myToken/navToken` dans `renderFifaRankings()` après le `await fetch`

**T1-2 — Reset sliders entre équipes :**
- `app.js` : `teamYearMin = 1872; teamYearMax = 2026; teamQualifsMode = false;` ajoutés en tout début de `renderTeam(slug)` — les sliders repartent à zéro à chaque changement d'équipe

**T1-3 — Vidéo controls + boutons vitesse + lien ancre :**
- `app.js` : balise `<video>` mise à jour avec `controls` + `id="elo-race-video"` ; boutons 1×/1.5×/2× avec event listeners `playbackRate` ; lien ancre `▶ Voir l'évolution historique` dans le page-header Elo
- `style.css` : classes `.race-speed-btns`, `.speed-btn`, `.speed-btn.active`, `.race-anchor`

**T1-4 — Fix CSS mobile + throttle sliders :**
- `style.css` : `.year-slider` + `top: 50%; transform: translateY(-50%);` pour alignement correct du thumb ; `.teams-controls` passé en `flex-direction: column; align-items: stretch` (slider pleine largeur)
- `app.js` : `teamsSliderTimer` local + setTimeout 60ms sur `onYearChange()` dans `renderTeams()`

**T1-5 — Bouton partage natif :**
- `index.html` : `<button class="share-btn" id="share-btn" onclick="sharesite()">🔗</button>` dans `.nav-links`
- `app.js` : fonction `sharesite()` — `navigator.share` si disponible, sinon clipboard + feedback visuel temporaire `✓`
- `style.css` : `.share-btn` — style minimal, fond transparent

**Commit** : `b423d4d`

---

### Session 2026-05-24 (partie 15) — Tier 4 : Navigation mobile déroulante

**Fichiers modifiés :** `index.html`, `app.js`, `style.css`

**Implémentation :**
- `index.html` : `<select class="nav-select" id="nav-select">` ajouté entre `.nav-links` et `.lang-toggle`
- `app.js` :
  - `NAV_PAGES` : array constant des 5 routes (hash + page + labelKey i18n)
  - `buildNavSelect()` : peuple les options + attache l'écouteur `change` → `location.hash` (appelé une fois depuis `initLang()`)
  - `updateNavSelectOptions()` : recrée les labels sans recréer l'écouteur (appelé depuis `setLang()`)
  - `setActiveNav(hash)` : refactorisé (activePage variable) + sync `sel.value` selon la page active
  - `setLang()` : appel `updateNavSelectOptions()` ajouté avant `route()`
  - `initLang()` : appel `buildNavSelect()` ajouté en fin de fonction
- `style.css` : `.nav-select` (hidden, flex:1) + `@media (max-width: 640px)` → `.nav-links` caché, `.nav-select` affiché

**Comportement :**
- ≤ 640px : select natif remplace les liens de nav (UX téléphone optimale)
- > 640px : nav liens normaux, select masqué
- Bilingue : labels mis à jour au changement FR/EN
- Page active reflétée dans le select (y compris `/team/...` → "Matchs")

---

### Session 2026-05-24 (partie 14) — Tier 3 : BCR Elo améliorations visuelles

**Fichier modifié :** `generate_elo_race.py`

**T3-1 — Noms abrégés :**
- `SHORT_NAMES` dict ajouté : "Bosnia and Herzegovina" → "Bosnia", "United States" → "USA", etc.
- `df.rename(columns=SHORT_NAMES)` après construction du DataFrame
- `TEAM_CONF_SHORT` recalculé pour que les couleurs restent correctes après renommage

**T3-2 — Top 10 + lissage :**
- `n_bars=10` (était 12)
- `steps_per_period=8` (était 4), `period_length=500` (était 300ms), `interpolate_period=True`
- Index converti en entiers (`int(y)`) — requis pour `interpolate_period=True` avec pandas

**T3-3 — Labels repositionnés :**
- `period_label` : `x=0.97, ha=right` + couleur `#f1f5f9` + `bbox` fond sombre `#0f172a` (opaque, en avant des barres)
- `period_summary_func=None` : supprimé (redondant avec les valeurs visibles sur les barres)
- Titre simplifié : "Elo Rating Evolution 1872–2026 (Top 10)" (sans "WC 2026 —")

**T3-4 — Génération :**
- Mode `--test` ajouté au script (5 premières années, steps=1, 100ms → GIF rapide pour validation)
- Validation visuelle effectuée en 4 itérations (fix index entier, fix position labels, suppression summary, fix bbox)
- `data/elo_race.mp4` régénéré : **3.9 MB**, 155 années (1872–2026), Top 10

---

### Session 2026-05-24 (partie 16) — Tier 5 : Classement FIFA historique

**T5-1 — Source validée :** API officielle FIFA (`inside.fifa.com/__NEXT_DATA__` + `api.fifa.com`)
- 346 dates disponibles depuis 1992 ; IDs anciens (`id1`, `id2`…) et modernes (`FRS_Male_Football_...`) tous accessibles
- 35 snapshots annuels sélectionnés (dernier classement de chaque année)

**T5-2 — `fetch_fifa_ranking_history.py` créé :**
- Extrait les 346 dates depuis `inside.fifa.com`, garde 1 par an
- Rate limiting 0.35s/requête
- Sortie : `data/fifa_ranking_history.json` (84 KB, 35 snapshots × top 30)
- #1 : Germany 1992 → Germany 1993 → Brazil 1994 → … → Spain 2025 → France 2026

**T5-3 — `renderFifaRankings()` enrichie dans `app.js` :**
- Sélecteur `<select>` "Période" avec toutes les années (1992–2026) chargé en lazy
- Par défaut : classement actuel 211 équipes (inchangé)
- Sélection d'une année → top 30 depuis `fifa_ranking_history.json` (lazy-load via `ensureFifaHistory()`)
- Labels adaptatifs FR/EN ; indicateur de changement de rang masqué pour les snapshots historiques
- Lien ancre vers la BCR FIFA ("Voir l'évolution historique")

**T5-4 — `generate_fifa_race.py` créé :**
- Source : `data/fifa_ranking_history.json`
- Mêmes paramètres que `generate_elo_race.py` (n_bars=10, steps_per_period=8, interpolate_period=True)
- Couleurs par confédération (extraites des données)
- `--test` mode disponible (10 premières années, GIF rapide)
- `data/fifa_race.mp4` généré : 1.3 MB, 35 années (1992–2026)
- ⚠️ Note dans le script : discontinuité visible en 2006/2018 = changements méthodologie FIFA

**Autres :**
- `.gitignore` : ajout `data/elo_race_test.gif` et `data/fifa_race_test.gif`
- i18n : `fifa_year_label` + `fifa_current_opt` ajoutés (FR + EN)

---

### Session 2026-05-24 (partie 17) — Tier 6 : couleurs dominantes drapeaux BCR Elo

**Fichier modifié :** `generate_elo_race.py`
**Fichier créé :** `data/flag_colors.json` (cache, 1.2 KB, 48 entrées)

**Implémentation :**
- `TEAM_ISO` dict : 48 équipes WC → codes ISO 3166-1 alpha-2 (avec `gb-eng` / `gb-sct` pour England/Scotland)
- `dominant_color(flag_url)` : télécharge le drapeau depuis flagcdn.com/w80/, resize 50×50, extrait la couleur la plus fréquente — avec filtre luminance (0.12 < luma < 0.82) pour exclure blanc/noir non lisibles sur fond sombre
- `load_flag_colors(teams, iso_map, conf_map)` : cache `data/flag_colors.json` (évite les re-téléchargements), fallback couleur confédération en cas d'erreur
- `main()` : `TEAM_ISO_SHORT` miroir de `TEAM_CONF_SHORT` ; `colors` construit depuis `flag_colors` au lieu de `CONF_COLORS`
- Imports ajoutés : `io`, `urllib.request`, `PIL.Image`

**Couleurs résultantes (exemples) :**
- France `#002654` (bleu marine) — Germany `#ffce00` (or) — Japan `#bc002d` (rouge) — Netherlands `#ae1c28`

**Non implémenté (scope T6 image-drapeaux) :**
- Superposition des drapeaux sur les barres via `AnnotationBbox + OffsetImage` — incompatible avec bar_chart_race standard, nécessite un callback matplotlib post-frame ; à prototyper séparément

**Prochaines étapes :**
1. Valider visuellement `data/elo_race_test.gif` (généré en --test)
2. Lancer `python3 generate_elo_race.py` (~5 min) pour régénérer `elo_race.mp4` avec les nouvelles couleurs
3. T7 : maintenance Python (elo_utils.py, nettoyage CSS)

---

### Session 2026-05-25 (partie 3) — Phase 2 : Bug slider double

**Fichier modifié :** `style.css`

**Fix appliqué :**
- `.dual-slider-track` : `height: 36px` → `20px` (juste assez pour les thumbs)
- `.dual-slider-track::before` : pseudo-élément ajouté — barre de fond explicite `4px` centrée (`z-index: 1`), évite la superposition des tracks natifs
- `.year-slider` : `top:50%/transform:translateY(-50%)` → `top:0/bottom:0/margin:0` + `z-index: 2`
- `.year-slider::-webkit-slider-thumb` : `position:relative; z-index:3` ajoutés, ombre `.4` → `.5`
- `.year-slider::-webkit-slider-runnable-track` : `background: var(--surface2)` → `transparent` (barre du conteneur utilisée)
- `.year-slider::-moz-range-track` : règle ajoutée (`background: transparent`)
- z-index : `year-slider-min` 3→2, `year-slider-max` 4→3 (cohérents avec la nouvelle pile)

**Validation :** Équipes, Équipe détail, Confrontation — les deux thumbs verts centrés sur la barre, déplaçables indépendamment, sans double track visible.

---

### Session 2026-05-25 (partie 4) — Phase 4 : Équipes — contrôles en ligne + colonne FIFA

**Fichiers modifiés :** `app.js`, `style.css`

**Implémentation :**
- `init()` : ajout de `fifa_ranking.json` dans le `Promise.all` initial (avec `.catch(() => null`) ; construction de `DATA.fifaRankMap` (Map iso2 → rang FIFA) — keyed par `iso2` plutôt que `slugify(name)` pour éviter les disparités de noms (IR Iran, Türkiye, Korea Republic…) ; 47/48 équipes WC matchées (Curaçao iso2 vide → affiche `—`)
- `renderTeams()` : bouton "Qualifs CDM" sorti du `.year-slider-wrap` → placé au même niveau que slider-wrap et search dans `.teams-controls` ; inline styles `align-self:flex-end;margin-bottom:4px`
- `style.css` : `.teams-controls` passé de `flex-direction:column` à `flex-direction:row + flex-wrap:wrap + gap:16px`
- `COL_DEFS` : colonne `{ col:'fifa', label:'FIFA', align:'right' }` ajoutée avant `elo`
- `renderTeamsBody()` : cellule FIFA rank (`DATA.fifaRankMap?.get(t.iso2) || '—'`) ajoutée ; cas `'fifa'` dans le tri (rang 9999 pour les équipes sans rang) ; direction par défaut `'asc'` au 1er clic (rang 1 = meilleur en haut)

**Aucune autre vue modifiée** (renderTeam, renderCompare, renderFixtures, renderRankings, renderFifaRankings, renderData inchangés).

---

### Session 2026-05-25 (partie 5) — Phase 5 : Classement FIFA — noms FR + slider + BCR en haut

**Fichier modifié :** `app.js`

**Implémentation :**
- `buildRows()` : `team.name` → `dn(team.name)` (lien + texte) — les noms s'affichent en français (France, Allemagne, Espagne…)
- `app.innerHTML` : structure réordonnée — `page-header` (titre + sous-titre, sans lien anchor) → `.race-section` (BCR vidéo en haut) → `.fifa-controls` (slider) → `.table-wrap` (tableau)
- `.fifa-controls` : `<select id="fifa-year-select">` remplacé par `<input type="range" id="fifa-year-slider" min="1992" max="2026">` + affichage de l'année sélectionnée (`#fifa-year-display`)
- Listener `change` sur select → listener `input` sur slider ; fallback `reduce` pour les années sans snapshot exact

**Non modifié :** `style.css` (`.fifa-controls` flex existant convient), `renderRankings()` (lien anchor Elo conservé — Phase 6).

---

### Session 2026-05-25 (partie 6) — Phase 6 : Classement Elo — entête + BCR en haut + slider année

**Fichiers modifiés :** `app.js`, `generate_web_data.py`
**Fichier créé :** `data/elo_ranking_history.json` (301 KB, 155 snapshots 1872–2026)

**6.1 — Raccourcir l'en-tête (app.js) :**
- `elo_sub` FR : `'Score de forme calculé…'` → `'Indicateur de niveau calculé…'`
- `elo_sub` EN : `'Form score calculated…'` → `'Level indicator based on…'`
- Bloc `explainer` (~60 lignes, `.elo-explainer` avec K-facteurs) → `explainerHtml` (4 lignes, lien vers page Données)
- Lien anchor `<a href="#elo-race-video">` supprimé du page-header

**6.2 — BCR vidéo en haut (app.js) :**
- `.race-section` déplacée avant `.table-wrap` (était après)
- Structure : `page-header → race-section → elo-controls → table-wrap`

**6.3 — Snapshots Elo annuels (generate_web_data.py) :**
- Import `datetime` ajouté
- `compute_elo_history(matches, qualified_teams)` ajoutée après `compute_elo()` : snapshots annuels des 48 équipes qualifiées
- Appel dans `main()` après `save_json(rankings_out, ...)` → génère `data/elo_ranking_history.json`
- 155 snapshots (1872–2026), 48 équipes par snapshot

**6.4 — Slider année 1872–2025 (app.js) :**
- `ensureEloHistory()` ajoutée après `ensureFifaHistory()` (même pattern)
- `renderRankings()` passée en `async`
- `route()` : `renderRankings()` → `await renderRankings()`
- Slider `#elo-year-slider` (min=1872, max=2025) + affichage `#elo-year-display`
- Réutilise `.fifa-controls` + `.fifa-year-label` (pas de nouveau CSS)
- Listener `input` : cherche snapshot exact, fallback `reduce` si absent ; affiche `dn(name)` avec lien équipe si slug disponible

**Validation :**
- `data/elo_ranking_history.json` : 155 snapshots, premier 1872 (England #1), dernier 2026 (Spain #1)
- `python3 generate_web_data.py` : génère les 5 JSON sans erreur

---

### Session 2026-05-25 (partie 2) — Analyse terrain + plan de corrections UI/UX

**Contexte :** Analyse manuelle complète du site (PC + mobile) → 11 points de correction identifiés.

**Livrables :**
- `PLAN_CORRECTIONS.md` créé (1 094 lignes) — plan autoporté en 10 phases, exécutable chat par chat

**Corrections planifiées (résumé) :**

| Phase | Sujet | Effort |
|-------|-------|--------|
| **P1** | Bandeau nav : icône trophée, titre CdM/WC bilingue, icône share SVG, share toujours visible, dropdown mobile corrigé (breakpoint 640→768px) | ~1h |
| **P2** | Bug slider double : thumbs mal centrés / derrière la barre — fix CSS complet | ~30min |
| **P3** | Matchs : proba-note retirée de chaque match card, déplacée dans l'en-tête | ~15min |
| **P4** | Équipes : contrôles en ligne (flex-row), colonne FIFA ajoutée, fifa_ranking.json chargé au boot | ~1h30 |
| **P5** | FIFA ranking : noms en FR, select → slider simple (1992–2026), BCR vidéo en haut | ~1h |
| **P6** | Elo ranking : entête raccourcie, BCR en haut, slider année (nécessite snapshots Elo annuels dans generate_web_data.py) | ~2h30 |
| **P7** | Données : suppression infoBanner, corrections textes (1872), section méthodologie Elo | ~30min |
| **P8** | Équipe/Confrontation : drapeaux w320 (re-fetch), slider+bouton sur une ligne, badge FIFA rank, forme droite alignée | ~1h30 |
| **P9** | README : mise à jour complète (1872, 49 329 matchs, nouveaux fichiers) | ~30min |
| **P10** | Quiz Drapeaux : nouvel onglet, 48 drapeaux en shuffle, autocomplete, score /48, partage | ~3h |

**Fichier de référence :** `PLAN_CORRECTIONS.md` (autoporté, sections indépendantes)

---

### Session 2026-05-25 — Tier 6 FINAL : couleurs maillot + drapeaux locaux

**Fichiers modifiés :** `generate_elo_race.py`, `generate_fifa_race.py`, `generate_web_data.py`, `app.js`, `fetch_flags.py` (nouveau)

**Couleurs maillot BCR :**
- `JERSEY_COLORS` dict (48 équipes WC) ajouté dans les deux scripts BCR
- Remplace les couleurs par confédération ET les couleurs dominantes de drapeaux
- **Bug corrigé :** `filter_column_colors=True` → `False` — avec une liste custom, la valeur `True` décalait toutes les couleurs (slice sur les N premières après filtrage des colonnes, pas correspondance par nom)
- BCR Elo : `period_length` 500 → 667 ms (aligné sur BCR FIFA)
- BCR FIFA : `period_length` 1000 → 667 ms (×1.5 plus rapide)

**Drapeaux locaux (w160) :**
- `fetch_flags.py` : télécharge 137+1 drapeaux (w160) depuis flagcdn.com → `data/flags/`
- `app.js` : `FLAG_BASE` CDN w40 → `./data/flags/` (images locales, haute qualité, lien pérenne)
- `generate_web_data.py` : `Curaçao: 'cw'` ajouté dans `TEAM_ISO2` + drapeau `cw.png` téléchargé

**Vidéos régénérées :**
- `elo_race.mp4` : 3.7 MB — 155 années, couleurs maillot, 667 ms/période
- `fifa_race.mp4` : 1.3 MB — 35 années, couleurs maillot, 667 ms/période

**Prochaine étape :** T7 — Maintenance Python (`elo_utils.py`, nettoyage CSS orphelins, `requirements-race.txt`)

---

### Session 2026-05-25 — Phase 7 : Page Données

**Fichier modifié :** `app.js`

**7.1 — Suppression du bandeau infoBanner :**
- `const infoBanner = ...` (~20 lignes) supprimé
- `<div class="info-banner">${infoBanner}</div>` supprimé du `app.innerHTML`

**7.2 — Descriptions datasets corrigées :**
- FR "Fiches équipes" : `depuis 2022, 2025, 2026, qualifs` → `depuis 1872, qualifs CDM` + `score Elo calculé depuis 1872`
- FR "Résultats historiques" : `dont WC 2022, Euro 2024…` → `couvrant toutes les compétitions depuis leur création : Coupe du Monde, Euro, Copa América, CAN, Ligue des Nations, qualifications, amicaux…`
- EN : mêmes corrections (since 1872, WC qualifiers, Elo calculated since 1872 ; all competitions since creation)

**7.3 — Section méthodologie Elo :**
- 4e `<li>` ajouté dans `sourcesHtml` FR et EN : "Score Elo — méthodologie détaillée" avec K-facteurs détaillés (Euro/Copa/CAN/Asie ×50), avantage domicile, score initial

**Prochaines étapes :** P9 (README), P10 (Quiz)

---

### Session 2026-05-25 — Phase 9 : README mise à jour

**Fichier modifié :** `README.md`

- Feature Elo Ranking : `"computed from results since 2022"` → `"computed from the complete history since 1872"`
- Structure `results.csv` : `3,970 international matches since Jan 2022` → `49,329 international matches since 1872`
- Section "Historical results" : bloc 4 lignes → 3 lignes (49 329 matchs, toutes compétitions depuis leur création, WC fixtures)
- Section "Elo Score" : `"Form score computed from the 3,970 matches since January 2022"` → `"Computed from the 49,329 matches since 1872"`
- Team profiles : `"since 2022 / 2025 / 2026 / WC qualifiers"` → `"since 1872 / WC qualifiers"`
- Structure : ajout de `elo_ranking_history.json` (155 snapshots, Phase 6 ✅)

---

### Session 2026-05-25 — Phase 8 : Équipe + Confrontation — drapeaux HD + layout + FIFA rank + forme droite

**Fichiers modifiés :** `fetch_flags.py`, `app.js`, `style.css`
**Fichiers régénérés :** `data/flags/*.png` (138 fichiers, 320×213 px)

**8.1 — Drapeaux w320 :**
- `fetch_flags.py` : `BASE_URL` `w160` → `w320`, message mis à jour
- `data/flags/*.png` : 138 drapeaux supprimés et re-téléchargés (320px, 0 erreur, 175 KB total)
- France 320×213 px, Allemagne 320×192 px — nets sur écrans HiDPI/Retina

**8.2 — Slider + bouton Qualifs sur une ligne :**
- `renderTeam()` : `<div class="dual-slider-row">` + `<button>` encapsulés dans `<div class="controls-inline-row"><div class="dual-slider-row" style="flex:1">...</div><button></div>`
- `renderCompare()` : même transformation appliquée
- `style.css` : `.controls-inline-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap }` + `.controls-inline-row .dual-slider-row { flex:1; min-width:160px }`

**8.3 — Badge FIFA rank :**
- `renderTeam()` : `${DATA.fifaRankMap?.has(team.iso2) ? \`<span class="badge badge-fifa">FIFA #...</span>\` : ''}` ajouté après `badge-elo`
- `renderCompare()` : rang FIFA injecté dans `.compare-team-meta` pour t1 et t2 (keyed par iso2)
- `style.css` : `.badge-fifa { background: rgba(251,191,36,.15); color: #fbbf24; }` ajouté

**8.4 — Forme droite alignée à droite :**
- `renderCompare()` : 2e `.compare-form-col` → `.compare-form-col compare-form-col--right`
- `style.css` : `.compare-form-col--right { text-align:right }` + `.compare-form-col--right .form-badges { justify-content:flex-end }`

---

### Session 2026-05-25 — Phase 10 : Quiz Drapeaux

**Fichiers modifiés :** `index.html`, `app.js`, `style.css`

**Comportement choisi (modification du plan initial) :**
Pas de feedback après chaque drapeau (ni "correct" ni "faux") — passage immédiat au suivant. Résultats uniquement en page finale.

**10.1 — Onglet Quiz :**
- `index.html` : `<a href="#/quiz" ...>Quiz</a>` ajouté dans `.nav-links`
- `app.js` : `NAV_PAGES` + `route()` + `setActiveNav()` mis à jour

**10.2 — renderQuiz() :**
- 48 équipes mélangées aléatoirement depuis `DATA.rankings`
- Datalist autocomplete avec tous les noms en langue active
- Valider / Passer → passage immédiat au drapeau suivant (pas de délai, pas de message)
- `results[]` trace correct/incorrect pour la page finale
- Page finale : score /48, grille des drapeaux ratés (`.quiz-results-grid`), bouton partage (`navigator.share` ou clipboard)

**10.3 — CSS :** `.quiz-wrapper`, `.quiz-progress`, `.quiz-card`, `.quiz-flag`, `.quiz-input-row`, `.quiz-input`, `.quiz-final-score`, `.quiz-results-grid`, `.quiz-result-item`, `.quiz-result-flag`

**Commit :** `25750cb`

---

### Session 2026-05-25 — Line Chart Race Elo (remplacement BCR Elo)

**Fichiers créés :** `generate_elo_line_race.py`, `data/elo_global_history.json`
**Fichiers modifiés :** `generate_web_data.py`, `app.js`, `data/elo_line_race.mp4`, `data/fifa_race.mp4`

**Contexte :** Remplacement du bar chart race Elo par une animation FuncAnimation matplotlib — line chart race des 11 plus grandes nations depuis 1920.

**Implémentation `generate_elo_line_race.py` :**
- `FuncAnimation` (matplotlib) avec `blit=False` (requis pour `ax.imshow` + drapeaux)
- 11 équipes sélectionnées manuellement (`KEEP_TEAMS`) : Argentina, Belgium, Brazil, England, France, Germany, Italy, Netherlands, Portugal, Spain, Uruguay
- Drapeaux via `ax.imshow()` + `set_extent()` par frame (AnnotationBbox abandonné — invisible en animation)
- Lissage gaussien (sigma=2.5) sur les données annuelles avant interpolation
- Axe Y fixe : 1600–2100 ; `START_YEAR=1920` (avant : toutes les équipes sous 1600 → invisible)
- Drapeaux et labels masqués (OFF_X) quand score < 1600
- Z-order dynamique : équipe au score le plus haut affichée devant
- FPS=24, STEPS_PER_YEAR=8 → 849 frames, 35.4s
- Sortie : `data/elo_line_race.mp4` (3.8 MB)

**`generate_web_data.py` :**
- `compute_elo_global_history()` ajoutée : simulation Elo sur tous les matchs, identifie les équipes jamais dans le top 10 mondial, sauvegarde leurs trajectoires complètes
- `data/elo_global_history.json` : 55 équipes × 155 années (43 KB)

**`app.js` :**
- Source vidéo Elo : `elo_race.mp4` → `elo_line_race.mp4`
- Attribut `loop` retiré des deux vidéos (Elo + FIFA) → arrêt sur image finale
- Lien Wikipédia ajouté dans bloc "Calcul Elo" (page Données) — FR + EN

**`data/fifa_race.mp4` :** régénéré (déjà existant, contenu identique)

**Problèmes résolus :**
- AnnotationBbox + OffsetImage → invisible en animation → remplacé par `ax.imshow` + `set_extent`
- Période 1872–1920 : toutes les équipes sous 1600 → invisible → `START_YEAR=1920`
- `TOP_HIGHLIGHT=10` avec 11 équipes → 1 équipe sans drapeau → condition étendue à toutes
- Ylim dynamique (progressif) → illisible → axe Y fixe
- Drapeau restant visible sous 1600 (`clip_on=False`) → masqué dès que score < y_min

**Commits :** `d3f58d6`, `e6f4e85`, `a109d5b`, `5ba1990`, `1cc8e1b`, `f72d902`

**État git :**
- Branch : master, à jour avec origin/master (dernier push : `f72d902`)
- Non committés : `data/elo_ranking_history.json`, `data/rankings.json`, `data/teams.json` (régénérés mais non modifiés structurellement — régénération normale à chaque `generate_web_data.py`)
- Non tracké : `data/elo_line_race_test.gif` (artefact de test, ignorable)

---

## Plan d'actions — restant (`NOUVEAU_PLAN.md`)

> Remplace l'ancien `PLAN.md`. Détail complet (code exact, lignes à modifier, tests, commits) dans `NOUVEAU_PLAN.md`.

| Tier | Tâche | Statut |
|------|-------|--------|
| **T0** | GitHub Actions auto-update + probabilités Elo + meta OG + fix noms FIFA | ✅ Fait (commit `d41df5a`, 2026-05-24) |
| **T1** | Race condition FIFA, reset sliders, vidéo controls+vitesse, CSS mobile, bouton partage | ✅ Fait (commit `b423d4d`, 2026-05-24) |
| **T2** | Lazy loading `teams.json` (session dédiée — 5 scénarios de test) | ✅ Fait (2026-05-24) |
| **T3** | BCR Elo : Top 10 + noms courts + labels (validation screenshot avant regen) | ✅ Fait (2026-05-24) |
| **T4** | Navigation mobile déroulante (`<select>` natif sous 640px) | ✅ Fait (2026-05-24) |
| **T5** | Classement FIFA historique (sélecteur années + BCR FIFA) | ✅ Fait (2026-05-24) |
| **T6** | BCR Elo : couleurs maillot domicile (48 équipes), drapeaux locaux w160, fix filter_column_colors | ✅ Fait (2026-05-25) |
| **T6-FINAL** | Régénération `elo_race.mp4` + `fifa_race.mp4` — couleurs maillot + speed 667ms | ✅ Fait (2026-05-25) |
| **T7** | Maintenance Python : `elo_utils.py`, nettoyage CSS, `requirements-race.txt` | ⬜ À faire |
| **Line Race** | `generate_elo_line_race.py` — FuncAnimation, 11 nations, 1920–2026, drapeaux, lissage gaussien | ✅ Fait (2026-05-25) |
| **P1** | Bandeau nav : logo trophée PNG, icône share SVG, share toujours visible, breakpoints 640→768px + 700→900px, titre bilingue | ✅ Fait (2026-05-25) |
| **P2** | Bug slider double : `::before` track explicite, `top:0/bottom:0`, tracks natifs transparents, z-index corrigés | ✅ Fait (2026-05-25) |
| **P3** | Onglet Matchs : `proba-note` retirée de chaque match card, déplacée dans l'en-tête avec lien vers Classement Elo | ✅ Fait (2026-05-25) |
| **P4** | Équipes : `init()` charge `fifa_ranking.json` au boot (map iso2→rang), contrôles en flex-row, colonne FIFA cliquable | ✅ Fait (2026-05-25) |
| **P5** | FIFA ranking : noms FR (`dn()`), select → slider (1992–2026), BCR vidéo déplacée en haut | ✅ Fait (2026-05-25) |
| **P6** | Elo ranking : `elo_sub` raccourci, explainer → lien Données, BCR en haut, slider 1872–2025, `elo_ranking_history.json` (155 snapshots) | ✅ Fait (2026-05-25) |
| **P7** | Données : suppression infoBanner, descriptions "depuis 1872", section méthodologie Elo détaillée | ✅ Fait (2026-05-25) |
| **P8** | Drapeaux w320, slider+bouton en ligne, badge FIFA rank, forme droite alignée | ✅ Fait (2026-05-25) |
| **P9** | README : 6 corrections (1872, 49 329 matchs, elo_ranking_history.json) | ✅ Fait (2026-05-25) |
| **P10** | Quiz Drapeaux : 48 drapeaux, input autocomplete, résultat uniquement en fin | ✅ Fait (2026-05-25, commit `25750cb`) |
