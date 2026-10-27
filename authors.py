"""Espace auteurs NGU : comptes, calcul des parts, versements, tableau de bord.

Branché sur app.py avec une seule ligne :
    register_author_routes(app, get_db, require_admin)
Rien dans app.py n'est modifié à part cet appel.
"""
import base64
import hashlib
import hmac
import html
import json
import os
import secrets
import threading
import time
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from flask import g, jsonify, request

LOGIN_LINK_BASE = "https://nguedition.com/auteur/connexion?token="
LOGIN_TOKEN_TTL = 15 * 60
SESSION_TTL = 30 * 24 * 3600
MAX_LOGIN_LINKS_PER_HOUR = 5
DEFAULT_COMMISSION_PERCENT = 15
FROM_ADDRESS = "NGU Edition <edition@nguedition.com>"
DEFAULT_PUBLISHER = "NGU Édition"


# ─────────────────────────────────────────────────────────
#  Tables
# ─────────────────────────────────────────────────────────

def init_tables(get_db):
    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS authors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            payout_phone TEXT NOT NULL DEFAULT '',
            commission_rate REAL NOT NULL DEFAULT 0.15,
            active INTEGER NOT NULL DEFAULT 1,
            created_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS author_books (
            book_id TEXT PRIMARY KEY,
            author_id INTEGER NOT NULL,
            assigned_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS author_sales (
            reference TEXT PRIMARY KEY,
            author_id INTEGER NOT NULL,
            book_id TEXT NOT NULL,
            gross INTEGER NOT NULL,
            rate REAL NOT NULL,
            author_share INTEGER NOT NULL,
            ngu_share INTEGER NOT NULL,
            sold_at REAL NOT NULL,
            voided INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS author_payouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            paid_at REAL NOT NULL,
            note TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS book_publishers (
            book_id TEXT PRIMARY KEY,
            publisher TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS author_login_tokens (
            token_hash TEXT PRIMARY KEY,
            author_id INTEGER NOT NULL,
            expires_at REAL NOT NULL,
            used INTEGER NOT NULL DEFAULT 0,
            created_at REAL NOT NULL
        );
        """
    )
    conn.commit()
    conn.close()


# ─────────────────────────────────────────────────────────
#  Calcul des parts
# ─────────────────────────────────────────────────────────

def split_amount(gross, rate):
    """Retourne (part_ngu, part_auteur) en FCFA entiers, somme = gross."""
    ngu = int((Decimal(gross) * Decimal(str(rate))).quantize(Decimal(1), rounding=ROUND_HALF_UP))
    return ngu, gross - ngu


def sync_sales(conn):
    """Enregistre les nouvelles ventes d'ebook payées des livres d'auteurs.

    Le taux appliqué est figé au moment où la vente est enregistrée ici, donc
    modifier le taux d'un auteur plus tard ne change pas ses ventes passées.
    Les commandes payées avant le rattachement du livre à l'auteur sont ignorées
    (achats de test de l'équipe, par exemple).
    """
    rows = conn.execute(
        """
        SELECT o.reference, o.book_id, o.amount, o.updated_at,
               ab.author_id, a.commission_rate
        FROM orders o
        JOIN author_books ab ON ab.book_id = o.book_id
        JOIN authors a ON a.id = ab.author_id
        WHERE o.status = 'paid'
          AND o.format_id LIKE '%ebook%'
          AND o.format_id NOT LIKE '%,%'
          AND CAST(o.updated_at AS REAL) >= ab.assigned_at
          AND NOT EXISTS (SELECT 1 FROM author_sales s WHERE s.reference = o.reference)
        """
    ).fetchall()
    for r in rows:
        try:
            gross = int(round(float(r["amount"])))
        except (TypeError, ValueError):
            continue
        if gross <= 0:
            continue
        ngu, share = split_amount(gross, r["commission_rate"])
        conn.execute(
            """INSERT OR IGNORE INTO author_sales
               (reference, author_id, book_id, gross, rate, author_share, ngu_share, sold_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (r["reference"], r["author_id"], r["book_id"], gross,
             r["commission_rate"], share, ngu, float(r["updated_at"])),
        )
    conn.commit()


def author_totals(conn, author_id):
    s = conn.execute(
        """SELECT COUNT(*) AS sold, COALESCE(SUM(gross), 0) AS gross,
                  COALESCE(SUM(author_share), 0) AS earned,
                  COALESCE(SUM(ngu_share), 0) AS ngu
           FROM author_sales WHERE author_id = ? AND voided = 0""",
        (author_id,),
    ).fetchone()
    p = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) AS paid FROM author_payouts WHERE author_id = ?",
        (author_id,),
    ).fetchone()
    return {
        "sold": s["sold"],
        "gross": s["gross"],
        "earned": s["earned"],
        "ngu": s["ngu"],
        "paid": p["paid"],
        "balance": s["earned"] - p["paid"],
    }


def _date(epoch):
    return datetime.fromtimestamp(float(epoch), tz=timezone.utc).strftime("%Y-%m-%d")


# ─────────────────────────────────────────────────────────
#  Session auteur (signée, distincte du jeton admin)
# ─────────────────────────────────────────────────────────

def _secret():
    return os.environ.get("SECRET_KEY", "").encode()


def make_author_session(author_id):
    expiry = int(time.time()) + SESSION_TTL
    payload = f"author:{author_id}:{expiry}"
    sig = hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(f"{payload}:{sig}".encode()).decode()


def read_author_session(token):
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        prefix, author_id, expiry, sig = raw.split(":")
        if prefix != "author":
            return None
        payload = f"{prefix}:{author_id}:{expiry}"
        expected = hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        if int(time.time()) >= int(expiry):
            return None
        return int(author_id)
    except Exception:
        return None


# ─────────────────────────────────────────────────────────
#  Email du lien de connexion
# ─────────────────────────────────────────────────────────

def send_login_email(to_email, name, link):
    try:
        import resend

        safe_name = html.escape(name)
        safe_link = html.escape(link, quote=True)
        html_body = (
            '<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; '
            'padding: 32px 24px; background-color: #E6E2DA; color: #2A3B19;">'
            '<div style="text-align: center; margin-bottom: 24px;">'
            '<img src="https://nguedition.com/logo.jpg" alt="NGU" '
            'style="width: 56px; height: 56px; border-radius: 8px;" /></div>'
            f'<p style="font-size: 15px; line-height: 1.6;">Bonjour {safe_name},</p>'
            '<p style="font-size: 15px; line-height: 1.6;">Voici votre lien pour accéder à votre '
            'espace auteur NGU. Il ne fonctionne qu\'une fois et reste valable 15 minutes.</p>'
            '<div style="text-align: center; margin: 28px 0;">'
            f'<a href="{safe_link}" style="background-color: #C9A15A; color: #2A3B19; '
            'text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: bold; '
            'font-size: 15px; display: inline-block;">Accéder à mon espace</a></div>'
            '<p style="font-size: 13px; color: #666;">Si vous n\'avez rien demandé, ignorez '
            'simplement ce message.</p>'
            '<p style="font-size: 14px;">L\'équipe NGU</p></div>'
        )
        text_body = (
            f"Bonjour {name},\n\n"
            "Voici votre lien pour accéder à votre espace auteur NGU :\n"
            f"{link}\n\n"
            "Il ne fonctionne qu'une fois et reste valable 15 minutes. "
            "Si vous n'avez rien demandé, ignorez simplement ce message.\n\n"
            "L'équipe NGU"
        )
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": [to_email],
            "subject": "Votre lien de connexion NGU",
            "html": html_body,
            "text": text_body,
        })
    except Exception as e:
        print(f"Erreur envoi lien auteur: {e}")


