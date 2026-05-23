/* =====================================================================
   WC 2026 — Données  |  app.js
   SPA avec hash-routing  (#/ | #/team/{slug} | #/rankings | #/fifa-ranking | #/data)
===================================================================== */

// ── State ────────────────────────────────────────────────────────────
let DATA = null;  // { fixtures, teams, groups, rankings }
let currentSlug = null;
let sliderPeriod = 15;

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
    window.addEventListener('hashchange', route);
    route();
  } catch (e) {
    document.getElementById('app').innerHTML =
      `<div class="splash"><p>⚠️ Impossible de charger les données.<br>
       Vérifiez que le serveur local tourne et que les JSON sont présents.</p></div>`;
    console.error(e);
  }
}

// ── Router ───────────────────────────────────────────────────────────
function route() {
  const hash = location.hash.slice(1) || '/';
  setActiveNav(hash);

  if (hash.startsWith('/team/')) {
    renderTeam(decodeURIComponent(hash.slice(6)));
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
      ((hash === '/' || hash.startsWith('/team/')) && p === 'fixtures') ||
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
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
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
  if (!s) return `<div class="no-data">Aucune donnée pour cette période</div>`;
  const gp = s.GP;
  const wBar = gp ? ((s.W / gp) * 100) : 0;
  const dBar = gp ? ((s.D / gp) * 100) : 0;
  const lBar = gp ? ((s.L / gp) * 100) : 0;

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${gp}</div>
        <div class="stat-label">Matchs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value win">${s.W}</div>
        <div class="stat-label">Victoires</div>
        <div class="wdl-bar">
          <div class="w" style="width:${wBar}%"></div>
          <div class="d" style="width:${dBar}%"></div>
          <div class="l" style="width:${lBar}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-value draw">${s.D}</div>
        <div class="stat-label">Nuls</div>
      </div>
      <div class="stat-card">
        <div class="stat-value loss">${s.L}</div>
        <div class="stat-label">Défaites</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--win)">${s.avg_gf}</div>
        <div class="stat-label">Buts/match marqués</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--loss)">${s.avg_ga}</div>
        <div class="stat-label">Buts/match encaissés</div>
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
          <span class="team-name">${t.name}</span>
          <span class="elo-badge">${t.elo}</span>
        </a>
      </div>`).join('');

    const matchesHtml = matches.map(m => `
      <div class="match-card">
        <div class="match-date">${formatDate(m.date)}${m.city ? ' · ' + m.city : ''}</div>
        <div class="match-teams">
          <div class="match-team home">
            <span>${m.home}</span>
            <a href="#/team/${encodeURIComponent(slugify(m.home))}">
              ${flagImg(m.home_iso2, m.home, 'flag-sm')}
            </a>
          </div>
          <div class="match-vs">vs</div>
          <div class="match-team away">
            <a href="#/team/${encodeURIComponent(slugify(m.away))}">
              ${flagImg(m.away_iso2, m.away, 'flag-sm')}
            </a>
            <span>${m.away}</span>
          </div>
        </div>
      </div>`).join('<hr style="border:none;border-top:1px solid var(--border);margin:4px 0">');

    groupsHtml += `
      <div class="group-card">
        <div class="group-card-header">Groupe ${letter}</div>
        <div class="group-teams">${teamsHtml}</div>
        <div class="group-matches">${matchesHtml}</div>
      </div>`;
  }

  app.innerHTML = `
    <div class="page-header">
      <h1>Coupe du Monde 2026</h1>
      <p>Canada · États-Unis · Mexique &nbsp;|&nbsp; Juin – Juillet 2026 &nbsp;|&nbsp; 48 équipes · 12 groupes</p>
    </div>
    <div class="groups-grid">${groupsHtml}</div>`;
}

// ── VIEW: Team ────────────────────────────────────────────────────────
function renderTeam(slug) {
  const app  = document.getElementById('app');
  const team = DATA.teams[slug];

  if (!team) {
    app.innerHTML = `<a href="#/" class="back-btn">← Retour</a>
      <div class="no-data">Équipe introuvable : <strong>${slug}</strong></div>`;
    return;
  }

  currentSlug = slug;

  app.innerHTML = `
    <a href="#/" class="back-btn">← Retour aux matchs</a>

    <div class="team-header">
      ${flagImg(team.iso2, team.name, 'team-flag-lg')}
      <div class="team-title">
        <h1>${team.name}</h1>
        <div class="team-meta">
          <span class="badge badge-group">Groupe ${team.group}</span>
          <span class="badge badge-elo">Elo ${team.elo}</span>
        </div>
      </div>
    </div>

    <div class="period-section">
      <h3>Période d'analyse</h3>
      <div class="period-btns">
        <button class="period-btn active" data-period="all">Depuis 2022</button>
        <button class="period-btn" data-period="2025">2025</button>
        <button class="period-btn" data-period="2026">2026</button>
        <button class="period-btn" data-period="qualifs">Qualifs CDM</button>
      </div>
      <div class="slider-row">
        <label>Derniers&nbsp;<strong id="slider-count">${sliderPeriod}</strong>&nbsp;matchs</label>
        <input type="range" id="period-slider" min="5" max="${Math.min(30, team.matches.length || 30)}"
               value="${sliderPeriod}">
      </div>
    </div>

    <div id="stats-display"></div>

    <div class="form-section">
      <h3>Forme récente (10 derniers)</h3>
      <div class="form-badges">
        ${(team.matches || []).slice(0, 10).map(m => resultBadge(m.result)).join('')}
      </div>
    </div>

    <div class="matches-section">
      <h3>Résultats récents</h3>
      <div class="table-wrap">
        ${buildMatchesTable(team.matches || [])}
      </div>
    </div>`;

  updateStats(team, 'all');

  app.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      app.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateStats(team, btn.dataset.period);
    });
  });

  const slider = app.querySelector('#period-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      sliderPeriod = parseInt(slider.value);
      document.getElementById('slider-count').textContent = sliderPeriod;
      app.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      const stats = computeStatsFrom((team.matches || []).slice(0, sliderPeriod));
      document.getElementById('stats-display').innerHTML = renderStatsGrid(stats);
    });
  }
}

function updateStats(team, period) {
  const stats = period === 'all'     ? team.stats.all
              : period === '2025'    ? team.stats['2025']
              : period === '2026'    ? team.stats['2026']
              : period === 'qualifs' ? team.stats.qualifs
              : null;
  document.getElementById('stats-display').innerHTML = renderStatsGrid(stats);
}

function buildMatchesTable(matches) {
  if (!matches.length) return '<div class="no-data">Aucun résultat disponible</div>';

  const rows = matches.map(m => {
    const loc   = m.home ? '<span class="home-tag">DOM</span>' : '';
    const score = `${m.scored} – ${m.conceded}`;
    return `<tr>
      <td>${formatDate(m.date)}</td>
      <td><div class="opponent-cell">
        ${flagImg(m.opp_iso2, m.opponent, 'flag-opponent')}
        <a href="#/team/${encodeURIComponent(slugify(m.opponent))}">${m.opponent}</a>
        ${loc}
      </div></td>
      <td class="score-cell ${m.result}">${score}</td>
      <td><span class="competition-tag" title="${m.tournament}">${m.tournament}</span></td>
    </tr>`;
  }).join('');

  return `<table class="matches-table">
    <thead><tr>
      <th>Date</th><th>Adversaire</th><th>Score</th><th>Compétition</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ── VIEW: Classement Elo (48 équipes WC) ─────────────────────────────
