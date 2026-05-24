"""
fetch_fifa_ranking.py
Récupère le classement FIFA masculin officiel (211 sélections).
Source 1 : API FDCP FIFA (api.fifa.com/api/v3/fifarankings/...)
           — dateId extrait dynamiquement depuis inside.fifa.com/__NEXT_DATA__
Source 2 : dataset GitHub cnc8/fifa-world-ranking (CSV historique, fallback)
"""

import csv
import io
import json
import os
import re
import urllib.request
import urllib.error
from datetime import datetime

OUTPUT = os.path.join("data", "fifa_ranking.json")

# ── Mapping FIFA 3-lettres → ISO2 (indépendant de la langue) ──────────────────
# Source : codes FIFA officiels + ISO 3166-1 alpha-2
FIFA_TO_ISO2 = {
    'AFG':'af','AIA':'ai','ALB':'al','ALG':'dz','AND':'ad','ANG':'ao','ARG':'ar',
    'ARM':'am','ARU':'aw','ASA':'as','ATG':'ag','AUS':'au','AUT':'at','AZE':'az',
    'BAH':'bs','BAN':'bd','BDI':'bi','BEL':'be','BEN':'bj','BER':'bm','BFA':'bf',
    'BHR':'bh','BHU':'bt','BIH':'ba','BLR':'by','BLZ':'bz','BOL':'bo','BOT':'bw',
    'BRA':'br','BRB':'bb','BRU':'bn','BUL':'bg','CAM':'kh','CAN':'ca','CAY':'ky',
    'CGO':'cg','CHA':'td','CHI':'cl','CHN':'cn','CIV':'ci','CMR':'cm','COD':'cd',
    'COK':'ck','COL':'co','COM':'km','CPV':'cv','CRC':'cr','CRO':'hr','CTA':'cf',
    'CUB':'cu','CUW':'cw','CYP':'cy','CZE':'cz','DEN':'dk','DJI':'dj','DMA':'dm',
    'DOM':'do','ECU':'ec','EGY':'eg','ENG':'gb-eng','EQG':'gq','ERI':'er',
    'ESP':'es','EST':'ee','ETH':'et','FIJ':'fj','FIN':'fi','FRA':'fr','FRO':'fo',
    'GAB':'ga','GAM':'gm','GEO':'ge','GER':'de','GHA':'gh','GIB':'gi','GNB':'gw',
    'GRE':'gr','GRN':'gd','GUA':'gt','GUI':'gn','GUM':'gu','GUY':'gy','HAI':'ht',
    'HKG':'hk','HON':'hn','HUN':'hu','IDN':'id','IND':'in','IRL':'ie','IRN':'ir',
    'IRQ':'iq','ISL':'is','ISR':'il','ITA':'it','JAM':'jm','JOR':'jo','JPN':'jp',
    'KAZ':'kz','KEN':'ke','KGZ':'kg','KOR':'kr','KOS':'xk','KSA':'sa','KUW':'kw',
    'LAO':'la','LBN':'lb','LBR':'lr','LBY':'ly','LCA':'lc','LES':'ls','LIE':'li',
    'LTU':'lt','LUX':'lu','LVA':'lv','MAC':'mo','MAD':'mg','MAR':'ma','MAS':'my',
    'MDA':'md','MDV':'mv','MEX':'mx','MKD':'mk','MLI':'ml','MLT':'mt','MNE':'me',
    'MNG':'mn','MOZ':'mz','MRI':'mu','MSR':'ms','MTN':'mr','MWI':'mw','MYA':'mm',
    'NAM':'na','NCA':'ni','NCL':'nc','NED':'nl','NEP':'np','NGA':'ng','NIG':'ne',
    'NIR':'gb-nir','NOR':'no','NZL':'nz','OMA':'om','PAK':'pk','PAN':'pa',
    'PAR':'py','PER':'pe','PHI':'ph','PLE':'ps','PNG':'pg','POL':'pl','POR':'pt',
    'PRK':'kp','PUR':'pr','QAT':'qa','ROU':'ro','RSA':'za','RUS':'ru','RWA':'rw',
    'SAM':'ws','SCO':'gb-sct','SDN':'sd','SEN':'sn','SEY':'sc','SGP':'sg',
    'SKN':'kn','SLE':'sl','SLV':'sv','SMR':'sm','SOL':'sb','SOM':'so','SRB':'rs',
    'SRI':'lk','SSD':'ss','STP':'st','SUI':'ch','SUR':'sr','SVK':'sk','SVN':'si',
    'SWE':'se','SWZ':'sz','SYR':'sy','TAH':'pf','TAN':'tz','TCA':'tc','TGA':'to',
    'THA':'th','TJK':'tj','TKM':'tm','TLS':'tl','TOG':'tg','TPE':'tw','TRI':'tt',
    'TUN':'tn','TUR':'tr','UAE':'ae','UGA':'ug','UKR':'ua','URU':'uy','USA':'us',
    'UZB':'uz','VAN':'vu','VEN':'ve','VGB':'vg','VIE':'vn','VIN':'vc','VIR':'vi',
    'WAL':'gb-wls','YEM':'ye','ZAM':'zm','ZIM':'zw',
}

