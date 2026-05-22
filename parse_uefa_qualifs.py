"""
Parseur du texte brut de la page FIFA - Qualifications UEFA WC 2026
Produit : data/uefa_qualifs_wc2026.csv
"""

import csv
import os
import re

# ── Texte source (copié depuis FIFA.com) ─────────────────────────────────────

RAW_TEXT = """
1re journée
21 mars
Chypre 2-0 Saint-Marin (Groupe H)
Angleterre 2-0 Albanie (Groupe K)
Pologne 1-0 Lituanie (Groupe G)
Malte 0-1 Finlande (Groupe G)
Andorre 0-1 Lettonie (Groupe K)
Roumanie 0-1 Bosnie-et-Herzégovine (Groupe H)

22 mars
Liechtenstein 0-3 Macédoine du Nord (Groupe J)
Monténégro 3-1 Gibraltar (Groupe L)
Moldavie 0-5 Norvège (Groupe I)
Pays de Galles 3-1 Kazakhstan (Groupe J)
Israël 2-1 Estonie (Groupe I)
République tchèque 2-1 Îles Féroé (Groupe L)

2e journée
24 mars
Lituanie 2-2 Finlande (Groupe G)
Angleterre 3-0 Lettonie (Groupe K)
Pologne 2-0 Malte (Groupe G)
Saint-Marin 1-5 Roumanie (Groupe H)
Bosnie-et-Herzégovine 2-1 Chypre (Groupe H)
Albanie 3-0 Andorre (Groupe K)

25 mars
Moldavie 2-3 Estonie (Groupe I)
Israël 2-4 Norvège (Groupe I)
Liechtenstein 0-2 Kazakhstan (Groupe J)
Macédoine du Nord 1-1 Pays de Galles (Groupe J)
Gibraltar 0-4 République tchèque (Groupe L)
Monténégro 1-0 Îles Féroé (Groupe L)

3e journée
6 juin
Estonie 1-3 Israël (Groupe I)
Norvège 3-0 Italie (Groupe I)
Macédoine du Nord 1-1 Belgique (Groupe J)
Pays de Galles 3-0 Liechtenstein (Groupe J)
République tchèque 2-0 Monténégro (Groupe L)
Gibraltar 0-7 Croatie (Groupe L)

7 juin
Malte 0-0 Lituanie (Groupe G)
Bosnie-et-Herzégovine 1-0 Saint-Marin (Groupe H)
Andorre 0-1 Angleterre (Groupe K)
Finlande 0-2 Pays-Bas (Groupe G)
Autriche 2-1 Roumanie (Groupe H)
Albanie 0-0 Serbie (Groupe K)

4e journée
9 juin
Estonie 0-1 Norvège (Groupe I)
Italie 2-0 Moldavie (Groupe I)
Belgique 4-3 Pays de Galles (Groupe J)
Kazakhstan 0-1 Macédoine du Nord (Groupe J)
Croatie 5-1 République tchèque (Groupe L)
Îles Féroé 2-1 Gibraltar (Groupe L)

10 juin
Finlande 2-1 Pologne (Groupe G)
Pays-Bas 8-0 Malte (Groupe G)
Roumanie 2-0 Chypre (Groupe H)
Saint-Marin 0-4 Autriche (Groupe H)
Lettonie 1-1 Albanie (Groupe K)
Serbie 3-0 Andorre (Groupe K)

5e journée
4 septembre
Luxembourg 1-3 Irlande du Nord (Groupe A)
Slovaquie 2-0 Allemagne (Groupe A)
Bulgarie 0-3 Espagne (Groupe E)
Géorgie 2-3 Turquie (Groupe E)
Lituanie 1-1 Malte (Groupe G)
Pays-Bas 1-1 Pologne (Groupe G)
Kazakhstan 0-1 Pays de Galles (Groupe J)
Liechtenstein 0-6 Belgique (Groupe J)

5 septembre
Slovénie 2-2 Suède (Groupe B)
Suisse 4-0 Kosovo (Groupe B)
Danemark 0-0 Écosse (Groupe C)
Grèce 5-1 Belarus (Groupe C)
Islande 5-0 Azerbaïdjan (Groupe D)
Ukraine 0-2 France (Groupe D)
Italie 5-0 Estonie (Groupe I)
Moldavie 0-4 Israël (Groupe I)
Îles Féroé 0-1 Croatie (Groupe L)
Monténégro 0-2 République tchèque (Groupe L)

6 septembre
Arménie 0-5 Portugal (Groupe F)
République d'Irlande 2-2 Hongrie (Groupe F)
Autriche 1-0 Chypre (Groupe H)
Saint-Marin 0-6 Bosnie-et-Herzégovine (Groupe H)
Angleterre 2-0 Andorre (Groupe K)
Lettonie 0-1 Serbie (Groupe K)

6e journée
7 septembre
Allemagne 3-1 Irlande du Nord (Groupe A)
Luxembourg 0-1 Slovaquie (Groupe A)
Géorgie 3-0 Bulgarie (Groupe E)
Turquie 0-6 Espagne (Groupe E)
Lituanie 2-3 Pays-Bas (Groupe G)
Pologne 3-1 Finlande (Groupe G)
Belgique 6-0 Kazakhstan (Groupe J)
Macédoine du Nord 5-0 Liechtenstein (Groupe J)

8 septembre
Kosovo 2-0 Suède (Groupe B)
Suisse 3-0 Slovénie (Groupe B)
Belarus 0-2 Écosse (Groupe C)
Grèce 0-3 Danemark (Groupe C)
Israël 4-5 Italie (Groupe I)
Croatie 4-0 Monténégro (Groupe L)
Gibraltar 0-1 Îles Féroé (Groupe L)

9 septembre
Norvège 11-1 Moldavie (Groupe I)
Azerbaïdjan 1-1 Ukraine (Groupe D)
France 2-1 Islande (Groupe D)
Arménie 2-1 République d'Irlande (Groupe F)
Hongrie 2-3 Portugal (Groupe F)
Bosnie-et-Herzégovine 1-2 Autriche (Groupe H)
Chypre 2-2 Roumanie (Groupe H)
Albanie 1-0 Lettonie (Groupe K)
Serbie 0-5 Angleterre (Groupe K)

7e journée
9 octobre
Belarus 0-6 Danemark (Groupe C)
Écosse 3-1 Grèce (Groupe C)
Autriche 10-0 Saint-Marin (Groupe H)
Chypre 2-2 Bosnie-et-Herzégovine (Groupe H)
République tchèque 0-0 Croatie (Groupe L)
Îles Féroé 4-0 Monténégro (Groupe L)
Finlande 2-1 Lituanie (Groupe G)
Malte 0-4 Pays-Bas (Groupe G)

10 octobre
Allemagne 4-0 Luxembourg (Groupe A)
Irlande du Nord 2-0 Slovaquie (Groupe A)
Kosovo 0-0 Slovénie (Groupe B)
Suède 0-2 Suisse (Groupe B)
France 3-0 Azerbaïdjan (Groupe D)
Islande 3-5 Ukraine (Groupe D)
Belgique 0-0 Macédoine du Nord (Groupe J)
Kazakhstan 4-0 Liechtenstein (Groupe J)

11 octobre
Bulgarie 1-6 Turquie (Groupe E)
Espagne 2-0 Géorgie (Groupe E)
Portugal 1-0 République d'Irlande (Groupe F)
Hongrie 2-0 Arménie (Groupe F)
Estonie 1-3 Italie (Groupe I)
Norvège 5-0 Israël (Groupe I)
Lettonie 2-2 Andorre (Groupe K)
Serbie 0-1 Albanie (Groupe K)

8e journée
12 octobre
Danemark 3-1 Grèce (Groupe C)
Écosse 2-1 Belarus (Groupe C)
Lituanie 0-2 Pologne (Groupe G)
Pays-Bas 4-0 Finlande (Groupe G)
Roumanie 1-0 Autriche (Groupe H)
Saint-Marin 0-4 Chypre (Groupe H)
Croatie 3-0 Gibraltar (Groupe L)
Îles Féroé 2-1 République tchèque (Groupe L)

13 octobre
Irlande du Nord 0-1 Allemagne (Groupe A)
Slovaquie 2-0 Luxembourg (Groupe A)
Slovénie 0-0 Suisse (Groupe B)
Suède 0-1 Kosovo (Groupe B)
Islande 2-2 France (Groupe D)
Ukraine 2-1 Azerbaïdjan (Groupe D)
Macédoine du Nord 1-1 Kazakhstan (Groupe J)
Pays de Galles 2-4 Belgique (Groupe J)

14 octobre
Espagne 4-0 Bulgarie (Groupe E)
Turquie 4-1 Géorgie (Groupe E)
Portugal 2-2 Hongrie (Groupe F)
République d'Irlande 1-0 Arménie (Groupe F)
Estonie 1-1 Moldavie (Groupe I)
Italie 3-0 Israël (Groupe I)
Andorre 1-3 Serbie (Groupe K)
Lettonie 0-5 Angleterre (Groupe K)

9e journée
13 novembre
Azerbaïdjan 0-2 Islande (Groupe D)
France 4-0 Ukraine (Groupe D)
Arménie 0-1 Hongrie (Groupe F)
République d'Irlande 2-0 Portugal (Groupe F)
Moldavie 0-2 Italie (Groupe I)
Norvège 4-1 Estonie (Groupe I)
Andorre 0-1 Albanie (Groupe K)
Angleterre 2-0 Serbie (Groupe K)

14 novembre
Luxembourg 0-2 Allemagne (Groupe A)
Slovaquie 1-0 Irlande du Nord (Groupe A)
Finlande 0-1 Malte (Groupe G)
Pologne 1-1 Pays-Bas (Groupe G)
Croatie 3-1 Îles Féroé (Groupe L)
Gibraltar 1-2 Monténégro (Groupe L)

15 novembre
Slovénie 0-2 Kosovo (Groupe B)
Suisse 4-1 Suède (Groupe B)
Danemark 2-2 Belarus (Groupe C)
Grèce 3-2 Écosse (Groupe C)
Géorgie 0-4 Espagne (Groupe E)
Turquie 2-0 Bulgarie (Groupe E)
Bosnie-et-Herzégovine 3-1 Roumanie (Groupe H)
Chypre 0-2 Autriche (Groupe H)
Kazakhstan 1-1 Belgique (Groupe J)
Liechtenstein 0-1 Pays de Galles (Groupe J)

10e journée
16 novembre
Azerbaïdjan 1-3 France (Groupe D)
Ukraine 2-0 Islande (Groupe D)
Portugal 9-1 Arménie (Groupe F)
Hongrie 2-3 République d'Irlande (Groupe F)
Israël 4-1 Moldavie (Groupe I)
Italie 1-4 Norvège (Groupe I)
Albanie 0-2 Angleterre (Groupe K)
Serbie 2-1 Lettonie (Groupe K)

17 novembre
Allemagne 6-0 Slovaquie (Groupe A)
Irlande du Nord 1-0 Luxembourg (Groupe A)
Malte 2-3 Pologne (Groupe G)
Pays-Bas 4-0 Lituanie (Groupe G)
Monténégro 2-3 Croatie (Groupe L)
République tchèque 6-0 Gibraltar (Groupe L)

18 novembre
Kosovo 1-1 Suisse (Groupe B)
Suède 1-1 Slovénie (Groupe B)
Belarus 0-0 Grèce (Groupe C)
Écosse 4-2 Danemark (Groupe C)
Bulgarie 2-1 Géorgie (Groupe E)
Espagne 2-2 Turquie (Groupe E)
Autriche 1-1 Bosnie-et-Herzégovine (Groupe H)
Roumanie 7-1 Saint-Marin (Groupe H)
Belgique 7-0 Liechtenstein (Groupe J)
Pays de Galles 7-1 Macédoine du Nord (Groupe J)

Barrages demi-finales
26 mars 2026
Pays de Galles 1-1 (a.p.) Bosnie-et-Herzégovine (2 tab à 4)
Italie 2-0 Irlande du Nord
Pologne 2-1 Albanie
Ukraine 1-3 Suède
Slovaquie 3-4 Kosovo
Turquie 1-0 Roumanie
Tchéquie 2-2 (a.p.) République d'Irlande (4 tab à 3)
Danemark 4-0 Macédoine du Nord

Barrages finales
31 mars 2026
Bosnie-et-Herzégovine 1-1 (a.p.) Italie (4 tab à 1)
Suède 3-2 Pologne
Kosovo 0-1 Turquie
Tchéquie 2-2 (a.p.) Danemark (3 tab à 1)
"""

