# PLAN D'ACTION — pronostics_wc2026
> Généré le 2026-05-24 · À exécuter phase par phase dans des sessions séparées

## Contexte du projet

**Localisation** : `/home/pargass/projects/pronostics_wc2026/`  
**Stack** : HTML/CSS/JS vanilla (SPA hash routing) + Python (génération de données)  
**Hébergement** : GitHub Pages (branch master)  
**Fichiers principaux** :
- `app.js` (51 KB) — toute l'application frontend (routing, vues, helpers)
- `style.css` (27 KB) — design system dark theme
- `index.html` (68 lignes) — page unique
- `generate_web_data.py` — génère les 4 JSON du site
- `generate_elo_race.py` — animation Bar Chart Race (créé, pas encore intégré)
- `data/teams.json` — 48 équipes avec historique complet de tous leurs matchs
- `data/results.csv` — 49 329 matchs depuis 1872 (source de vérité)

**Architecture de `app.js`** : chaque "vue" est une fonction `render*()` qui écrit dans `document.getElementById('app')`. Routes :
- `#/team/{slug}` → `renderTeam(slug)`
- `#/teams` → `renderTeams()`
- `#/compare/{s1}/{s2}` → `renderCompare(slug1, slug2)`
- `#/rankings` → `renderRankings()`
- `#/` → `renderFixtures()`

**Lancer le site localement** : `python -m http.server 8080` depuis le dossier du projet.

---

## Phase 1 — Diagnostic et fix "fiches équipes depuis 1872"

### Problème
L'utilisateur rapporte que les matchs depuis 1872 ne s'affichent pas sur les fiches équipes. La dernière session a ajouté le code mais ça ne marche pas. Le fichier `teams.json` est tracké par git (pas dans `.gitignore`) et fait 4,6 MB.

### Étape 1.1 — Vérifier que teams.json contient bien l'historique complet

```bash
cd /home/pargass/projects/pronostics_wc2026

# Vérifier les matchs les plus anciens de l'Angleterre (joue depuis 1872)
python3 -c "
import json
with open('data/teams.json') as f:
    teams = json.load(f)
england = teams.get('england', {})
matches = england.get('matches', [])
print(f'England : {len(matches)} matchs')
if matches:
    oldest = min(matches, key=lambda m: m['date'])
    newest = max(matches, key=lambda m: m['date'])
    print(f'Plus ancien : {oldest[\"date\"]} vs {oldest[\"opponent\"]}')
    print(f'Plus récent : {newest[\"date\"]} vs {newest[\"opponent\"]}')
print()
# Vérifier aussi France et Brésil
for slug, since in [('france', '1900'), ('brazil', '1914')]:
    t = teams.get(slug, {})
    m = t.get('matches', [])
    print(f'{slug} : {len(m)} matchs, plus ancien : {min(m, key=lambda x: x[\"date\"])[\"date\"] if m else \"N/A\"}')
"
```

**Si le plus ancien match d'Angleterre n'est PAS en 1872 → régénérer teams.json** (voir étape 1.2).  
**Si les matchs sont là → le bug est dans le JS** (voir étape 1.3).

### Étape 1.2 — Régénérer teams.json (si données incomplètes)

```bash
cd /home/pargass/projects/pronostics_wc2026
python generate_web_data.py
```

Puis vérifier à nouveau avec le script de l'étape 1.1.

Committer :
```bash
git add data/teams.json data/fixtures.json data/groups.json data/rankings.json
git commit -m "chore: régénération teams.json avec historique complet depuis 1872"
```

### Étape 1.3 — Vérifier le bug JS dans renderTeam

Ouvrir `app.js` et vérifier la fonction `renderTeam` (autour de la ligne 437).

Le problème probable : l'affichage initial montre `slice(0, sliderPeriod)` (50 matchs récents). Pour voir les matchs depuis 1872, l'utilisateur doit cliquer le bouton "Historique". Vérifier que ce bouton fonctionne.

**Fix si le bouton Historique ne fonctionne pas** : dans `renderTeam`, la fonction `updateMatchList` :
```javascript
// Vérifier que cette section existe et est correcte (ligne ~496) :
if (period === 'all_time') {
  wrap.innerHTML  = buildMatchesTable(team.matches || []);
  if (title) title.textContent = `${t('results_title')} (${(team.matches || []).length})`;
  if (sliderRow) sliderRow.style.display = 'none';
}
```

Si le problème est que les matchs s'affichent mais sans le champ `tournament`, vérifier que `buildMatchesTable` (ligne ~543) référence bien `m.tournament`.

### Test de validation Phase 1

