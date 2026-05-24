"""
fetch_flags.py
Télécharge les drapeaux de toutes les équipes (w160) depuis flagcdn.com.
Sortie : data/flags/{iso2}.png (utilisé par le site comme source locale)

Usage : python3 fetch_flags.py
"""

import time
import urllib.request
from pathlib import Path

from generate_web_data import TEAM_ISO2

ROOT = Path(__file__).parent
FLAGS_DIR = ROOT / "data" / "flags"
FLAGS_DIR.mkdir(exist_ok=True)

BASE_URL = "https://flagcdn.com/w320/{}.png"


def download_flags() -> None:
    iso_codes = sorted(set(TEAM_ISO2.values()))
    total = len(iso_codes)
    print(f"Téléchargement de {total} drapeaux (w320) → data/flags/\n")

    ok, skip, fail = 0, 0, 0
    for i, iso in enumerate(iso_codes, 1):
        dest = FLAGS_DIR / f"{iso}.png"
        if dest.exists():
            skip += 1
            continue
        url = BASE_URL.format(iso)
        try:
            urllib.request.urlretrieve(url, dest)
            ok += 1
            print(f"  [{i:3}/{total}] {iso:<10} ✓")
        except Exception as e:
            fail += 1
            print(f"  [{i:3}/{total}] {iso:<10} ✗  {e!r}")
        time.sleep(0.15)

    total_kb = sum(f.stat().st_size for f in FLAGS_DIR.glob("*.png")) / 1024
    print(f"\n  ✓ {ok} téléchargés  |  {skip} déjà présents  |  {fail} erreurs")
    print(f"  Taille totale : {total_kb:.0f} KB  ({len(list(FLAGS_DIR.glob('*.png')))} fichiers)")


if __name__ == "__main__":
    download_flags()
