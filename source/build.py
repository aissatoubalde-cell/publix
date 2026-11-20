#!/usr/bin/env python3
"""Assemble le site Publix 360° à partir de src/.

Sources :
  src/style.css, src/main.js     styles et script communs
  src/header.html, footer.html   barre du haut, menu, pied de page
  src/pages/<page>.html          contenu propre à chaque page

Sorties :
  publix360-site/   site complet (pages HTML + style.css + main.js + img/) pour Vercel
  site/             même chose, avec site/index.html sans <head> pour la page Claude

Deux façons de l'utiliser :
  - sur l'ordinateur de travail (dossier Sossa) : python3 build.py
    -> reconstruit le site et recopie src/ + build.py dans publix360-site/source/
  - depuis le dépôt GitHub (dossier source/) : python3 source/build.py
    -> reconstruit les pages à la racine du dépôt (les images sont déjà dans img/)
"""
import re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
IN_REPO = not (ROOT / "publix360-site").exists() and ROOT.name == "source"
OUT = ROOT.parent if IN_REPO else ROOT / "publix360-site"
ART = None if IN_REPO else ROOT / "site"

# page -> (fichier, titre de l'onglet, titre affiché, sous-titre, lien du menu actif)
PAGES = {
    "index":        ("index.html",        "Publix 360°", None, None, "index.html"),
    "a-propos":     ("a-propos.html",     "À propos · Publix 360°", "À propos", "Qui nous sommes, notre mission et notre façon de travailler.", "a-propos.html"),
    "services":     ("services.html",     "Nos services · Publix 360°", "Nos services", "Sept métiers réunis dans une seule équipe, de la stratégie jusqu'au terrain.", "services.html"),
    "realisations": ("realisations.html", "Nos réalisations · Publix 360°", "Nos réalisations", "Des campagnes menées sur le terrain, en images et en vidéo.", "realisations.html"),
    # "actualites" : page mise de côté pour l'instant (source gardée dans src/pages/actualites.html)
    "galerie":      ("galerie.html",      "Galerie · Publix 360°", "Galerie", "Nos campagnes en images. Cliquez sur une photo pour l'agrandir.", "galerie.html"),
    "contact":      ("contact.html",      "Contact · Publix 360°", "Contact", "Parlons de votre prochaine campagne.", "contact.html"),
}

# ancres de l'ancienne page unique -> nouvelles pages
LINKS = {
    "#accueil": "index.html", "#apropos": "a-propos.html", "#services": "services.html",
    "#realisations": "realisations.html", "#partenaires": "index.html#partenaires",
    "#actualites": "actualites.html", "#galerie": "galerie.html", "#contact": "contact.html",
    "#video": "realisations.html#video",
}

def relink(html):
    html = re.sub(r'href="#svc-([a-z]+)"', r'href="services.html#svc-\1"', html)
    for old, new in LINKS.items():
        html = html.replace(f'href="{old}"', f'href="{new}"')
    return html

def nav_for(active):
    h = relink((SRC / "header.html").read_text())
    h = h.replace('<a class="on" href=', '<a href=')
    h = re.sub(r'(<ul class="menu">.*?)<a href="%s"' % re.escape(active),
               lambda m: m.group(1) + f'<a class="on" aria-current="page" href="{active}"', h, count=1, flags=re.S)
    return h

def page_head(title, sub, page):
    return f'''<section class="page-head">
  <div class="wrap">
    <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a><span aria-hidden="true">/</span><span>{title}</span></nav>
    <h1>{title}</h1>
    <p>{sub}</p>
  </div>
</section>
'''

def body(key):
    fname, tab, title, sub, active = PAGES[key]
    content = relink((SRC / "pages" / f"{key}.html").read_text())
    head = page_head(title, sub, key) if title else ""
    return (nav_for(active) + "\n" + f'<main class="page page-{key}">\n' + head + "\n" + content
            + "</main>\n\n" + relink((SRC / "footer.html").read_text())
            + '\n<script src="main.js"></script>\n')

def head_tags(tab, desc):
    fonts = (SRC / "fonts.html").read_text().strip()
    return (f'<title>{tab}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'<meta name="description" content="{desc}">\n<link rel="icon" href="img/favicon.png">\n'
            f'{fonts}\n<link rel="stylesheet" href="style.css">\n')

DESC = "Publix 360 · Découvrez, Engagez, Propulsez. Agence de publicité et de marketing à Conakry, communication globale à 360°."

def full_doc(key):
    fname, tab, *_ = PAGES[key]
    return ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head_tags(tab, DESC) + '</head>\n<body>\n' + body(key) + '</body>\n</html>\n')

def build():
    for out in [o for o in (OUT, ART) if o]:
        out.mkdir(exist_ok=True)
        shutil.copy(SRC / "style.css", out / "style.css")
        shutil.copy(SRC / "main.js", out / "main.js")
        for key, (fname, *_r) in PAGES.items():
            (out / fname).write_text(full_doc(key))
    if not IN_REPO:
        # la page Claude ajoute elle-même <!doctype>, <head> et <body> autour de index.html
        _, tab, *_r = PAGES["index"]
        (ART / "index.html").write_text(head_tags(tab, DESC) + "\n" + body("index"))
        # images : site/img est la référence
        shutil.copytree(ART / "img", OUT / "img", dirs_exist_ok=True)
        # fichiers de travail recopiés dans le dépôt GitHub (non publiés, voir .vercelignore)
        dst = OUT / "source"
        if (dst / "src").exists():
            shutil.rmtree(dst / "src")
        shutil.copytree(SRC, dst / "src")
        shutil.copy(Path(__file__).resolve(), dst / "build.py")
    print("Pages :", ", ".join(p[0] for p in PAGES.values()))

if __name__ == "__main__":
    build()