# ── Table de correspondance noms FR → EN ─────────────────────────────────────

FR_TO_EN = {
    "Albanie": "Albania",
    "Allemagne": "Germany",
    "Andorre": "Andorra",
    "Angleterre": "England",
    "Arménie": "Armenia",
    "Autriche": "Austria",
    "Azerbaïdjan": "Azerbaijan",
    "Belarus": "Belarus",
    "Belgique": "Belgium",
    "Bosnie-et-Herzégovine": "Bosnia and Herzegovina",
    "Bulgarie": "Bulgaria",
    "Chypre": "Cyprus",
    "Croatie": "Croatia",
    "Danemark": "Denmark",
    "Écosse": "Scotland",
    "Espagne": "Spain",
    "Estonie": "Estonia",
    "Finlande": "Finland",
    "France": "France",
    "Géorgie": "Georgia",
    "Gibraltar": "Gibraltar",
    "Grèce": "Greece",
    "Hongrie": "Hungary",
    "Îles Féroé": "Faroe Islands",
    "Irlande du Nord": "Northern Ireland",
    "Islande": "Iceland",
    "Israël": "Israel",
    "Italie": "Italy",
    "Kazakhstan": "Kazakhstan",
    "Kosovo": "Kosovo",
    "Lettonie": "Latvia",
    "Liechtenstein": "Liechtenstein",
    "Lituanie": "Lithuania",
    "Luxembourg": "Luxembourg",
    "Macédoine du Nord": "North Macedonia",
    "Malte": "Malta",
    "Moldavie": "Moldova",
    "Monténégro": "Montenegro",
    "Norvège": "Norway",
    "Pays de Galles": "Wales",
    "Pays-Bas": "Netherlands",
    "Pologne": "Poland",
    "Portugal": "Portugal",
    "République d'Irlande": "Republic of Ireland",
    "République tchèque": "Czech Republic",
    "Roumanie": "Romania",
    "Saint-Marin": "San Marino",
    "Serbie": "Serbia",
    "Slovaquie": "Slovakia",
    "Slovénie": "Slovenia",
    "Suède": "Sweden",
    "Suisse": "Switzerland",
    "Tchéquie": "Czech Republic",
    "Turquie": "Turkey",
    "Ukraine": "Ukraine",
}

