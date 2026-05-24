/* =====================================================================
   WC 2026 — Données  |  app.js
   Routing: #/ | #/team/{slug} | #/teams | #/compare/{s1}/{s2}
          | #/rankings | #/fifa-ranking | #/data
===================================================================== */

// ── i18n ─────────────────────────────────────────────────────────────
const I18N = {
  fr: {
    nav_fixtures: 'Matchs',        nav_teams: 'Équipes',
    nav_fifa: 'Classement FIFA',   nav_elo: 'Classement Elo',
    nav_data: 'Données',
    back_matches: '← Retour aux matchs',
    back: '← Retour',
    group: 'Groupe',
    no_data_period: 'Aucune donnée pour cette période',
    no_results: 'Aucun résultat disponible',
    team_not_found: (s) => `Équipe introuvable : <strong>${s}</strong>`,
    team_not_found_short: 'Équipe introuvable',
    period_all: 'Depuis 2022',
    period_all_time: 'Historique',
    period_qualifs: 'Qualifs CDM',
    period_title: "Période d'analyse",
    slider_label: (n) => `Derniers <strong>${n}</strong> matchs`,
    stat_mp: 'Matchs',
    stat_w: 'Victoires',
    stat_d: 'Nuls',
    stat_l: 'Défaites',
    stat_avg_gf: 'Buts/match marqués',
    stat_avg_ga: 'Buts/match encaissés',
    form_title: 'Forme récente (10 derniers)',
    results_title: 'Résultats récents',
    home_tag: 'DOM',
    th_date: 'Date',
    th_opp: 'Adversaire',
    th_score: 'Score',
    th_comp: 'Compétition',
    fixtures_h1: 'Coupe du Monde 2026',
    fixtures_sub: 'Canada · États-Unis · Mexique  |  Juin – Juillet 2026  |  48 équipes · 12 groupes',
    fixtures_hint: '💡 Cliquez sur une équipe pour sa fiche détaillée · Cliquez sur un match pour comparer les deux équipes',
    teams_h1: 'Les 48 équipes',
    teams_sub: 'Cliquez sur une équipe pour sa fiche · Cliquez sur un en-tête de colonne pour trier',
    search_placeholder: 'Rechercher une équipe…',
    col_team: 'Équipe',  col_grp: 'Grp',
    col_gp: 'MJ', col_w2: 'V',  col_d2: 'N',  col_l2: 'D',
    col_gf: 'Buts+', col_ga: 'Buts−', col_gd: 'Diff', col_elo: 'Elo',
    cmp_row_gp: 'Matchs joués',     cmp_row_w: 'Victoires',
    cmp_row_d: 'Nuls',              cmp_row_l: 'Défaites',
    cmp_row_gf: 'Buts marqués',     cmp_row_ga: 'Buts encaissés',
    cmp_row_gd: 'Différence buts',  cmp_row_elo: 'Score Elo',
    cmp_stat_col: 'Statistique',
    h2h_title: (n) => `Confrontations directes — ${n} match${n !== 1 ? 's' : ''}`,
    no_h2h: 'Aucune confrontation directe trouvée',
    form_of: (name) => `Forme récente — ${name}`,
    elo_h1: 'Classement Elo — 48 équipes',
    elo_sub: 'Score de forme calculé sur l\'historique complet des matchs internationaux (depuis 1872)',
    elo_info: "L'Elo est un indicateur de niveau calculé sur l'ensemble de l'histoire du football international (depuis 1872). Il intègre WC 2022, Euro 2024, Copa América 2024, qualifications, matchs amicaux et bien plus. Il reflète la valeur globale des équipes, pas uniquement leur forme récente.",
    th_team: 'Équipe',    th_group: 'Groupe',  th_elo_score: 'Score Elo',
    fifa_h1: 'Classement FIFA Masculin',
    fifa_sub: (count, date, source) => `${count} sélections · Mise à jour : ${date} · Source : ${source}`,
    fifa_loading: 'Chargement classement FIFA…',
    fifa_no_data: 'Données non disponibles.<br>Lancez <code>python fetch_fifa_ranking.py</code> pour les générer.',
    th_confederation: 'Confédération',  th_fifa_pts: 'Points FIFA',
    data_h1: 'Données',
    data_sub: 'Tous les fichiers sont au format ouvert (JSON / CSV) — libres de réutilisation.',
    dl_btn: 'Télécharger',
    sources_h3: 'Sources détaillées',
    load_error: '⚠️ Impossible de charger les données.<br>Vérifiez que le serveur local tourne et que les JSON sont présents.',
    footer_uefa_title: 'Clubs français en Europe',
    footer_uefa_desc: 'Champions League, Europa, C4 — tous les résultats et classements UEFA des clubs français',
    footer_gh_title: 'Code source',
  },
  en: {
    nav_fixtures: 'Matches',       nav_teams: 'Teams',
    nav_fifa: 'FIFA Ranking',      nav_elo: 'Elo Ranking',
    nav_data: 'Data',
    back_matches: '← Back to matches',
    back: '← Back',
    group: 'Group',
    no_data_period: 'No data for this period',
    no_results: 'No results available',
    team_not_found: (s) => `Team not found: <strong>${s}</strong>`,
    team_not_found_short: 'Team not found',
    period_all: 'Since 2022',
    period_all_time: 'All time',
    period_qualifs: 'WC Qualifiers',
    period_title: 'Analysis period',
    slider_label: (n) => `Last <strong>${n}</strong> matches`,
    stat_mp: 'Matches',
    stat_w: 'Wins',
    stat_d: 'Draws',
    stat_l: 'Losses',
    stat_avg_gf: 'Goals scored/game',
    stat_avg_ga: 'Goals conceded/game',
    form_title: 'Recent form (last 10)',
    results_title: 'Recent results',
    home_tag: 'HOME',
    th_date: 'Date',
    th_opp: 'Opponent',
    th_score: 'Score',
    th_comp: 'Competition',
    fixtures_h1: 'World Cup 2026',
    fixtures_sub: 'Canada · United States · Mexico  |  June – July 2026  |  48 teams · 12 groups',
    fixtures_hint: '💡 Click on a team for its profile · Click on a match to compare both teams',
    teams_h1: 'The 48 teams',
    teams_sub: 'Click on a team for its profile · Click on a column header to sort',
    search_placeholder: 'Search a team…',
    col_team: 'Team',  col_grp: 'Grp',
    col_gp: 'MP', col_w2: 'W',  col_d2: 'D',  col_l2: 'L',
    col_gf: 'GF', col_ga: 'GA', col_gd: 'GD', col_elo: 'Elo',
    cmp_row_gp: 'Matches played',    cmp_row_w: 'Wins',
    cmp_row_d: 'Draws',              cmp_row_l: 'Losses',
    cmp_row_gf: 'Goals scored',      cmp_row_ga: 'Goals conceded',
    cmp_row_gd: 'Goal difference',   cmp_row_elo: 'Elo score',
    cmp_stat_col: 'Stat',
    h2h_title: (n) => `Head-to-head — ${n} match${n !== 1 ? 'es' : ''}`,
    no_h2h: 'No head-to-head matches found',
    form_of: (name) => `Recent form — ${name}`,
    elo_h1: 'Elo Ranking — 48 teams',
    elo_sub: 'Form score calculated from the complete history of international football (since 1872)',
    elo_info: 'Elo is a performance indicator calculated from the entire history of international football (since 1872). It includes WC 2022, Euro 2024, Copa América 2024, qualifications, friendlies, and much more. It reflects the overall level of teams, not just recent form.',
    th_team: 'Team',    th_group: 'Group',  th_elo_score: 'Elo Score',
    fifa_h1: "Men's FIFA Ranking",
    fifa_sub: (count, date, source) => `${count} national teams · Updated: ${date} · Source: ${source}`,
    fifa_loading: 'Loading FIFA ranking…',
    fifa_no_data: 'Data unavailable.<br>Run <code>python fetch_fifa_ranking.py</code> to generate it.',
    th_confederation: 'Confederation',  th_fifa_pts: 'FIFA Points',
    data_h1: 'Data',
    data_sub: 'All files are in open format (JSON / CSV) — free to reuse.',
    dl_btn: 'Download',
    sources_h3: 'Detailed sources',
    load_error: '⚠️ Unable to load data.<br>Make sure the local server is running and JSON files are present.',
    footer_uefa_title: 'French clubs in Europe',
    footer_uefa_desc: 'Champions League, Europa, C4 — all results and UEFA standings for French clubs',
    footer_gh_title: 'Source code',
  },
};

