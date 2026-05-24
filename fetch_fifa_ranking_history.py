"""
fetch_fifa_ranking_history.py
Récupère l'historique du classement FIFA masculin (1 snapshot par an, 1993–2026).
Source : API officielle FIFA (même endpoint que fetch_fifa_ranking.py).
Sortie : data/fifa_ranking_history.json
"""

import json
import re
import time
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

from fetch_fifa_ranking import FIFA_TO_ISO2

ROOT = Path(__file__).parent
OUTPUT = ROOT / "data" / "fifa_ranking_history.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://inside.fifa.com/fr/fifa-world-ranking/men',
    'Origin': 'https://inside.fifa.com',
}

INSIDE_FIFA = 'https://inside.fifa.com/fr/fifa-world-ranking/men'
FDCP_BASE = 'https://api.fifa.com/api/v3/fifarankings/rankings/rankingsbyschedule'
TOP_N = 30
RATE_LIMIT_S = 0.35


def fetch_url(url: str, headers: dict | None = None) -> bytes:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def get_all_date_ids() -> list[tuple[str, str]]:
    """Retourne tous les (id, date) depuis inside.fifa.com/__NEXT_DATA__, newest first."""
    raw = fetch_url(INSIDE_FIFA, {'User-Agent': HEADERS['User-Agent']})
    html = raw.decode('utf-8', errors='ignore')
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
    if not m:
        raise RuntimeError("__NEXT_DATA__ introuvable dans inside.fifa.com")
    data = json.loads(m.group(1))
    ranking = data['props']['pageProps']['pageData']['ranking']
    all_dates = []
    for g in ranking.get('dates', []):
        for d in g.get('dates', []):
            date_str = d.get('matchWindowEndDate', '')
            if date_str:
                all_dates.append((d['id'], date_str))
    return all_dates


def pick_latest_per_year(dates: list[tuple[str, str]]) -> list[tuple[str, str]]:
    """Garde le snapshot le plus récent de chaque année (dates newest-first en entrée)."""
    seen: set[str] = set()
    selected = []
    for date_id, date_str in dates:
        year = date_str[:4]
        if year not in seen:
            seen.add(year)
            selected.append((date_id, date_str))
    return list(reversed(selected))  # ordre chronologique


def fetch_ranking_for_date(date_id: str) -> list[dict] | None:
    url = f'{FDCP_BASE}?rankingScheduleId={date_id}&count={TOP_N}&language=en'
    try:
        raw = fetch_url(url, HEADERS)
        data = json.loads(raw)
        results = data.get('Results', [])
        if not results:
            return None
        rankings = []
        for item in results:
            name_list = item.get('TeamName', [])
            name = next((n['Description'] for n in name_list if n.get('Description')), '')
            if not name:
                continue
            country_code = item.get('IdCountry', '').upper()
            iso2 = FIFA_TO_ISO2.get(country_code, country_code.lower()[:2])
            rankings.append({
                'rank': int(item.get('Rank') or 0),
                'name': name,
                'points': round(float(item.get('TotalPoints', 0)), 1),
                'iso2': iso2,
                'confederation': item.get('ConfederationName', ''),
            })
        rankings.sort(key=lambda x: x['rank'])
        return rankings
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}")
        return None
    except Exception as e:
        print(f"Erreur: {e}")
        return None


def main() -> None:
    print("=" * 55)
    print("  FIFA Ranking History — fetch")
    print("=" * 55)

    print("\n  Récupération des dates disponibles depuis inside.fifa.com...")
    all_dates = get_all_date_ids()
    print(f"  {len(all_dates)} dates disponibles au total")

    selected = pick_latest_per_year(all_dates)
    print(f"  {len(selected)} snapshots sélectionnés (dernier classement de chaque année)")
    print(f"  Période : {selected[0][1][:4]} → {selected[-1][1][:4]}")
    print(f"  Top {TOP_N} équipes par snapshot\n")

    snapshots = []
    for i, (date_id, date_str) in enumerate(selected, 1):
        year = date_str[:4]
        print(f"  [{i:2}/{len(selected)}] {year}  ({date_str})  {date_id[:40]:<40} ", end="", flush=True)
        rankings = fetch_ranking_for_date(date_id)
        if rankings:
            snapshots.append({
                'date': date_str,
                'year': int(year),
                'rankings': rankings,
            })
            print(f"✓  #{rankings[0]['name']}")
        else:
            print("⚠ ignoré")
        time.sleep(RATE_LIMIT_S)

    output = {
        'generated_at': datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
        'count': len(snapshots),
        'top_n': TOP_N,
        'snapshots': snapshots,
    }

    OUTPUT.parent.mkdir(exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT.stat().st_size / 1024
    print(f"\n✅ {OUTPUT}  —  {len(snapshots)} snapshots  ({size_kb:.1f} KB)")
    print("\n  Vérifications :")
    for s in snapshots[:3] + snapshots[-2:]:
        print(f"    {s['year']}  #1 = {s['rankings'][0]['name']}  ({s['rankings'][0]['points']} pts)")


if __name__ == '__main__':
    main()
