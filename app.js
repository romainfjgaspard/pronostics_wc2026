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
    elo_sub: 'Indicateur de niveau calculé sur l\'historique complet des matchs internationaux depuis 1872',
    elo_info: "L'Elo est un indicateur de niveau calculé sur l'ensemble de l'histoire du football international (depuis 1872). Il intègre WC 2022, Euro 2024, Copa América 2024, qualifications, matchs amicaux et bien plus. Il reflète la valeur globale des équipes, pas uniquement leur forme récente.",
    th_team: 'Équipe',    th_group: 'Groupe',  th_elo_score: 'Score Elo',
    fifa_h1: 'Classement FIFA Masculin',
    fifa_sub: (count, date, source) => `${count} sélections · Mise à jour : ${date} · Source : ${source}`,
    fifa_loading: 'Chargement classement FIFA…',
    fifa_no_data: 'Données non disponibles.<br>Lancez <code>python fetch_fifa_ranking.py</code> pour les générer.',
    th_confederation: 'Confédération',  th_fifa_pts: 'Points FIFA',
    fifa_year_label: 'Période',  fifa_current_opt: 'Classement actuel',
    data_h1: 'Données',
    data_sub: 'Tous les fichiers sont au format ouvert (JSON / CSV) — libres de réutilisation.',
    dl_btn: 'Télécharger',
    sources_h3: 'Sources détaillées',
    load_error: '⚠️ Impossible de charger les données.<br>Vérifiez que le serveur local tourne et que les JSON sont présents.',
    footer_uefa_title: 'Clubs français en Europe',
    footer_uefa_desc: 'Champions League, Europa, C4 — tous les résultats et classements UEFA des clubs français',
    footer_gh_title: 'Code source',
    year_slider_label: (min, max, n) => `De <strong>${min}</strong> à <strong>${max}</strong> — <strong>${n}</strong> match${n > 1 ? 's' : ''}`,
    btn_qualifs_cdm: 'Qualifs CDM 2026',
    nav_quiz: 'Quiz 🏳️',
    quiz_h1: 'Quiz Drapeaux',
    quiz_sub: 'Reconnaissez-vous les 48 drapeaux de la Coupe du Monde 2026 ?',
    quiz_placeholder: 'Nom du pays…',
    quiz_validate: 'Valider',
    quiz_skip: 'Passer',
    quiz_final_title: (score) => `Score final : ${score}/48`,
    quiz_share_text: (score) => `J'ai eu ${score}/48 au Quiz Drapeaux CdM 2026 ! Et toi ?`,
    quiz_restart: 'Rejouer',
    quiz_share: 'Partager mon score',
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
    elo_sub: 'Level indicator based on the complete history of international football since 1872',
    elo_info: 'Elo is a performance indicator calculated from the entire history of international football (since 1872). It includes WC 2022, Euro 2024, Copa América 2024, qualifications, friendlies, and much more. It reflects the overall level of teams, not just recent form.',
    th_team: 'Team',    th_group: 'Group',  th_elo_score: 'Elo Score',
    fifa_h1: "Men's FIFA Ranking",
    fifa_sub: (count, date, source) => `${count} national teams · Updated: ${date} · Source: ${source}`,
    fifa_loading: 'Loading FIFA ranking…',
    fifa_no_data: 'Data unavailable.<br>Run <code>python fetch_fifa_ranking.py</code> to generate it.',
    th_confederation: 'Confederation',  th_fifa_pts: 'FIFA Points',
    fifa_year_label: 'Period',  fifa_current_opt: 'Current ranking',
    data_h1: 'Data',
    data_sub: 'All files are in open format (JSON / CSV) — free to reuse.',
    dl_btn: 'Download',
    sources_h3: 'Detailed sources',
    load_error: '⚠️ Unable to load data.<br>Make sure the local server is running and JSON files are present.',
    footer_uefa_title: 'French clubs in Europe',
    footer_uefa_desc: 'Champions League, Europa, C4 — all results and UEFA standings for French clubs',
    footer_gh_title: 'Source code',
    year_slider_label: (min, max, n) => `From <strong>${min}</strong> to <strong>${max}</strong> — <strong>${n}</strong> match${n > 1 ? 'es' : ''}`,
    btn_qualifs_cdm: 'WC 2026 Qualifiers',
    nav_quiz: 'Quiz 🏳️',
    quiz_h1: 'Flag Quiz',
    quiz_sub: 'Do you know all 48 flags from the 2026 World Cup?',
    quiz_placeholder: 'Country name…',
    quiz_validate: 'Validate',
    quiz_skip: 'Skip',
    quiz_final_title: (score) => `Final score: ${score}/48`,
    quiz_share_text: (score) => `I scored ${score}/48 on the WC 2026 Flag Quiz! What about you?`,
    quiz_restart: 'Play again',
    quiz_share: 'Share my score',
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
  document.title = LANG === 'fr'
    ? 'CdM 2026 — Données & Statistiques'
    : 'WC 2026 — Data & Statistics';
  updateNavSelectOptions();
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
  buildNavSelect();
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
  'Canada':                 'Canada',
  'Cape Verde':             'Cap-Vert',
  'Colombia':               'Colombie',
  'Croatia':                'Croatie',
  'Curaçao':                'Curaçao',
  'Czech Republic':         'République tchèque',
  'DR Congo':               'RD Congo',
  'Ecuador':                'Équateur',
  'Egypt':                  'Égypte',
  'England':                'Angleterre',
  'France':                 'France',
  'Germany':                'Allemagne',
  'Ghana':                  'Ghana',
  'Haiti':                  'Haïti',
  'Iran':                   'Iran',
  'Iraq':                   'Irak',
  'Ivory Coast':            "Côte d'Ivoire",
  'Japan':                  'Japon',
  'Jordan':                 'Jordanie',
  'Mexico':                 'Mexique',
  'Morocco':                'Maroc',
  'Netherlands':            'Pays-Bas',
  'New Zealand':            'Nouvelle-Zélande',
  'Nigeria':                'Nigéria',
  'Norway':                 'Norvège',
  'Panama':                 'Panama',
  'Paraguay':               'Paraguay',
  'Portugal':               'Portugal',
  'Qatar':                  'Qatar',
  'Republic of Ireland':    'Irlande',
  'Saudi Arabia':           'Arabie saoudite',
  'Scotland':               'Écosse',
  'Senegal':                'Sénégal',
  'South Africa':           'Afrique du Sud',
  'South Korea':            'Corée du Sud',
  'Spain':                  'Espagne',
  'Sweden':                 'Suède',
  'Switzerland':            'Suisse',
  'Trinidad and Tobago':    'Trinité-et-Tobago',
  'Tunisia':                'Tunisie',
  'Turkey':                 'Turquie',
  'United States':          'États-Unis',
  'Uruguay':                'Uruguay',
  'Uzbekistan':             'Ouzbékistan',
};

