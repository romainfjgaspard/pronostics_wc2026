"""
generate_web_data.py
Génère les 4 fichiers JSON pour le site web WC 2026.
Exécuter depuis pronostics_wc2026/
"""
import csv, json, os, re, unicodedata
from collections import defaultdict
from datetime import datetime

DATA_DIR    = "data"
WEB_DATA    = "data"

# ── ISO-2 codes ───────────────────────────────────────────────────────────────
TEAM_ISO2 = {
    'Argentina':'ar','Brazil':'br','Uruguay':'uy','Colombia':'co','Ecuador':'ec',
    'Chile':'cl','Paraguay':'py','Bolivia':'bo','Peru':'pe','Venezuela':'ve',
    'Mexico':'mx','United States':'us','Canada':'ca','Honduras':'hn','Panama':'pa',
    'Costa Rica':'cr','Jamaica':'jm','Cuba':'cu','Haiti':'ht','Guatemala':'gt',
    'El Salvador':'sv','Trinidad and Tobago':'tt','Curaçao':'cw',
    'Germany':'de','France':'fr','Spain':'es','Portugal':'pt','Netherlands':'nl',
    'Belgium':'be','Italy':'it','England':'gb-eng','Switzerland':'ch','Croatia':'hr',
    'Denmark':'dk','Poland':'pl','Sweden':'se','Norway':'no','Austria':'at',
    'Czech Republic':'cz','Scotland':'gb-sct','Wales':'gb-wls','Serbia':'rs',
    'Hungary':'hu','Romania':'ro','Turkey':'tr','Ukraine':'ua','Greece':'gr',
    'Slovakia':'sk','Slovenia':'si','Bosnia and Herzegovina':'ba','Kosovo':'xk',
    'Albania':'al','Finland':'fi','Iceland':'is','Republic of Ireland':'ie',
    'Northern Ireland':'gb-nir','Georgia':'ge','Armenia':'am','Azerbaijan':'az',
    'Moldova':'md','Montenegro':'me','North Macedonia':'mk','Bulgaria':'bg',
    'Belarus':'by','Estonia':'ee','Latvia':'lv','Lithuania':'lt',
    'Morocco':'ma','Senegal':'sn','Nigeria':'ng','Cameroon':'cm','Ghana':'gh',
    "Ivory Coast":'ci','Mali':'ml','Algeria':'dz','Egypt':'eg','Tunisia':'tn',
    'South Africa':'za','DR Congo':'cd','Congo':'cg','Uganda':'ug','Kenya':'ke',
    'Ethiopia':'et','Zambia':'zm','Zimbabwe':'zw','Angola':'ao','Guinea':'gn',
    'Burkina Faso':'bf','Benin':'bj','Gabon':'ga','Comoros':'km','Cape Verde':'cv',
    'Namibia':'na','Mozambique':'mz','Madagascar':'mg','Rwanda':'rw',
    'Liberia':'lr','Tanzania':'tz','Malawi':'mw','Sudan':'sd','Libya':'ly',
    'Japan':'jp','South Korea':'kr','Australia':'au','Iran':'ir','Saudi Arabia':'sa',
    'Qatar':'qa','United Arab Emirates':'ae','UAE':'ae','Iraq':'iq','Syria':'sy',
    'Uzbekistan':'uz','Jordan':'jo','Bahrain':'bh','Oman':'om','Palestine':'ps',
    'China':'cn','Vietnam':'vn','Indonesia':'id','Thailand':'th','India':'in',
    'Philippines':'ph','Malaysia':'my','Myanmar':'mm','Cambodia':'kh',
    'Tajikistan':'tj','Kyrgyzstan':'kg','Kuwait':'kw','Lebanon':'lb',
    'North Korea':'kp','Singapore':'sg','Pakistan':'pk',
    'New Zealand':'nz','Fiji':'fj','Solomon Islands':'sb','Papua New Guinea':'pg',
    'Tahiti':'pf','New Caledonia':'nc','Vanuatu':'vu',
}

# ── K-facteurs Elo ────────────────────────────────────────────────────────────
def get_k(tournament: str) -> int:
    t = tournament.lower()
    if 'world cup' in t and 'qualif' not in t: return 60
    if any(x in t for x in ['euro','copa am','african cup','asian cup','gold cup','oceania']): return 50
    if 'qualif' in t or 'nations league' in t: return 35
    if 'friendly' in t: return 20
    return 28

def elo_exp(ra, rb):
    return 1.0 / (1.0 + 10.0 ** ((rb - ra) / 400.0))

def elo_prob(ra: float, rb: float) -> dict:
    """Probabilités statistiques pour un match sur terrain neutre."""
    exp_a = elo_exp(ra, rb)
    draw = max(0.15, 0.27 - 0.001 * abs(ra - rb))
    win_a = exp_a * (1 - draw)
    win_b = (1 - exp_a) * (1 - draw)
    return {
        "home": round(win_a, 3),
        "draw": round(draw, 3),
        "away": round(win_b, 3),
    }