let LANG = localStorage.getItem('wc2026_lang') || 'fr';

function t(key, ...args) {
  const val = (I18N[LANG] || I18N.fr)[key] ?? I18N.fr[key] ?? key;
  return typeof val === 'function' ? val(...args) : val;
}

function setLang(lang) {
  LANG = lang;
  localStorage.setItem('wc2026_lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  route();
}

function initLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === LANG);
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}

// ── Team name translations (EN → FR) ─────────────────────────────────
const TEAM_FR_NAMES = {
  'Algeria':                'Algérie',
  'Argentina':              'Argentine',
  'Australia':              'Australie',
  'Austria':                'Autriche',
  'Belgium':                'Belgique',
  'Bosnia and Herzegovina': 'Bosnie-Herzégovine',
  'Brazil':                 'Brésil',
  'Cape Verde':             'Cap-Vert',
  'Colombia':               'Colombie',
  'Croatia':                'Croatie',
  'Czech Republic':         'République tchèque',
  'DR Congo':               'RD Congo',
  'Ecuador':                'Équateur',
  'Egypt':                  'Égypte',
  'England':                'Angleterre',
  'Germany':                'Allemagne',
  'Haiti':                  'Haïti',
  'Iraq':                   'Irak',
  'Ivory Coast':            "Côte d'Ivoire",
  'Japan':                  'Japon',
  'Jordan':                 'Jordanie',
  'Mexico':                 'Mexique',
  'Morocco':                'Maroc',
  'Netherlands':            'Pays-Bas',
  'New Zealand':            'Nouvelle-Zélande',
  'Norway':                 'Norvège',
  'Saudi Arabia':           'Arabie saoudite',
  'Scotland':               'Écosse',
  'Senegal':                'Sénégal',
  'South Africa':           'Afrique du Sud',
  'South Korea':            'Corée du Sud',
  'Spain':                  'Espagne',
  'Sweden':                 'Suède',
  'Switzerland':            'Suisse',
  'Tunisia':                'Tunisie',
  'United States':          'États-Unis',
  'Uzbekistan':             'Ouzbékistan',
};

function dn(name) {
  return LANG === 'fr' ? (TEAM_FR_NAMES[name] || name) : name;
}

// ── State ────────────────────────────────────────────────────────────
let DATA = null;
let currentSlug = null;
let sliderPeriod = 15;
let teamsSort = { col: 'elo', dir: 'desc' };
let teamsPeriod = 'all';
let teamsSlider = null;

// ── Init ─────────────────────────────────────────────────────────────
async function init() {
  try {
    const [fixtures, teams, groups, rankings] = await Promise.all([
      fetch('./data/fixtures.json').then(r => r.json()),
      fetch('./data/teams.json').then(r => r.json()),
      fetch('./data/groups.json').then(r => r.json()),
      fetch('./data/rankings.json').then(r => r.json()),
    ]);
    DATA = { fixtures, teams, groups, rankings };
    initLang();
    window.addEventListener('hashchange', route);
    route();
  } catch (e) {
    document.getElementById('app').innerHTML =
      `<div class="splash"><p>${t('load_error')}</p></div>`;
    console.error(e);
  }
}

