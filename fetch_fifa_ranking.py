"""
fetch_fifa_ranking.py
Récupère le classement FIFA masculin officiel (211 sélections).
Source 1 : API interne FIFA (inside.fifa.com)
Source 2 : dataset GitHub cnc8/fifa-world-ranking (CSV historique, fallback)
"""

import csv
import io
import json
import os
import urllib.request
import urllib.error
from datetime import datetime

OUTPUT = os.path.join("data", "fifa_ranking.json")

# ── ISO2 codes ────────────────────────────────────────────────────────────────
TEAM_ISO2 = {
    'Argentina':'ar','Brazil':'br','Uruguay':'uy','Colombia':'co','Ecuador':'ec',
    'Chile':'cl','Paraguay':'py','Bolivia':'bo','Peru':'pe','Venezuela':'ve',
    'Mexico':'mx','United States':'us','Canada':'ca','Honduras':'hn','Panama':'pa',
    'Costa Rica':'cr','Jamaica':'jm','Cuba':'cu','Haiti':'ht','Guatemala':'gt',
    'El Salvador':'sv','Trinidad and Tobago':'tt','Curaçao':'cw','Suriname':'sr',
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
    'Luxembourg':'lu','Cyprus':'cy','Andorra':'ad','Malta':'mt',
    'Liechtenstein':'li','San Marino':'sm','Gibraltar':'gi','Faroe Islands':'fo',
    'Morocco':'ma','Senegal':'sn','Nigeria':'ng','Cameroon':'cm','Ghana':'gh',
    "Ivory Coast":'ci','Côte d\'Ivoire':'ci','Mali':'ml','Algeria':'dz',
    'Egypt':'eg','Tunisia':'tn','South Africa':'za','DR Congo':'cd',
    'Congo':'cg','Uganda':'ug','Kenya':'ke','Ethiopia':'et','Zambia':'zm',
    'Zimbabwe':'zw','Angola':'ao','Guinea':'gn','Burkina Faso':'bf',
    'Benin':'bj','Gabon':'ga','Comoros':'km','Cape Verde':'cv',
    'Namibia':'na','Mozambique':'mz','Madagascar':'mg','Rwanda':'rw',
    'Liberia':'lr','Tanzania':'tz','Malawi':'mw','Sudan':'sd','Libya':'ly',
    'Mauritania':'mr','Niger':'ne','Togo':'tg','Sierra Leone':'sl',
    'Japan':'jp','South Korea':'kr','Australia':'au','Iran':'ir',
    'Saudi Arabia':'sa','Qatar':'qa','United Arab Emirates':'ae',
    'Iraq':'iq','Syria':'sy','Uzbekistan':'uz','Jordan':'jo',
    'Bahrain':'bh','Oman':'om','Palestine':'ps','China':'cn',
    'Vietnam':'vn','Indonesia':'id','Thailand':'th','India':'in',
    'Philippines':'ph','Malaysia':'my','Myanmar':'mm','Cambodia':'kh',
    'Tajikistan':'tj','Kyrgyzstan':'kg','Kuwait':'kw','Lebanon':'lb',
    'North Korea':'kp','Singapore':'sg','Pakistan':'pk',
    'New Zealand':'nz','Fiji':'fj','Solomon Islands':'sb',
    'Papua New Guinea':'pg','Tahiti':'pf','New Caledonia':'nc','Vanuatu':'vu',
    'USA':'us',
}

# ── Endpoints FIFA à tester ───────────────────────────────────────────────────
FIFA_ENDPOINTS = [
    "https://inside.fifa.com/api/client/ranking/men?locale=fr&count=211",
    "https://inside.fifa.com/api/client/ranking/men?locale=en&count=211",
    "https://inside.fifa.com/api/client/ranking/men?locale=fr",
    "https://inside.fifa.com/api/client/ranking/men?locale=en",
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://inside.fifa.com/fr/fifa-world-ranking/men',
    'Origin': 'https://inside.fifa.com',
}

# ── Repo fallback ─────────────────────────────────────────────────────────────
FALLBACK_REPO_API = "https://api.github.com/repos/cnc8/fifa-world-ranking/contents/"
FALLBACK_RAW_BASE = "https://raw.githubusercontent.com/cnc8/fifa-world-ranking/master/"


# ── Helpers ───────────────────────────────────────────────────────────────────