1. `python -m http.server 8080` depuis le projet
2. Naviguer vers une fiche équipe (ex: France)
3. Cliquer le bouton "Historique"
4. Vérifier que des matchs des années 1900, 1930, 1950... apparaissent dans la table
5. Vérifier que la colonne "Compétition" est remplie

### Commit

```bash
git add app.js  # si modifications JS
git commit -m "fix: affichage historique complet (1872) sur les fiches équipes"
git fetch origin main && git merge origin/main --no-edit
git push
```

---

## Phase 2 — Slider par années sur les fiches équipes (renderTeam)

### Objectif

Remplacer l'actuel slider "x derniers matchs" + les 5 boutons de période (`Depuis 2022 / 2025 / 2026 / Qualifs CDM / Historique`) par :
- **Un dual slider d'années** : curseur min (gauche) et curseur max (droite), range 1872–2026
- **Un bouton "Qualifs CDM 2026"** uniquement

### Étape 2.1 — Ajouter les helpers JS dans app.js

Trouver la section `// ── Helpers ──` dans `app.js` (autour de la ligne 278) et ajouter après les helpers existants :

```javascript
function filterMatchesByYears(matches, minYear, maxYear) {
  return matches.filter(m => {
    const y = parseInt(m.date.slice(0, 4), 10);
    return y >= minYear && y <= maxYear;
  });
}

function filterMatchesQualifs(matches) {
  return matches.filter(m =>
    m.tournament && m.tournament.toLowerCase().includes('qualification')
  );
}
```

### Étape 2.2 — Ajouter les entrées i18n

Dans `I18N.fr` (objet à partir de la ligne 8), ajouter dans la section des labels :
```javascript
year_slider_label: (min, max, n) => `De <strong>${min}</strong> à <strong>${max}</strong> — <strong>${n}</strong> match${n > 1 ? 's' : ''}`,
btn_qualifs_cdm: 'Qualifs CDM 2026',
```

Dans `I18N.en`, ajouter :
```javascript
year_slider_label: (min, max, n) => `From <strong>${min}</strong> to <strong>${max}</strong> — <strong>${n}</strong> match${n > 1 ? 'es' : ''}`,
btn_qualifs_cdm: 'WC 2026 Qualifiers',
```

### Étape 2.3 — Ajouter la variable d'état globale

Trouver la section `// ── State ──` (autour de la ligne 213) et ajouter :
```javascript
let teamYearMin = 1872;
let teamYearMax = 2026;
let teamQualifsMode = false;
```

### Étape 2.4 — Modifier renderTeam

Localiser `renderTeam` dans `app.js` (ligne ~437). 

**Remplacer** le bloc `<div class="period-section">` (qui contient `period-btns` et `slider-row`) par :

```javascript
    <div class="period-section">
      <div class="year-slider-wrap">
        <div class="year-slider-label" id="year-label-team">
          ${t('year_slider_label', teamYearMin, teamYearMax, team.matches.length)}
        </div>
        <div class="dual-slider-row">
          <span class="year-edge">1872</span>
          <div class="dual-slider-track">
            <input type="range" class="year-slider year-slider-min" id="year-min-team"
                   min="1872" max="2026" value="${teamYearMin}">
            <input type="range" class="year-slider year-slider-max" id="year-max-team"
                   min="1872" max="2026" value="${teamYearMax}">
          </div>
          <span class="year-edge">2026</span>
        </div>
        <button class="period-btn ${teamQualifsMode ? 'active' : ''}" id="btn-qualifs-team">
          ${t('btn_qualifs_cdm')}
        </button>
      </div>
    </div>
```

**Remplacer** toute la logique d'event listeners à la fin de `renderTeam` (les `querySelectorAll('.period-btn')` et le slider) par :