// ── Router ───────────────────────────────────────────────────────────
function route() {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const hash = location.hash.slice(1) || '/';
  setActiveNav(hash);

  if (hash.startsWith('/team/')) {
    renderTeam(decodeURIComponent(hash.slice(6)));
  } else if (hash.startsWith('/compare/')) {
    const parts = hash.slice(9).split('/');
    renderCompare(decodeURIComponent(parts[0] || ''), decodeURIComponent(parts[1] || ''));
  } else if (hash === '/teams') {
    renderTeams();
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

function setActiveNav(hash) {
  document.querySelectorAll('.nav-link').forEach(a => {
    const p = a.dataset.page;
    a.classList.toggle('active',
      ((hash === '/' || hash.startsWith('/team/') || hash.startsWith('/compare/')) && p === 'fixtures') ||
      (hash === '/teams'        && p === 'teams') ||
      (hash === '/rankings'     && p === 'rankings') ||
      (hash === '/fifa-ranking' && p === 'fifa-ranking') ||
      (hash === '/data'         && p === 'data')
    );
  });
}

// ── Helpers ──────────────────────────────────────────────────────────
const FLAG_BASE = 'https://flagcdn.com/w40/';

function flagImg(iso2, name, cls = 'flag-sm') {
  if (!iso2) return `<span class="${cls}" style="display:inline-block;background:var(--surface2);border-radius:2px;"></span>`;
  return `<img class="${cls}" src="${FLAG_BASE}${iso2}.png" alt="${name}" loading="lazy"
         onerror="this.style.visibility='hidden'">`;
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const locale = LANG === 'fr' ? 'fr-FR' : 'en-GB';
  return dt.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function resultBadge(r) {
  return `<span class="form-badge ${r}">${r}</span>`;
}

function getPeriods() {
  return [
    { key: 'all',      label: t('period_all') },
    { key: '2025',     label: '2025' },
    { key: '2026',     label: '2026' },
    { key: 'qualifs',  label: t('period_qualifs') },
    { key: 'all_time', label: t('period_all_time') },
  ];
}

function computeStatsFrom(matches) {
  let gp = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;
  for (const m of matches) {
    gp++; gf += m.scored; ga += m.conceded;
    if (m.result === 'W') w++;
    else if (m.result === 'D') d++;
    else l++;
  }
  if (gp === 0) return null;
  return {
    GP: gp, W: w, D: d, L: l, GF: gf, GA: ga, GD: gf - ga,
    avg_gf: (gf / gp).toFixed(2),
    avg_ga: (ga / gp).toFixed(2),
    win_pct: ((w / gp) * 100).toFixed(1),
  };
}

function getTeamStats(team, period) {
  if (period === 'all')    return team.stats?.all      || null;
  if (period === '2025')   return team.stats?.['2025'] || null;
  if (period === '2026')   return team.stats?.['2026'] || null;
  if (period === 'qualifs') return team.stats?.qualifs || null;
  return null;
}

function renderStatsGrid(s) {
  if (!s) return `<div class="no-data">${t('no_data_period')}</div>`;
  const gp = s.GP;
  const wBar = gp ? ((s.W / gp) * 100) : 0;
  const dBar = gp ? ((s.D / gp) * 100) : 0;
  const lBar = gp ? ((s.L / gp) * 100) : 0;

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${gp}</div>
        <div class="stat-label">${t('stat_mp')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value win">${s.W}</div>
        <div class="stat-label">${t('stat_w')}</div>
        <div class="wdl-bar">
          <div class="w" style="width:${wBar}%"></div>
          <div class="d" style="width:${dBar}%"></div>
          <div class="l" style="width:${lBar}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-value draw">${s.D}</div>
        <div class="stat-label">${t('stat_d')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value loss">${s.L}</div>
        <div class="stat-label">${t('stat_l')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--win)">${s.avg_gf}</div>
        <div class="stat-label">${t('stat_avg_gf')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--loss)">${s.avg_ga}</div>
        <div class="stat-label">${t('stat_avg_ga')}</div>
      </div>
    </div>`;
}

// ── VIEW: Fixtures ────────────────────────────────────────────────────
function renderFixtures() {
  const app = document.getElementById('app');

  const byGroup = {};
  for (const f of DATA.fixtures) {
    if (!byGroup[f.group]) byGroup[f.group] = [];
    byGroup[f.group].push(f);
  }

  let groupsHtml = '';
  for (const letter of Object.keys(DATA.groups).sort()) {
    const teams   = DATA.groups[letter];
    const matches = (byGroup[letter] || []).sort((a, b) => a.date.localeCompare(b.date));

    const teamsHtml = teams.map(t => `
      <div class="group-team-row">
        <a href="#/team/${encodeURIComponent(t.slug)}">
          ${flagImg(t.iso2, t.name, 'flag-sm')}
          <span class="team-name">${dn(t.name)}</span>
          <span class="elo-badge" title="Score Elo — calculé depuis 1872">Elo ${t.elo}</span>
        </a>
      </div>`).join('');

    const matchesHtml = matches.map(m => {
      const s1 = encodeURIComponent(slugify(m.home));
      const s2 = encodeURIComponent(slugify(m.away));
      return `
        <div class="match-card match-card-link" onclick="location.hash='#/compare/${s1}/${s2}'">
          <div class="match-date">${formatDate(m.date)}${m.city ? ' · ' + m.city : ''}</div>
          <div class="match-teams">
            <div class="match-team home">
              <span>${dn(m.home)}</span>
              ${flagImg(m.home_iso2, m.home, 'flag-sm')}
            </div>
            <div class="match-vs">vs</div>
            <div class="match-team away">
              ${flagImg(m.away_iso2, m.away, 'flag-sm')}
              <span>${dn(m.away)}</span>
            </div>
          </div>
        </div>`;
    }).join('<hr style="border:none;border-top:1px solid var(--border);margin:4px 0">');

    groupsHtml += `
      <div class="group-card">
        <div class="group-card-header">${t('group')} ${letter}</div>
        <div class="group-teams">${teamsHtml}</div>
        <div class="group-matches">${matchesHtml}</div>
      </div>`;
  }

  app.innerHTML = `
    <div class="page-header">
      <h1>${t('fixtures_h1')}</h1>
      <p>${t('fixtures_sub')}</p>
      <p class="hint-text">${t('fixtures_hint')}</p>
    </div>
    <div class="groups-grid">${groupsHtml}</div>`;
}

// ── VIEW: Team ────────────────────────────────────────────────────────
function renderTeam(slug) {
  const app  = document.getElementById('app');
  const team = DATA.teams[slug];

  if (!team) {
    app.innerHTML = `<a href="#/" class="back-btn">${t('back')}</a>
      <div class="no-data">${t('team_not_found', slug)}</div>`;
    return;
  }

  currentSlug = slug;
  const PERIODS = getPeriods();

  app.innerHTML = `
    <a href="#/" class="back-btn">${t('back_matches')}</a>

    <div class="team-header">
      ${flagImg(team.iso2, team.name, 'team-flag-lg')}
      <div class="team-title">
        <h1>${dn(team.name)}</h1>
        <div class="team-meta">
          <span class="badge badge-group">${t('group')} ${team.group}</span>
          <span class="badge badge-elo">Elo ${team.elo}</span>
        </div>
      </div>
    </div>

    <div class="period-section">
      <h3>${t('period_title')}</h3>
      <div class="period-btns">
        ${PERIODS.map(p => `
          <button class="period-btn${p.key === 'all' ? ' active' : ''}" data-period="${p.key}">${p.label}</button>
        `).join('')}
      </div>
      <div class="slider-row" id="match-slider-row">
        <label>${t('slider_label', sliderPeriod)}</label>
        <input type="range" id="period-slider" min="5" max="${team.matches.length || 50}"
               value="${Math.min(sliderPeriod, team.matches.length || 50)}">
      </div>
    </div>

    <div id="stats-display"></div>

    <div class="form-section">
      <h3>${t('form_title')}</h3>
      <div class="form-badges">
        ${(team.matches || []).slice(0, 10).map(m => resultBadge(m.result)).join('')}
      </div>
    </div>

    <div class="matches-section">
      <h3 id="matches-title">${t('results_title')}</h3>
      <div class="table-wrap" id="matches-table-wrap">
        ${buildMatchesTable((team.matches || []).slice(0, sliderPeriod))}
      </div>
    </div>`;

  updateStats(team, 'all');

  function updateMatchList(period) {
    const wrap  = document.getElementById('matches-table-wrap');
    const title = document.getElementById('matches-title');
    const sliderRow = document.getElementById('match-slider-row');
    if (!wrap) return;
    if (period === 'all_time') {
      wrap.innerHTML  = buildMatchesTable(team.matches || []);
      if (title) title.textContent = `${t('results_title')} (${(team.matches || []).length})`;
      if (sliderRow) sliderRow.style.display = 'none';
    } else {
      const n = Math.min(sliderPeriod, (team.matches || []).length);
      wrap.innerHTML  = buildMatchesTable((team.matches || []).slice(0, n));
      if (title) title.textContent = t('results_title');
      if (sliderRow) sliderRow.style.display = '';
    }
  }

  app.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      app.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateStats(team, btn.dataset.period);
      updateMatchList(btn.dataset.period);
    });
  });

  const slider = app.querySelector('#period-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      sliderPeriod = parseInt(slider.value);
      const lbl = app.querySelector('.slider-row label');
      if (lbl) lbl.innerHTML = t('slider_label', sliderPeriod);
      app.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      const n = Math.min(sliderPeriod, (team.matches || []).length);
      const stats = computeStatsFrom((team.matches || []).slice(0, n));
      document.getElementById('stats-display').innerHTML = renderStatsGrid(stats);
      const wrap = document.getElementById('matches-table-wrap');
      if (wrap) wrap.innerHTML = buildMatchesTable((team.matches || []).slice(0, n));
    });
  }
}

function updateStats(team, period) {
  const stats = getTeamStats(team, period);
  document.getElementById('stats-display').innerHTML = renderStatsGrid(stats);
}

function buildMatchesTable(matches) {
  if (!matches.length) return `<div class="no-data">${t('no_results')}</div>`;

  const rows = matches.map(m => {
    const loc   = m.home ? `<span class="home-tag">${t('home_tag')}</span>` : '';
    const score = `${m.scored} – ${m.conceded}`;
    return `<tr>
      <td>${formatDate(m.date)}</td>
      <td><div class="opponent-cell">
        ${flagImg(m.opp_iso2, m.opponent, 'flag-opponent')}
        <a href="#/team/${encodeURIComponent(slugify(m.opponent))}">${dn(m.opponent)}</a>
        ${loc}
      </div></td>
      <td class="score-cell ${m.result}">${score}</td>
      <td><span class="competition-tag" title="${m.tournament}">${m.tournament}</span></td>
    </tr>`;
  }).join('');

  return `<table class="matches-table">
    <thead><tr>
      <th>${t('th_date')}</th><th>${t('th_opp')}</th><th>${t('th_score')}</th><th>${t('th_comp')}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ── VIEW: Teams ───────────────────────────────────────────────────────
function renderTeams() {
  const app = document.getElementById('app');
  const PERIODS = getPeriods();

  const COL_DEFS = [
    { col: 'name',  label: t('col_team'), align: 'left' },
    { col: 'group', label: t('col_grp'),  align: 'center' },
    { col: 'gp',    label: t('col_gp'),   align: 'center' },
    { col: 'w',     label: t('col_w2'),   align: 'center' },
    { col: 'd',     label: t('col_d2'),   align: 'center' },
    { col: 'l',     label: t('col_l2'),   align: 'center' },
    { col: 'gf',    label: t('col_gf'),   align: 'center' },
    { col: 'ga',    label: t('col_ga'),   align: 'center' },
    { col: 'gd',    label: t('col_gd'),   align: 'center' },
    { col: 'elo',   label: t('col_elo'),  align: 'right'  },
  ];

  const maxMatches = Math.max(...Object.values(DATA.teams).map(t => t.matches?.length || 0));
  const sliderVal  = teamsSlider ?? maxMatches;

  app.innerHTML = `
    <div class="page-header">
      <h1>${t('teams_h1')}</h1>
      <p>${t('teams_sub')}</p>
    </div>

    <div class="teams-controls">
      <div class="period-btns">
        ${PERIODS.map(p => `
          <button class="period-btn ${teamsPeriod === p.key && teamsSlider === null ? 'active' : ''}"
                  data-period="${p.key}">${p.label}</button>
        `).join('')}
      </div>
      <div class="slider-row">
        <label>${t('slider_label', sliderVal)}</label>
        <input type="range" id="teams-period-slider" min="5" max="${maxMatches}" value="${sliderVal}">
      </div>
      <input type="search" id="teams-search" class="teams-search"
             placeholder="${t('search_placeholder')}" value="">
    </div>

    <div class="table-wrap">
      <table class="rankings-table">
        <thead><tr>
          <th></th>
          ${COL_DEFS.map(c => `
            <th class="sort-th ${teamsSort.col === c.col ? 'sort-active' : ''}"
                data-col="${c.col}" style="text-align:${c.align};white-space:nowrap">
              ${c.label}<span class="sort-arrow">${teamsSort.col === c.col ? (teamsSort.dir === 'asc' ? ' ↑' : ' ↓') : ''}</span>
            </th>
          `).join('')}
        </tr></thead>
        <tbody id="teams-tbody"></tbody>
      </table>
    </div>`;

  renderTeamsBody();

  app.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      teamsPeriod = btn.dataset.period;
      teamsSlider = null;
      app.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sl = document.getElementById('teams-period-slider');
      if (sl) {
        sl.value = maxMatches;
        const lbl = app.querySelector('.slider-row label');
        if (lbl) lbl.innerHTML = t('slider_label', maxMatches);
      }
      renderTeamsBody(document.getElementById('teams-search')?.value || '');
      updateTeamsSortHeaders();
    });
  });

  app.querySelector('#teams-period-slider')?.addEventListener('input', e => {
    teamsSlider = parseInt(e.target.value);
    const lbl = app.querySelector('.slider-row label');
    if (lbl) lbl.innerHTML = t('slider_label', teamsSlider);
    app.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    renderTeamsBody(document.getElementById('teams-search')?.value || '');
  });

  app.querySelector('#teams-search')?.addEventListener('input', e => {
    renderTeamsBody(e.target.value);
  });

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
      renderTeamsBody(document.getElementById('teams-search')?.value || '');
    });
  });
}