def compute_elo(matches: list) -> dict:
    elo = defaultdict(lambda: 1500.0)
    for m in sorted(matches, key=lambda x: x['date']):
        h, a = m['home_team'], m['away_team']
        try:
            hs, as_ = int(m['home_score']), int(m['away_score'])
        except (ValueError, TypeError):
            continue
        neutral = str(m.get('neutral', 'FALSE')).upper() == 'TRUE'
        ha = 0 if neutral else 75
        k  = get_k(m.get('tournament', ''))
        ea = elo_exp(elo[h] + ha, elo[a])
        sa = 1.0 if hs > as_ else (0.5 if hs == as_ else 0.0)
        elo[h] += k * (sa - ea)
        elo[a] += k * ((1 - sa) - (1 - ea))
    return dict(elo)

def compute_elo_global_history(matches: list) -> dict:
    """
    Historique Elo mondial complet : toutes les équipes jamais dans le top 10 mondial,
    avec leur trajectoire annuelle complète depuis 1872.
    Retourne un dict compact {'years': [...], 'teams': {name: [elo_par_année]}}.
    """
    elo = defaultdict(lambda: 1500.0)
    yearly_snapshots: dict[int, dict[str, float]] = {}
    current_year = None

    for m in sorted(matches, key=lambda x: x['date']):
        year = int(m['date'][:4])
        if current_year is not None and year != current_year:
            yearly_snapshots[current_year] = dict(elo)
        current_year = year
        h, a = m['home_team'], m['away_team']
        try:
            hs, as_ = int(m['home_score']), int(m['away_score'])
        except (ValueError, TypeError):
            continue
        neutral = str(m.get('neutral', 'FALSE')).upper() == 'TRUE'
        ha = 0 if neutral else 75
        k  = get_k(m.get('tournament', ''))
        ea = elo_exp(elo[h] + ha, elo[a])
        sa = 1.0 if hs > as_ else (0.5 if hs == as_ else 0.0)
        elo[h] += k * (sa - ea)
        elo[a] += k * ((1 - sa) - (1 - ea))

    if current_year:
        yearly_snapshots[current_year] = dict(elo)

    # Identifier les équipes jamais top 10 mondial
    ever_top10: set[str] = set()
    for snap in yearly_snapshots.values():
        for name, _ in sorted(snap.items(), key=lambda x: -x[1])[:10]:
            ever_top10.add(name)

    years_sorted = sorted(yearly_snapshots.keys())
    team_histories: dict[str, list[int]] = {
        team: [round(yearly_snapshots[y].get(team, 1500.0)) for y in years_sorted]
        for team in sorted(ever_top10)
    }
    return {'years': years_sorted, 'teams': team_histories}


def compute_elo_history(matches: list, qualified_teams: set) -> list:
    """Retourne les snapshots annuels du classement Elo des équipes qualifiées."""
    elo = defaultdict(lambda: 1500.0)
    snapshots = []
    current_year = None

    for m in sorted(matches, key=lambda x: x['date']):
        year = int(m['date'][:4])
        if current_year is not None and year != current_year:
            ranking = sorted(
                [(t, round(elo[t])) for t in qualified_teams],
                key=lambda x: -x[1]
            )
            snapshots.append({
                'year': current_year,
                'rankings': [{'name': name, 'elo': score, 'rank': i + 1}
                             for i, (name, score) in enumerate(ranking)]
            })
        current_year = year

        h, a = m['home_team'], m['away_team']
        try:
            hs, as_ = int(m['home_score']), int(m['away_score'])
        except (ValueError, TypeError):
            continue
        neutral = str(m.get('neutral', 'FALSE')).upper() == 'TRUE'
        ha = 0 if neutral else 75
        k  = get_k(m.get('tournament', ''))
        ea = elo_exp(elo[h] + ha, elo[a])
        sa = 1.0 if hs > as_ else (0.5 if hs == as_ else 0.0)
        elo[h] += k * (sa - ea)
        elo[a] += k * ((1 - sa) - (1 - ea))

    if current_year:
        ranking = sorted(
            [(t, round(elo[t])) for t in qualified_teams],
            key=lambda x: -x[1]
        )
        snapshots.append({
            'year': current_year,
            'rankings': [{'name': name, 'elo': score, 'rank': i + 1}
                         for i, (name, score) in enumerate(ranking)]
        })
    return snapshots

# ── Helpers ───────────────────────────────────────────────────────────────────
def load_csv(path):
    with open(path, encoding='utf-8') as f:
        return list(csv.DictReader(f))