```javascript
  function applyTeamFilters() {
    const matches = teamQualifsMode
      ? filterMatchesQualifs(team.matches || [])
      : filterMatchesByYears(team.matches || [], teamYearMin, teamYearMax);

    const label = document.getElementById('year-label-team');
    if (label) {
      if (teamQualifsMode) {
        label.innerHTML = `${t('btn_qualifs_cdm')} — <strong>${matches.length}</strong> matchs`;
      } else {
        label.innerHTML = t('year_slider_label', teamYearMin, teamYearMax, matches.length);
      }
    }

    const stats = computeStatsFrom(matches);
    document.getElementById('stats-display').innerHTML = renderStatsGrid(stats);
    const wrap = document.getElementById('matches-table-wrap');
    if (wrap) wrap.innerHTML = buildMatchesTable(matches);
    const title = document.getElementById('matches-title');
    if (title) title.textContent = `${t('results_title')} (${matches.length})`;
  }

  applyTeamFilters();

  const minSlider = app.querySelector('#year-min-team');
  const maxSlider = app.querySelector('#year-max-team');
  const qualifBtn = app.querySelector('#btn-qualifs-team');

  if (minSlider) {
    minSlider.addEventListener('input', () => {
      teamYearMin = parseInt(minSlider.value, 10);
      if (teamYearMin > teamYearMax) { teamYearMax = teamYearMin; maxSlider.value = teamYearMax; }
      teamQualifsMode = false;
      qualifBtn?.classList.remove('active');
      applyTeamFilters();
    });
  }
  if (maxSlider) {
    maxSlider.addEventListener('input', () => {
      teamYearMax = parseInt(maxSlider.value, 10);
      if (teamYearMax < teamYearMin) { teamYearMin = teamYearMax; minSlider.value = teamYearMin; }
      teamQualifsMode = false;
      qualifBtn?.classList.remove('active');
      applyTeamFilters();
    });
  }
  if (qualifBtn) {
    qualifBtn.addEventListener('click', () => {
      teamQualifsMode = !teamQualifsMode;
      qualifBtn.classList.toggle('active', teamQualifsMode);
      applyTeamFilters();
    });
  }
```

**Supprimer** l'ancienne fonction `updateStats` et `updateMatchList` locales si elles sont devenues orphelines.

### Étape 2.5 — CSS pour le dual slider

Dans `style.css`, trouver la section `.slider-row` existante et ajouter/remplacer avec :

```css
.year-slider-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 16px 0;
}
.year-slider-label {
  font-size: .9rem;
  color: var(--muted);
  text-align: center;
}
.year-slider-label strong { color: var(--fg); }

.dual-slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.year-edge {
  font-size: .75rem;
  color: var(--muted);
  white-space: nowrap;
}
.dual-slider-track {
  position: relative;
  flex: 1;
  height: 36px;
  display: flex;
  align-items: center;
}
.year-slider {
  position: absolute;
  width: 100%;
  appearance: none;
  background: transparent;
  pointer-events: none;
}
.year-slider::-webkit-slider-thumb {
  appearance: none;
  pointer-events: all;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid var(--bg);
  box-shadow: 0 0 4px rgba(0,0,0,.4);
}
.year-slider::-webkit-slider-runnable-track {
  height: 4px;
  background: var(--surface2);
  border-radius: 2px;
}
.year-slider-min { z-index: 3; }
.year-slider-max { z-index: 4; }

/* Bouton Qualifs CDM — identique aux .period-btn existants */
/* (les styles .period-btn sont déjà dans style.css) */
```

### Test de validation Phase 2

1. `python -m http.server 8080`
2. Naviguer vers `#/team/france`
3. Vérifier le slider années (1872–2026)
4. Déplacer le curseur min → 1950 : les stats et la table se mettent à jour
5. Déplacer le curseur max → 2000 : fonctionne aussi
6. Cliquer "Qualifs CDM 2026" : seuls les matchs de qualification apparaissent
7. Recliquer : retour en mode slider

### Commit

```bash
git add app.js style.css
git commit -m "feat: slider par années sur les fiches équipes (remplace slider matchs)"
git fetch origin main && git merge origin/main --no-edit
git push
```

---

## Phase 3 — Slider années sur la page équipes + page comparaison

### Objectif

Appliquer le même slider dual-années sur :
- `renderTeams` (page liste des 48 équipes) — remplace l'actuel slider + period buttons
- `renderCompare` (comparaison 2 équipes) — ajouter un slider (aucun slider actuellement)

> Pré-requis : Phase 2 terminée (helpers `filterMatchesByYears` et `filterMatchesQualifs` déjà dans app.js, CSS déjà ajouté).

### Étape 3.1 — Ajouter variables d'état pour renderTeams

Dans la section `// ── State ──` (après les variables ajoutées en Phase 2) :
```javascript
let teamsYearMin = 1872;
let teamsYearMax = 2026;
let teamsQualifsMode = false;
```

### Étape 3.2 — Modifier renderTeams

Localiser `renderTeams` (ligne ~570). 

**Remplacer** le bloc `.teams-controls` (qui contient `.period-btns` + `.slider-row` + le search input) par :