function renderTeamsBody(search = '') {
  const tbody = document.getElementById('teams-tbody');
  if (!tbody) return;

  let teams = Object.values(DATA.teams).map(t => {
    const s = teamsSlider !== null
      ? (computeStatsFrom((t.matches || []).slice(0, teamsSlider)) || { GP:0, W:0, D:0, L:0, GF:0, GA:0, GD:0 })
      : (getTeamStats(t, teamsPeriod) || { GP:0, W:0, D:0, L:0, GF:0, GA:0, GD:0 });
    return { ...t, s };
  });

  if (search) {
    const q = search.toLowerCase();
    teams = teams.filter(t => t.name.toLowerCase().includes(q) || t.group.toLowerCase().includes(q));
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

  tbody.innerHTML = teams.map(t => {
    const gd = t.s.GD ?? (t.s.GF - t.s.GA);
    const gdStr   = gd > 0 ? `+${gd}` : `${gd}`;
    const gdColor = gd > 0 ? 'color:var(--win)' : gd < 0 ? 'color:var(--loss)' : '';
    return `<tr>
      <td>${flagImg(t.iso2, t.name, 'flag-sm')}</td>
      <td><a href="#/team/${encodeURIComponent(t.slug)}">${dn(t.name)}</a></td>
      <td style="text-align:center;color:var(--muted)">${t.group}</td>
      <td style="text-align:center">${t.s.GP}</td>
      <td style="text-align:center;color:var(--win)">${t.s.W}</td>
      <td style="text-align:center;color:var(--draw)">${t.s.D}</td>
      <td style="text-align:center;color:var(--loss)">${t.s.L}</td>
      <td style="text-align:center">${t.s.GF}</td>
      <td style="text-align:center">${t.s.GA}</td>
      <td style="text-align:center;${gdColor}">${gdStr}</td>
      <td style="text-align:right;color:var(--blue);font-weight:700">${t.elo}</td>
    </tr>`;
  }).join('');
}

function updateTeamsSortHeaders() {
  document.querySelectorAll('.sort-th').forEach(th => {
    const col = th.dataset.col;
    th.classList.toggle('sort-active', col === teamsSort.col);
    const arrow = th.querySelector('.sort-arrow');
    if (arrow) arrow.textContent = col === teamsSort.col ? (teamsSort.dir === 'asc' ? ' ↑' : ' ↓') : '';
  });
}

// ── VIEW: Compare ─────────────────────────────────────────────────────
function renderCompare(slug1, slug2) {
  const app = document.getElementById('app');
  const t1  = DATA.teams[slug1];
  const t2  = DATA.teams[slug2];

  if (!t1 || !t2) {
    app.innerHTML = `<a href="#/" class="back-btn">${t('back_matches')}</a>
      <div class="no-data">${t('team_not_found_short')}</div>`;
    return;
  }

  const PERIODS = getPeriods();
  const h2h = (t1.matches || []).filter(m => slugify(m.opponent) === slug2);

  function buildContent(period) {
    const s1 = getTeamStats(t1, period) || computeStatsFrom(t1.matches || []) || {};
    const s2 = getTeamStats(t2, period) || computeStatsFrom(t2.matches || []) || {};
    const gd1 = s1.GD ?? ((s1.GF ?? 0) - (s1.GA ?? 0));
    const gd2 = s2.GD ?? ((s2.GF ?? 0) - (s2.GA ?? 0));

    const ROWS = [
      { label: t('cmp_row_gp'),  v1: s1.GP,  v2: s2.GP,  better: 'neutral' },
      { label: t('cmp_row_w'),   v1: s1.W,   v2: s2.W,   better: 'high' },
      { label: t('cmp_row_d'),   v1: s1.D,   v2: s2.D,   better: 'neutral' },
      { label: t('cmp_row_l'),   v1: s1.L,   v2: s2.L,   better: 'low' },
      { label: t('cmp_row_gf'),  v1: s1.GF,  v2: s2.GF,  better: 'high' },
      { label: t('cmp_row_ga'),  v1: s1.GA,  v2: s2.GA,  better: 'low' },
      { label: t('cmp_row_gd'),  v1: gd1,    v2: gd2,    better: 'high', sign: true },
      { label: t('cmp_row_elo'), v1: t1.elo, v2: t2.elo, better: 'high' },
    ];

    const compareRows = ROWS.map(row => {
      const v1 = row.v1 ?? null;
      const v2 = row.v2 ?? null;
      let c1 = '', c2 = '';
      if (row.better !== 'neutral' && typeof v1 === 'number' && typeof v2 === 'number') {
        if (row.better === 'high') { c1 = v1 > v2 ? 'cw' : v1 < v2 ? 'cl' : ''; c2 = v2 > v1 ? 'cw' : v2 < v1 ? 'cl' : ''; }
        else                       { c1 = v1 < v2 ? 'cw' : v1 > v2 ? 'cl' : ''; c2 = v2 < v1 ? 'cw' : v2 > v1 ? 'cl' : ''; }
      }
      const fmt = (v, sign) => v === null ? '—' : (sign && v > 0 ? `+${v}` : v);
      return `<tr>
        <td class="compare-val ${c1}">${fmt(v1, row.sign)}</td>
        <td class="compare-lbl">${row.label}</td>
        <td class="compare-val ${c2}">${fmt(v2, row.sign)}</td>
      </tr>`;
    }).join('');

    const h2hHtml = h2h.length === 0
      ? `<div class="no-data">${t('no_h2h')}</div>`
      : `<div class="table-wrap">${buildMatchesTable(h2h)}</div>`;

    const form1 = (t1.matches || []).slice(0, 10).map(m => resultBadge(m.result)).join('');
    const form2 = (t2.matches || []).slice(0, 10).map(m => resultBadge(m.result)).join('');

    return `
      <div class="table-wrap" style="margin-bottom:32px">
        <table class="compare-table">
          <thead><tr>
            <th class="compare-val" style="font-size:.9rem">
              ${flagImg(t1.iso2, t1.name, 'flag-sm')}&nbsp;${dn(t1.name)}
            </th>
            <th class="compare-lbl" style="color:var(--muted)">${t('cmp_stat_col')}</th>
            <th class="compare-val" style="font-size:.9rem">
              ${dn(t2.name)}&nbsp;${flagImg(t2.iso2, t2.name, 'flag-sm')}
            </th>
          </tr></thead>
          <tbody>${compareRows}</tbody>
        </table>
      </div>

      <h3 style="font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">
        ${t('h2h_title', h2h.length)}
      </h3>
      ${h2hHtml}

      <div class="compare-forms">
        <div class="compare-form-col">
          <h3>${t('form_of', dn(t1.name))}</h3>
          <div class="form-badges">${form1 || '<span style="color:var(--muted)">—</span>'}</div>
        </div>
        <div class="compare-form-col">
          <h3>${t('form_of', dn(t2.name))}</h3>
          <div class="form-badges">${form2 || '<span style="color:var(--muted)">—</span>'}</div>
        </div>
      </div>`;
  }

  app.innerHTML = `
    <a href="#/" class="back-btn">${t('back_matches')}</a>

    <div class="compare-header">
      <div class="compare-team-hdr">
        ${flagImg(t1.iso2, t1.name, 'team-flag-lg')}
        <div>
          <div class="compare-team-name"><a href="#/team/${encodeURIComponent(slug1)}">${dn(t1.name)}</a></div>
          <div class="compare-team-meta">${t('group')} ${t1.group} · Elo ${t1.elo}</div>
        </div>
      </div>
      <div class="compare-vs">VS</div>
      <div class="compare-team-hdr compare-team-hdr-right">
        <div style="text-align:right">
          <div class="compare-team-name"><a href="#/team/${encodeURIComponent(slug2)}">${dn(t2.name)}</a></div>
          <div class="compare-team-meta">${t('group')} ${t2.group} · Elo ${t2.elo}</div>
        </div>
        ${flagImg(t2.iso2, t2.name, 'team-flag-lg')}
      </div>
    </div>

    <div class="period-section">
      <div class="period-btns" id="cmp-period-btns">
        ${PERIODS.map(p => `
          <button class="period-btn ${p.key === 'all' ? 'active' : ''}" data-period="${p.key}">${p.label}</button>
        `).join('')}
      </div>
    </div>

    <div id="compare-content"></div>`;

  document.getElementById('compare-content').innerHTML = buildContent('all');

  app.querySelectorAll('#cmp-period-btns .period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      app.querySelectorAll('#cmp-period-btns .period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('compare-content').innerHTML = buildContent(btn.dataset.period);
    });
  });
}