function dn(name) {
  return LANG === 'fr' ? (TEAM_FR_NAMES[name] || name) : name;
}

// ── Tournament name translations (EN → FR) ────────────────────────────
const TOURNAMENT_FR_NAMES = {
  'Friendly':                              'Amical',
  'FIFA World Cup':                        'Coupe du Monde FIFA',
  'FIFA World Cup qualification':          'Qualification CDM',
  'UEFA Euro':                             'UEFA Euro',
  'UEFA Euro qualification':              'Qualification UEFA Euro',
  'African Cup of Nations':               "Coupe d'Afrique des Nations",
  'African Cup of Nations qualification': 'Qualification CAN',
  'AFC Asian Cup':                         'Coupe d\'Asie AFC',
  'AFC Asian Cup qualification':           'Qualification Coupe d\'Asie AFC',
  'UEFA Nations League':                   'Ligue des Nations UEFA',
  'UEFA Nations League qualification':     'Qualification LN UEFA',
  'CONCACAF Nations League':              'Ligue des Nations CONCACAF',
  'CONCACAF Nations League qualification':'Qualification LN CONCACAF',
  'CONCACAF Championship':                'Championnat CONCACAF',
  'CONCACAF Championship qualification':  'Qualification CONCACAF',
  'Confederations Cup':                    'Coupe des Confédérations',
  'Olympic Games':                         'Jeux Olympiques',
  'Gold Cup':                              'Gold Cup',
  'Gold Cup qualification':               'Qualification Gold Cup',
  'Gulf Cup':                              'Coupe du Golfe',
  'Arab Cup':                              'Coupe Arabe',
  'Arab Cup qualification':               'Qualification Coupe Arabe',
  'Asian Games':                           'Jeux Asiatiques',
  'Nordic Championship':                   'Championnat Nordique',
  'EAFF Championship':                     'Championnat EAFF',
  'Copa América':                          'Copa América',
  'Copa América qualification':           'Qualification Copa América',
};

function dt(tournament) {
  return LANG === 'fr' ? (TOURNAMENT_FR_NAMES[tournament] || tournament) : tournament;
}

// ── State ────────────────────────────────────────────────────────────
let DATA = null;
let currentSlug = null;
let teamsSort = { col: 'elo', dir: 'desc' };
let teamYearMin = 1872;
let teamYearMax = 2026;
let teamQualifsMode = false;
let teamsYearMin = 1872;
let teamsYearMax = 2026;
let teamsQualifsMode = false;
let cmpYearMin = 1872;
let cmpYearMax = 2026;
let cmpQualifsMode = false;
let navToken = 0;

// ── Init ─────────────────────────────────────────────────────────────
async function init() {
  try {
    const [fixtures, groups, rankings, fifaRanking] = await Promise.all([
      fetch('./data/fixtures.json').then(r => r.json()),
      fetch('./data/groups.json').then(r => r.json()),
      fetch('./data/rankings.json').then(r => r.json()),
      fetch('./data/fifa_ranking.json').then(r => r.json()).catch(() => null),
    ]);
    DATA = { fixtures, teams: null, fifaHistory: null, groups, rankings };
    DATA.fifaRankMap = new Map();
    if (fifaRanking?.rankings) {
      for (const entry of fifaRanking.rankings) {
        if (entry.iso2) DATA.fifaRankMap.set(entry.iso2, entry.rank);
      }
    }
    initLang();
    window.addEventListener('hashchange', route);
    route();
  } catch (e) {
    document.getElementById('app').innerHTML =
      `<div class="splash"><p>${t('load_error')}</p></div>`;
    console.error(e);
  }
}

// ── Teams lazy loader ─────────────────────────────────────────────────
async function ensureTeams() {
  if (DATA.teams) return;
  const appEl = document.getElementById('app');
  appEl.innerHTML = `<div class="splash"><div class="spinner"></div><p>${LANG === 'fr' ? 'Chargement des équipes…' : 'Loading teams…'}</p></div>`;
  DATA.teams = await fetch('./data/teams.json').then(r => r.json());
}

// ── FIFA history lazy loader ──────────────────────────────────────────
async function ensureFifaHistory() {
  if (DATA.fifaHistory) return;
  DATA.fifaHistory = await fetch('./data/fifa_ranking_history.json').then(r => r.json());
}

// ── Elo history lazy loader ───────────────────────────────────────────
async function ensureEloHistory() {
  if (DATA.eloHistory) return;
  DATA.eloHistory = await fetch('./data/elo_ranking_history.json').then(r => r.json());
}

// ── Router ───────────────────────────────────────────────────────────
async function route() {
  navToken++;
  window.scrollTo({ top: 0, behavior: 'instant' });
  const hash = location.hash.slice(1) || '/';
  setActiveNav(hash);

  if (hash.startsWith('/team/')) {
    await renderTeam(decodeURIComponent(hash.slice(6)));
  } else if (hash.startsWith('/compare/')) {
    const parts = hash.slice(9).split('/');
    await renderCompare(decodeURIComponent(parts[0] || ''), decodeURIComponent(parts[1] || ''));
  } else if (hash === '/teams') {
    await renderTeams();
  } else if (hash === '/rankings') {
    await renderRankings();
  } else if (hash === '/fifa-ranking') {
    renderFifaRankings();
  } else if (hash === '/data') {
    renderData();
  } else if (hash === '/quiz') {
    renderQuiz();
  } else {
    renderFixtures();
  }
}

