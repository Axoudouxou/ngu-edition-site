#!/bin/bash
# Reconstruit /var/www/nguedition/sitemap.xml : les pages du site + un lien par livre du catalogue.
# À relancer après l'ajout d'un livre (le script de mise en ligne le fait aussi).
WEB="${WEB:-/var/www/nguedition}"
API="${API:-https://payment.nguedition.com}"
python3 - "$WEB" "$API" <<'PY'
import json, sys, urllib.request
web, api = sys.argv[1], sys.argv[2]
pages = ["/", "/boutique", "/catalogue", "/notre-histoire", "/notre-engagement", "/contact", "/publier",
         "/mentions-legales", "/confidentialite", "/cgv", "/cgu", "/politique-remboursement", "/politique-livraison"]
books = []
try:
    with urllib.request.urlopen(api + "/api/books", timeout=10) as r:
        books = [b["id"] for b in json.load(r) if b.get("id")]
except Exception as e:
    print("Catalogue illisible, sitemap sans les livres :", e)
urls = ["https://nguedition.com" + p for p in pages] + ["https://nguedition.com/livre/" + b for b in books]
xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
xml += "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n"
open(web + "/sitemap.xml", "w", encoding="utf-8").write(xml)
print(f"sitemap.xml : {len(urls)} adresses dont {len(books)} livre(s)")
PY
