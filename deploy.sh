#!/bin/bash
# Mise en ligne de NGU Édition : le serveur d'abord, puis le site. Le script s'arrête à la première erreur.
set -euo pipefail
BASE="https://raw.githubusercontent.com/Axoudouxou/ngu-edition-site/main"
T=$(date +%s)
APP=/opt/ngu-payment-server
WEB=/var/www/nguedition
JS="index-CwEE_3Ik.js"
CSS="index-BYWWVf7Q.css"

get() {   # $1 = chemin sur GitHub, $2 = destination
  curl -fsS -o "$2" "$BASE/$1?nocache=$T" || { echo "ÉCHEC : $1 est introuvable sur GitHub (les fichiers ont-ils été envoyés, puis « Commit » ?)"; exit 1; }
}

echo "== 1/4 Sauvegarde de la base"
cd "$APP"
cp orders.db "orders.db.avant-$(date +%Y%m%d-%H%M)"

echo "== 2/4 Serveur"
for f in authors.py admin_api.py submissions.py catalog.py; do get "$f" "$f"; done
wc -c authors.py admin_api.py submissions.py catalog.py
./venv/bin/python3 -c "import app; print('chargement OK')" > /tmp/ngu-load.txt 2>&1 || true
cat /tmp/ngu-load.txt
if ! grep -q "chargement OK" /tmp/ngu-load.txt || grep -q "non chargé" /tmp/ngu-load.txt; then
  echo "ÉCHEC : le serveur ne se charge pas correctement. Le site n'a pas été touché. Envoyez-moi ce qui précède."; exit 1
fi
systemctl restart ngu-payment.service
sleep 3
systemctl is-active --quiet ngu-payment.service || { echo "ÉCHEC : le service ne redémarre pas."; journalctl -u ngu-payment.service -n 25 --no-pager; exit 1; }
code=$(curl -s -o /dev/null -w "%{http_code}" https://payment.nguedition.com/api/books)
[ "$code" = "200" ] || { echo "ÉCHEC : la liste des livres répond $code."; exit 1; }
code=$(curl -s -o /dev/null -w "%{http_code}" https://payment.nguedition.com/api/admin/v2/catalog)
[ "$code" = "401" ] || { echo "ÉCHEC : le catalogue sur commande n'est pas actif (réponse $code au lieu de 401)."; exit 1; }
echo "Serveur : OK"

echo "== 3/4 Site"
cd "$WEB"
rm -rf assets
mkdir assets
mkdir -p fonts
get server-index.html index.html
get "$JS" "assets/$JS"
get "$CSS" "assets/$CSS"
for f in robots.txt site.webmanifest favicon.ico favicon-32.png apple-touch-icon.png icon-192.png icon-512.png og-image.jpg logo.jpg; do get "public/$f" "$f"; done
for f in league-spartan-latin-{400,500,600,700}-normal.woff2 montserrat-latin-{300,400,500,600,700}-normal.woff2 montserrat-latin-400-italic.woff2 cormorant-garamond-latin-{400,500,600}-normal.woff2 cormorant-garamond-latin-{400,500}-italic.woff2; do get "public/fonts/$f" "fonts/$f"; done
grep -q "$JS" index.html || { echo "ÉCHEC : index.html ne correspond pas aux fichiers téléchargés."; exit 1; }
echo "Site : OK"

echo "== 4/4 Plan du site (sitemap)"
get update-sitemap.sh /root/update-sitemap.sh
bash /root/update-sitemap.sh

echo
echo "== Vérifications"
curl -s -o /dev/null -w "site : %{http_code}\n" https://nguedition.com/
curl -s -o /dev/null -w "police : %{http_code}\n" https://nguedition.com/fonts/montserrat-latin-400-normal.woff2
curl -s -o /dev/null -w "robots.txt : %{http_code}\n" https://nguedition.com/robots.txt
curl -s -o /dev/null -w "sitemap.xml : %{http_code}\n" https://nguedition.com/sitemap.xml
curl -s -o /dev/null -w "catalogue public : %{http_code}\n" https://payment.nguedition.com/api/catalog
echo "-- protection du prix (doit répondre un refus) :"
curl -s -X POST https://payment.nguedition.com/create-payment -H 'Content-Type: application/json' -d '{"amount":"1","currency":"XOF","client_reference":"NGU-TEST-PRIX","book_id":"si-javais-su-a-16-ans","format_id":"si-javais-su-a-16-ans-ebook","customer_email":"test@test.com","payment_method":"wave"}'
echo
echo "-- limite de taille des PDF envoyés (nginx) :"
grep -rn "client_max_body_size" /etc/nginx/ || echo "aucune limite indiquée : nginx applique 1 Mo, à relever"
echo
echo "== Terminé."
