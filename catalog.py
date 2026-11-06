"""Catalogue « sur commande » : les livres d'un éditeur partenaire, importés depuis un fichier Excel.

- le prix d'achat (éditeur) n'est jamais renvoyé par l'API publique ;
- un import peut ajouter, modifier et retirer des références ; un aperçu précède toujours l'application ;
- branché par authors.py, comme les autres modules.
"""
import os
import re
import time

from flask import jsonify, request, send_file

MAX_ROWS = 5000
MAX_BODY = 6 * 1024 * 1024
CODE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$")
MAX_COVER = 3 * 1024 * 1024
MAX_COVER_BATCH = 24 * 1024 * 1024
COVER_TYPES = ((b"\xff\xd8\xff", "jpg", "image/jpeg"), (b"\x89PNG\r\n\x1a\n", "png", "image/png"))
TEXT_FIELDS = ("author", "catalogue", "rubrique", "sous_rubrique", "collection", "level", "audience", "approval", "also_in")
COMPARED = ("title",) + TEXT_FIELDS + ("supplier_price", "price", "publisher")


def covers_dir():
    return os.environ.get("NGU_COVERS_DIR") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "catalog_covers")


def sniff_cover(data):
    """(extension, type mime) si le contenu est bien une image JPEG, PNG ou WebP ; sinon None."""
    for magic, ext, mime in COVER_TYPES:
        if data.startswith(magic):
            return ext, mime
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp", "image/webp"
    return None


def init_tables(get_db):
    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS catalog_items (
            code TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            publisher TEXT NOT NULL DEFAULT '',
            catalogue TEXT NOT NULL DEFAULT '',
            rubrique TEXT NOT NULL DEFAULT '',
            sous_rubrique TEXT NOT NULL DEFAULT '',
            collection TEXT NOT NULL DEFAULT '',
            level TEXT NOT NULL DEFAULT '',
            audience TEXT NOT NULL DEFAULT '',
            approval TEXT NOT NULL DEFAULT '',
            also_in TEXT NOT NULL DEFAULT '',
            supplier_price INTEGER NOT NULL DEFAULT 0,
            price INTEGER NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            position INTEGER NOT NULL DEFAULT 0,
            updated_at REAL NOT NULL
        );
        """
    )
    conn.execute("CREATE TABLE IF NOT EXISTS catalog_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    have = {r["name"] for r in conn.execute("PRAGMA table_info(catalog_items)").fetchall()}
    if "author" not in have:
        conn.execute("ALTER TABLE catalog_items ADD COLUMN author TEXT NOT NULL DEFAULT ''")
    if "cover" not in have:
        conn.execute("ALTER TABLE catalog_items ADD COLUMN cover TEXT NOT NULL DEFAULT ''")
    conn.commit()
    conn.close()


def _text(value, limit=200):
    return re.sub(r"\s+", " ", str(value if value is not None else "")).strip()[:limit]


def _int(value):
    if value is None or value == "":
        return None
    try:
        number = float(str(value).replace("\u202f", "").replace("\xa0", "").replace(" ", "").replace(",", "."))
    except ValueError:
        return None
    return int(round(number))


def clean_row(raw, publisher):
    """(ligne propre, None) ou (None, motif du refus)."""
    code = _text(raw.get("code"), 40)
    if not CODE_RE.match(code):
        return None, "code absent ou invalide"
    title = _text(raw.get("title"))
    if len(title) < 2:
        return None, "titre absent"
    price = _int(raw.get("price"))
    if price is None or price <= 0 or price > 10_000_000:
        return None, "prix de vente absent ou invalide"
    supplier = _int(raw.get("supplier_price")) or 0
    if supplier < 0 or supplier > 10_000_000:
        return None, "prix d'achat invalide"
    row = {"code": code, "title": title, "publisher": publisher, "price": price, "supplier_price": supplier}
    for field in TEXT_FIELDS:
        row[field] = _text(raw.get(field), 300 if field == "also_in" else 120)
    return row, None


def only_with_cover(conn):
    """Si activé (par défaut), le site n'affiche que les livres qui ont une couverture."""
    row = conn.execute("SELECT value FROM catalog_settings WHERE key = 'only_with_cover'").fetchone()
    return row is None or row["value"] != "0"


