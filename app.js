/* =====================================================================
   WC 2026 — Données  |  app.js
   Routing: #/ | #/team/{slug} | #/teams | #/compare/{s1}/{s2}
          | #/rankings | #/fifa-ranking | #/data
===================================================================== */

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

function getTeamStats(team, period) {
  if (period === 'all')    return team.stats?.all      || null;
  if (period === '2025')   return team.stats?.['2025'] || null;
  if (period === '2026')   return team.stats?.['2026'] || null;
  if (period === 'qualifs') return team.stats?.qualifs || null;
  return null;
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
          <span class="elo-badge" title="Score Elo — indicateur de forme depuis 2022">Elo ${t.elo}</span>
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
              <span>${m.home}</span>
              ${flagImg(m.home_iso2, m.home, 'flag-sm')}
            </div>
            <div class="match-vs">vs</div>
            <div class="match-team away">
              ${flagImg(m.away_iso2, m.away, 'flag-sm')}
              <span>${m.away}</span>
            </div>
          </div>
        </div>`;
    }).join('<hr style="border:none;border-top:1px solid var(--border);margin:4px 0">');

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
      <p class="hint-text">💡 Cliquez sur une équipe pour sa fiche détaillée · Cliquez sur un match pour comparer les deux équipes</p>
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
  const stats = getTeamStats(team, period);
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

// ── VIEW: Teams ───────────────────────────────────────────────────────
function renderTeams() {
  const app = document.getElementById('app');

  const PERIODS = [
    { key: 'all',    label: 'Depuis 2022' },
    { key: '2025',   label: '2025' },
    { key: '2026',   label: '2026' },
    { key: 'qualifs', label: 'Qualifs CDM' },
  ];

  const COL_DEFS = [
    { col: 'name',  label: 'Équipe',  align: 'left' },
    { col: 'group', label: 'Grp',     align: 'center' },
    { col: 'gp',    label: 'MJ',      align: 'center' },
    { col: 'w',     label: 'V',       align: 'center' },
    { col: 'd',     label: 'N',       align: 'center' },
    { col: 'l',     label: 'D',       align: 'center' },
    { col: 'gf',    label: 'Buts+',   align: 'center' },
    { col: 'ga',    label: 'Buts−',   align: 'center' },
    { col: 'gd',    label: 'Diff',    align: 'center' },
    { col: 'elo',   label: 'Elo',     align: 'right'  },
  ];

  const maxMatches = Math.max(...Object.values(DATA.teams).map(t => t.matches?.length || 0));
  const sliderVal  = teamsSlider ?? maxMatches;

  app.innerHTML = `
    <div class="page-header">
      <h1>Les 48 équipes</h1>
      <p>Cliquez sur une équipe pour sa fiche · Cliquez sur un en-tête de colonne pour trier</p>
    </div>

    <div class="teams-controls">
      <div class="period-btns">
        ${PERIODS.map(p => `
          <button class="period-btn ${teamsPeriod === p.key && teamsSlider === null ? 'active' : ''}"
                  data-period="${p.key}">${p.label}</button>
        `).join('')}
      </div>
      <div class="slider-row">
        <label>Derniers&nbsp;<strong id="teams-slider-count">${sliderVal}</strong>&nbsp;matchs</label>
        <input type="range" id="teams-period-slider" min="5" max="${maxMatches}" value="${sliderVal}">
      </div>
      <input type="search" id="teams-search" class="teams-search" placeholder="Rechercher une équipe…" value="">
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
      if (sl) { sl.value = maxMatches; document.getElementById('teams-slider-count').textContent = maxMatches; }
      renderTeamsBody(document.getElementById('teams-search')?.value || '');
      updateTeamsSortHeaders();
    });
  });

  app.querySelector('#teams-period-slider')?.addEventListener('input', e => {
    teamsSlider = parseInt(e.target.value);
    document.getElementById('teams-slider-count').textContent = teamsSlider;
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
      <td><a href="#/team/${encodeURIComponent(t.slug)}">${t.name}</a></td>
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
    app.innerHTML = `<a href="#/" class="back-btn">← Retour aux matchs</a>
      <div class="no-data">Équipe introuvable</div>`;
    return;
  }

  const PERIODS = [
    { key: 'all',    label: 'Depuis 2022' },
    { key: '2025',   label: '2025' },
    { key: '2026',   label: '2026' },
    { key: 'qualifs', label: 'Qualifs CDM' },
  ];

  const h2h = (t1.matches || []).filter(m => slugify(m.opponent) === slug2);

  function buildContent(period) {
    const s1 = getTeamStats(t1, period) || computeStatsFrom(t1.matches || []) || {};
    const s2 = getTeamStats(t2, period) || computeStatsFrom(t2.matches || []) || {};
    const gd1 = s1.GD ?? ((s1.GF ?? 0) - (s1.GA ?? 0));
    const gd2 = s2.GD ?? ((s2.GF ?? 0) - (s2.GA ?? 0));

    const ROWS = [
      { label: 'Matchs joués',    v1: s1.GP,  v2: s2.GP,  better: 'neutral' },
      { label: 'Victoires',       v1: s1.W,   v2: s2.W,   better: 'high' },
      { label: 'Nuls',            v1: s1.D,   v2: s2.D,   better: 'neutral' },
      { label: 'Défaites',        v1: s1.L,   v2: s2.L,   better: 'low' },
      { label: 'Buts marqués',    v1: s1.GF,  v2: s2.GF,  better: 'high' },
      { label: 'Buts encaissés',  v1: s1.GA,  v2: s2.GA,  better: 'low' },
      { label: 'Différence buts', v1: gd1,    v2: gd2,    better: 'high', sign: true },
      { label: 'Score Elo',       v1: t1.elo, v2: t2.elo, better: 'high' },
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
      ? `<div class="no-data">Aucune confrontation directe trouvée depuis 2022</div>`
      : `<div class="table-wrap">${buildMatchesTable(h2h)}</div>`;

    const form1 = (t1.matches || []).slice(0, 10).map(m => resultBadge(m.result)).join('');
    const form2 = (t2.matches || []).slice(0, 10).map(m => resultBadge(m.result)).join('');

    return `
      <div class="table-wrap" style="margin-bottom:32px">
        <table class="compare-table">
          <thead><tr>
            <th class="compare-val" style="font-size:.9rem">
              ${flagImg(t1.iso2, t1.name, 'flag-sm')}&nbsp;${t1.name}
            </th>
            <th class="compare-lbl" style="color:var(--muted)">Statistique</th>
            <th class="compare-val" style="font-size:.9rem">
              ${t2.name}&nbsp;${flagImg(t2.iso2, t2.name, 'flag-sm')}
            </th>
          </tr></thead>
          <tbody>${compareRows}</tbody>
        </table>
      </div>

      <h3 style="font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">
        Confrontations directes (depuis 2022) — ${h2h.length} match${h2h.length !== 1 ? 's' : ''}
      </h3>
      ${h2hHtml}

      <div class="compare-forms">
        <div class="compare-form-col">
          <h3>Forme récente — ${t1.name}</h3>
          <div class="form-badges">${form1 || '<span style="color:var(--muted)">—</span>'}</div>
        </div>
        <div class="compare-form-col">
          <h3>Forme récente — ${t2.name}</h3>
          <div class="form-badges">${form2 || '<span style="color:var(--muted)">—</span>'}</div>
        </div>
      </div>`;
  }

  app.innerHTML = `
    <a href="#/" class="back-btn">← Retour aux matchs</a>

    <div class="compare-header">
      <div class="compare-team-hdr">
        ${flagImg(t1.iso2, t1.name, 'team-flag-lg')}
        <div>
          <div class="compare-team-name"><a href="#/team/${encodeURIComponent(slug1)}">${t1.name}</a></div>
          <div class="compare-team-meta">Groupe ${t1.group} · Elo ${t1.elo}</div>
        </div>
      </div>
      <div class="compare-vs">VS</div>
      <div class="compare-team-hdr compare-team-hdr-right">
        <div style="text-align:right">
          <div class="compare-team-name"><a href="#/team/${encodeURIComponent(slug2)}">${t2.name}</a></div>
          <div class="compare-team-meta">Groupe ${t2.group} · Elo ${t2.elo}</div>
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
      <h1>Classement FIFA Masculin</h1>
      <p>${rankings.length} sélections · Mise à jour : ${dateStr} · Source : ${data.source || 'FIFA'}</p>
    </div>
    <div class="table-wrap">
      <table class="rankings-table">
        <thead><tr>
          <th>#</th><th></th><th>Équipe</th><th>Confédération</th><th>Points FIFA</th>
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
      icon: '📅', type: 'JSON',
    },
    {
      file: 'teams.json',
      label: 'Fiches équipes',
      desc: '48 équipes qualifiées : stats par période (depuis 2022, 2025, 2026, qualifs), 30 derniers matchs, score Elo.',
      icon: '🏳️', type: 'JSON',
    },
    {
      file: 'groups.json',
      label: 'Groupes',
      desc: '12 groupes avec la composition et le score Elo de chaque équipe.',
      icon: '📋', type: 'JSON',
    },
    {
      file: 'rankings.json',
      label: 'Classement Elo',
      desc: '48 équipes classées par score Elo (indicateur de forme, basé sur les résultats depuis 2022).',
      icon: '📊', type: 'JSON',
    },
    {
      file: 'fifa_ranking.json',
      label: 'Classement FIFA',
      desc: 'Classement FIFA officiel (211 sélections) avec points et confédération.',
      icon: '🏆', type: 'JSON',
    },
    {
      file: 'results.csv',
      label: 'Résultats historiques',
      desc: 'Tous les matchs internationaux depuis janvier 2022 (WC 2022, Euro 2024, Copa América, CAN, qualifications, amicaux…).',
      icon: '📰', type: 'CSV',
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

    <div class="info-banner">
      <strong>Résultats historiques</strong> —
      <a href="https://github.com/martj42/international_results" target="_blank" class="ext-link">martj42/international_results</a>
      (CC0, mis à jour en continu) · 3 970 matchs depuis janvier 2022.
      &nbsp;&nbsp;<strong>Classement FIFA</strong> — API officielle
      <a href="https://inside.fifa.com/fr/fifa-world-ranking/men" target="_blank" class="ext-link">inside.fifa.com</a>
      · 211 sélections · avril 2026 · France #1.
      &nbsp;&nbsp;<strong>Score Elo</strong> — calcul maison sur K-facteurs
      WC×60 · tournois×50 · qualifs×35 · amicaux×20.
    </div>

    <div class="data-grid">${cards}</div>

    <div class="source-section">
      <h3>Sources détaillées</h3>
      <ul>
        <li>
          <strong>Résultats historiques</strong> :
          <a href="https://github.com/martj42/international_results" target="_blank" class="ext-link">martj42/international_results</a> (CC0) —
          3 970 matchs depuis jan 2022 · WC 2022, Euro 2024, Copa América 2024, CAN, Nations League, qualifications, amicaux.
        </li>
        <li>
          <strong>Classement FIFA</strong> :
          <a href="https://inside.fifa.com/fr/fifa-world-ranking/men" target="_blank" class="ext-link">inside.fifa.com</a>
          via API officielle FDCP — 211 sélections, avril 2026 (France #1, 1 877 pts).
          Le repo <a href="https://github.com/cnc8/fifa-world-ranking" target="_blank" class="ext-link">cnc8/fifa-world-ranking</a>
          est conservé en fallback uniquement (abandonné depuis jan 2021, données de déc. 2020).
        </li>
        <li>
          <strong>Score Elo</strong> : calcul maison —
          K-facteurs WC×60 · tournois×50 · qualifs×35 · amicaux×20 ·
          avantage terrain +75 (neutralisé sur terrain neutre).
        </li>
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