HEADERS_HTTP = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://inside.fifa.com/fr/fifa-world-ranking/men',
    'Origin': 'https://inside.fifa.com',
}

FDCP_BASE = 'https://api.fifa.com/api/v3'
INSIDE_FIFA_RANKING = 'https://inside.fifa.com/fr/fifa-world-ranking/men'


def fetch_url(url: str, headers: dict | None = None) -> bytes:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


# ── Source 1 : API FDCP FIFA ───────────────────────────────────────────────────

def get_latest_date_id() -> tuple[str, str] | None:
    """Récupère l'ID de date du classement le plus récent via __NEXT_DATA__."""
    try:
        print("  Récupération de la date du classement depuis inside.fifa.com...")
        raw = fetch_url(INSIDE_FIFA_RANKING, {'User-Agent': HEADERS_HTTP['User-Agent']})
        html = raw.decode('utf-8', errors='ignore')
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
        if not m:
            print("  ⚠️  __NEXT_DATA__ introuvable")
            return None
        data = json.loads(m.group(1))
        ranking = data['props']['pageProps']['pageData']['ranking']
        date_groups = ranking.get('dates', [])
        if not date_groups:
            return None
        latest_group = date_groups[0]
        latest_date = latest_group['dates'][0]
        date_id = latest_date['id']
        date_str = latest_date['matchWindowEndDate']
        print(f"  Dernière date trouvée : {date_id} ({date_str})")
        return date_id, date_str
    except Exception as e:
        print(f"  ⚠️  Impossible de récupérer la date : {e}")
        return None


def fetch_fdcp_ranking(date_id: str, date_str: str) -> tuple[list[dict], str] | None:
    """Appelle l'API FDCP FIFA avec le dateId."""
    url = (
        f'{FDCP_BASE}/fifarankings/rankings/rankingsbyschedule'
        f'?rankingScheduleId={date_id}&count=211&language=en'
    )
    try:
        print(f"  API FDCP : {url}")
        raw = fetch_url(url, HEADERS_HTTP)
        data = json.loads(raw)
        results = data.get('Results', [])
        if len(results) < 50:
            print(f"  ⚠️  Réponse incomplète : {len(results)} équipes")
            return None

        rankings = []
        for item in results:
            name_list = item.get('TeamName', [])
            name = next((n['Description'] for n in name_list if n.get('Description')), '')
            if not name:
                continue
            country_code = item.get('IdCountry', '').upper()
            iso2 = FIFA_TO_ISO2.get(country_code, country_code.lower()[:2])
            rank = int(item.get('Rank') or 0)
            prev_rank = int(item.get('PrevRank') or rank)
            rankings.append({
                'rank': rank,
                'previous_rank': prev_rank,
                'change': prev_rank - rank,
                'name': name,
                'iso2': iso2,
                'country_code': country_code,
                'confederation': item.get('ConfederationName', ''),
                'points': round(float(item.get('TotalPoints', 0)), 2),
                'rated_matches': int(item.get('RatedMatches', 0)),
            })

        rankings.sort(key=lambda x: x['rank'])
        print(f"  ✅ API FDCP OK — {len(rankings)} équipes (date : {date_str})")
        return rankings, date_str

    except urllib.error.HTTPError as e:
        print(f"  ⚠️  HTTP {e.code}")
        return None
    except Exception as e:
        print(f"  ⚠️  Erreur : {e}")
        return None


def try_fifa_api() -> tuple[list[dict], str] | None:
    """Tente de récupérer le classement via l'API officielle FIFA."""
    date_info = get_latest_date_id()
    if date_info is None:
        # Fallback : utiliser le dernier ID de date connu
        print("  Utilisation du dateId de secours (FRS_Male_Football_20260119)...")
        date_info = ('FRS_Male_Football_20260119', '2026-04-01')
    return fetch_fdcp_ranking(*date_info)


# ── Source 2 : GitHub cnc8 (fallback CSV historique) ─────────────────────────

FALLBACK_REPO_API = "https://api.github.com/repos/cnc8/fifa-world-ranking/contents/"
FALLBACK_RAW_BASE = "https://raw.githubusercontent.com/cnc8/fifa-world-ranking/master/"


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
            rank = int(r.get('rank', 0))
            result.append({
                'rank': rank,
                'previous_rank': rank,
                'change': 0,
                'name': name,
                'iso2': FIFA_TO_ISO2.get(r.get('country_abrv', '').upper(), r.get('country_abrv', '').lower()[:2]),
                'country_code': r.get('country_abrv', ''),
                'confederation': r.get('confederation', ''),
                'points': pts,
                'rated_matches': 0,
            })

        print(f"  ✅ Fallback CSV OK — {len(result)} équipes (date classement : {max_date})")
        return result, max_date
    except Exception as e:
        print(f"  ⚠️  Fallback échoué : {e}")
        return None


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("  Classement FIFA — fetch")
    print("=" * 55)

    result = try_fifa_api()
    source = "FIFA API (FDCP)"

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
        print(f"    {r['rank']:3}. {r['name']:<30} {r['points']:10.2f} pts  {chg}")


if __name__ == '__main__':
    main()
