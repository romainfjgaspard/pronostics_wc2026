/* =====================================================================
   WC 2026 — Pronostics  |  app.js
   SPA avec hash-routing  (#/ | #/team/{slug} | #/rankings)
===================================================================== */

// ── State ────────────────────────────────────────────────────────────
let DATA = null;  // { fixtures, teams, groups, rankings }
let currentSlug = null;
let sliderPeriod = 15;   // nb de matchs pour le slider

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
    const slug = decodeURIComponent(hash.slice(6));
    renderTeam(slug);
  } else if (hash === '/rankings') {
    renderRankings();
  } else {
    renderFixtures();
  }
}

function setActiveNav(hash) {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active',
      (hash === '/' || hash.startsWith('/team/')) && a.dataset.page === 'fixtures' ||
      hash === '/rankings' && a.dataset.page === 'rankings'
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

function pronoBars(prono) {
  if (!prono) return '';
  const { home: h, draw: dr, away: a } = prono;
  return `
    <div class="prono-bar">
      <div class="prono-seg home" style="width:${h}%">${h >= 18 ? h + '%' : ''}</div>
      <div class="prono-seg draw" style="width:${dr}%">${dr >= 12 ? dr + '%' : ''}</div>
      <div class="prono-seg away" style="width:${a}%">${a >= 18 ? a + '%' : ''}</div>
    </div>
    <div class="prono-labels">
      <span>${h}%</span><span>${dr}%</span><span>${a}%</span>
    </div>`;
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
  const wPct = gp ? ((s.W / gp) * 100).toFixed(0) : 0;
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

  // Group matches by group letter
  const byGroup = {};
  for (const f of DATA.fixtures) {
    if (!byGroup[f.group]) byGroup[f.group] = [];
    byGroup[f.group].push(f);
  }

  // Build group cards HTML
  let groupsHtml = '';
  for (const letter of Object.keys(DATA.groups).sort()) {
    const teams = DATA.groups[letter];
    const matches = (byGroup[letter] || []).sort((a, b) => a.date.localeCompare(b.date));

    // Teams list
    const teamsHtml = teams.map(t => `
      <div class="group-team-row">
        <a href="#/team/${encodeURIComponent(t.slug)}">
          ${flagImg(t.iso2, t.name, 'flag-sm')}
          <span class="team-name">${t.name}</span>
          <span class="elo-badge">${t.elo}</span>
        </a>
      </div>`).join('');

    // Matches
    const matchesHtml = matches.map(m => {
      const homeWins = m.prono && m.prono.home >= m.prono.away;
      const awayWins = m.prono && m.prono.away > m.prono.home;
      return `
        <div class="match-card">
          <div class="match-date">📅 ${formatDate(m.date)}${m.city ? ' · ' + m.city : ''}</div>
          <div class="match-teams">
            <div class="match-team home">
              <span style="${homeWins ? 'color:var(--text)' : 'color:var(--muted)'}">${m.home}</span>
              <a href="#/team/${encodeURIComponent(slugify(m.home))}">
                ${flagImg(m.home_iso2, m.home, 'flag-sm')}
              </a>
            </div>
            <div class="match-vs">vs</div>
            <div class="match-team away">
              <a href="#/team/${encodeURIComponent(slugify(m.away))}">
                ${flagImg(m.away_iso2, m.away, 'flag-sm')}
              </a>
              <span style="${awayWins ? 'color:var(--text)' : 'color:var(--muted)'}">${m.away}</span>
            </div>
          </div>
          ${pronoBars(m.prono)}
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
      <h1>⚽ Coupe du Monde 2026</h1>
      <p>Canada · États-Unis · Mexique &nbsp;|&nbsp; Juin – Juillet 2026</p>
    </div>
    <div class="tab-nav">
      <button class="tab-btn active" data-tab="groups">Phases de groupes</button>
      <button class="tab-btn"       data-tab="info">À propos du prono</button>
    </div>
    <div id="tab-content">
      <div id="tab-groups" class="groups-grid">${groupsHtml}</div>
      <div id="tab-info" style="display:none">
        <div class="stat-card" style="max-width:600px;padding:24px;line-height:1.8">
          <h2 style="margin-bottom:12px">📊 Méthode de pronostic</h2>
          <p>Les probabilités sont calculées par un <strong>système Elo</strong> basé sur 
          <strong>${DATA.fixtures.length ? DATA.fixtures.length : ''}+ matchs</strong> 
          internationaux depuis janvier 2022 (WC 2022, Euro 2024, Copa América 2024, CAN, 
          qualifications, matchs amicaux…).</p>
          <br>
          <ul style="padding-left:20px;color:var(--muted)">
            <li>K-factor × 60 pour WC, × 50 pour tournois continentaux</li>
            <li>K-factor × 35 pour qualifications</li>
            <li>Avantage terrain de +75 Elo points (neutralisé pour le WC)</li>
            <li>Probabilité de nul : max(12%, 27% − |ΔElo| / 2500)</li>
          </ul>
        </div>
      </div>
    </div>`;

  // Tab switching
  app.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      app.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-groups').style.display = btn.dataset.tab === 'groups' ? 'grid' : 'none';
      document.getElementById('tab-info').style.display   = btn.dataset.tab === 'info'   ? 'block' : 'none';
    });
  });
}

// ── VIEW: Team ────────────────────────────────────────────────────────
function renderTeam(slug) {
  const app   = document.getElementById('app');
  const team  = DATA.teams[slug];

  if (!team) {
    app.innerHTML = `<a href="#/" class="back-btn">← Retour</a>
      <div class="no-data">Équipe introuvable : <strong>${slug}</strong></div>`;
    return;
  }

  currentSlug = slug;

  // Build HTML
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

  // Initial stats render
  updateStats(team, 'all');

  // Period button handlers
  app.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      app.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const period = btn.dataset.period;
      if (period === 'all' || period === '2025' || period === '2026' || period === 'qualifs') {
        updateStats(team, period);
      }
    });
  });

  // Slider handler (live computation)
  const slider = app.querySelector('#period-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      sliderPeriod = parseInt(slider.value);
      document.getElementById('slider-count').textContent = sliderPeriod;
      // Deactivate preset buttons
      app.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      const stats = computeStatsFrom((team.matches || []).slice(0, sliderPeriod));
      document.getElementById('stats-display').innerHTML = renderStatsGrid(stats);
    });
  }
}

function updateStats(team, period) {
  const stats = period === 'all'    ? team.stats.all
              : period === '2025'   ? team.stats['2025']
              : period === '2026'   ? team.stats['2026']
              : period === 'qualifs'? team.stats.qualifs
              : null;
  document.getElementById('stats-display').innerHTML = renderStatsGrid(stats);
}

function buildMatchesTable(matches) {
  if (!matches.length) return '<div class="no-data">Aucun résultat disponible</div>';

  const rows = matches.map(m => {
    const loc = m.home ? '<span class="home-tag">DOM</span>' : '';
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

// ── VIEW: Rankings ────────────────────────────────────────────────────
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
      <h1>Classement Elo WC 2026</h1>
      <p>48 équipes qualifiées · Basé sur les matchs depuis janv. 2022</p>
    </div>
    <div class="table-wrap">
      <table class="rankings-table">
        <thead><tr>
          <th>#</th><th></th><th>Équipe</th><th>Groupe</th><th>Elo</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Utility: slugify (mirror of Python's slugify) ────────────────────
function slugify(name) {
  // Normalize accents
  const s = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Boot ─────────────────────────────────────────────────────────────
init();