# ─────────────────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────────────────

def _percent_to_rate(value):
    percent = float(value)
    if percent < 0 or percent > 100:
        raise ValueError("percent out of range")
    return percent / 100.0


def register_author_routes(app, get_db, require_admin):
    init_tables(get_db)

    def require_author(f):
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            token = auth.replace("Bearer ", "")
            author_id = read_author_session(token) if token else None
            if not author_id:
                return jsonify({"error": "unauthorized"}), 401
            conn = get_db()
            row = conn.execute(
                "SELECT * FROM authors WHERE id = ? AND active = 1", (author_id,)
            ).fetchone()
            conn.close()
            if not row:
                return jsonify({"error": "unauthorized"}), 401
            g.author = dict(row)
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper

    # ── Auteur : connexion par lien envoyé par email ──────────────

    @app.route("/api/author/request-login", methods=["POST"])
    def ngu_author_request_login():
        email = ((request.json or {}).get("email") or "").strip().lower()
        if email and "@" in email:
            conn = get_db()
            author = conn.execute(
                "SELECT * FROM authors WHERE email = ? AND active = 1", (email,)
            ).fetchone()
            if author:
                recent = conn.execute(
                    "SELECT COUNT(*) AS n FROM author_login_tokens WHERE author_id = ? AND created_at > ?",
                    (author["id"], time.time() - 3600),
                ).fetchone()["n"]
                if recent < MAX_LOGIN_LINKS_PER_HOUR:
                    token = secrets.token_urlsafe(32)
                    conn.execute(
                        """INSERT INTO author_login_tokens
                           (token_hash, author_id, expires_at, created_at) VALUES (?, ?, ?, ?)""",
                        (hashlib.sha256(token.encode()).hexdigest(), author["id"],
                         time.time() + LOGIN_TOKEN_TTL, time.time()),
                    )
                    conn.commit()
                    threading.Thread(
                        target=send_login_email,
                        args=(author["email"], author["name"], LOGIN_LINK_BASE + token),
                        daemon=True,
                    ).start()
            conn.close()
        # Même réponse que l'adresse existe ou non
        return jsonify({"status": "ok"})

    @app.route("/api/author/verify", methods=["POST"])
    def ngu_author_verify():
        token = ((request.json or {}).get("token") or "").strip()
        if not token:
            return jsonify({"error": "invalid"}), 400
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        conn = get_db()
        row = conn.execute(
            """SELECT t.author_id, a.name FROM author_login_tokens t
               JOIN authors a ON a.id = t.author_id
               WHERE t.token_hash = ? AND t.used = 0 AND t.expires_at > ? AND a.active = 1""",
            (token_hash, time.time()),
        ).fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "invalid"}), 400
        cur = conn.execute(
            "UPDATE author_login_tokens SET used = 1 WHERE token_hash = ? AND used = 0",
            (token_hash,),
        )
        conn.commit()
        conn.close()
        if cur.rowcount != 1:
            return jsonify({"error": "invalid"}), 400
        return jsonify({"token": make_author_session(row["author_id"]), "name": row["name"]})

    @app.route("/api/author/dashboard", methods=["GET"])
    @require_author
    def ngu_author_dashboard():
        author = g.author
        conn = get_db()
        sync_sales(conn)
        totals = author_totals(conn, author["id"])

        books = conn.execute(
            """SELECT ab.book_id, COALESCE(b.title, ab.book_id) AS title,
                      b.ebook_price AS price,
                      (SELECT COUNT(*) FROM author_sales s
                         WHERE s.book_id = ab.book_id AND s.author_id = ab.author_id AND s.voided = 0) AS sold,
                      (SELECT COALESCE(SUM(author_share), 0) FROM author_sales s
                         WHERE s.book_id = ab.book_id AND s.author_id = ab.author_id AND s.voided = 0) AS earned
               FROM author_books ab LEFT JOIN books b ON b.id = ab.book_id
               WHERE ab.author_id = ? ORDER BY title""",
            (author["id"],),
        ).fetchall()

        months = conn.execute(
            """SELECT strftime('%Y-%m', sold_at, 'unixepoch') AS month,
                      COUNT(*) AS sold, SUM(author_share) AS earned
               FROM author_sales WHERE author_id = ? AND voided = 0
               GROUP BY month ORDER BY month DESC""",
            (author["id"],),
        ).fetchall()

        sales = conn.execute(
            """SELECT s.sold_at, COALESCE(b.title, s.book_id) AS title, s.gross, s.author_share
               FROM author_sales s LEFT JOIN books b ON b.id = s.book_id
               WHERE s.author_id = ? AND s.voided = 0
               ORDER BY s.sold_at DESC LIMIT 30""",
            (author["id"],),
        ).fetchall()

        payouts = conn.execute(
            "SELECT paid_at, amount, note FROM author_payouts WHERE author_id = ? ORDER BY paid_at DESC",
            (author["id"],),
        ).fetchall()
        conn.close()

        return jsonify({
            "author": {
                "name": author["name"],
                "commission_percent": round(author["commission_rate"] * 100, 2),
            },
            "totals": totals,
            "books": [dict(b) for b in books],
            "months": [dict(m) for m in months],
            "sales": [
                {"date": _date(s["sold_at"]), "title": s["title"],
                 "gross": s["gross"], "earned": s["author_share"]}
                for s in sales
            ],
            "payouts": [
                {"date": _date(p["paid_at"]), "amount": p["amount"], "note": p["note"]}
                for p in payouts
            ],
        })

    # ── Admin NGU ─────────────────────────────────────────────────

    def _author_summary(conn, row):
        t = author_totals(conn, row["id"])
        n_books = conn.execute(
            "SELECT COUNT(*) AS n FROM author_books WHERE author_id = ?", (row["id"],)
        ).fetchone()["n"]
        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "payout_phone": row["payout_phone"],
            "commission_percent": round(row["commission_rate"] * 100, 2),
            "active": bool(row["active"]),
            "books_count": n_books,
            "sold": t["sold"],
            "earned": t["earned"],
            "paid": t["paid"],
            "balance": t["balance"],
        }

    @app.route("/api/admin/authors", methods=["GET"])
    @require_admin
    def ngu_admin_list_authors():
        conn = get_db()
        sync_sales(conn)
        rows = conn.execute("SELECT * FROM authors ORDER BY name").fetchall()
        out = [_author_summary(conn, r) for r in rows]
        conn.close()
        return jsonify(out)

    @app.route("/api/admin/authors", methods=["POST"])
    @require_admin
    def ngu_admin_create_author():
        data = request.json or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        if not name or "@" not in email:
            return jsonify({"error": "nom et email valide requis"}), 400
        try:
            rate = _percent_to_rate(data.get("commission_percent", DEFAULT_COMMISSION_PERCENT))
        except (TypeError, ValueError):
            return jsonify({"error": "commission invalide"}), 400
        conn = get_db()
        try:
            cur = conn.execute(
                """INSERT INTO authors (name, email, payout_phone, commission_rate, created_at)
                   VALUES (?, ?, ?, ?, ?)""",
                (name, email, (data.get("payout_phone") or "").strip(), rate, time.time()),
            )
            conn.commit()
        except Exception:
            conn.close()
            return jsonify({"error": "cet email est déjà utilisé"}), 409
        author_id = cur.lastrowid
        conn.close()
        return jsonify({"status": "ok", "id": author_id})

    @app.route("/api/admin/authors/<int:author_id>", methods=["PUT"])
    @require_admin
    def ngu_admin_update_author(author_id):
        data = request.json or {}
        conn = get_db()
        row = conn.execute("SELECT * FROM authors WHERE id = ?", (author_id,)).fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "not found"}), 404
        # On fige les ventes déjà réalisées avant de toucher au taux
        sync_sales(conn)
        name = (data.get("name") or row["name"]).strip()
        email = (data.get("email") or row["email"]).strip().lower()
        phone = data.get("payout_phone", row["payout_phone"])
        active = int(bool(data.get("active", row["active"])))
        rate = row["commission_rate"]
        if "commission_percent" in data:
            try:
                rate = _percent_to_rate(data["commission_percent"])
            except (TypeError, ValueError):
                conn.close()
                return jsonify({"error": "commission invalide"}), 400
        try:
            conn.execute(
                """UPDATE authors SET name = ?, email = ?, payout_phone = ?,
                   commission_rate = ?, active = ? WHERE id = ?""",
                (name, email, (phone or "").strip(), rate, active, author_id),
            )
            conn.commit()
        except Exception:
            conn.close()
            return jsonify({"error": "cet email est déjà utilisé"}), 409
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/authors/<int:author_id>", methods=["GET"])
    @require_admin
    def ngu_admin_get_author(author_id):
        conn = get_db()
        sync_sales(conn)
        row = conn.execute("SELECT * FROM authors WHERE id = ?", (author_id,)).fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "not found"}), 404
        books = conn.execute(
            """SELECT ab.book_id, COALESCE(b.title, ab.book_id) AS title
               FROM author_books ab LEFT JOIN books b ON b.id = ab.book_id
               WHERE ab.author_id = ? ORDER BY title""",
            (author_id,),
        ).fetchall()
        sales = conn.execute(
            """SELECT s.reference, s.sold_at, COALESCE(b.title, s.book_id) AS title,
                      s.gross, s.author_share, s.ngu_share, s.voided
               FROM author_sales s LEFT JOIN books b ON b.id = s.book_id
               WHERE s.author_id = ? ORDER BY s.sold_at DESC LIMIT 50""",
            (author_id,),
        ).fetchall()
        payouts = conn.execute(
            "SELECT id, paid_at, amount, note FROM author_payouts WHERE author_id = ? ORDER BY paid_at DESC",
            (author_id,),
        ).fetchall()
        summary = _author_summary(conn, row)
        conn.close()
        return jsonify({
            "author": summary,
            "books": [dict(b) for b in books],
            "sales": [
                {"reference": s["reference"], "date": _date(s["sold_at"]), "title": s["title"],
                 "gross": s["gross"], "earned": s["author_share"], "ngu": s["ngu_share"],
                 "voided": bool(s["voided"])}
                for s in sales
            ],
            "payouts": [
                {"id": p["id"], "date": _date(p["paid_at"]), "amount": p["amount"], "note": p["note"]}
                for p in payouts
            ],
        })

    @app.route("/api/admin/authors/<int:author_id>/books", methods=["POST"])
    @require_admin
    def ngu_admin_assign_book(author_id):
        book_id = ((request.json or {}).get("book_id") or "").strip()
        conn = get_db()
        if not conn.execute("SELECT 1 FROM authors WHERE id = ?", (author_id,)).fetchone():
            conn.close()
            return jsonify({"error": "auteur introuvable"}), 404
        if not conn.execute("SELECT 1 FROM books WHERE id = ?", (book_id,)).fetchone():
            conn.close()
            return jsonify({"error": "livre introuvable"}), 404
        existing = conn.execute(
            "SELECT author_id FROM author_books WHERE book_id = ?", (book_id,)
        ).fetchone()
        if existing and existing["author_id"] != author_id:
            conn.close()
            return jsonify({"error": "ce livre est déjà rattaché à un autre auteur"}), 409
        if not existing:
            conn.execute(
                "INSERT INTO author_books (book_id, author_id, assigned_at) VALUES (?, ?, ?)",
                (book_id, author_id, time.time()),
            )
            conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/authors/<int:author_id>/books/<book_id>", methods=["DELETE"])
    @require_admin
    def ngu_admin_unassign_book(author_id, book_id):
        conn = get_db()
        sync_sales(conn)  # on garde les ventes déjà réalisées
        conn.execute(
            "DELETE FROM author_books WHERE book_id = ? AND author_id = ?", (book_id, author_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/authors/<int:author_id>/payouts", methods=["POST"])
    @require_admin
    def ngu_admin_add_payout(author_id):
        data = request.json or {}
        try:
            amount = int(round(float(data.get("amount"))))
        except (TypeError, ValueError):
            return jsonify({"error": "montant invalide"}), 400
        if amount <= 0:
            return jsonify({"error": "montant invalide"}), 400
        paid_at = time.time()
        if data.get("date"):
            try:
                paid_at = datetime.strptime(data["date"], "%Y-%m-%d").replace(
                    hour=12, tzinfo=timezone.utc).timestamp()
            except ValueError:
                return jsonify({"error": "date invalide"}), 400
        conn = get_db()
        if not conn.execute("SELECT 1 FROM authors WHERE id = ?", (author_id,)).fetchone():
            conn.close()
            return jsonify({"error": "auteur introuvable"}), 404
        conn.execute(
            "INSERT INTO author_payouts (author_id, amount, paid_at, note) VALUES (?, ?, ?, ?)",
            (author_id, amount, paid_at, (data.get("note") or "").strip()),
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/authors/<int:author_id>/payouts/<int:payout_id>", methods=["DELETE"])
    @require_admin
    def ngu_admin_delete_payout(author_id, payout_id):
        conn = get_db()
        conn.execute(
            "DELETE FROM author_payouts WHERE id = ? AND author_id = ?", (payout_id, author_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/author-sales/<path:reference>/void", methods=["POST"])
    @require_admin
    def ngu_admin_void_sale(reference):
        voided = int(bool((request.json or {}).get("voided", True)))
        conn = get_db()
        cur = conn.execute(
            "UPDATE author_sales SET voided = ? WHERE reference = ?", (voided, reference)
        )
        conn.commit()
        conn.close()
        if cur.rowcount != 1:
            return jsonify({"error": "vente introuvable"}), 404
        return jsonify({"status": "ok"})

    # ── Maison d'édition de chaque livre ──────────────────────────
    # Stockée à part (et non dans la table books) pour ne pas être effacée
    # quand l'admin réenregistre un livre.

    def _publisher_map():
        conn = get_db()
        rows = conn.execute("SELECT book_id, publisher FROM book_publishers").fetchall()
        conn.close()
        return {r["book_id"]: r["publisher"] for r in rows}

    @app.after_request
    def ngu_add_publisher(resp):
        try:
            if (request.method == "GET"
                    and request.path in ("/api/books", "/api/admin/books")
                    and resp.status_code == 200 and resp.is_json):
                data = resp.get_json()
                if isinstance(data, list):
                    names = _publisher_map()
                    for book in data:
                        if isinstance(book, dict):
                            book["publisher"] = names.get(book.get("id"), DEFAULT_PUBLISHER)
                    dumps = getattr(getattr(app, "json", None), "dumps", None) or json.dumps
                    resp.set_data(dumps(data))
        except Exception as e:
            print(f"Erreur ajout maison d'édition: {e}")
        return resp

    @app.route("/api/admin/books/<book_id>/publisher", methods=["PUT"])
    @require_admin
    def ngu_admin_set_publisher(book_id):
        name = ((request.json or {}).get("publisher") or "").strip()
        conn = get_db()
        if not conn.execute("SELECT 1 FROM books WHERE id = ?", (book_id,)).fetchone():
            conn.close()
            return jsonify({"error": "livre introuvable"}), 404
        if not name or name.lower() == DEFAULT_PUBLISHER.lower():
            conn.execute("DELETE FROM book_publishers WHERE book_id = ?", (book_id,))
        else:
            conn.execute(
                "INSERT OR REPLACE INTO book_publishers (book_id, publisher) VALUES (?, ?)",
                (book_id, name[:120]),
            )
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    # ── Modules complémentaires (chargés s'ils sont présents) ─────
    try:
        import admin_api
        admin_api.register(app, get_db, require_admin)
    except Exception as e:
        print(f"Module admin_api non chargé : {e}")
