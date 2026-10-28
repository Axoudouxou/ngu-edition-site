"""Back-office NGU : commandes, indicateurs, rapports, stock, maisons partenaires, paramètres.

Branché automatiquement par authors.py. Ne modifie ni la table des commandes (sauf
suppression des commandes non payées après 30 jours), ni le paiement, ni l'authentification.
Les colonnes de la base sont détectées au démarrage de chaque requête, pour ne pas dépendre
d'une structure supposée.
"""
import json
import sys
import time
from datetime import datetime, timezone

from flask import jsonify, request

DAY = 86400
HIDE_AFTER = DAY            # une commande non payée disparaît après 24 h
PURGE_AFTER = 30 * DAY      # et n'est supprimée pour de bon qu'après 30 jours
PURGE_EVERY = 600

DELIVERY_FIELDS = ("first_name", "last_name", "phone", "address", "district", "city", "country")
MAX_LEN = 200
FULFILLMENT = ("a_livrer", "livree")
SETTINGS_DEFAULTS = {"default_commission_percent": "15", "default_low_stock": "5"}

_last_purge = 0.0


# ─────────────────────────────────────────────────────────
#  Tables
# ─────────────────────────────────────────────────────────

def init_tables(get_db):
    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS order_delivery (
            reference TEXT PRIMARY KEY,
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            address TEXT NOT NULL DEFAULT '',
            district TEXT NOT NULL DEFAULT '',
            city TEXT NOT NULL DEFAULT '',
            country TEXT NOT NULL DEFAULT '',
            created_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS order_admin (
            reference TEXT PRIMARY KEY,
            fulfillment TEXT NOT NULL DEFAULT '',
            refunded INTEGER NOT NULL DEFAULT 0,
            refunded_at REAL,
            note TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS order_payment (
            reference TEXT PRIMARY KEY,
            method TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS stock_baseline (
            format_id TEXT PRIMARY KEY,
            since REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS partner_houses (
            name TEXT PRIMARY KEY COLLATE NOCASE,
            description TEXT NOT NULL DEFAULT '',
            website TEXT NOT NULL DEFAULT '',
            contact TEXT NOT NULL DEFAULT '',
            created_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS admin_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """
    )
    conn.commit()
    conn.close()


def _cols(conn, table):
    return [r["name"] for r in conn.execute(f"PRAGMA table_info({table})")]


def _has_table(conn, name):
    return conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone() is not None


# ─────────────────────────────────────────────────────────
#  Lecture des commandes
# ─────────────────────────────────────────────────────────

def _order_schema(conn):
    cols = _cols(conn, "orders")
    created = "created_at" if "created_at" in cols else ("updated_at" if "updated_at" in cols else None)
    updated = "updated_at" if "updated_at" in cols else created
    return {"created": created, "updated": updated,
            "email": "customer_email" in cols, "format": "format_id" in cols}


def _book_title_col(conn):
    return "title" if "title" in _cols(conn, "books") else None


def _raw_orders(conn):
    s = _order_schema(conn)
    created = f"CAST(o.{s['created']} AS REAL)" if s["created"] else "0"
    updated = f"CAST(o.{s['updated']} AS REAL)" if s["updated"] else "0"
    email = "o.customer_email" if s["email"] else "''"
    fmt = "o.format_id" if s["format"] else "''"
    title = "b.title" if _book_title_col(conn) else "NULL"
    sql = f"""
        SELECT o.reference AS reference, o.book_id AS book_id, {fmt} AS format_id,
               o.status AS status, o.amount AS amount, {email} AS customer_email,
               {created} AS t_created, {updated} AS t_updated, {title} AS book_title,
               d.first_name AS d_first_name, d.last_name AS d_last_name, d.phone AS d_phone,
               d.address AS d_address, d.district AS d_district, d.city AS d_city,
               d.country AS d_country,
               oa.fulfillment AS fulfillment, oa.refunded AS refunded, oa.note AS note,
               op.method AS payment_method
        FROM orders o
        LEFT JOIN books b ON b.id = o.book_id
        LEFT JOIN order_delivery d ON d.reference = o.reference
        LEFT JOIN order_admin oa ON oa.reference = o.reference
        LEFT JOIN order_payment op ON op.reference = o.reference
    """
    return conn.execute(sql).fetchall()


def _short(reference):
    tail = str(reference).split("-", 1)[-1].replace("-", "")
    return "NGU-" + tail[:8].upper()


def _shape(r, now):
    paid = r["status"] == "paid"
    visible = paid or (
        r["status"] == "pending" and (not r["t_created"] or now - r["t_created"] < HIDE_AFTER)
    )
    t = (r["t_updated"] if paid and r["t_updated"] else r["t_created"]) or 0
    refunded = bool(paid and r["refunded"])
    status = "refunded" if refunded else r["status"]
    kind = "papier" if "physique" in (r["format_id"] or "") else "ebook"
    try:
        amount = int(round(float(r["amount"])))
    except (TypeError, ValueError):
        amount = 0
    delivery = None
    if any(r[f"d_{k}"] for k in DELIVERY_FIELDS):
        delivery = {k: r[f"d_{k}"] or "" for k in DELIVERY_FIELDS}
    fulfillment = None
    if kind == "papier" and paid and not refunded:
        fulfillment = r["fulfillment"] or "a_livrer"
    return {
        "reference": r["reference"],
        "short": _short(r["reference"]),
        "visible": visible,
        "status": status,
        "kind": kind,
        "book_id": r["book_id"],
        "book_title": r["book_title"] or r["book_id"],
        "format_id": r["format_id"],
        "amount": amount,
        "customer_email": r["customer_email"] or "",
        "delivery": delivery,
        "fulfillment": fulfillment,
        "note": r["note"] or "",
        "payment_method": r["payment_method"] or "",
        "t": t,
        "t_created": r["t_created"],
        "date": _iso(t) if t else "",
    }


def _iso(epoch):
    return datetime.fromtimestamp(float(epoch), tz=timezone.utc).strftime("%Y-%m-%d")


def visible_orders(conn):
    now = time.time()
    return [o for o in (_shape(r, now) for r in _raw_orders(conn)) if o["visible"]]


def _maybe_purge(conn):
    """Supprime pour de bon les commandes non payées de plus de 30 jours."""
    global _last_purge
    now = time.time()
    if now - _last_purge < PURGE_EVERY:
        return
    _last_purge = now
    s = _order_schema(conn)
    if not s["created"]:
        return
    cut = now - PURGE_AFTER
    col = f"CAST({s['created']} AS REAL)"
    conn.execute(
        f"DELETE FROM orders WHERE status != 'paid' AND {col} > 0 AND {col} < ?", (cut,)
    )
    conn.execute(
        "DELETE FROM order_delivery WHERE created_at < ? AND reference NOT IN (SELECT reference FROM orders)",
        (cut,),
    )
    conn.execute("DELETE FROM order_admin WHERE reference NOT IN (SELECT reference FROM orders)")
    conn.commit()


def _revenue_orders(orders):
    return [o for o in orders if o["status"] == "paid"]


PAYMENT_METHODS = ("wave", "orange", "mtn", "moov", "djamo")


def _expected_price(conn, book_id, format_id):
    """Prix officiel du livre dans la base.
    Retourne (état, prix) : "ok", "unknown_book", ou "skip" si les colonnes de prix sont introuvables."""
    cols = _cols(conn, "books")
    ebook = next((c for c in cols if "ebook" in c.lower() and "price" in c.lower()), None)
    paper = next((c for c in cols if ("phys" in c.lower() or "papier" in c.lower()) and "price" in c.lower()), None)
    wanted = paper if "physique" in format_id else ebook
    if not wanted:
        return "skip", None
    row = conn.execute(f"SELECT {wanted} AS price FROM books WHERE id = ?", (book_id,)).fetchone()
    if not row:
        return "unknown_book", None
    return "ok", row["price"]


def check_price(conn, data):
    """None si la demande de paiement est conforme, sinon le message d'erreur à renvoyer."""
    book_id = str(data.get("book_id") or "").strip()
    format_id = str(data.get("format_id") or "").strip()
    if not book_id or not format_id or "," in format_id:
        return "Demande de paiement invalide."
    try:
        amount = float(data.get("amount"))
    except (TypeError, ValueError):
        return "Montant invalide."
    state, price = _expected_price(conn, book_id, format_id)
    if state == "skip":
        print("Prix non vérifié : colonnes de prix introuvables dans la table books")
        return None
    if state == "unknown_book":
        return "Livre introuvable."
    try:
        price = float(price)
    except (TypeError, ValueError):
        return "Livre indisponible."
    if price <= 0:
        return "Ce format n'est pas disponible."
    if abs(amount - price) > 0.5:
        return "Le prix de ce livre a changé. Rechargez la page et recommencez."
    return None


def _authors_mod():
    return sys.modules.get("authors")


# ─────────────────────────────────────────────────────────
#  Enregistrement
# ─────────────────────────────────────────────────────────

def register(app, get_db, require_admin):
    init_tables(get_db)

    # ── Coordonnées de livraison reçues avec le paiement ──────────
    @app.before_request
    def ngu_capture_delivery():
        try:
            if request.method == "POST" and request.path == "/create-card-payment":
                return jsonify({"error": "Le paiement par carte n'est pas disponible."}), 410
            if request.method == "POST" and request.path == "/create-payment":
                data = request.get_json(silent=True) or {}
                conn = get_db()
                try:
                    problem = check_price(conn, data)
                finally:
                    conn.close()
                if problem:
                    return jsonify({"error": problem}), 400
                ref = str(data.get("client_reference") or "").strip()
                conn = get_db()
                method = str(data.get("payment_method") or "").strip().lower()
                if ref and method in PAYMENT_METHODS:
                    conn.execute("INSERT OR IGNORE INTO order_payment (reference, method) VALUES (?, ?)", (ref[:120], method))
                delivery = data.get("delivery")
                if ref and isinstance(delivery, dict):
                    values = {k: str(delivery.get(k) or "").strip()[:MAX_LEN] for k in DELIVERY_FIELDS}
                    if any(values.values()):
                        # La première saisie gagne : on ne réécrit pas une commande existante
                        conn.execute(
                            """INSERT OR IGNORE INTO order_delivery
                               (reference, first_name, last_name, phone, address, district, city, country, created_at)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                            (ref[:120], *[values[k] for k in DELIVERY_FIELDS], time.time()),
                        )
                conn.commit()
                conn.close()
        except Exception as e:
            print(f"Erreur contrôle de la commande: {e}")
        return None

    @app.after_request
    def ngu_add_delivery_to_orders(resp):
        # Ancienne liste des commandes : on y ajoute les coordonnées (compatibilité)
        try:
            if (request.method == "GET" and request.path == "/api/admin/orders"
                    and resp.status_code == 200 and resp.is_json):
                data = resp.get_json()
                if isinstance(data, list):
                    refs = [o.get("reference") for o in data if isinstance(o, dict) and o.get("reference")]
                    found = {}
                    if refs:
                        conn = get_db()
                        marks = ",".join("?" * len(refs))
                        for r in conn.execute(
                            f"SELECT * FROM order_delivery WHERE reference IN ({marks})", refs
                        ).fetchall():
                            found[r["reference"]] = {k: r[k] for k in DELIVERY_FIELDS}
                        conn.close()
                    for o in data:
                        if isinstance(o, dict):
                            o["delivery"] = found.get(o.get("reference"))
                    dumps = getattr(getattr(app, "json", None), "dumps", None) or json.dumps
                    resp.set_data(dumps(data))
        except Exception as e:
            print(f"Erreur ajout coordonnées aux commandes: {e}")
        return resp

    # ── Commandes ─────────────────────────────────────────────────

    def _matches(o, q):
        if not q:
            return True
        hay = " ".join([
            o["reference"], o["short"], o["book_title"] or "", o["customer_email"],
            *(o["delivery"].values() if o["delivery"] else []),
        ]).lower()
        return all(part in hay for part in q.lower().split())

    @app.route("/api/admin/v2/orders", methods=["GET"])
    @require_admin
    def ngu_v2_orders():
        conn = get_db()
        _maybe_purge(conn)
        orders = visible_orders(conn)
        conn.close()

        q = (request.args.get("q") or "").strip()
        status = request.args.get("status") or "all"
        kind = request.args.get("kind") or "all"
        period = request.args.get("period") or "all"
        now = time.time()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        month = today[:7]

        def keep(o):
            if status == "to_deliver":
                if o["fulfillment"] != "a_livrer":
                    return False
            elif status != "all" and o["status"] != status:
                return False
            if kind != "all" and o["kind"] != kind:
                return False
            if period == "today" and o["date"] != today:
                return False
            if period == "7d" and not (o["t"] and now - o["t"] <= 7 * DAY):
                return False
            if period == "30d" and not (o["t"] and now - o["t"] <= 30 * DAY):
                return False
            if period == "month" and o["date"][:7] != month:
                return False
            return _matches(o, q)

        items = sorted((o for o in orders if keep(o)), key=lambda o: o["t"], reverse=True)
        total = len(items)
        try:
            limit = max(1, min(int(request.args.get("limit", 50)), 500))
            offset = max(0, int(request.args.get("offset", 0)))
        except ValueError:
            limit, offset = 50, 0
        counts = {
            "all": len(orders),
            "paid": sum(1 for o in orders if o["status"] == "paid"),
            "pending": sum(1 for o in orders if o["status"] == "pending"),
            "refunded": sum(1 for o in orders if o["status"] == "refunded"),
            "to_deliver": sum(1 for o in orders if o["fulfillment"] == "a_livrer"),
        }
        out = [{k: v for k, v in o.items() if k not in ("visible", "t_created")} for o in items[offset:offset + limit]]
        return jsonify({"items": out, "total": total, "counts": counts})

    @app.route("/api/admin/v2/orders/<path:reference>", methods=["GET"])
    @require_admin
    def ngu_v2_order_detail(reference):
        conn = get_db()
        orders = {o["reference"]: o for o in visible_orders(conn)}
        o = orders.get(reference)
        if not o:
            conn.close()
            return jsonify({"error": "commande introuvable"}), 404
        author = None
        A = _authors_mod()
        if A and _has_table(conn, "author_sales"):
            row = conn.execute(
                """SELECT s.gross, s.author_share, s.ngu_share, s.rate, s.voided, a.name
                   FROM author_sales s JOIN authors a ON a.id = s.author_id WHERE s.reference = ?""",
                (reference,),
            ).fetchone()
            if row:
                author = {"name": row["name"], "gross": row["gross"], "author_share": row["author_share"],
                          "ngu_share": row["ngu_share"], "rate": round(row["rate"] * 100, 2),
                          "voided": bool(row["voided"])}
        conn.close()
        o = {k: v for k, v in o.items() if k not in ("visible", "t_created")}
        o["author"] = author
        return jsonify(o)

    def _order_exists(conn, reference):
        return conn.execute("SELECT 1 FROM orders WHERE reference = ?", (reference,)).fetchone() is not None

    def _admin_row(conn, reference):
        conn.execute("INSERT OR IGNORE INTO order_admin (reference) VALUES (?)", (reference,))

    @app.route("/api/admin/v2/orders/<path:reference>/fulfillment", methods=["POST"])
    @require_admin
    def ngu_v2_fulfillment(reference):
        status = (request.json or {}).get("status")
        if status not in FULFILLMENT:
            return jsonify({"error": "statut invalide"}), 400
        conn = get_db()
        if not _order_exists(conn, reference):
            conn.close()
            return jsonify({"error": "commande introuvable"}), 404
        _admin_row(conn, reference)
        conn.execute("UPDATE order_admin SET fulfillment = ? WHERE reference = ?", (status, reference))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/v2/orders/<path:reference>/note", methods=["POST"])
    @require_admin
    def ngu_v2_note(reference):
        note = str((request.json or {}).get("note") or "").strip()[:1000]
        conn = get_db()
        if not _order_exists(conn, reference):
            conn.close()
            return jsonify({"error": "commande introuvable"}), 404
        _admin_row(conn, reference)
        conn.execute("UPDATE order_admin SET note = ? WHERE reference = ?", (note, reference))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/v2/orders/<path:reference>/refund", methods=["POST"])
    @require_admin
    def ngu_v2_refund(reference):
        refunded = int(bool((request.json or {}).get("refunded", True)))
        conn = get_db()
        row = conn.execute("SELECT status FROM orders WHERE reference = ?", (reference,)).fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "commande introuvable"}), 404
        if row["status"] != "paid":
            conn.close()
            return jsonify({"error": "seule une commande payée peut être remboursée"}), 400
        _admin_row(conn, reference)
        conn.execute(
            "UPDATE order_admin SET refunded = ?, refunded_at = ? WHERE reference = ?",
            (refunded, time.time() if refunded else None, reference),
        )
        # Une vente remboursée sort aussi du solde de l'auteur
        if _has_table(conn, "author_sales"):
            conn.execute("UPDATE author_sales SET voided = ? WHERE reference = ?", (refunded, reference))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    # ── Tableau de bord ───────────────────────────────────────────

    @app.route("/api/admin/v2/dashboard", methods=["GET"])
    @require_admin
    def ngu_v2_dashboard():
        conn = get_db()
        _maybe_purge(conn)
        orders = visible_orders(conn)
        paid = _revenue_orders(orders)
        now = time.time()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        month = today[:7]

        def total(sel):
            return sum(o["amount"] for o in paid if sel(o))

        revenue = {
            "total": total(lambda o: True),
            "month": total(lambda o: o["date"][:7] == month),
            "week": total(lambda o: o["t"] and now - o["t"] <= 7 * DAY),
            "today": total(lambda o: o["date"] == today),
        }
        by_kind = {}
        for kind in ("ebook", "papier"):
            sel = [o for o in paid if o["kind"] == kind]
            by_kind[kind] = {"orders": len(sel), "revenue": sum(o["amount"] for o in sel)}
        recent = [
            {"reference": o["reference"], "short": o["short"], "date": o["date"], "book_title": o["book_title"],
             "kind": o["kind"], "amount": o["amount"],
             "customer": (f"{o['delivery']['first_name']} {o['delivery']['last_name']}".strip()
                          if o["delivery"] else o["customer_email"])}
            for o in sorted(paid, key=lambda o: o["t"], reverse=True)[:8]
        ]
        authors_due = None
        A = _authors_mod()
        if A and _has_table(conn, "authors"):
            try:
                A.sync_sales(conn)
                authors_due = sum(A.author_totals(conn, a["id"])["balance"]
                                  for a in conn.execute("SELECT id FROM authors").fetchall())
            except Exception as e:
                print(f"Erreur solde auteurs: {e}")
        new_submissions = 0
        try:
            if _has_table(conn, "submissions"):
                new_submissions = conn.execute("SELECT COUNT(*) AS n FROM submissions WHERE status = 'nouvelle'").fetchone()["n"]
        except Exception:
            pass
        conn.close()
        return jsonify({
            "submissions_new": new_submissions,
            "revenue": revenue,
            "orders": {
                "paid": len(paid),
                "pending": sum(1 for o in orders if o["status"] == "pending"),
                "refunded": sum(1 for o in orders if o["status"] == "refunded"),
                "to_deliver": sum(1 for o in orders if o["fulfillment"] == "a_livrer"),
            },
            "by_kind": by_kind,
            "recent": recent,
            "authors_due": authors_due,
        })

    # ── Rapports ──────────────────────────────────────────────────

    def _parse_day(value, end=False):
        try:
            d = datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            return None
        return d.timestamp() + (DAY - 1 if end else 0)

    @app.route("/api/admin/v2/reports", methods=["GET"])
    @require_admin
    def ngu_v2_reports():
        t_from = _parse_day(request.args.get("from"))
        t_to = _parse_day(request.args.get("to"), end=True)
        conn = get_db()
        orders = [o for o in _revenue_orders(visible_orders(conn))
                  if (t_from is None or o["t"] >= t_from) and (t_to is None or o["t"] <= t_to)]

        months = {}
        for o in orders:
            m = months.setdefault(o["date"][:7], {"month": o["date"][:7], "orders": 0, "revenue": 0})
            m["orders"] += 1
            m["revenue"] += o["amount"]

        books = {}
        for o in orders:
            b = books.setdefault(o["book_id"], {
                "book_id": o["book_id"], "title": o["book_title"],
                "ebook_units": 0, "ebook_revenue": 0, "papier_units": 0, "papier_revenue": 0})
            b[f"{o['kind']}_units"] += 1
            b[f"{o['kind']}_revenue"] += o["amount"]
        for b in books.values():
            b["units"] = b["ebook_units"] + b["papier_units"]
            b["revenue"] = b["ebook_revenue"] + b["papier_revenue"]

        kinds = {k: {"orders": 0, "revenue": 0} for k in ("ebook", "papier")}
        for o in orders:
            kinds[o["kind"]]["orders"] += 1
            kinds[o["kind"]]["revenue"] += o["amount"]

        authors = []
        A = _authors_mod()
        if A and _has_table(conn, "authors"):
            try:
                A.sync_sales(conn)
                for a in conn.execute("SELECT * FROM authors ORDER BY name").fetchall():
                    cond, params = "author_id = ? AND voided = 0", [a["id"]]
                    if t_from is not None:
                        cond += " AND sold_at >= ?"; params.append(t_from)
                    if t_to is not None:
                        cond += " AND sold_at <= ?"; params.append(t_to)
                    s = conn.execute(
                        f"""SELECT COUNT(*) AS n, COALESCE(SUM(gross),0) AS gross,
                                   COALESCE(SUM(author_share),0) AS author_share,
                                   COALESCE(SUM(ngu_share),0) AS ngu_share FROM author_sales WHERE {cond}""",
                        params).fetchone()
                    tot = A.author_totals(conn, a["id"])
                    authors.append({"name": a["name"], "sold": s["n"], "gross": s["gross"],
                                    "author_share": s["author_share"], "ngu_share": s["ngu_share"],
                                    "paid": tot["paid"], "balance": tot["balance"]})
            except Exception as e:
                print(f"Erreur rapport auteurs: {e}")
        conn.close()
        return jsonify({
            "totals": {"orders": len(orders), "revenue": sum(o["amount"] for o in orders)},
            "months": sorted(months.values(), key=lambda m: m["month"]),
            "books": sorted(books.values(), key=lambda b: b["revenue"], reverse=True),
            "kinds": kinds,
            "authors": authors,
        })

    # ── Stock : ce qui reste = quantité comptée moins ventes papier depuis ──

    @app.route("/api/admin/v2/stock-sold", methods=["GET"])
    @require_admin
    def ngu_v2_stock_sold():
        conn = get_db()
        orders = [o for o in _revenue_orders(visible_orders(conn)) if o["kind"] == "papier"]
        base = {r["format_id"]: r["since"] for r in conn.execute("SELECT * FROM stock_baseline").fetchall()}
        now = time.time()
        for fid in {o["format_id"] for o in orders if o["format_id"]} - set(base):
            conn.execute("INSERT OR IGNORE INTO stock_baseline (format_id, since) VALUES (?, ?)", (fid, now))
            base[fid] = now
        conn.commit()
        out = {}
        for fid, since in base.items():
            out[fid] = {"since": since,
                        "sold": sum(1 for o in orders if o["format_id"] == fid and o["t"] >= since)}
        conn.close()
        return jsonify(out)

    @app.route("/api/admin/v2/stock-baseline", methods=["POST"])
    @require_admin
    def ngu_v2_stock_baseline():
        fid = str((request.json or {}).get("format_id") or "").strip()
        if not fid:
            return jsonify({"error": "format manquant"}), 400
        conn = get_db()
        conn.execute("INSERT OR REPLACE INTO stock_baseline (format_id, since) VALUES (?, ?)", (fid, time.time()))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    # ── Maisons partenaires ───────────────────────────────────────

    @app.route("/api/admin/v2/publishers", methods=["GET"])
    @require_admin
    def ngu_v2_publishers():
        conn = get_db()
        houses = {r["name"].casefold(): dict(r) for r in conn.execute("SELECT * FROM partner_houses").fetchall()}
        used = {}
        if _has_table(conn, "book_publishers"):
            for r in conn.execute(
                """SELECT p.publisher, p.book_id, COALESCE(b.title, p.book_id) AS title
                   FROM book_publishers p LEFT JOIN books b ON b.id = p.book_id"""
            ).fetchall():
                used.setdefault(r["publisher"].casefold(), {"name": r["publisher"], "books": []})["books"].append(
                    {"id": r["book_id"], "title": r["title"]})
        orders = _revenue_orders(visible_orders(conn))
        conn.close()
        out = []
        for key in sorted(set(houses) | set(used)):
            h = houses.get(key, {})
            u = used.get(key, {"name": h.get("name", key), "books": []})
            ids = {b["id"] for b in u["books"]}
            mine = [o for o in orders if o["book_id"] in ids]
            out.append({
                "name": h.get("name") or u["name"],
                "description": h.get("description", ""), "website": h.get("website", ""),
                "contact": h.get("contact", ""), "books": u["books"],
                "sold": len(mine), "revenue": sum(o["amount"] for o in mine),
            })
        return jsonify(out)

    def _find_house(conn, name):
        wanted = str(name).strip().casefold()
        for r in conn.execute("SELECT name FROM partner_houses").fetchall():
            if r["name"].casefold() == wanted:
                return r["name"]
        return None

    def _house_fields(data):
        return (str(data.get("description") or "").strip()[:1000],
                str(data.get("website") or "").strip()[:300],
                str(data.get("contact") or "").strip()[:300])

    @app.route("/api/admin/v2/publishers", methods=["POST"])
    @require_admin
    def ngu_v2_create_publisher():
        data = request.json or {}
        name = str(data.get("name") or "").strip()[:120]
        if not name:
            return jsonify({"error": "nom requis"}), 400
        desc, site, contact = _house_fields(data)
        conn = get_db()
        if _find_house(conn, name):
            conn.close()
            return jsonify({"error": "cette maison existe déjà"}), 409
        conn.execute(
            "INSERT INTO partner_houses (name, description, website, contact, created_at) VALUES (?,?,?,?,?)",
            (name, desc, site, contact, time.time()))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/v2/publishers/<path:name>", methods=["PUT"])
    @require_admin
    def ngu_v2_update_publisher(name):
        desc, site, contact = _house_fields(request.json or {})
        conn = get_db()
        stored = _find_house(conn, name)
        if stored:
            conn.execute(
                "UPDATE partner_houses SET description = ?, website = ?, contact = ? WHERE name = ?",
                (desc, site, contact, stored))
        else:
            conn.execute(
                "INSERT INTO partner_houses (name, description, website, contact, created_at) VALUES (?,?,?,?,?)",
                (name, desc, site, contact, time.time()))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/v2/publishers/<path:name>", methods=["DELETE"])
    @require_admin
    def ngu_v2_delete_publisher(name):
        conn = get_db()
        if _has_table(conn, "book_publishers") and any(
                r["publisher"].casefold() == name.strip().casefold()
                for r in conn.execute("SELECT publisher FROM book_publishers").fetchall()):
            conn.close()
            return jsonify({"error": "des livres sont encore rattachés à cette maison"}), 409
        stored = _find_house(conn, name)
        if stored:
            conn.execute("DELETE FROM partner_houses WHERE name = ?", (stored,))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    # ── Paramètres ────────────────────────────────────────────────

    @app.route("/api/admin/v2/settings", methods=["GET"])
    @require_admin
    def ngu_v2_get_settings():
        conn = get_db()
        values = dict(SETTINGS_DEFAULTS)
        for r in conn.execute("SELECT key, value FROM admin_settings").fetchall():
            if r["key"] in SETTINGS_DEFAULTS:
                values[r["key"]] = r["value"]
        conn.close()
        return jsonify(values)

    @app.route("/api/admin/v2/settings", methods=["PUT"])
    @require_admin
    def ngu_v2_put_settings():
        data = request.json or {}
        conn = get_db()
        for key in SETTINGS_DEFAULTS:
            if key in data:
                try:
                    value = float(data[key])
                except (TypeError, ValueError):
                    conn.close()
                    return jsonify({"error": f"valeur invalide pour {key}"}), 400
                if value < 0 or (key == "default_commission_percent" and value > 100):
                    conn.close()
                    return jsonify({"error": f"valeur invalide pour {key}"}), 400
                conn.execute("INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)",
                             (key, str(int(value)) if value == int(value) else str(value)))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    # ── Abonnés à la newsletter ───────────────────────────────────

    @app.route("/api/admin/v2/subscribers", methods=["GET"])
    @require_admin
    def ngu_v2_subscribers():
        conn = get_db()
        if not _has_table(conn, "newsletter_subscribers"):
            conn.close()
            return jsonify({"items": [], "total": 0})
        cols = _cols(conn, "newsletter_subscribers")
        email_col = next((c for c in cols if "email" in c.lower()), None)
        date_col = next((c for c in cols if any(k in c.lower() for k in ("created", "date", "subscribed", "updated"))), None)
        if not email_col:
            conn.close()
            return jsonify({"items": [], "total": 0})
        date_sql = f"CAST({date_col} AS REAL)" if date_col else "0"
        rows = conn.execute(
            f"SELECT {email_col} AS email, {date_sql} AS t FROM newsletter_subscribers ORDER BY t DESC, email"
        ).fetchall()
        conn.close()
        items = []
        for r in rows:
            t = r["t"] or 0
            items.append({"email": r["email"], "date": _iso(t) if t > 1e9 else ""})
        return jsonify({"items": items, "total": len(items)})