def fetch_url(url: str, headers: dict | None = None) -> bytes:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def parse_fifa_response(data) -> list[dict] | None:
    """Tente d'extraire la liste des équipes depuis la réponse FIFA (format variable)."""
    items = None
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        for key in ('ranking', 'rankings', 'data', 'results', 'items', 'content'):
            if key in data and isinstance(data[key], list):
                items = data[key]
                break

    if not items:
        return None

    result = []
    for i, item in enumerate(items):
        try:
            name = (
                item.get('countryName') or item.get('name') or
                item.get('team') or item.get('country') or ''
            ).strip()
            rank     = int(item.get('rank') or item.get('ranking') or (i + 1))
            prev     = int(item.get('previousRank') or item.get('previous_rank') or rank)
            pts      = float(item.get('totalPoints') or item.get('points') or 0)
            conf     = str(item.get('confederation') or item.get('conf') or '')
            if name:
                result.append({
                    'rank': rank,
                    'previous_rank': prev,
                    'change': prev - rank,
                    'name': name,
                    'iso2': TEAM_ISO2.get(name, ''),
                    'confederation': conf,
                    'points': round(pts, 2),
                })
        except Exception:
            continue

    return result if len(result) >= 50 else None


def try_fifa_api() -> tuple[list[dict], str] | None:
    for url in FIFA_ENDPOINTS:
        try:
            print(f"  Tentative API FIFA : {url}")
            raw = fetch_url(url, HEADERS)
            data = json.loads(raw)
            rankings = parse_fifa_response(data)
            if rankings:
                print(f"  ✅ API FIFA OK — {len(rankings)} équipes")
                date_str = datetime.now().strftime('%Y-%m-%d')
                return rankings, date_str
        except urllib.error.HTTPError as e:
            print(f"  ⚠️  HTTP {e.code} : {url}")
        except Exception as e:
            print(f"  ⚠️  Erreur : {e}")
    return None


def try_fallback_csv() -> tuple[list[dict], str] | None:
    try:
        print("  Fallback : listing repo cnc8/fifa-world-ranking...")
        index_raw = fetch_url(FALLBACK_REPO_API)
        files = json.loads(index_raw)

        csvs = sorted(
            [f for f in files
             if f['name'].startswith('fifa_ranking-') and f['name'].endswith('.csv')],
            key=lambda x: x['name'],
            reverse=True,
        )
        if not csvs:
            print("  ⚠️  Aucun CSV trouvé dans le repo")
            return None

        latest = csvs[0]
        print(f"  Téléchargement : {latest['name']}")
        csv_raw = fetch_url(latest['download_url']).decode('utf-8')
        rows = list(csv.DictReader(io.StringIO(csv_raw)))

        # Garder uniquement la date la plus récente du fichier
        dates = sorted(set(r.get('rank_date', '') for r in rows if r.get('rank_date')))
        max_date = dates[-1] if dates else 'inconnue'
        latest_rows = [r for r in rows if r.get('rank_date') == max_date]
        latest_rows.sort(key=lambda x: int(x.get('rank', 9999)))

        result = []
        for r in latest_rows:
            name = r.get('country_full', r.get('country_abrv', ''))
            try:
                pts = round(float(r.get('total_points', 0)), 2)
            except ValueError:
                pts = 0.0
            prev = int(r.get('rank', 0))
            result.append({
                'rank': int(r.get('rank', 0)),
                'previous_rank': prev,
                'change': 0,
                'name': name,
                'iso2': TEAM_ISO2.get(name, r.get('country_abrv', '').lower()[:2]),
                'confederation': r.get('confederation', ''),
                'points': pts,
            })

        print(f"  ✅ Fallback CSV OK — {len(result)} équipes (date classement : {max_date})")
        return result, max_date
    except Exception as e:
        print(f"  ⚠️  Fallback échoué : {e}")
        return None


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("  Classement FIFA — fetch")
    print("=" * 55)

    result = try_fifa_api()
    source = "FIFA API"

    if result is None:
        print("\n  API FIFA inaccessible, passage au fallback CSV...")
        result = try_fallback_csv()
        source = "GitHub cnc8/fifa-world-ranking (CSV)"

    if result is None:
        print("\n❌ Impossible de récupérer le classement FIFA.")
        print("   Vérifiez votre connexion internet ou ajoutez data/fifa_ranking.json manuellement.")
        return

    rankings, ranking_date = result

    output = {
        'updated_at': datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
        'ranking_date': ranking_date,
        'source': source,
        'count': len(rankings),
        'rankings': rankings,
    }

    os.makedirs(os.path.dirname(OUTPUT) if os.path.dirname(OUTPUT) else '.', exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, separators=(',', ':'))

    print(f"\n✅ {OUTPUT} — {len(rankings)} équipes (source : {source})")
    print("\n  Top 10 :")
    for r in rankings[:10]:
        chg = f"(+{r['change']})" if r['change'] > 0 else (f"({r['change']})" if r['change'] < 0 else "  (=)")
        print(f"    {r['rank']:3}. {r['name']:<30} {r['points']:8.2f} pts  {chg}")


if __name__ == '__main__':
    main()