```javascript
    <div class="teams-controls">
      <div class="year-slider-wrap">
        <div class="year-slider-label" id="year-label-teams">
          ${t('year_slider_label', teamsYearMin, teamsYearMax, 0)}
        </div>
        <div class="dual-slider-row">
          <span class="year-edge">1872</span>
          <div class="dual-slider-track">
            <input type="range" class="year-slider year-slider-min" id="year-min-teams"
                   min="1872" max="2026" value="${teamsYearMin}">
            <input type="range" class="year-slider year-slider-max" id="year-max-teams"
                   min="1872" max="2026" value="${teamsYearMax}">
          </div>
          <span class="year-edge">2026</span>
        </div>
        <button class="period-btn ${teamsQualifsMode ? 'active' : ''}" id="btn-qualifs-teams">
          ${t('btn_qualifs_cdm')}
        </button>
      </div>
      <input type="search" id="teams-search" class="teams-search"
             placeholder="${t('search_placeholder')}" value="">
    </div>
```

**Modifier `renderTeamsBody`** (ligne ~672) pour utiliser le filtre années au lieu de `teamsSlider` / `teamsPeriod` :

```javascript
function renderTeamsBody(search = '') {
  const tbody = document.getElementById('teams-tbody');
  if (!tbody) return;

  let teams = Object.values(DATA.teams).map(tm => {
    const filtered = teamsQualifsMode
      ? filterMatchesQualifs(tm.matches || [])
      : filterMatchesByYears(tm.matches || [], teamsYearMin, teamsYearMax);
    const s = computeStatsFrom(filtered) || { GP:0, W:0, D:0, L:0, GF:0, GA:0, GD:0 };
    return { ...tm, s };
  });

  // Mise à jour du label avec le total de matchs de la 1ère équipe (ordre de grandeur)
  const label = document.getElementById('year-label-teams');
  if (label && !teamsQualifsMode) {
    // Compter le total de matchs filtrés sur toutes les équipes
    const totalMatches = teams.reduce((acc, t) => acc + t.s.GP, 0);
    label.innerHTML = t('year_slider_label', teamsYearMin, teamsYearMax, totalMatches);
  }

  if (search) {
    const q = search.toLowerCase();
    teams = teams.filter(tm => tm.name.toLowerCase().includes(q) || tm.group.toLowerCase().includes(q));
  }

  const { col, dir } = teamsSort;
  const mult = dir === 'asc' ? 1 : -1;
  const statKey = { gp:'GP', w:'W', d:'D', l:'L', gf:'GF', ga:'GA', gd:'GD' };

  teams.sort((a, b) => {
    if (col === 'name')  return mult * a.name.localeCompare(b.name);
    if (col === 'group') return mult * a.group.localeCompare(b.group);
    if (col === 'elo')   return mult * (a.elo - b.elo);
    const k = statKey[col];
    return k ? mult * ((a.s[k] ?? 0) - (b.s[k] ?? 0)) : 0;
  });

  tbody.innerHTML = teams.map(tm => {
    const gd = tm.s.GD ?? (tm.s.GF - tm.s.GA);
    const gdStr   = gd > 0 ? `+${gd}` : `${gd}`;
    const gdColor = gd > 0 ? 'color:var(--win)' : gd < 0 ? 'color:var(--loss)' : '';
    return `<tr>
      <td>${flagImg(tm.iso2, tm.name, 'flag-sm')}</td>
      <td><a href="#/team/${encodeURIComponent(tm.slug)}">${dn(tm.name)}</a></td>
      <td style="text-align:center;color:var(--muted)">${tm.group}</td>
      <td style="text-align:center">${tm.s.GP}</td>
      <td style="text-align:center;color:var(--win)">${tm.s.W}</td>
      <td style="text-align:center;color:var(--draw)">${tm.s.D}</td>
      <td style="text-align:center;color:var(--loss)">${tm.s.L}</td>
      <td style="text-align:center">${tm.s.GF}</td>
      <td style="text-align:center">${tm.s.GA}</td>
      <td style="text-align:center;${gdColor}">${gdStr}</td>
      <td style="text-align:right;color:var(--blue);font-weight:700">${tm.elo}</td>
    </tr>`;
  }).join('');
}
```

**Remplacer les event listeners** de `renderTeams` (les `querySelectorAll('.period-btn')` et le slider) par :

