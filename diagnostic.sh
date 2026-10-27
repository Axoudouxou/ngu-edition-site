#!/bin/bash
# Lit la structure du serveur pour préparer la refonte de l'admin.
# N'affiche ni mot de passe, ni nom, ni email de client : seulement la structure et des totaux.
DIR="${1:-/opt/ngu-payment-server}"
cd "$DIR" || { echo "Dossier introuvable : $DIR"; exit 1; }
PY=./venv/bin/python3
[ -x "$PY" ] || PY=python3

"$PY" - <<'PYEOF'
import re, sqlite3, time

c = sqlite3.connect('orders.db')
c.row_factory = sqlite3.Row
now = time.time()

print("===== TABLES =====")
tables = [r[0] for r in c.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name")]
for t in tables:
    cols = [f"{r['name']} {r['type']}" for r in c.execute(f"pragma table_info({t})")]
    n = c.execute(f"select count(*) from {t}").fetchone()[0]
    print(f"{t} ({n} lignes) : " + ", ".join(cols))

print("\n===== COMMANDES =====")
cols = [r['name'] for r in c.execute("pragma table_info(orders)")]
if 'status' in cols:
    for r in c.execute("select status, count(*) n from orders group by status order by n desc"):
        print(f"statut {r['status']!r} : {r['n']}")
if 'format_id' in cols and 'status' in cols:
    for r in c.execute("select case when format_id like '%physique%' then 'papier' else 'ebook' end f, status, count(*) n from orders group by f, status order by f, status"):
        print(f"{r['f']} / {r['status']} : {r['n']}")
if 'customer_email' in cols:
    print("commandes avec email renseigné :", c.execute("select count(*) from orders where coalesce(customer_email,'')<>''").fetchone()[0])
for col in [x for x in cols if x.endswith('_at') or x in ('date', 'created', 'timestamp')]:
    r = c.execute(f"select min(cast({col} as real)) a, max(cast({col} as real)) b from orders").fetchone()
    if r['a']:
        f = lambda v: time.strftime('%Y-%m-%d %H:%M', time.gmtime(v)) if v > 1e9 else str(v)
        print(f"colonne {col} : de {f(r['a'])} à {f(r['b'])}")
tcol = next((x for x in ('created_at', 'updated_at') if x in cols), None)
if tcol and 'status' in cols:
    n = c.execute(f"select count(*) from orders where status='pending' and cast({tcol} as real) < ?", (now - 86400,)).fetchone()[0]
    print(f"en attente depuis plus de 24 h (selon {tcol}) : {n}")

print("\n===== STOCK =====")
if 'stock' in tables:
    for r in c.execute("select * from stock"):
        print(dict(r))

print("\n===== LIVRES =====")
if 'books' in tables:
    bcols = [r['name'] for r in c.execute("pragma table_info(books)")]
    show = [x for x in ('id', 'title', 'author', 'ebook_price', 'physical_price', 'has_ebook_file') if x in bcols]
    for r in c.execute(f"select {', '.join(show)} from books"):
        print(dict(r))

print("\n===== TEXTES DU SITE (clés) =====")
if 'site_content' in tables:
    for r in c.execute("select * from site_content"):
        d = dict(r); k = d.get('key') or list(d.values())[0]
        print(k, "(", len(str(d.get('value', ''))), "caractères )")

lines = open('app.py', encoding='utf-8').read().split('\n')

print("\n===== ROUTES =====")
for i, l in enumerate(lines):
    if l.startswith('@app.route'):
        name = next((m.group(1) for m in (re.match(r'def (\w+)', x) for x in lines[i+1:i+4]) if m), '?')
        print(f"{i+1:4d}  {l.strip()}  ->  {name}")

starts = [i for i, l in enumerate(lines)
          if (l.startswith('@') and (i == 0 or not lines[i-1].startswith('@')))
          or (l.startswith('def ') and (i == 0 or not lines[i-1].startswith('@')))]
starts.append(len(lines))
blocks = [lines[starts[k]:starts[k+1]] for k in range(len(starts) - 1)]
SENSIBLE = re.compile(r'PASSWORD|SECRET|API_KEY|_KEY|TOKEN|WEBHOOK')

def show(pattern):
    for b in blocks:
        head = '\n'.join(b[:6])
        if pattern in head:
            print(f"\n----- {pattern} -----")
            for l in b:
                if l.strip():
                    print(re.sub(r'\S.*', '[ligne masquée]', l) if SENSIBLE.search(l) else l)

print("\n===== FONCTIONS CLÉS =====")
for p in ("'/create-payment'", "'/api/admin/orders'", "'/api/admin/stock'", "def expire_old_orders", "def row_to_book", "def get_db", "def init_db"):
    show(p)
PYEOF