MONTH_FR = {
    "janvier": "01", "février": "02", "mars": "03", "avril": "04",
    "mai": "05", "juin": "06", "juillet": "07", "août": "08",
    "septembre": "09", "octobre": "10", "novembre": "11", "décembre": "12",
}

# ── Patterns ──────────────────────────────────────────────────────────────────

# "26 mars 2026" ou "26 mars" (sans année)
RE_DATE_FULL  = re.compile(r'^(\d{1,2})\s+(\w+)\s+(\d{4})$')
RE_DATE_SHORT = re.compile(r'^(\d{1,2})\s+(\w+)$')

# "Xème journée" ou "Barrages xxx"
RE_ROUND = re.compile(r'^(\d+)[eè]\s+journée|^Barrages', re.IGNORECASE)

# Match normal : "Team1 X-Y Team2 (Groupe Z)"
RE_MATCH_GROUP = re.compile(
    r'^(.+?)\s+(\d+)-(\d+)\s+(.+?)\s+\(Groupe ([A-Z])\)$'
)
# Match barrage sans TAB : "Team1 X-Y Team2"
RE_MATCH_PLAIN = re.compile(
    r'^(.+?)\s+(\d+)-(\d+)\s+(.+?)$'
)
# Match avec prolongations + TAB : "Team1 X-X (a.p.) Team2 (A tab à B)"
RE_MATCH_AP = re.compile(
    r'^(.+?)\s+(\d+)-(\d+)\s+\(a\.p\.\)\s+(.+?)\s+\((\d+)\s+tab\s+à\s+(\d+)\)$'
)
# Match barrage simple aet sans penalties : pas présent ici mais défensif
RE_MATCH_AP_NOPEN = re.compile(
    r'^(.+?)\s+(\d+)-(\d+)\s+\(a\.p\.\)\s+(.+?)$'
)