def register(app, get_db, require_admin):
    init_tables(get_db)

    # ── Public : liste des références, sans le prix d'achat ───────────────────

    @app.route("/api/catalog", methods=["GET"])
    def ngu_public_catalog():
        conn = get_db()
        rows = conn.execute(
            """SELECT code, title, author, publisher, catalogue, rubrique, sous_rubrique, collection, level, audience, approval, also_in, price, cover
               FROM catalog_items WHERE active = 1""" + (" AND cover != ''" if only_with_cover(conn) else "") + """ ORDER BY position, rowid"""
        ).fetchall()
        conn.close()
        items = []
        for r in rows:
            d = dict(r)
            d["cover"] = f"/api/catalog/cover/{d['code']}" if d["cover"] else ""
            items.append(d)
        resp = jsonify({"items": items})
        resp.headers["Cache-Control"] = "public, max-age=300"
        return resp

    # ── Admin ─────────────────────────────────────────────────────────────────

    @app.route("/api/admin/v2/catalog", methods=["GET"])
    @require_admin
    def ngu_admin_catalog():
        conn = get_db()
        rows = conn.execute("SELECT * FROM catalog_items ORDER BY position, rowid").fetchall()
        conn.close()
        items = [dict(r) for r in rows]
        for i in items:
            i["active"] = bool(i["active"])
        settings = {"only_with_cover": only_with_cover(get_db())}
        return jsonify({"items": items, "settings": settings,
                        "counts": {"total": len(items), "active": sum(1 for i in items if i["active"]), "hidden": sum(1 for i in items if not i["active"]),
                                   "with_cover": sum(1 for i in items if i["active"] and i["cover"])}})

    @app.route("/api/admin/v2/catalog/settings", methods=["POST"])
    @require_admin
    def ngu_admin_catalog_settings():
        data = request.get_json(silent=True) or {}
        if "only_with_cover" not in data:
            return jsonify({"error": "réglage inconnu"}), 400
        conn = get_db()
        conn.execute("INSERT INTO catalog_settings (key, value) VALUES ('only_with_cover', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                     ("1" if data["only_with_cover"] else "0",))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok", "only_with_cover": bool(data["only_with_cover"])})

    @app.route("/api/admin/v2/catalog/import", methods=["POST"])
    @require_admin
    def ngu_admin_catalog_import():
        if request.content_length and request.content_length > MAX_BODY:
            return jsonify({"error": "Fichier trop volumineux."}), 413
        data = request.get_json(silent=True) or {}
        rows_in = data.get("rows")
        if not isinstance(rows_in, list) or not rows_in:
            return jsonify({"error": "Aucune ligne à importer."}), 400
        if len(rows_in) > MAX_ROWS:
            return jsonify({"error": f"Trop de lignes ({len(rows_in)} ; maximum {MAX_ROWS})."}), 400
        publisher = _text(data.get("publisher"), 80)
        if not publisher:
            return jsonify({"error": "Indiquez la maison d'édition."}), 400
        replace = bool(data.get("replace"))
        dry_run = bool(data.get("dry_run"))

        good, invalid, seen = [], [], set()
        for index, raw in enumerate(rows_in):
            if not isinstance(raw, dict):
                invalid.append({"row": index + 1, "reason": "ligne illisible"})
                continue
            row, reason = clean_row(raw, publisher)
            if reason:
                invalid.append({"row": raw.get("_row") or index + 1, "code": _text(raw.get("code"), 40), "reason": reason})
            elif row["code"] in seen:
                invalid.append({"row": raw.get("_row") or index + 1, "code": row["code"], "reason": "code déjà présent plus haut dans le fichier"})
            else:
                seen.add(row["code"])
                good.append(row)
        if not good:
            return jsonify({"error": "Aucune ligne valide.", "invalid": invalid[:50]}), 400

        conn = get_db()
        existing = {r["code"]: dict(r) for r in conn.execute("SELECT * FROM catalog_items").fetchall()}
        added = updated = unchanged = 0
        for row in good:
            old = existing.get(row["code"])
            if old is None:
                added += 1
            elif any(old[f] != row[f] for f in COMPARED) or not old["active"]:
                updated += 1
            else:
                unchanged += 1
        removed_codes = [c for c, o in existing.items() if o["publisher"] == publisher and o["active"] and c not in seen] if replace else []
        summary = {"added": added, "updated": updated, "unchanged": unchanged, "removed": len(removed_codes), "invalid": invalid[:50], "invalid_count": len(invalid), "total": len(good)}
        if dry_run:
            conn.close()
            return jsonify({"dry_run": True, **summary})

        now = time.time()
        for position, row in enumerate(good):
            conn.execute(
                """INSERT INTO catalog_items (code, title, author, publisher, catalogue, rubrique, sous_rubrique, collection, level, audience, approval, also_in,
                                              supplier_price, price, active, position, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                   ON CONFLICT(code) DO UPDATE SET title=excluded.title, author=excluded.author, publisher=excluded.publisher, catalogue=excluded.catalogue, rubrique=excluded.rubrique,
                       sous_rubrique=excluded.sous_rubrique, collection=excluded.collection, level=excluded.level, audience=excluded.audience,
                       approval=excluded.approval, also_in=excluded.also_in, supplier_price=excluded.supplier_price, price=excluded.price,
                       active=1, position=excluded.position, updated_at=excluded.updated_at""",
                (row["code"], row["title"], row["author"], row["publisher"], row["catalogue"], row["rubrique"], row["sous_rubrique"], row["collection"], row["level"],
                 row["audience"], row["approval"], row["also_in"], row["supplier_price"], row["price"], position, now),
            )
        for code in removed_codes:
            conn.execute("UPDATE catalog_items SET active = 0, updated_at = ? WHERE code = ?", (now, code))
        conn.commit()
        conn.close()
        return jsonify({"dry_run": False, **summary})

    @app.route("/api/admin/v2/catalog/<code>/active", methods=["POST"])
    @require_admin
    def ngu_admin_catalog_active(code):
        active = 1 if (request.get_json(silent=True) or {}).get("active") else 0
        conn = get_db()
        cur = conn.execute("UPDATE catalog_items SET active = ?, updated_at = ? WHERE code = ?", (active, time.time(), code))
        conn.commit()
        conn.close()
        if cur.rowcount == 0:
            return jsonify({"error": "référence introuvable"}), 404
        return jsonify({"status": "ok"})

    # ── Couvertures ───────────────────────────────────────────────────────────

    @app.route("/api/catalog/cover/<code>", methods=["GET"])
    def ngu_catalog_cover(code):
        if not CODE_RE.match(code):
            return jsonify({"error": "introuvable"}), 404
        conn = get_db()
        row = conn.execute("SELECT cover FROM catalog_items WHERE code = ? AND active = 1", (code,)).fetchone()
        conn.close()
        if not row or not row["cover"]:
            return jsonify({"error": "introuvable"}), 404
        path = os.path.join(covers_dir(), os.path.basename(row["cover"]))
        if not os.path.exists(path):
            return jsonify({"error": "introuvable"}), 404
        mime = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(row["cover"].rsplit(".", 1)[-1], "application/octet-stream")
        resp = send_file(path, mimetype=mime)
        resp.headers["Cache-Control"] = "public, max-age=86400"
        return resp

    @app.route("/api/admin/v2/catalog/covers", methods=["POST"])
    @require_admin
    def ngu_admin_catalog_covers():
        """Reçoit des images nommées d'après le code du livre (1PRE2084.jpg) : une couverture par fichier."""
        if request.content_length and request.content_length > MAX_COVER_BATCH + 1024 * 1024:
            return jsonify({"error": "Envoi trop volumineux."}), 413
        files = request.files.getlist("files")
        if not files:
            return jsonify({"error": "Aucun fichier."}), 400
        conn = get_db()
        codes = {r["code"].lower(): r["code"] for r in conn.execute("SELECT code FROM catalog_items").fetchall()}
        os.makedirs(covers_dir(), mode=0o755, exist_ok=True)
        saved, unknown, invalid = [], [], []
        for f in files:
            name = os.path.basename(f.filename or "")
            stem = name.rsplit(".", 1)[0].strip()
            code = codes.get(stem.lower())
            if not code:
                unknown.append(name)
                continue
            data = f.read(MAX_COVER + 1)
            kind = sniff_cover(data)
            if len(data) > MAX_COVER:
                invalid.append({"name": name, "reason": "image trop lourde (3 Mo maximum)"})
            elif not kind:
                invalid.append({"name": name, "reason": "ce n'est pas une image JPEG, PNG ou WebP"})
            else:
                filename = f"{code}.{kind[0]}"
                for old in os.listdir(covers_dir()):           # une seule couverture par livre
                    if old.rsplit(".", 1)[0] == code and old != filename:
                        os.remove(os.path.join(covers_dir(), old))
                with open(os.path.join(covers_dir(), filename), "wb") as out:
                    out.write(data)
                conn.execute("UPDATE catalog_items SET cover = ?, updated_at = ? WHERE code = ?", (filename, time.time(), code))
                saved.append(code)
        conn.commit()
        conn.close()
        return jsonify({"saved": len(saved), "unknown": unknown[:50], "unknown_count": len(unknown), "invalid": invalid[:50], "invalid_count": len(invalid)})

    @app.route("/api/admin/v2/catalog/<code>/cover", methods=["DELETE"])
    @require_admin
    def ngu_admin_catalog_cover_delete(code):
        conn = get_db()
        row = conn.execute("SELECT cover FROM catalog_items WHERE code = ?", (code,)).fetchone()
        if row and row["cover"]:
            try:
                os.remove(os.path.join(covers_dir(), os.path.basename(row["cover"])))
            except OSError:
                pass
            conn.execute("UPDATE catalog_items SET cover = '', updated_at = ? WHERE code = ?", (time.time(), code))
            conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/v2/catalog/delete-all", methods=["POST"])
    @require_admin
    def ngu_admin_catalog_delete_all():
        """Supprime définitivement les références du catalogue (toutes, ou celles d'une maison d'édition) et leurs couvertures."""
        data = request.get_json(silent=True) or {}
        if data.get("confirm") != "SUPPRIMER":
            return jsonify({"error": "Confirmation manquante : tape SUPPRIMER."}), 400
        publisher = _text(data.get("publisher"), 80)
        conn = get_db()
        if publisher:
            codes = [r["code"] for r in conn.execute("SELECT code FROM catalog_items WHERE publisher = ?", (publisher,)).fetchall()]
            conn.execute("DELETE FROM catalog_items WHERE publisher = ?", (publisher,))
        else:
            codes = [r["code"] for r in conn.execute("SELECT code FROM catalog_items").fetchall()]
            conn.execute("DELETE FROM catalog_items")
        conn.commit()
        conn.close()
        folder = covers_dir()
        if os.path.isdir(folder):
            wanted = set(codes)
            for name in os.listdir(folder):
                if name.rsplit(".", 1)[0] in wanted:
                    try:
                        os.remove(os.path.join(folder, name))
                    except OSError:
                        pass
        return jsonify({"deleted": len(codes)})