```javascript
  renderTeamsBody();

  const minSl = app.querySelector('#year-min-teams');
  const maxSl = app.querySelector('#year-max-teams');
  const qualBtn = app.querySelector('#btn-qualifs-teams');
  const searchInput = app.querySelector('#teams-search');

  function onYearChange() {
    teamsQualifsMode = false;
    qualBtn?.classList.remove('active');
    renderTeamsBody(searchInput?.value || '');
    updateTeamsSortHeaders();
  }

  minSl?.addEventListener('input', () => {
    teamsYearMin = parseInt(minSl.value, 10);
    if (teamsYearMin > teamsYearMax) { teamsYearMax = teamsYearMin; maxSl.value = teamsYearMax; }
    onYearChange();
  });
  maxSl?.addEventListener('input', () => {
    teamsYearMax = parseInt(maxSl.value, 10);
    if (teamsYearMax < teamsYearMin) { teamsYearMin = teamsYearMax; minSl.value = teamsYearMin; }
    onYearChange();
  });
  qualBtn?.addEventListener('click', () => {
    teamsQualifsMode = !teamsQualifsMode;
    qualBtn.classList.toggle('active', teamsQualifsMode);
    const label = document.getElementById('year-label-teams');
    if (label && teamsQualifsMode) label.innerHTML = `${t('btn_qualifs_cdm')}`;
    renderTeamsBody(searchInput?.value || '');
    updateTeamsSortHeaders();
  });
  searchInput?.addEventListener('input', e => renderTeamsBody(e.target.value));

  app.querySelectorAll('.sort-th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      teamsSort = {
        col,
        dir: teamsSort.col === col
          ? (teamsSort.dir === 'asc' ? 'desc' : 'asc')
          : (col === 'name' || col === 'group' ? 'asc' : 'desc'),
      };
      updateTeamsSortHeaders();
      renderTeamsBody(searchInput?.value || '');
    });
  });
```

**Supprimer** les variables d'état devenues inutiles : `teamsSlider`, `teamsPeriod` (si elles ne sont plus utilisées ailleurs).

### Étape 3.3 — Modifier renderCompare

Localiser `renderCompare` (ligne ~730).

**Ajouter les variables d'état** dans la section `// ── State ──` :
```javascript
let cmpYearMin = 1872;
let cmpYearMax = 2026;
let cmpQualifsMode = false;
```

Dans `renderCompare`, **remplacer** la fonction `buildContent` et le bloc `<div class="period-section">` :

**Remplacer** le bloc `.period-section` (avec `#cmp-period-btns`) par :
```javascript
    <div class="period-section">
      <div class="year-slider-wrap">
        <div class="year-slider-label" id="year-label-cmp">
          ${t('year_slider_label', cmpYearMin, cmpYearMax, 0)}
        </div>
        <div class="dual-slider-row">
          <span class="year-edge">1872</span>
          <div class="dual-slider-track">
            <input type="range" class="year-slider year-slider-min" id="year-min-cmp"
                   min="1872" max="2026" value="${cmpYearMin}">
            <input type="range" class="year-slider year-slider-max" id="year-max-cmp"
                   min="1872" max="2026" value="${cmpYearMax}">
          </div>
          <span class="year-edge">2026</span>
        </div>
        <button class="period-btn ${cmpQualifsMode ? 'active' : ''}" id="btn-qualifs-cmp">
          ${t('btn_qualifs_cdm')}
        </button>
      </div>
    </div>
```

**Modifier `buildContent`** pour accepter des matchs filtrés directement :
```javascript
  function buildContent(matches1, matches2) {
    const s1 = computeStatsFrom(matches1) || {};
    const s2 = computeStatsFrom(matches2) || {};
    // ... reste identique, mais s1/s2 viennent de computeStatsFrom au lieu de getTeamStats
    // SUPPRIMER la ligne `const s1 = getTeamStats(t1, period) || ...`
    // SUPPRIMER la ligne `const s2 = getTeamStats(t2, period) || ...`
```

**Remplacer les event listeners** (les `querySelectorAll('#cmp-period-btns .period-btn')`) par :

```javascript
  function applyCmpFilters() {
    const m1 = cmpQualifsMode
      ? filterMatchesQualifs(t1.matches || [])
      : filterMatchesByYears(t1.matches || [], cmpYearMin, cmpYearMax);
    const m2 = cmpQualifsMode
      ? filterMatchesQualifs(t2.matches || [])
      : filterMatchesByYears(t2.matches || [], cmpYearMin, cmpYearMax);

    const label = document.getElementById('year-label-cmp');
    if (label) {
      if (cmpQualifsMode) {
        label.innerHTML = `${t('btn_qualifs_cdm')} — ${m1.length} / ${m2.length} matchs`;
      } else {
        label.innerHTML = t('year_slider_label', cmpYearMin, cmpYearMax, m1.length + m2.length);
      }
    }
    document.getElementById('compare-content').innerHTML = buildContent(m1, m2);
  }

  applyCmpFilters();

  const minSlCmp = app.querySelector('#year-min-cmp');
  const maxSlCmp = app.querySelector('#year-max-cmp');
  const qualBtnCmp = app.querySelector('#btn-qualifs-cmp');

  minSlCmp?.addEventListener('input', () => {
    cmpYearMin = parseInt(minSlCmp.value, 10);
    if (cmpYearMin > cmpYearMax) { cmpYearMax = cmpYearMin; maxSlCmp.value = cmpYearMax; }
    cmpQualifsMode = false;
    qualBtnCmp?.classList.remove('active');
    applyCmpFilters();
  });
  maxSlCmp?.addEventListener('input', () => {
    cmpYearMax = parseInt(maxSlCmp.value, 10);
    if (cmpYearMax < cmpYearMin) { cmpYearMin = cmpYearMax; minSlCmp.value = cmpYearMin; }
    cmpQualifsMode = false;
    qualBtnCmp?.classList.remove('active');
    applyCmpFilters();
  });
  qualBtnCmp?.addEventListener('click', () => {
    cmpQualifsMode = !cmpQualifsMode;
    qualBtnCmp.classList.toggle('active', cmpQualifsMode);
    applyCmpFilters();
  });
```