def translate(name: str) -> str:
    name = name.strip()
    return FR_TO_EN.get(name, name)


def parse_date(day: str, month_fr: str, year: str) -> str:
    m = MONTH_FR.get(month_fr.lower())
    if not m:
        return f"{year}-??-{day.zfill(2)}"
    return f"{year}-{m}-{day.zfill(2)}"


def parse_text(text: str) -> list[dict]:
    records = []
    current_year = "2025"
    current_date = None
    current_round = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        # ─ Ignorer les lignes parasites ─
        if line.startswith("CONSULTEZ") or line.startswith("http") \
                or re.match(r'^[A-Z\s]+[A-Z]$', line) \
                or "Photo by" in line or "Getty" in line \
                or line.startswith("Sandro") or line.startswith("Kosovo v") \
                or line.startswith("Joao") or line.startswith("AMSTERDAM") \
                or line.startswith("OSLO") or line.startswith("PARIS") \
                or line.startswith("GLASGOW") or line.startswith("ZAGREB") \
                or re.match(r'^\d{10}$', line):  # numéros Getty
            continue

        # ─ Journée ─
        if RE_ROUND.match(line):
            current_round = line
            continue

        # ─ Date complète (avec année) ─
        m = RE_DATE_FULL.match(line)
        if m:
            current_year = m.group(3)
            current_date = parse_date(m.group(1), m.group(2), current_year)
            continue

        # ─ Date courte (sans année) ─
        m = RE_DATE_SHORT.match(line)
        if m and m.group(2).lower() in MONTH_FR:
            current_date = parse_date(m.group(1), m.group(2), current_year)
            continue

        # ─ Match avec TAB (a.p.) ─
        m = RE_MATCH_AP.match(line)
        if m:
            home, hs, as_, away, tab_home, tab_away = m.groups()
            records.append({
                "date":          current_date,
                "round":         current_round,
                "group":         "Barrage",
                "home_team":     translate(home),
                "away_team":     translate(away),
                "home_score":    int(hs),
                "away_score":    int(as_),
                "extra_time":    True,
                "pen_home":      int(tab_home),
                "pen_away":      int(tab_away),
                "pen_winner":    translate(home) if int(tab_home) > int(tab_away) else translate(away),
                "tournament":    "FIFA World Cup qualification",
                "confederation": "UEFA",
            })
            continue

        # ─ Match de groupe ─
        m = RE_MATCH_GROUP.match(line)
        if m:
            home, hs, as_, away, group = m.groups()
            records.append({
                "date":          current_date,
                "round":         current_round,
                "group":         f"Groupe {group}",
                "home_team":     translate(home),
                "away_team":     translate(away),
                "home_score":    int(hs),
                "away_score":    int(as_),
                "extra_time":    False,
                "pen_home":      None,
                "pen_away":      None,
                "pen_winner":    None,
                "tournament":    "FIFA World Cup qualification",
                "confederation": "UEFA",
            })
            continue

        # ─ Match barrage sans TAB ─
        if current_round and "Barrage" in (current_round or ""):
            m = RE_MATCH_PLAIN.match(line)
            if m:
                home, hs, as_, away = m.groups()
                records.append({
                    "date":          current_date,
                    "round":         current_round,
                    "group":         "Barrage",
                    "home_team":     translate(home),
                    "away_team":     translate(away),
                    "home_score":    int(hs),
                    "away_score":    int(as_),
                    "extra_time":    False,
                    "pen_home":      None,
                    "pen_away":      None,
                    "pen_winner":    None,
                    "tournament":    "FIFA World Cup qualification",
                    "confederation": "UEFA",
                })

    return records


def save(records: list[dict], path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)
    print(f"✅ {len(records)} matchs → {path}")


if __name__ == "__main__":
    records = parse_text(RAW_TEXT)

    out = os.path.join(os.path.dirname(__file__), "data", "uefa_qualifs_wc2026.csv")
    save(records, out)

    # Vérification rapide
    groups   = sorted(set(r["group"] for r in records))
    rounds   = sorted(set(r["round"] for r in records if r["round"]))
    with_tab = [r for r in records if r["pen_winner"]]

    print(f"\n  Groupes    : {groups}")
    print(f"  Journées   : {len(rounds)} rounds")
    print(f"  Avec TAB   : {len(with_tab)} matchs")
    print(f"\n  Exemple barrages :")
    for r in with_tab:
        print(f"    {r['date']} {r['home_team']} {r['home_score']}-{r['away_score']} "
              f"{r['away_team']}  |  TAB {r['pen_home']}-{r['pen_away']} → {r['pen_winner']}")