function renderRankings() {
  const app = document.getElementById('app');
  const maxElo = DATA.rankings[0]?.elo || 1800;

  const rows = DATA.rankings.map((t, i) => {
    const barW = Math.round((t.elo / maxElo) * 100);
    const rankClass = i < 3 ? `rank-${i + 1}` : '';
    return `<tr class="${rankClass}">
      <td class="rank-num">${i + 1}</td>
      <td>${flagImg(t.iso2, t.name, 'flag-sm')}</td>
      <td><a href="#/team/${encodeURIComponent(t.slug)}">${t.name}</a></td>
      <td style="color:var(--muted)">Groupe ${t.group}</td>
      <td>
        <div class="elo-bar-wrap">
          <div class="elo-bar" style="width:${barW}px;max-width:160px"></div>
          <span class="elo-num">${t.elo}</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  app.innerHTML = `
    <div class="page-header">
      <h1>Classement Elo — 48 équipes</h1>
      <p>Score de forme calculé sur les matchs internationaux depuis janvier 2022</p>
    </div>
    <div class="info-banner">
      L'Elo est un indicateur de niveau basé sur les résultats récents (WC 2022, Euro 2024,
      Copa América 2024, qualifications, matchs amicaux…). Il reflète la forme des équipes
      sur la période, pas un pronostic de victoire.
    </div>
    <div class="table-wrap">
      <table class="rankings-table">
        <thead><tr>
          <th>#</th><th></th><th>Équipe</th><th>Groupe</th><th>Score Elo</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── VIEW: Classement FIFA ─────────────────────────────────────────────
async function renderFifaRankings() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="splash"><div class="spinner"></div><p>Chargement classement FIFA…</p></div>`;

  let data;
  try {
    data = await fetch('./data/fifa_ranking.json').then(r => r.json());
  } catch (e) {
    app.innerHTML = `
      <div class="page-header"><h1>Classement FIFA</h1></div>
      <div class="no-data">
        Données non disponibles.<br>
        Lancez <code>python fetch_fifa_ranking.py</code> pour les générer.
      </div>`;
    return;
  }

  const rankings = data.rankings || [];
  const maxPts   = rankings[0]?.points || 1900;
  const dateStr  = data.ranking_date || data.updated_at?.slice(0, 10) || '—';

  const rows = rankings.map((t, i) => {
    const barW   = Math.round((t.points / maxPts) * 160);
    const rankCls = i < 3 ? `rank-${i + 1}` : '';
    const chg    = t.change;
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
      <td class="rank-num">${t.rank}</td>
      <td>${chgHtml}</td>
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
      <h1>Classement FIFA Masculin</h1>
      <p>${rankings.length} sélections · Mise à jour : ${dateStr} · Source : ${data.source || 'FIFA'}</p>
    </div>
    <div class="table-wrap">
      <table class="rankings-table">
        <thead><tr>
          <th>#</th><th></th><th></th><th>Équipe</th><th>Confédération</th><th>Points FIFA</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── VIEW: Données ─────────────────────────────────────────────────────
function renderData() {
  const app = document.getElementById('app');

  const datasets = [
    {
      file: 'fixtures.json',
      label: 'Matchs WC 2026',
      desc: '72 matchs de phase de groupes : dates, villes, équipes, score Elo.',
      icon: '📅',
      type: 'JSON',
    },
    {
      file: 'teams.json',
      label: 'Fiches équipes',
      desc: '48 équipes qualifiées : stats par période (depuis 2022, 2025, 2026, qualifs), 30 derniers matchs, score Elo.',
      icon: '🏳️',
      type: 'JSON',
    },
    {
      file: 'groups.json',
      label: 'Groupes',
      desc: '12 groupes avec la composition et le score Elo de chaque équipe.',
      icon: '📋',
      type: 'JSON',
    },
    {
      file: 'rankings.json',
      label: 'Classement Elo',
      desc: '48 équipes classées par score Elo (indicateur de forme, basé sur les résultats depuis 2022).',
      icon: '📊',
      type: 'JSON',
    },
    {
      file: 'fifa_ranking.json',
      label: 'Classement FIFA',
      desc: 'Classement FIFA officiel (211 sélections) avec points et confederation.',
      icon: '🏆',
      type: 'JSON',
    },
    {
      file: 'results.csv',
      label: 'Résultats historiques',
      desc: 'Tous les matchs internationaux depuis janvier 2022 (WC 2022, Euro 2024, Copa América, CAN, qualifications, amicaux…).',
      icon: '📰',
      type: 'CSV',
    },
  ];

  const cards = datasets.map(d => `
    <div class="data-card">
      <div class="data-card-header">
        <span class="data-icon">${d.icon}</span>
        <div>
          <div class="data-label">${d.label}</div>
          <span class="data-type-badge">${d.type}</span>
        </div>
        <a class="dl-btn" href="./data/${d.file}" download="${d.file}">Télécharger</a>
      </div>
      <p class="data-desc">${d.desc}</p>
      <code class="data-filename">data/${d.file}</code>
    </div>`).join('');

  app.innerHTML = `
    <div class="page-header">
      <h1>Données</h1>
      <p>Tous les fichiers sont au format ouvert (JSON / CSV) — libres de réutilisation.</p>
    </div>

    <div class="data-grid">${cards}</div>

    <div class="source-section">
      <h3>Sources</h3>
      <ul>
        <li>Résultats historiques : <a href="https://github.com/martj42/international_results" target="_blank" class="ext-link">martj42/international_results</a> (CC0)</li>
        <li>Classement FIFA : <a href="https://inside.fifa.com/fr/fifa-world-ranking/men" target="_blank" class="ext-link">inside.fifa.com</a> via API / <a href="https://github.com/cnc8/fifa-world-ranking" target="_blank" class="ext-link">cnc8/fifa-world-ranking</a> (fallback)</li>
        <li>Score Elo : calcul maison sur K-facteurs WC×60, tournois×50, qualifs×35, amicaux×20</li>
      </ul>
    </div>`;
}

// ── Utility: slugify ─────────────────────────────────────────────────
function slugify(name) {
  const s = name.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Boot ─────────────────────────────────────────────────────────────
init();