**Important** : dans `buildContent`, le H2H (`h2h`) doit rester calculé sur **l'ensemble de l'historique** (pas filtré par années). Garder la ligne :
```javascript
const h2h = (t1.matches || []).filter(m => slugify(m.opponent) === slug2);
```
sans filtre d'années — le H2H affiche toutes les confrontations directes depuis 1872.

### Étape 3.4 — Nettoyage

Supprimer les variables d'état devenues inutiles :
- `let sliderPeriod = 50;` → peut rester pour compatibilité ou supprimer
- `let teamsSlider = null;` → supprimer
- `let teamsPeriod = 'all';` → supprimer

Vérifier qu'aucune autre vue n'utilise ces variables.

### Test de validation Phase 3

1. Page équipes (`#/teams`) : dual slider années, stats se mettent à jour pour les 48 équipes, bouton Qualifs CDM fonctionne
2. Page comparaison (`#/compare/france/brazil`) : dual slider années, stats comparatives se mettent à jour, H2H affiche toujours tous les matchs directs depuis 1872

### Commit

```bash
git add app.js
git commit -m "feat: slider par années sur page équipes et page comparaison"
git fetch origin main && git merge origin/main --no-edit
git push
```

---

## Phase 4 — Bar Chart Race Elo depuis 1872

### Objectif

Générer l'animation de l'évolution Elo des 48 équipes WC depuis 1872, et l'intégrer dans la page "Classement Elo" du site.

### Étape 4.1 — Installer les dépendances Python

```bash
cd /home/pargass/projects/pronostics_wc2026

# Dans WSL2 :
pip install bar_chart_race pandas matplotlib Pillow

# Vérifier ffmpeg (pour MP4) :
which ffmpeg
# Si absent : sudo apt install ffmpeg
```

### Étape 4.2 — Modifier generate_elo_race.py

Ouvrir `generate_elo_race.py`. À la ligne ~75, la date de départ est `"1930-01-01"`.

**Changer** cette ligne :
```python
# Avant :
if r["date"] >= "1930-01-01"

# Après :
if r["date"] >= "1872-01-01"
```

Chercher aussi la variable `START_YEAR` ou équivalente si elle existe (peut ne pas exister, dans ce cas seule la ligne ci-dessus suffit).

**Ajustement des snapshots** : avec des données depuis 1872, des snapshots mensuels produiront ~1800 frames (trop lourd). Utiliser des snapshots **annuels** au lieu de mensuels.

Localiser dans `generate_elo_race.py` la boucle qui génère les snapshots (probablement autour de la ligne 80-130). Si elle est mensuelle (format `YYYY-MM`), passer en annuel (format `YYYY`).

Exemple de modification si le code ressemble à :
```python
# Snapshot mensuel (à remplacer) :
months = pd.date_range('1930-01', '2026-05', freq='MS')

# Snapshot annuel (depuis 1872) :
years = pd.date_range('1872-01', '2026-01', freq='YS')
```

### Étape 4.3 — Générer l'animation

```bash
cd /home/pargass/projects/pronostics_wc2026
python generate_elo_race.py
```

Le fichier sera généré dans `data/elo_race.mp4` (ou `data/elo_race.gif`).

Vérifier la taille :
```bash
ls -lh data/elo_race.*
```

Si > 50 MB → trop lourd pour GitHub Pages. Options :
- Réduire la durée totale de la vidéo (paramètre `duration` dans `bcr.bar_chart_race`)
- Passer en GIF à résolution réduite
- Héberger sur un service externe (voir note ci-dessous)

**Note** : GitHub Pages supporte les fichiers jusqu'à 100 MB par fichier, mais les gros fichiers ralentissent le chargement. Viser < 20 MB.

### Étape 4.4 — Intégrer dans la page classement Elo