// ── VIEW: Classement Elo (48 équipes WC) ─────────────────────────────
function renderRankings() {
  const app = document.getElementById('app');
  const maxElo = DATA.rankings[0]?.elo || 1800;

  const rows = DATA.rankings.map((tk, i) => {
    const barW = Math.round((tk.elo / maxElo) * 100);
    const rankClass = i < 3 ? `rank-${i + 1}` : '';
    return `<tr class="${rankClass}">
      <td class="rank-num">${i + 1}</td>
      <td>${flagImg(tk.iso2, tk.name, 'flag-sm')}</td>
      <td><a href="#/team/${encodeURIComponent(tk.slug)}">${dn(tk.name)}</a></td>
      <td style="color:var(--muted)">${t('group')} ${tk.group}</td>
      <td>
        <div class="elo-bar-wrap">
          <div class="elo-bar" style="width:${barW}px;max-width:160px"></div>
          <span class="elo-num">${tk.elo}</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  const explainer = LANG === 'en' ? `
    <div class="elo-explainer">
      <p class="elo-explainer-intro">
        Elo is a rating system originally invented for chess and widely used in sports to measure relative strength.
        Each team starts at <strong>1,500 points</strong>. After each match, points are redistributed between the two
        teams based on the result and the Elo gap between them — beating a stronger opponent earns more points than
        beating a weaker one.
      </p>
      <div class="elo-explainer-cols">
        <div>
          <h4>K-factors — match importance</h4>
          <table class="elo-kfactor-table">
            <tr><td>FIFA World Cup</td><td>×60</td></tr>
            <tr><td>Euro, Copa América, AFCON, Asian Cup</td><td>×50</td></tr>
            <tr><td>Qualifiers, Nations League</td><td>×35</td></tr>
            <tr><td>Friendlies</td><td>×20</td></tr>
          </table>
        </div>
        <div>
          <h4>Other parameters</h4>
          <ul class="elo-params">
            <li>Home advantage: <strong>+75 pts</strong> (neutralized on neutral ground)</li>
            <li>Starting score: <strong>1,500</strong> per team</li>
            <li>Dataset: <strong>49,329 matches</strong> — complete history since 1872</li>
          </ul>
          <p class="elo-note">This ranking reflects the overall level of teams across their entire history. Unlike the FIFA ranking, it goes all the way back to 1872 and gives more weight to high-stakes matches.</p>
        </div>
      </div>
    </div>
  ` : `
    <div class="elo-explainer">
      <p class="elo-explainer-intro">
        L'Elo est un système de classement inventé pour les échecs et adapté à de nombreux sports pour mesurer
        le niveau relatif des équipes. Chaque équipe démarre à <strong>1 500 points</strong>. Après chaque match,
        des points sont échangés entre les deux équipes selon le résultat et leur écart d'Elo — battre une équipe
        plus forte rapporte davantage que battre une équipe plus faible.
      </p>
      <div class="elo-explainer-cols">
        <div>
          <h4>K-facteurs — importance des matchs</h4>
          <table class="elo-kfactor-table">
            <tr><td>Coupe du Monde FIFA</td><td>×60</td></tr>
            <tr><td>Euro, Copa América, CAN, Coupe d'Asie</td><td>×50</td></tr>
            <tr><td>Qualifications, Nations League</td><td>×35</td></tr>
            <tr><td>Matchs amicaux</td><td>×20</td></tr>
          </table>
        </div>
        <div>
          <h4>Autres paramètres</h4>
          <ul class="elo-params">
            <li>Avantage domicile : <strong>+75 pts</strong> (annulé sur terrain neutre)</li>
            <li>Score initial : <strong>1 500</strong> par équipe</li>
            <li>Base : <strong>49 329 matchs</strong> — historique complet depuis 1872</li>
          </ul>
          <p class="elo-note">Ce classement reflète le niveau global des équipes sur toute leur histoire. Contrairement au classement FIFA, il remonte jusqu'en 1872 et pondère davantage les matchs à enjeu élevé.</p>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = `
    <div class="page-header">
      <h1>${t('elo_h1')}</h1>
      <p>${t('elo_sub')}</p>
    </div>
    ${explainer}
    <div class="table-wrap">
      <table class="rankings-table">
        <thead><tr>
          <th>#</th><th></th><th>${t('th_team')}</th><th>${t('th_group')}</th><th>${t('th_elo_score')}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── VIEW: Classement FIFA ─────────────────────────────────────────────
async function renderFifaRankings() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="splash"><div class="spinner"></div><p>${t('fifa_loading')}</p></div>`;

  let data;
  try {
    data = await fetch('./data/fifa_ranking.json').then(r => r.json());
  } catch (e) {
    app.innerHTML = `
      <div class="page-header"><h1>${t('fifa_h1')}</h1></div>
      <div class="no-data">${t('fifa_no_data')}</div>`;
    return;
  }

  const rankings = data.rankings || [];
  const maxPts   = rankings[0]?.points || 1900;
  const dateStr  = data.ranking_date || data.updated_at?.slice(0, 10) || '—';

  const rows = rankings.map((t, i) => {
    const barW    = Math.round((t.points / maxPts) * 160);
    const rankCls = i < 3 ? `rank-${i + 1}` : '';
    const chg     = t.change;
    const chgHtml = chg > 0
      ? `<span class="rank-chg up">▲${chg}</span>`
      : chg < 0
        ? `<span class="rank-chg down">▼${Math.abs(chg)}</span>`
        : `<span class="rank-chg eq">—</span>`;
    const teamSlug = slugify(t.name);
    const hasTeam  = DATA.teams && DATA.teams[teamSlug];
    const nameHtml = hasTeam
      ? `<a href="#/team/${encodeURIComponent(teamSlug)}">${t.name}</a>`
      : t.name;

    return `<tr class="${rankCls}">
      <td class="rank-num" style="white-space:nowrap">${t.rank}&thinsp;${chgHtml}</td>
      <td>${flagImg(t.iso2, t.name, 'flag-sm')}</td>
      <td>${nameHtml}</td>
      <td style="color:var(--muted);font-size:.8rem">${t.confederation}</td>
      <td>
        <div class="elo-bar-wrap">
          <div class="elo-bar" style="width:${barW}px;max-width:160px;background:var(--blue)"></div>
          <span class="elo-num">${t.points.toFixed(2)}</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  app.innerHTML = `
    <div class="page-header">
      <h1>${t('fifa_h1')}</h1>
      <p>${t('fifa_sub', rankings.length, dateStr, data.source || 'FIFA')}</p>
    </div>
    <div class="table-wrap">
      <table class="rankings-table">
        <thead><tr>
          <th>#</th><th></th><th>${t('th_team')}</th><th>${t('th_confederation')}</th><th>${t('th_fifa_pts')}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── VIEW: Données ─────────────────────────────────────────────────────
function renderData() {
  const app = document.getElementById('app');

  const datasets = LANG === 'en' ? [
    { file: 'fixtures.json',     label: 'WC 2026 Matches',       desc: '72 group stage matches: dates, cities, teams, Elo score.',                                                                                          icon: '📅', type: 'JSON' },
    { file: 'teams.json',        label: 'Team profiles',          desc: '48 qualified teams: stats by period (since 2022, 2025, 2026, WC qualifiers), last 30 matches, Elo score.',                                          icon: '🏳️', type: 'JSON' },
    { file: 'groups.json',       label: 'Groups',                 desc: '12 groups with squad composition and Elo score for each team.',                                                                                     icon: '📋', type: 'JSON' },
    { file: 'rankings.json',     label: 'Elo Ranking',            desc: '48 teams ranked by Elo score (calculated from complete international football history since 1872).',                                     icon: '📊', type: 'JSON' },
    { file: 'fifa_ranking.json', label: 'FIFA Ranking',           desc: 'Official FIFA ranking (211 national teams) with points and confederation.',                                                                         icon: '🏆', type: 'JSON' },
    { file: 'results.csv',       label: 'Historical results',     desc: 'Complete history of international football since 1872 — 49,329 matches including WC 2022, Euro 2024, Copa América, AFCON, Nations League, WC 2026 qualifiers, friendlies…', icon: '📰', type: 'CSV'  },
  ] : [
    { file: 'fixtures.json',     label: 'Matchs WC 2026',         desc: '72 matchs de phase de groupes : dates, villes, équipes, score Elo.',                                                                               icon: '📅', type: 'JSON' },
    { file: 'teams.json',        label: 'Fiches équipes',          desc: '48 équipes qualifiées : stats par période (depuis 2022, 2025, 2026, qualifs), 30 derniers matchs, score Elo.',                                     icon: '🏳️', type: 'JSON' },
    { file: 'groups.json',       label: 'Groupes',                 desc: '12 groupes avec la composition et le score Elo de chaque équipe.',                                                                                 icon: '📋', type: 'JSON' },
    { file: 'rankings.json',     label: 'Classement Elo',          desc: '48 équipes classées par score Elo (calculé sur l\'historique complet du football international depuis 1872).',                                     icon: '📊', type: 'JSON' },
    { file: 'fifa_ranking.json', label: 'Classement FIFA',         desc: 'Classement FIFA officiel (211 sélections) avec points et confédération.',                                                                          icon: '🏆', type: 'JSON' },
    { file: 'results.csv',       label: 'Résultats historiques',   desc: 'Historique complet du football international depuis 1872 — 49 329 matchs dont WC 2022, Euro 2024, Copa América, CAN, qualifications, amicaux…',  icon: '📰', type: 'CSV'  },
  ];

  const cards = datasets.map(d => `
    <div class="data-card">
      <div class="data-card-header">
        <span class="data-icon">${d.icon}</span>
        <div>
          <div class="data-label">${d.label}</div>
          <span class="data-type-badge">${d.type}</span>
        </div>
        <a class="dl-btn" href="./data/${d.file}" download="${d.file}">${t('dl_btn')}</a>
      </div>
      <p class="data-desc">${d.desc}</p>
      <code class="data-filename">data/${d.file}</code>
    </div>`).join('');

  const infoBanner = LANG === 'en' ? `
    <strong>Results</strong> —
    <a href="https://github.com/martj42/international_results" target="_blank" class="ext-link">martj42/international_results</a>
    (CC0, active — last commit May 2026) · complete history since 1872 (49,329 matches),
    including 108 real 2026 results + 72 WC 2026 fixtures.
    &nbsp;&nbsp;<strong>FIFA Ranking</strong> — Official API
    <a href="https://inside.fifa.com/fr/fifa-world-ranking/men" target="_blank" class="ext-link">inside.fifa.com</a>
    · 211 nations · April 2026 · France #1
    (vs cnc8 repo: abandoned since 2021, 2020 data, Belgium #1).
    &nbsp;&nbsp;<strong>Elo Score</strong> — custom calculation, K-factors WC×60 · tournaments×50 · qualifiers×35 · friendlies×20.
  ` : `
    <strong>Résultats</strong> —
    <a href="https://github.com/martj42/international_results" target="_blank" class="ext-link">martj42/international_results</a>
    (CC0, actif — dernier commit mai 2026) · historique complet depuis 1872 (49 329 matchs),
    dont 108 résultats 2026 + 72 fixtures WC 2026.
    &nbsp;&nbsp;<strong>Classement FIFA</strong> — API officielle
    <a href="https://inside.fifa.com/fr/fifa-world-ranking/men" target="_blank" class="ext-link">inside.fifa.com</a>
    · 211 sélections · avril 2026 · France #1
    (vs repo cnc8 : abandonné depuis 2021, données de 2020, Belgique #1).
    &nbsp;&nbsp;<strong>Score Elo</strong> — calcul maison, K-facteurs WC×60 · tournois×50 · qualifs×35 · amicaux×20.
  `;

  const sourcesHtml = LANG === 'en' ? `
    <ul>
      <li>
        <strong>Historical results</strong>:
        <a href="https://github.com/martj42/international_results" target="_blank" class="ext-link">martj42/international_results</a>
        (CC0) — <strong>active</strong> repo, last commit May 12, 2026.
        Complete history since 1872 — 49,329 matches · 108 real 2026 results with scores ·
        72 WC 2026 fixtures (NA scores = upcoming matches) ·
        WC 2022, Euro 2024, Copa América 2024, AFCON, Nations League, WC 2026 qualifiers, friendlies and every major tournament since 1872.
      </li>
      <li>
        <strong>FIFA Ranking</strong>:
        Official API <a href="https://inside.fifa.com/fr/fifa-world-ranking/men" target="_blank" class="ext-link">inside.fifa.com</a>
        (FDCP endpoint, dynamic dateId) — 211 nations, April 2026, France #1 (1,877 pts).
        The <a href="https://github.com/cnc8/fifa-world-ranking" target="_blank" class="ext-link">cnc8/fifa-world-ranking</a>
        repo is kept as fallback only: <strong>abandoned since January 2021</strong>,
        December 2020 data (Belgium #1, 1,780 pts).
      </li>
      <li>
        <strong>Elo Score</strong>: custom calculation — not available in public datasets.
        K-factors WC×60 · tournaments×50 · qualifiers×35 · friendlies×20 ·
        home advantage +75 (neutralized on neutral ground) · initial score 1,500.
      </li>
    </ul>
  ` : `
    <ul>
      <li>
        <strong>Résultats historiques</strong> :
        <a href="https://github.com/martj42/international_results" target="_blank" class="ext-link">martj42/international_results</a>
        (CC0) — repo <strong>actif</strong>, dernier commit 12 mai 2026.
        Historique complet depuis 1872 — 49 329 matchs · 108 résultats 2026 avec scores réels ·
        72 fixtures WC 2026 (scores <code>NA</code> = matchs à venir) ·
        WC 2022, Euro 2024, Copa América 2024, CAN, Nations League, qualifications WC 2026, amicaux et tous les grands tournois depuis 1872.
      </li>
      <li>
        <strong>Classement FIFA</strong> :
        API officielle <a href="https://inside.fifa.com/fr/fifa-world-ranking/men" target="_blank" class="ext-link">inside.fifa.com</a>
        (endpoint FDCP, dateId dynamique) — 211 sélections, avril 2026, France #1 (1 877 pts).
        Le repo <a href="https://github.com/cnc8/fifa-world-ranking" target="_blank" class="ext-link">cnc8/fifa-world-ranking</a>
        est conservé en fallback uniquement : <strong>abandonné depuis janvier 2021</strong>,
        données de décembre 2020 (Belgique #1, 1 780 pts).
      </li>
      <li>
        <strong>Score Elo</strong> : calcul maison — absent des sources publiques.
        K-facteurs WC×60 · tournois×50 · qualifs×35 · amicaux×20 ·
        avantage terrain +75 (neutralisé sur terrain neutre) · score initial 1 500.
      </li>
    </ul>
  `;

  app.innerHTML = `
    <div class="page-header">
      <h1>${t('data_h1')}</h1>
      <p>${t('data_sub')}</p>
    </div>

    <div class="info-banner">${infoBanner}</div>

    <div class="data-grid">${cards}</div>

    <div class="source-section">
      <h3>${t('sources_h3')}</h3>
      ${sourcesHtml}
    </div>`;
}

// ── Utility: slugify ─────────────────────────────────────────────────
function slugify(name) {
  const s = name.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Boot ─────────────────────────────────────────────────────────────
init();