def slugify(name: str) -> str:
    nfkd = unicodedata.normalize('NFKD', name)
    s = nfkd.encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def save_json(obj, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
    kb = os.path.getsize(path) / 1024
    n  = len(obj)
    print(f"  ✅ {os.path.basename(path):25} ({kb:.0f} KB, {n} entrées)")

# ── Inférence des groupes (K4 — groupes de 4 équipes) ────────────────────────
def infer_groups(gs: list):
    """12 groupes de 4 équipes, chacun forme une clique K4."""
    adj = defaultdict(set)
    for f in gs:
        adj[f['home_team']].add(f['away_team'])
        adj[f['away_team']].add(f['home_team'])

    visited, groups = set(), []
    for team in sorted(adj):
        if team in visited:
            continue
        if len(adj[team]) < 3:
            continue
        opp = sorted(adj[team])
        # Chercher les 3 autres membres du groupe (tous doivent se jouer entre eux)
        found_group = None
        from itertools import combinations
        for combo in combinations(opp, 3):
            # Vérifier que les 3 sont reliés entre eux
            ok = all(combo[b] in adj[combo[a]]
                     for a in range(3) for b in range(a+1, 3))
            if ok:
                found_group = [team] + list(combo)
                break
        if found_group and all(t not in visited for t in found_group):
            groups.append(sorted(found_group))
            for t in found_group:
                visited.add(t)

    # Trier par date du premier match du groupe
    date_map = {}
    for f in gs:
        for t in [f['home_team'], f['away_team']]:
            if t not in date_map or f['date'] < date_map[t]:
                date_map[t] = f['date']

    groups.sort(key=lambda g: min(date_map.get(t, '9999') for t in g))

    t2g, g_list = {}, {}
    for i, g in enumerate(groups):
        letter = chr(65 + i)
        for t in g:
            t2g[t] = letter
        g_list[letter] = g
    return t2g, g_list

# ── Stats équipe ──────────────────────────────────────────────────────────────
def team_stats(matches, team, since=None, until=None, tourney=None):
    gp = w = d = l = gf = ga = 0
    for m in matches:
        if m['home_team'] != team and m['away_team'] != team:
            continue
        if since and m['date'] < since: continue
        if until and m['date'] > until: continue
        if tourney and tourney.lower() not in m.get('tournament','').lower(): continue
        try:
            hs, as_ = int(m['home_score']), int(m['away_score'])
        except:
            continue
        ih = m['home_team'] == team
        s = hs if ih else as_
        c = as_ if ih else hs
        gf += s; ga += c; gp += 1
        if s > c: w += 1
        elif s == c: d += 1
        else: l += 1
    if gp == 0:
        return None
    return {'GP':gp,'W':w,'D':d,'L':l,'GF':gf,'GA':ga,'GD':gf-ga,
            'avg_gf':round(gf/gp,2),'avg_ga':round(ga/gp,2),
            'win_pct':round(w/gp*100,1)}

def team_recent(matches, team):
    out = []
    for m in sorted(matches, key=lambda x: x['date'], reverse=True):
        if m['home_team'] != team and m['away_team'] != team: continue
        try:
            hs, as_ = int(m['home_score']), int(m['away_score'])
        except:
            continue
        ih  = m['home_team'] == team
        s   = hs if ih else as_
        c   = as_ if ih else hs
        opp = m['away_team'] if ih else m['home_team']
        r   = 'W' if s > c else ('D' if s == c else 'L')
        out.append({'date':m['date'],'tournament':m.get('tournament',''),
                    'opponent':opp,'opp_iso2':TEAM_ISO2.get(opp,''),
                    'home':ih,'scored':s,'conceded':c,'result':r})
    return out

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  Génération des données web WC 2026")
    print("=" * 55)

    print("\n[1/5] Chargement...")
    results = load_csv(os.path.join(DATA_DIR, 'results.csv'))
    wc26 = sorted(
        [r for r in results if r['tournament'] == 'FIFA World Cup' and r['date'] >= '2026-06-01'],
        key=lambda x: x['date']
    )
    history = [r for r in results
               if not (r['tournament'] == 'FIFA World Cup' and r['date'] >= '2026-06-01')]
    print(f"  {len(wc26)} fixtures WC 2026 | {len(history)} matchs historiques")

    print("\n[2/5] Étiquetage des phases...")
    # WC 2026 : 12 groupes de 4 équipes, 72 matchs tous en phase de groupes.
    # Le dataset ne contient pas encore les matchs éliminatoires.
    for f in wc26:
        f['_stage'] = 'group'

    gs = wc26  # tous les 72

    print("\n[3/5] Inférence des groupes...")
    t2g, groups_map = infer_groups(gs)
    print(f"  {len(groups_map)} groupes | {len(t2g)} équipes")
    for letter in sorted(groups_map):
        print(f"    Groupe {letter}: {', '.join(groups_map[letter])}")

    print("\n[4/5] Calcul Elo (historique complet)...")
    elo = compute_elo(history)
    wc_teams = set(t2g.keys())

    top = sorted([(t, elo.get(t,1500)) for t in wc_teams], key=lambda x: -x[1])
    print("  Top 10 :")
    for i, (t, e) in enumerate(top[:10], 1):
        print(f"    {i:2}. {t:<28} {e:.0f}  [Groupe {t2g.get(t,'?')}]")

    print("\n[5/5] Génération JSON...")

    # fixtures.json
    STAGE_NAMES = {'group':'Phase de groupes','r32':'Huitièmes de finale','r16':'Quarts de finale','ko':'Demi-finales / Finale'}
    fixtures_out = []
    for f in wc26:
        h, a = f['home_team'], f['away_team']
        grp = t2g.get(h) or t2g.get(a) or '?'
        elo_h = elo.get(h, 1500)
        elo_a = elo.get(a, 1500)
        fixtures_out.append({
            'date':f['date'], 'stage':f['_stage'], 'stage_label':STAGE_NAMES.get(f['_stage'],''),
            'group':grp, 'home':h, 'away':a,
            'home_iso2':TEAM_ISO2.get(h,''), 'away_iso2':TEAM_ISO2.get(a,''),
            'home_elo':round(elo_h, 0), 'away_elo':round(elo_a, 0),
            'city':f.get('city',''),
            'proba': elo_prob(elo_h, elo_a),
        })

    # teams.json
    teams_out = {}
    for team in sorted(wc_teams):
        slug = slugify(team)
        recent = team_recent(history, team)

        s_l10 = None
        if recent:
            last10 = recent[:10]
            gp=w=d=l=gf=ga=0
            for m in last10:
                gp+=1; gf+=m['scored']; ga+=m['conceded']
                if m['result']=='W': w+=1
                elif m['result']=='D': d+=1
                else: l+=1
            s_l10 = {'GP':gp,'W':w,'D':d,'L':l,'GF':gf,'GA':ga,'GD':gf-ga,
                     'avg_gf':round(gf/gp,2),'avg_ga':round(ga/gp,2),'win_pct':round(w/gp*100,1)}

        teams_out[slug] = {
            'name':team, 'slug':slug,
            'group':t2g.get(team,'?'), 'iso2':TEAM_ISO2.get(team,''),
            'elo':round(elo.get(team,1500),0),
            'stats':{
                'all':      team_stats(history, team, since='2022-01-01'),
                '2026':     team_stats(history, team, since='2026-01-01'),
                '2025':     team_stats(history, team, since='2025-01-01', until='2025-12-31'),
                '2024':     team_stats(history, team, since='2024-01-01', until='2024-12-31'),
                'last10':   s_l10,
                'qualifs':  team_stats(history, team, since='2023-01-01', tourney='World Cup qualification'),
                'all_time': team_stats(history, team),
            },
            'matches': recent,
        }

    # groups.json
    groups_out = {}
    for letter, members in groups_map.items():
        groups_out[letter] = [
            {'name':t,'slug':slugify(t),'iso2':TEAM_ISO2.get(t,''),'elo':round(elo.get(t,1500),0)}
            for t in members
        ]

    # rankings.json
    rankings_out = sorted(
        [{'name':t,'slug':slugify(t),'iso2':TEAM_ISO2.get(t,''),
          'elo':round(elo.get(t,1500),0),'group':t2g.get(t,'?')} for t in wc_teams],
        key=lambda x: -x['elo']
    )

    save_json(fixtures_out, os.path.join(WEB_DATA, 'fixtures.json'))
    save_json(teams_out,    os.path.join(WEB_DATA, 'teams.json'))
    save_json(groups_out,   os.path.join(WEB_DATA, 'groups.json'))
    save_json(rankings_out, os.path.join(WEB_DATA, 'rankings.json'))

    # Snapshots Elo annuels — 48 équipes qualifiées (pour le site)
    qualified_set = set(t2g.keys())
    elo_history_snapshots = compute_elo_history(history, qualified_set)
    elo_history = {
        'generated_at': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S'),
        'count': len(elo_history_snapshots),
        'snapshots': elo_history_snapshots,
    }
    save_json(elo_history, os.path.join(WEB_DATA, 'elo_ranking_history.json'))

    # Historique Elo mondial — toutes équipes jamais top 10 (pour la vidéo line race)
    elo_global = compute_elo_global_history(history)
    save_json(elo_global, os.path.join(WEB_DATA, 'elo_global_history.json'))

    print(f"\n✅ Données prêtes dans {WEB_DATA}/")

if __name__ == '__main__':
    main()