Dans `app.js`, localiser `renderRankings` (autour de la ligne 860).

Après le bloc `app.innerHTML = ...` (qui contient la table et l'explainer Elo), ajouter une section animation **avant** le `</div>` final :

```javascript
  // À ajouter dans le template HTML de renderRankings, après la table :
  <div class="race-section">
    <h2 style="margin-top:48px;margin-bottom:8px">
      ${LANG === 'fr' ? 'Évolution historique du classement Elo (1872–2026)' : 'Historical Elo ranking evolution (1872–2026)'}
    </h2>
    <p style="color:var(--muted);font-size:.9rem;margin-bottom:16px">
      ${LANG === 'fr'
        ? 'Animation Bar Chart Race — scores Elo annuels des 48 équipes qualifiées pour la Coupe du Monde 2026.'
        : 'Bar Chart Race animation — annual Elo scores for the 48 WC 2026 qualified teams.'}
    </p>
    <video class="elo-race-video" autoplay loop muted playsinline
           src="./data/elo_race.mp4"
           onerror="this.closest('.race-section').innerHTML += '<p style=color:var(--muted)>Vidéo non disponible — lancer <code>python generate_elo_race.py</code></p>';this.remove()">
    </video>
  </div>
```

Dans `style.css`, ajouter :
```css
.race-section { margin-top: 32px; }
.elo-race-video {
  width: 100%;
  max-width: 900px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
```

### Test de validation Phase 4

1. `python -m http.server 8080`
2. Naviguer vers `#/rankings`
3. Faire défiler vers le bas
4. La vidéo/animation doit se lancer automatiquement en boucle
5. Si la vidéo ne se charge pas, vérifier que `data/elo_race.mp4` existe

### Commit

```bash
git add generate_elo_race.py app.js style.css
# Ajouter la vidéo si taille raisonnable (< 50 MB) :
git add data/elo_race.mp4  # ou data/elo_race.gif
git commit -m "feat: bar chart race Elo depuis 1872 intégré dans la page classement"
git fetch origin main && git merge origin/main --no-edit
git push
```

**Note si la vidéo est trop lourde pour le push** : utiliser Git LFS ou héberger ailleurs (YouTube, Vimeo, Cloudflare R2) et remplacer le `<video>` par un `<iframe>` ou lien.

---

## Phase 5 — Améliorations diverses

### 5.1 — Compléter TEAM_FR_NAMES (11 équipes manquantes)

Dans `app.js`, localiser `const TEAM_FR_NAMES = {` (ligne ~169).

Ajouter les équipes manquantes :
```javascript
// À ajouter dans TEAM_FR_NAMES :
'Curaçao':                'Curaçao',        // déjà correct, juste vérifier
'Palestine':              'Palestine',       // identique FR/EN
'Trinidad and Tobago':    'Trinité-et-Tobago',
'Republic of Ireland':    'Irlande',
'Ivory Coast':            "Côte d'Ivoire",  // peut déjà être là
'Qatar':                  'Qatar',
'Panama':                 'Panama',
'Paraguay':               'Paraguay',
'Uruguay':                'Uruguay',
'Ghana':                  'Ghana',
'Nigeria':                'Nigéria',
```

Vérifier quelles équipes affichent encore leur nom anglais en mode FR en naviguant `#/teams` et en cherchant les équipes suspectes.

### 5.2 — H2H : ajouter compteur résumé W/D/L

Dans `renderCompare`, dans `buildContent`, localiser le bloc H2H et ajouter un résumé avant la table :

```javascript
// Avant la table H2H, calculer le résumé :
const h2hW = h2h.filter(m => m.result === 'W').length;  // victoires de t1
const h2hD = h2h.filter(m => m.result === 'D').length;
const h2hL = h2h.filter(m => m.result === 'L').length;  // défaites de t1

// Ajouter dans le HTML :
<div class="h2h-summary">
  <span class="h2h-score win">${h2hW}</span>
  <span class="h2h-sep">${dn(t1.name)}</span>
  <span class="h2h-score draw">${h2hD}</span>
  <span class="h2h-sep">Nuls</span>
  <span class="h2h-score loss">${h2hL}</span>
  <span class="h2h-sep">${dn(t2.name)}</span>
</div>
```

CSS :
```css
.h2h-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface2);
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: .95rem;
}
.h2h-score {
  font-size: 1.4rem;
  font-weight: 700;
}
.h2h-score.win  { color: var(--win); }
.h2h-score.draw { color: var(--draw); }
.h2h-score.loss { color: var(--loss); }
.h2h-sep { color: var(--muted); font-size: .8rem; }
```

### 5.3 — Performances : lazy load teams.json

Actuellement `teams.json` (4,6 MB) est chargé au démarrage pour toutes les pages. Optimisation : le charger uniquement quand on accède à une route équipe.

Dans `init()`, remplacer le chargement systématique de `teams.json` par un chargement différé :

```javascript
async function init() {
  try {
    const [fixtures, groups, rankings] = await Promise.all([
      fetch('./data/fixtures.json').then(r => r.json()),
      fetch('./data/groups.json').then(r => r.json()),
      fetch('./data/rankings.json').then(r => r.json()),
    ]);
    DATA = { fixtures, teams: null, groups, rankings };
    // teams.json est null — chargé à la demande
    initLang();
    window.addEventListener('hashchange', route);
    route();
  } catch (e) {
    document.getElementById('app').innerHTML =
      `<div class="splash"><p>${t('load_error')}</p></div>`;
  }
}

async function ensureTeams() {
  if (DATA.teams) return;
  DATA.teams = await fetch('./data/teams.json').then(r => r.json());
}
```

Puis dans `renderTeam`, `renderTeams`, `renderCompare` : appeler `await ensureTeams()` en début de fonction (les rendre `async`).

**Note** : ce changement est optionnel et un peu plus complexe à mettre en place. Ne le faire que si les performances sur mobile sont vraiment perçues comme lentes.

### 5.4 — Fix mobile : onglet "Données" inaccessible

Sur mobile, l'onglet "Données" (`#/data`) n'est pas accessible dans la nav. Probable débordement horizontal de la barre de navigation sur petits écrans.

**Diagnostic** : inspecter `.nav` dans `style.css` — si `overflow: hidden` ou `white-space: nowrap` sans scroll, les liens en bout de liste sont masqués.

**Fix suggéré** : autoriser le scroll horizontal sur la nav mobile, ou passer à un menu hamburger, ou utiliser `flex-wrap: wrap` :
```css
/* Option 1 — scroll horizontal (minimal) */
nav .nav-links {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
nav .nav-links::-webkit-scrollbar { display: none; }

/* Option 2 — retour à la ligne */
nav .nav-links {
  flex-wrap: wrap;
}
```

### 5.5 — Fix mobile : toggle FR/EN inaccessible

Le bouton de bascule langue FR/EN n'est pas accessible sur mobile (probablement masqué hors écran ou trop petit).

**Diagnostic** : vérifier `.lang-btn` et son conteneur dans `style.css` — position absolue ou fixed peut causer un débordement sur petits écrans.

**Fix suggéré** : s'assurer que le toggle est dans le flux de la page ou accessible via scroll, et que la taille de clic est ≥ 44×44px (recommandation mobile) :
```css
.lang-switcher {
  /* s'assurer qu'il est visible sur mobile */
  flex-shrink: 0;
}
.lang-btn {
  min-width: 44px; min-height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
}
```

### 5.5 — Fix mobile : toggle FR/EN inaccessible
 le champ competition est en anglais quand on est en mode FR, exemple friendly au lieu d'amical. Il faut bien verifier qu'aucun terme anglais sont affiché dans le mode FR


### Commit Phase 5

```bash
git add app.js style.css
git commit -m "feat: traductions FR complètes, H2H résumé W/D/L, fix nav mobile"
git fetch origin main && git merge origin/main --no-edit
git push
```

---

## Checklist globale

| Phase | Tâche | Fichiers modifiés | Statut |
|-------|-------|-------------------|--------|
| 1 | Fix matchs depuis 1872 (fiches équipes) | `app.js`, `data/teams.json` | ✅ |
| 2 | Slider années — fiche équipe | `app.js`, `style.css` | ⬜ |
| 3 | Slider années — page équipes + comparaison | `app.js` | ⬜ |
| 4 | Bar Chart Race Elo depuis 1872 | `generate_elo_race.py`, `app.js`, `style.css`, `data/elo_race.gif` | ✅ |
| 5 | Améliorations diverses (+ fix nav mobile + fix toggle FR/EN mobile) | `app.js`, `style.css` | ⬜ |

---

## Notes importantes pour chaque session

1. **Toujours commencer par** `git status` pour voir l'état actuel
2. **Lire les fichiers avant de les modifier** — `app.js` évolue, les numéros de lignes changent entre sessions
3. **Tester localement avant de push** : `python -m http.server 8080` puis ouvrir `http://localhost:8080`
4. **Le push** : toujours `git fetch origin main && git merge origin/main --no-edit` avant `git push`
5. **Générer les JSON** si besoin : `python generate_web_data.py` — puis committer les 4 JSON dans `data/`