const NAV_PAGES = [
  { hash: '#/',             page: 'fixtures',     labelKey: 'nav_fixtures' },
  { hash: '#/teams',        page: 'teams',        labelKey: 'nav_teams' },
  { hash: '#/fifa-ranking', page: 'fifa-ranking', labelKey: 'nav_fifa' },
  { hash: '#/rankings',     page: 'rankings',     labelKey: 'nav_elo' },
  { hash: '#/data',         page: 'data',         labelKey: 'nav_data' },
  { hash: '#/quiz',         page: 'quiz',         labelKey: 'nav_quiz' },
];

function buildNavSelect() {
  updateNavSelectOptions();
  const sel = document.getElementById('nav-select');
  if (!sel) return;
  sel.addEventListener('change', () => { location.hash = sel.value; });
}

function updateNavSelectOptions() {
  const sel = document.getElementById('nav-select');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = NAV_PAGES.map(p =>
    `<option value="${p.hash}">${t(p.labelKey)}</option>`
  ).join('');
  if (current) sel.value = current;
}

function setActiveNav(hash) {
  let activePage = 'fixtures';
  if (hash === '/teams')         activePage = 'teams';
  else if (hash === '/rankings')      activePage = 'rankings';
  else if (hash === '/fifa-ranking')  activePage = 'fifa-ranking';
  else if (hash === '/data')          activePage = 'data';
  else if (hash === '/quiz')          activePage = 'quiz';

  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === activePage);
  });

  const sel = document.getElementById('nav-select');
  if (sel) {
    const page = NAV_PAGES.find(p => p.page === activePage);
    if (page) sel.value = page.hash;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────
const FLAG_BASE = './data/flags/';

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

function filterMatchesByYears(matches, minYear, maxYear) {
  return matches.filter(m => {
    const y = parseInt(m.date.slice(0, 4), 10);
    return y >= minYear && y <= maxYear;
  });
}

function filterMatchesQualifs(matches) {
  return matches.filter(m =>
    m.tournament === 'FIFA World Cup qualification' &&
    parseInt(m.date.slice(0, 4), 10) >= 2023
  );
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
      let probaHtml = '';
      const p = m.proba;
      if (p) {
        const titleFr = `Indicateur Elo — ${dn(m.home)} ${(p.home*100).toFixed(0)}% / Nul ${(p.draw*100).toFixed(0)}% / ${dn(m.away)} ${(p.away*100).toFixed(0)}%`;
        const titleEn = `Elo indicator — ${dn(m.home)} ${(p.home*100).toFixed(0)}% / Draw ${(p.draw*100).toFixed(0)}% / ${dn(m.away)} ${(p.away*100).toFixed(0)}%`;
        probaHtml = `
          <div class="proba-bar" title="${LANG === 'fr' ? titleFr : titleEn}">
            <div class="proba-seg proba-home" style="width:${(p.home*100).toFixed(0)}%">${(p.home*100).toFixed(0)}%</div>
            <div class="proba-seg proba-draw" style="width:${(p.draw*100).toFixed(0)}%">${(p.draw*100).toFixed(0)}%</div>
            <div class="proba-seg proba-away" style="width:${(p.away*100).toFixed(0)}%">${(p.away*100).toFixed(0)}%</div>
          </div>
          `;
      }
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
          ${probaHtml}
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
      <p class="hint-text proba-hint">
        ⚡ ${LANG === 'fr'
          ? 'Probabilités calculées d\'après un indicateur Elo custom — <a href="#/rankings" style="color:var(--accent)">voir Classement Elo</a>'
          : 'Win probabilities based on a custom Elo indicator — <a href="#/rankings" style="color:var(--accent)">see Elo Ranking</a>'}
      </p>
    </div>
    <div class="groups-grid">${groupsHtml}</div>`;
}

// ── VIEW: Team ────────────────────────────────────────────────────────
async function renderTeam(slug) {
  teamYearMin = 1872;
  teamYearMax = 2026;
  teamQualifsMode = false;
  await ensureTeams();
  const app  = document.getElementById('app');
  const team = DATA.teams[slug];

  if (!team) {
    app.innerHTML = `<a href="#/" class="back-btn">${t('back')}</a>
      <div class="no-data">${t('team_not_found', slug)}</div>`;
    return;
  }

  currentSlug = slug;

  app.innerHTML = `
    <a href="#/" class="back-btn">${t('back_matches')}</a>

    <div class="team-header">
      ${flagImg(team.iso2, team.name, 'team-flag-lg')}
      <div class="team-title">
        <h1>${dn(team.name)}</h1>
        <div class="team-meta">
          <span class="badge badge-group">${t('group')} ${team.group}</span>
          <span class="badge badge-elo">Elo ${team.elo}</span>
          ${DATA.fifaRankMap?.has(team.iso2)
            ? `<span class="badge badge-fifa">FIFA #${DATA.fifaRankMap.get(team.iso2)}</span>`
            : ''}
        </div>
      </div>
    </div>

    <div class="period-section">
      <div class="year-slider-wrap">
        <div class="year-slider-label" id="year-label-team">
          ${t('year_slider_label', teamYearMin, teamYearMax, team.matches.length)}
        </div>
        <div class="controls-inline-row">
          <div id="noui-team" style="flex:1;margin:0 10px 0 0"></div>
          <button class="period-btn ${teamQualifsMode ? 'active' : ''}" id="btn-qualifs-team">
            ${t('btn_qualifs_cdm')}
          </button>
        </div>
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
      <div class="table-wrap" id="matches-table-wrap"></div>
    </div>`;

  function applyTeamFilters() {
    const matches = teamQualifsMode
      ? filterMatchesQualifs(team.matches || [])
      : filterMatchesByYears(team.matches || [], teamYearMin, teamYearMax);

    const label = document.getElementById('year-label-team');
    if (label) {
      if (teamQualifsMode) {
        label.innerHTML = `${t('btn_qualifs_cdm')} — <strong>${matches.length}</strong> match${matches.length > 1 ? 's' : ''}`;
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

  const nouiTeam  = app.querySelector('#noui-team');
  const qualifBtn = app.querySelector('#btn-qualifs-team');

  if (nouiTeam && typeof noUiSlider !== 'undefined') {
    noUiSlider.create(nouiTeam, {
      start: [teamYearMin, teamYearMax],
      connect: true, step: 1,
      range: { min: 1872, max: 2026 },
    });
    nouiTeam.noUiSlider.on('slide', (values) => {
      teamYearMin = Math.round(+values[0]);
      teamYearMax = Math.round(+values[1]);
      teamQualifsMode = false;
      qualifBtn?.classList.remove('active');
      applyTeamFilters();
    });
  }
  qualifBtn?.addEventListener('click', () => {
    teamQualifsMode = !teamQualifsMode;
    qualifBtn.classList.toggle('active', teamQualifsMode);
    applyTeamFilters();
  });
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
      <td><span class="competition-tag" title="${m.tournament}">${dt(m.tournament)}</span></td>
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
async function renderTeams() {
  await ensureTeams();
  const app = document.getElementById('app');

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
    { col: 'fifa',  label: 'FIFA',         align: 'right'  },
    { col: 'elo',   label: t('col_elo'),  align: 'right'  },
  ];

  app.innerHTML = `
    <div class="page-header">
      <h1>${t('teams_h1')}</h1>
      <p>${t('teams_sub')}</p>
    </div>

    <div class="teams-controls">
      <div class="year-slider-wrap" style="flex:1;min-width:220px">
        <div class="year-slider-label" id="year-label-teams">
          ${t('year_slider_label', teamsYearMin, teamsYearMax, 0)}
        </div>
        <div id="noui-teams"></div>
      </div>
      <button class="period-btn ${teamsQualifsMode ? 'active' : ''}" id="btn-qualifs-teams"
              style="flex-shrink:0;align-self:flex-end;margin-bottom:4px">
        ${t('btn_qualifs_cdm')}
      </button>
      <input type="search" id="teams-search" class="teams-search"
             placeholder="${t('search_placeholder')}" value=""
             style="align-self:flex-end;margin-bottom:4px">
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

  const nouiTeams  = app.querySelector('#noui-teams');
  const qualBtn    = app.querySelector('#btn-qualifs-teams');
  const searchInput = app.querySelector('#teams-search');
  let teamsSliderTimer = null;

  if (nouiTeams && typeof noUiSlider !== 'undefined') {
    noUiSlider.create(nouiTeams, {
      start: [teamsYearMin, teamsYearMax],
      connect: true, step: 1,
      range: { min: 1872, max: 2026 },
    });
    nouiTeams.noUiSlider.on('slide', (values) => {
      teamsYearMin = Math.round(+values[0]);
      teamsYearMax = Math.round(+values[1]);
      teamsQualifsMode = false;
      qualBtn?.classList.remove('active');
      clearTimeout(teamsSliderTimer);
      teamsSliderTimer = setTimeout(() => {
        renderTeamsBody(searchInput?.value || '');
        updateTeamsSortHeaders();
      }, 60);
    });
  }

  qualBtn?.addEventListener('click', () => {
    teamsQualifsMode = !teamsQualifsMode;
    qualBtn.classList.toggle('active', teamsQualifsMode);
    const label = document.getElementById('year-label-teams');
    if (label && teamsQualifsMode) label.innerHTML = t('btn_qualifs_cdm');
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
          : (col === 'name' || col === 'group' || col === 'fifa' ? 'asc' : 'desc'),
      };
      updateTeamsSortHeaders();
      renderTeamsBody(searchInput?.value || '');
    });
  });
}

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

  const label = document.getElementById('year-label-teams');
  if (label && !teamsQualifsMode) {
    const totalMatches = teams.reduce((acc, tm) => acc + tm.s.GP, 0);
    label.innerHTML = t('year_slider_label', teamsYearMin, teamsYearMax, totalMatches);
  }

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
    if (col === 'fifa') {
      const fa = DATA.fifaRankMap?.get(a.iso2) || 9999;
      const fb = DATA.fifaRankMap?.get(b.iso2) || 9999;
      return mult * (fa - fb);
    }
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
      <td style="text-align:right;color:var(--muted)">${DATA.fifaRankMap?.get(t.iso2) || '—'}</td>
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
async function renderCompare(slug1, slug2) {
  await ensureTeams();
  const app = document.getElementById('app');
  const t1  = DATA.teams[slug1];
  const t2  = DATA.teams[slug2];

  if (!t1 || !t2) {
    app.innerHTML = `<a href="#/" class="back-btn">${t('back_matches')}</a>
      <div class="no-data">${t('team_not_found_short')}</div>`;
    return;
  }

  // H2H sur l'historique complet (pas filtré par années)
  const h2h = (t1.matches || []).filter(m => slugify(m.opponent) === slug2);

  function buildContent(matches1, matches2) {
    const s1 = computeStatsFrom(matches1) || {};
    const s2 = computeStatsFrom(matches2) || {};
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

    let h2hHtml;
    if (h2h.length === 0) {
      h2hHtml = `<div class="no-data">${t('no_h2h')}</div>`;
    } else {
      const h2hW = h2h.filter(m => m.result === 'W').length;
      const h2hD = h2h.filter(m => m.result === 'D').length;
      const h2hL = h2h.filter(m => m.result === 'L').length;
      h2hHtml = `
        <div class="h2h-summary">
          <span class="h2h-score win">${h2hW}</span>
          <span class="h2h-sep">${dn(t1.name)}</span>
          <span class="h2h-score draw">${h2hD}</span>
          <span class="h2h-sep">${t('stat_d')}</span>
          <span class="h2h-score loss">${h2hL}</span>
          <span class="h2h-sep">${dn(t2.name)}</span>
        </div>
        <div class="table-wrap">${buildMatchesTable(h2h)}</div>`;
    }

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
        <div class="compare-form-col compare-form-col--right">
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
          <div class="compare-team-meta">${t('group')} ${t1.group}${DATA.fifaRankMap?.has(t1.iso2) ? ` · FIFA #${DATA.fifaRankMap.get(t1.iso2)}` : ''} · Elo ${t1.elo}</div>
        </div>
      </div>
      <div class="compare-vs">VS</div>
      <div class="compare-team-hdr compare-team-hdr-right">
        <div style="text-align:right">
          <div class="compare-team-name"><a href="#/team/${encodeURIComponent(slug2)}">${dn(t2.name)}</a></div>
          <div class="compare-team-meta">${t('group')} ${t2.group}${DATA.fifaRankMap?.has(t2.iso2) ? ` · FIFA #${DATA.fifaRankMap.get(t2.iso2)}` : ''} · Elo ${t2.elo}</div>
        </div>
        ${flagImg(t2.iso2, t2.name, 'team-flag-lg')}
      </div>
    </div>

    <div class="period-section">
      <div class="year-slider-wrap">
        <div class="year-slider-label" id="year-label-cmp">
          ${t('year_slider_label', cmpYearMin, cmpYearMax, 0)}
        </div>
        <div class="controls-inline-row">
          <div id="noui-cmp" style="flex:1;margin:0 10px 0 0"></div>
          <button class="period-btn ${cmpQualifsMode ? 'active' : ''}" id="btn-qualifs-cmp">
            ${t('btn_qualifs_cdm')}
          </button>
        </div>
      </div>
    </div>

    <div id="compare-content"></div>`;

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

  const nouiCmp   = app.querySelector('#noui-cmp');
  const qualBtnCmp = app.querySelector('#btn-qualifs-cmp');

  if (nouiCmp && typeof noUiSlider !== 'undefined') {
    noUiSlider.create(nouiCmp, {
      start: [cmpYearMin, cmpYearMax],
      connect: true, step: 1,
      range: { min: 1872, max: 2026 },
    });
    nouiCmp.noUiSlider.on('slide', (values) => {
      cmpYearMin = Math.round(+values[0]);
      cmpYearMax = Math.round(+values[1]);
      cmpQualifsMode = false;
      qualBtnCmp?.classList.remove('active');
      applyCmpFilters();
    });
  }
  qualBtnCmp?.addEventListener('click', () => {
    cmpQualifsMode = !cmpQualifsMode;
    qualBtnCmp.classList.toggle('active', cmpQualifsMode);
    applyCmpFilters();
  });
}

// ── VIEW: Classement Elo (48 équipes WC) ─────────────────────────────
async function renderRankings() {
  const app = document.getElementById('app');
  const myToken = navToken;
  const maxElo = DATA.rankings[0]?.elo || 1800;

  const initialRows = DATA.rankings.map((tk, i) => {
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

  const explainerHtml = `
    <p style="text-align:center;margin-bottom:20px;font-size:.85rem;color:var(--muted)">
      ${LANG === 'fr'
        ? '→ <a href="#/data" style="color:var(--accent)">Voir le détail du calcul Elo (page Données)</a>'
        : '→ <a href="#/data" style="color:var(--accent)">See Elo calculation details (Data page)</a>'}
    </p>`;

  app.innerHTML = `
    <div class="page-header">
      <h1>${t('elo_h1')}</h1>
      <p>${t('elo_sub')}</p>
      ${explainerHtml}
    </div>
    <div class="race-section">
      <h2 style="margin-bottom:8px">
        ${LANG === 'fr' ? 'Évolution historique du classement Elo (1872–2026)' : 'Historical Elo ranking evolution (1872–2026)'}
      </h2>
      <p style="color:var(--muted);font-size:.9rem;margin-bottom:16px">
        ${LANG === 'fr'
          ? 'Animation Line Chart Race — évolution du score Elo des 10 meilleures équipes WC 2026 depuis 1872.'
          : 'Line Chart Race animation — Elo score evolution of the top 10 WC 2026 teams since 1872.'}
      </p>
      <div class="race-speed-btns">
        <span style="font-size:.8rem;color:var(--muted)">${LANG === 'fr' ? 'Vitesse' : 'Speed'} :</span>
        <button class="speed-btn active" data-rate="1">1×</button>
        <button class="speed-btn" data-rate="1.5">1.5×</button>
        <button class="speed-btn" data-rate="2">2×</button>
      </div>
      <video class="elo-race-video" id="elo-race-video" muted playsinline controls
             src="./data/elo_line_race.mp4"
             onerror="this.closest('.race-section').style.display='none'">
      </video>
    </div>
    <h2 style="font-size:1.3rem;font-weight:700;margin-top:40px;margin-bottom:12px">
      ${LANG === 'fr' ? 'Détail du classement' : 'Ranking Detail'}
    </h2>
    <div class="fifa-controls">
      <label class="fifa-year-label" for="elo-year-slider">
        ${LANG === 'fr' ? 'Année' : 'Year'} :
      </label>
      <span id="elo-year-display" style="font-weight:700;color:var(--text);min-width:40px">2025</span>
      <input type="range" id="elo-year-slider"
             min="1872" max="2025" step="1" value="2025"
             style="flex:1;max-width:260px;accent-color:var(--accent)">
    </div>
    <div class="table-wrap">
      <table class="rankings-table">
        <thead><tr>
          <th>#</th><th></th><th>${t('th_team')}</th><th>${t('th_group')}</th><th>${t('th_elo_score')}</th>
        </tr></thead>
        <tbody id="elo-table-body">${initialRows}</tbody>
      </table>
    </div>`;

  const video = app.querySelector('#elo-race-video');
  app.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (video) video.playbackRate = parseFloat(btn.dataset.rate);
      app.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  await ensureEloHistory();
  if (navToken !== myToken) return;

  const sliderEl  = document.getElementById('elo-year-slider');
  const displayEl = document.getElementById('elo-year-display');
  if (!sliderEl) return;

  sliderEl.addEventListener('input', () => {
    const year     = parseInt(sliderEl.value, 10);
    const tbody    = document.getElementById('elo-table-body');
    const snapshot = DATA.eloHistory?.snapshots?.find(s => s.year === year)
      || DATA.eloHistory?.snapshots?.reduce((prev, curr) =>
          Math.abs(curr.year - year) < Math.abs(prev.year - year) ? curr : prev);
    if (!snapshot) return;
    displayEl.textContent = String(snapshot.year);
    const maxE = snapshot.rankings[0]?.elo || 1800;
    tbody.innerHTML = snapshot.rankings.map((tk, i) => {
      const barW      = Math.round((tk.elo / maxE) * 100);
      const rankClass = i < 3 ? `rank-${i + 1}` : '';
      const wctk      = DATA.rankings.find(r => r.name === tk.name);
      const iso2      = wctk?.iso2 || '';
      const slug      = wctk?.slug || '';
      const nameHtml  = slug
        ? `<a href="#/team/${encodeURIComponent(slug)}">${dn(tk.name)}</a>`
        : dn(tk.name);
      return `<tr class="${rankClass}">
        <td class="rank-num">${tk.rank}</td>
        <td>${flagImg(iso2, tk.name, 'flag-sm')}</td>
        <td>${nameHtml}</td>
        <td style="color:var(--muted)"></td>
        <td>
          <div class="elo-bar-wrap">
            <div class="elo-bar" style="width:${barW}px;max-width:160px"></div>
            <span class="elo-num">${tk.elo}</span>
          </div>
        </td>
      </tr>`;
    }).join('');
  });
}

// ── VIEW: Classement FIFA ─────────────────────────────────────────────
async function renderFifaRankings() {
  const app = document.getElementById('app');
  const myToken = navToken;
  app.innerHTML = `<div class="splash"><div class="spinner"></div><p>${t('fifa_loading')}</p></div>`;

  let data;
  try {
    data = await fetch('./data/fifa_ranking.json').then(r => r.json());
    if (navToken !== myToken) return;
  } catch (e) {
    app.innerHTML = `
      <div class="page-header"><h1>${t('fifa_h1')}</h1></div>
      <div class="no-data">${t('fifa_no_data')}</div>`;
    return;
  }

  const currentRankings = data.rankings || [];
  const currentDateStr  = data.ranking_date || data.updated_at?.slice(0, 10) || '—';

  function buildRows(rankingList, maxPts, showChange) {
    return rankingList.map((team, i) => {
      const barW    = Math.round((team.points / maxPts) * 160);
      const rankCls = i < 3 ? `rank-${i + 1}` : '';
      const chgHtml = showChange
        ? (team.change > 0
            ? `<span class="rank-chg up">▲${team.change}</span>`
            : team.change < 0
              ? `<span class="rank-chg down">▼${Math.abs(team.change)}</span>`
              : `<span class="rank-chg eq">—</span>`)
        : '';
      const teamSlug    = slugify(team.name);
      const hasTeamData = DATA.teams && DATA.teams[teamSlug];
      const nameHtml    = hasTeamData
        ? `<a href="#/team/${encodeURIComponent(teamSlug)}">${dn(team.name)}</a>`
        : dn(team.name);
      return `<tr class="${rankCls}">
        <td class="rank-num" style="white-space:nowrap">${team.rank}&thinsp;${chgHtml}</td>
        <td>${flagImg(team.iso2, team.name, 'flag-sm')}</td>
        <td>${nameHtml}</td>
        <td style="color:var(--muted);font-size:.8rem">${team.confederation}</td>
        <td>
          <div class="elo-bar-wrap">
            <div class="elo-bar" style="width:${barW}px;max-width:160px;background:var(--blue)"></div>
            <span class="elo-num">${Number(team.points).toFixed(1)}</span>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  app.innerHTML = `
    <div class="page-header">
      <h1>${t('fifa_h1')}</h1>
      <p id="fifa-sub-label">${t('fifa_sub', currentRankings.length, currentDateStr, data.source || 'FIFA')}</p>
    </div>
    <div class="race-section">
      <h2 style="margin-bottom:8px">
        ${LANG === 'fr' ? 'Évolution du classement FIFA (1992–2026)' : 'FIFA ranking evolution (1992–2026)'}
      </h2>
      <p style="color:var(--muted);font-size:.9rem;margin-bottom:16px">
        ${LANG === 'fr'
          ? 'Animation Bar Chart Race — points FIFA annuels des 30 meilleures sélections.'
          : 'Bar Chart Race animation — annual FIFA points for the top 30 national teams.'}
      </p>
      <div class="race-speed-btns">
        <span style="font-size:.8rem;color:var(--muted)">${LANG === 'fr' ? 'Vitesse' : 'Speed'} :</span>
        <button class="speed-btn active" data-rate="1">1×</button>
        <button class="speed-btn" data-rate="1.5">1.5×</button>
        <button class="speed-btn" data-rate="2">2×</button>
      </div>
      <video class="elo-race-video" id="fifa-race-video" muted playsinline controls
             src="./data/fifa_race.mp4"
             onerror="this.closest('.race-section').style.display='none'">
      </video>
    </div>
    <h2 style="font-size:1.3rem;font-weight:700;margin-top:40px;margin-bottom:12px">
      ${LANG === 'fr' ? 'Détail du classement' : 'Ranking Detail'}
    </h2>
    <div class="fifa-controls">
      <label class="fifa-year-label" for="fifa-year-slider">
        ${LANG === 'fr' ? 'Année' : 'Year'} :
      </label>
      <span id="fifa-year-display" style="font-weight:700;color:var(--text);min-width:40px">
        ${currentDateStr}
      </span>
      <input type="range" id="fifa-year-slider"
             min="1992" max="2026" step="1" value="2026"
             style="flex:1;max-width:260px;accent-color:var(--accent)">
    </div>
    <div class="table-wrap">
      <table class="rankings-table">
        <thead><tr>
          <th>#</th><th></th><th>${t('th_team')}</th><th>${t('th_confederation')}</th><th>${t('th_fifa_pts')}</th>
        </tr></thead>
        <tbody id="fifa-table-body">${buildRows(currentRankings, currentRankings[0]?.points || 1, true)}</tbody>
      </table>
    </div>`;

  const fifaVideo = app.querySelector('#fifa-race-video');
  app.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (fifaVideo) fifaVideo.playbackRate = parseFloat(btn.dataset.rate);
      app.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  await ensureFifaHistory();
  if (navToken !== myToken) return;

  const sliderEl  = document.getElementById('fifa-year-slider');
  const displayEl = document.getElementById('fifa-year-display');
  if (!sliderEl) return;

  sliderEl.addEventListener('input', () => {
    const year  = parseInt(sliderEl.value, 10);
    const tbody = document.getElementById('fifa-table-body');
    const sub   = document.getElementById('fifa-sub-label');
    if (year === 2026) {
      displayEl.textContent = currentDateStr;
      tbody.innerHTML = buildRows(currentRankings, currentRankings[0]?.points || 1, true);
      sub.textContent = t('fifa_sub', currentRankings.length, currentDateStr, data.source || 'FIFA');
    } else {
      const snapshot = DATA.fifaHistory?.snapshots?.find(s => s.year === year)
        || DATA.fifaHistory?.snapshots?.reduce((prev, curr) =>
            Math.abs(curr.year - year) < Math.abs(prev.year - year) ? curr : prev);
      if (snapshot) {
        displayEl.textContent = String(snapshot.year);
        const maxP = snapshot.rankings[0]?.points || 1;
        tbody.innerHTML = buildRows(snapshot.rankings, maxP, false);
        const topN = DATA.fifaHistory.top_n || 30;
        sub.textContent = LANG === 'fr'
          ? `Top ${topN} sélections · ${snapshot.date}`
          : `Top ${topN} teams · ${snapshot.date}`;
      }
    }
  });
}

// ── VIEW: Données ─────────────────────────────────────────────────────
function renderData() {
  const app = document.getElementById('app');

  const datasets = LANG === 'en' ? [
    { file: 'fixtures.json',     label: 'WC 2026 Matches',       desc: '72 group stage matches: dates, cities, teams, Elo score.',                                                                                          icon: '📅', type: 'JSON' },
    { file: 'teams.json',        label: 'Team profiles',          desc: '48 qualified teams: stats by period (since 1872, WC qualifiers), last 30 matches, Elo score calculated since 1872.',                              icon: '🏳️', type: 'JSON' },
    { file: 'groups.json',       label: 'Groups',                 desc: '12 groups with squad composition and Elo score for each team.',                                                                                     icon: '📋', type: 'JSON' },
    { file: 'rankings.json',     label: 'Elo Ranking',            desc: '48 teams ranked by Elo score (calculated from complete international football history since 1872).',                                     icon: '📊', type: 'JSON' },
    { file: 'fifa_ranking.json', label: 'FIFA Ranking',           desc: 'Official FIFA ranking (211 national teams) with points and confederation.',                                                                         icon: '🏆', type: 'JSON' },
    { file: 'results.csv',       label: 'Historical results',     desc: 'Complete history of international football since 1872 — 49,329 matches covering all competitions since their creation: FIFA World Cup, Euro, Copa América, AFCON, Nations League, qualifiers, friendlies…', icon: '📰', type: 'CSV'  },
  ] : [
    { file: 'fixtures.json',     label: 'Matchs WC 2026',         desc: '72 matchs de phase de groupes : dates, villes, équipes, score Elo.',                                                                               icon: '📅', type: 'JSON' },
    { file: 'teams.json',        label: 'Fiches équipes',          desc: '48 équipes qualifiées : stats par période (depuis 1872, qualifs CDM), 30 derniers matchs, score Elo calculé depuis 1872.',                        icon: '🏳️', type: 'JSON' },
    { file: 'groups.json',       label: 'Groupes',                 desc: '12 groupes avec la composition et le score Elo de chaque équipe.',                                                                                 icon: '📋', type: 'JSON' },
    { file: 'rankings.json',     label: 'Classement Elo',          desc: '48 équipes classées par score Elo (calculé sur l\'historique complet du football international depuis 1872).',                                     icon: '📊', type: 'JSON' },
    { file: 'fifa_ranking.json', label: 'Classement FIFA',         desc: 'Classement FIFA officiel (211 sélections) avec points et confédération.',                                                                          icon: '🏆', type: 'JSON' },
    { file: 'results.csv',       label: 'Résultats historiques',   desc: 'Historique complet du football international depuis 1872 — 49 329 matchs couvrant toutes les compétitions depuis leur création : Coupe du Monde, Euro, Copa América, CAN, Ligue des Nations, qualifications, amicaux…',  icon: '📰', type: 'CSV'  },
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
    </ul>
  `;

  const eloMethodHtml = LANG === 'en' ? `
    <ul>
      <li>
        Ranking system adapted to football, calculated from all <strong>49,329 matches since 1872</strong>.
        Each team starts at <strong>1,500 pts</strong>. After each match, points are exchanged
        based on the result and the Elo gap between the two teams.
      </li>
      <li>
        <strong>K-factors</strong>: FIFA World Cup ×60 · Euro/Copa América/AFCON/Asia Cup ×50 ·
        Qualifiers / Nations League ×35 · Friendlies ×20.
      </li>
      <li>
        <strong>Home advantage</strong>: +75 pts added to the home team's expected score (cancelled on neutral ground).
      </li>
      <li>
        <strong>Initial score</strong>: 1,500 pts per team.
      </li>
      <li>
        Inspired by the
        <a href="https://fr.wikipedia.org/wiki/Classement_mondial_de_football_Elo" target="_blank" class="ext-link">Elo world football ranking (Wikipedia)</a>.
      </li>
    </ul>
  ` : `
    <ul>
      <li>
        Système de classement adapté au football, calculé sur l'ensemble des <strong>49 329 matchs depuis 1872</strong>.
        Chaque équipe démarre à <strong>1 500 pts</strong>. Après chaque match, les points sont échangés
        selon le résultat et l'écart Elo entre les deux équipes.
      </li>
      <li>
        <strong>K-facteurs</strong> : Coupe du Monde ×60 · Euro/Copa América/CAN/Coupe d'Asie ×50 ·
        Qualifications / Nations League ×35 · Amicaux ×20.
      </li>
      <li>
        <strong>Avantage domicile</strong> : +75 pts ajoutés au score attendu de l'équipe à domicile (annulé sur terrain neutre).
      </li>
      <li>
        <strong>Score initial</strong> : 1 500 pts par équipe.
      </li>
      <li>
        Inspiré du
        <a href="https://fr.wikipedia.org/wiki/Classement_mondial_de_football_Elo" target="_blank" class="ext-link">classement mondial de football Elo (Wikipédia)</a>.
      </li>
    </ul>
  `;

  app.innerHTML = `
    <div class="page-header">
      <h1>${t('data_h1')}</h1>
      <p>${t('data_sub')}</p>
    </div>

    <div class="data-grid">${cards}</div>

    <div class="source-section">
      <h3>${t('sources_h3')}</h3>
      ${sourcesHtml}
    </div>

    <div class="source-section" style="margin-top:16px">
      <h3>${LANG === 'fr' ? 'Calcul Elo' : 'Elo Calculation'}</h3>
      ${eloMethodHtml}
    </div>`;
}

// ── Quiz Drapeaux ─────────────────────────────────────────────────────
function renderQuiz() {
  const app = document.getElementById('app');
  const teams = [...DATA.rankings].sort(() => Math.random() - 0.5);
  const allNames = DATA.rankings.map(tk => dn(tk.name));

  let currentIdx = 0;
  let score = 0;
  const results = [];

  function renderCard() {
    if (currentIdx >= teams.length) { renderFinal(); return; }
    const tk = teams[currentIdx];
    app.innerHTML = `
      <div class="quiz-wrapper">
        <div class="quiz-progress">
          <span>${currentIdx + 1} / ${teams.length}</span>
        </div>
        <div class="quiz-card">
          <img class="quiz-flag" src="${FLAG_BASE}${tk.iso2}.png" alt="?">
        </div>
        <div class="quiz-input-row">
          <div class="quiz-autocomplete-wrap">
            <input type="text" id="quiz-input" class="quiz-input"
                   placeholder="${t('quiz_placeholder')}"
                   autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            <div class="quiz-suggestions" id="quiz-suggestions"></div>
          </div>
          <button id="quiz-validate" class="period-btn active">${t('quiz_validate')}</button>
          <button id="quiz-skip" class="period-btn">${t('quiz_skip')}</button>
        </div>
      </div>`;

    const input    = app.querySelector('#quiz-input');
    const suggests = app.querySelector('#quiz-suggestions');
    input?.focus();

    function closeSuggestions() { if (suggests) suggests.innerHTML = ''; }

    function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

    input?.addEventListener('input', () => {
      const val = norm(input.value.trim());
      if (!val || !suggests) { closeSuggestions(); return; }
      const hits = allNames.filter(n => norm(n).startsWith(val)).slice(0, 8);
      suggests.innerHTML = hits.map(n =>
        `<div class="quiz-suggest-item" data-name="${n}">${n}</div>`
      ).join('');
    });

    suggests?.addEventListener('mousedown', e => {
      const item = e.target.closest('.quiz-suggest-item');
      if (item) { input.value = item.dataset.name; closeSuggestions(); }
    });
    suggests?.addEventListener('touchend', e => {
      const item = e.target.closest('.quiz-suggest-item');
      if (item) { e.preventDefault(); input.value = item.dataset.name; closeSuggestions(); input.focus(); }
    });

    function validate() {
      closeSuggestions();
      const answer = input.value.trim();
      const correct = dn(tk.name);
      const isCorrect = answer.toLowerCase() === correct.toLowerCase()
        || answer.toLowerCase() === tk.name.toLowerCase();
      results.push({ name: tk.name, iso2: tk.iso2, correct: isCorrect, userAnswer: answer });
      if (isCorrect) score++;
      currentIdx++;
      renderCard();
    }

    app.querySelector('#quiz-validate')?.addEventListener('click', validate);
    app.querySelector('#quiz-skip')?.addEventListener('click', () => {
      closeSuggestions();
      results.push({ name: tk.name, iso2: tk.iso2, correct: false, userAnswer: '' });
      currentIdx++;
      renderCard();
    });
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') validate();
      if (e.key === 'Escape') closeSuggestions();
    });
  }

  function renderFinal() {
    const url = 'https://romainfjgaspard.github.io/pronostics_wc2026/';
    const shareText = t('quiz_share_text', score);
    const wrongOnes = results.filter(r => !r.correct);

    app.innerHTML = `
      <div class="quiz-wrapper">
        <div class="quiz-final-score">${t('quiz_final_title', score)}</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:20px 0">
          <button class="period-btn active" id="quiz-share-btn">${t('quiz_share')}</button>
          <button class="period-btn" onclick="location.hash='#/quiz'">${t('quiz_restart')}</button>
        </div>
        ${wrongOnes.length ? `
          <h3 style="font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">
            ${LANG === 'fr' ? 'À retenir' : 'Missed'}
          </h3>
          <div class="quiz-results-grid">
            ${wrongOnes.map(r => `
              <div class="quiz-result-item">
                ${flagImg(r.iso2, r.name, 'quiz-result-flag')}
                <span>${dn(r.name)}</span>
              </div>`).join('')}
          </div>` : ''}
      </div>`;

    app.querySelector('#quiz-share-btn')?.addEventListener('click', () => {
      const fullText = `${shareText}\n${url}`;
      if (navigator.share) {
        navigator.share({ text: fullText });
      } else {
        navigator.clipboard.writeText(fullText);
        const btn = app.querySelector('#quiz-share-btn');
        if (btn) { btn.textContent = '✓ Copié !'; setTimeout(() => btn.textContent = t('quiz_share'), 2000); }
      }
    });
  }

  renderCard();
}

// ── Share ─────────────────────────────────────────────────────────────
function sharesite() {
  const url = 'https://romainfjgaspard.github.io/pronostics_wc2026/';
  if (navigator.share) {
    navigator.share({
      title: 'WC 2026 — Données & Statistiques',
      text: 'Stats CDM 2026 : Elo depuis 1872, classements FIFA, comparaisons équipes',
      url,
    });
  } else {
    navigator.clipboard.writeText(url);
    const btn = document.getElementById('share-btn');
    if (btn) { btn.textContent = '✓'; setTimeout(() => btn.textContent = '🔗', 2000); }
  }
}

// ── Utility: slugify ─────────────────────────────────────────────────
function slugify(name) {
  const s = name.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Boot ─────────────────────────────────────────────────────────────
init();
