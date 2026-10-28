"""Propositions de manuscrits : formulaire « Publier avec NGU ».

Reçoit un nom, un prénom, un email, un téléphone et un PDF. Le fichier est rangé dans un dossier
qui n'est pas servi par le site (seul l'admin peut le télécharger). Branché par authors.py.
"""
import hashlib
import hmac
import html
import os
import re
import secrets
import threading
import time
from datetime import datetime, timezone

from flask import jsonify, request, send_file

MAX_BYTES = 15 * 1024 * 1024
RATE_PER_HOUR = 5            # propositions par adresse IP et par heure
MAX_PER_DAY = 150            # plafond global, contre le remplissage du disque
STATUSES = ("nouvelle", "en_lecture", "retenue", "declinee")
FROM_ADDRESS = "NGU Edition <edition@nguedition.com>"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def store_dir():
    return os.environ.get("NGU_MANUSCRIPTS_DIR") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "manuscripts")


def init_tables(get_db):
    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            original_name TEXT NOT NULL,
            stored_name TEXT NOT NULL,
            size INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'nouvelle',
            note TEXT NOT NULL DEFAULT '',
            created_at REAL NOT NULL,
            ip_hash TEXT NOT NULL DEFAULT ''
        );
        """
    )
    conn.commit()
    conn.close()


def _iso(epoch):
    return datetime.fromtimestamp(float(epoch), tz=timezone.utc).strftime("%Y-%m-%d")


def _send(to, subject, html_body, text_body, reply_to=None):
    try:
        import resend

        payload = {"from": FROM_ADDRESS, "to": [to], "subject": subject, "html": html_body, "text": text_body}
        if reply_to:
            payload["reply_to"] = [reply_to]
        resend.Emails.send(payload)
    except Exception as e:
        print(f"Erreur envoi email proposition: {e}")


def _frame(inner):
    return (
        '<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; '
        'background-color: #E6E2DA; color: #2A3B19;">'
        '<div style="text-align: center; margin-bottom: 24px;">'
        '<img src="https://nguedition.com/logo.jpg" alt="NGU" style="width: 56px; height: 56px; border-radius: 8px;" /></div>'
        + inner + "</div>"
    )


def notify(row):
    """Prévient l'équipe et confirme la réception à l'auteur."""
    first, last = row["first_name"], row["last_name"]
    team = os.environ.get("GMAIL_ADDRESS")
    if team:
        text = (f"Nouvelle proposition de manuscrit.\n\nAuteur : {first} {last}\nEmail : {row['email']}\n"
                f"Téléphone : {row['phone']}\nDocument : {row['original_name']} ({row['size'] // 1024} Ko)\n\n"
                "À lire dans l'administration, rubrique Propositions.")
        body = _frame(
            '<p style="font-size:15px;line-height:1.6;">Nouvelle proposition de manuscrit.</p>'
            f'<p style="font-size:15px;line-height:1.7;"><strong>{html.escape(first)} {html.escape(last)}</strong><br>'
            f'{html.escape(row["email"])}<br>{html.escape(row["phone"])}<br>'
            f'Document : {html.escape(row["original_name"])}</p>'
            '<p style="font-size:14px;">À lire dans l\'administration, rubrique Propositions.</p>')
        threading.Thread(target=_send, args=(team, f"Nouvelle proposition de manuscrit : {first} {last}", body, text, row["email"]), daemon=True).start()
    text = (f"Bonjour {first},\n\nNous avons bien reçu votre proposition ainsi que votre document « {row['original_name']} ». "
            "Notre équipe va l'étudier et reviendra vers vous à cette adresse.\n\nMerci pour votre confiance.\n\n"
            "L'équipe Never Give Up Édition")
    body = _frame(
        f'<p style="font-size:15px;line-height:1.6;">Bonjour {html.escape(first)},</p>'
        '<p style="font-size:15px;line-height:1.6;">Nous avons bien reçu votre proposition ainsi que votre document '
        f'« {html.escape(row["original_name"])} ». Notre équipe va l\'étudier et reviendra vers vous à cette adresse.</p>'
        '<p style="font-size:15px;line-height:1.6;">Merci pour votre confiance.</p>'
        '<p style="font-size:14px;">L\'équipe Never Give Up Édition</p>')
    threading.Thread(target=_send, args=(row["email"], "Votre proposition a bien été reçue : Never Give Up Édition", body, text), daemon=True).start()


def _client_ip():
    forwarded = request.headers.get("X-Forwarded-For", "")
    return (forwarded.split(",")[0].strip() if forwarded else request.remote_addr) or ""


def _ip_hash(ip):
    secret = os.environ.get("SECRET_KEY", "").encode()
    return hmac.new(secret, ip.encode(), hashlib.sha256).hexdigest()[:32]


def _clean(value, limit):
    return str(value or "").strip()[:limit]


def _safe_name(name):
    name = os.path.basename(str(name or "document.pdf")).replace("\x00", "")
    name = re.sub(r"[^\w.\- ()éèêàâçùûôîïÉÈÀÂÇÙÛÔÎ']", "_", name)
    return name[:120] or "document.pdf"


def register(app, get_db, require_admin):
    init_tables(get_db)

    @app.route("/api/submissions", methods=["POST"])
    def ngu_submit_manuscript():
        # Taille annoncée : on refuse avant même de lire le fichier
        if request.content_length and request.content_length > MAX_BYTES + 1024 * 1024:
            return jsonify({"error": "Le fichier est trop volumineux (15 Mo maximum)."}), 413

        # Champ piège invisible pour les humains : les robots le remplissent
        if request.form.get("website"):
            return jsonify({"status": "ok"})

        first = _clean(request.form.get("first_name"), 80)
        last = _clean(request.form.get("last_name"), 80)
        email = _clean(request.form.get("email"), 160).lower()
        phone = _clean(request.form.get("phone"), 40)
        if not first or not last:
            return jsonify({"error": "Merci d'indiquer votre prénom et votre nom."}), 400
        if not EMAIL_RE.match(email):
            return jsonify({"error": "Adresse email invalide."}), 400
        if len(re.sub(r"\D", "", phone)) < 8 or len(re.sub(r"\D", "", phone)) > 15:
            return jsonify({"error": "Numéro de téléphone invalide."}), 400
        if request.form.get("consent") != "1":
            return jsonify({"error": "Merci d'accepter le traitement de vos informations."}), 400

        upload = request.files.get("file")
        if not upload or not upload.filename:
            return jsonify({"error": "Merci de joindre votre document au format PDF."}), 400
        if not upload.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Le document doit être un fichier PDF."}), 400
        data = upload.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            return jsonify({"error": "Le fichier est trop volumineux (15 Mo maximum)."}), 413
        if not data.startswith(b"%PDF"):
            return jsonify({"error": "Le document doit être un fichier PDF valide."}), 400

        ip = _ip_hash(_client_ip())
        now = time.time()
        conn = get_db()
        recent = conn.execute("SELECT COUNT(*) AS n FROM submissions WHERE ip_hash = ? AND created_at > ?", (ip, now - 3600)).fetchone()["n"]
        today = conn.execute("SELECT COUNT(*) AS n FROM submissions WHERE created_at > ?", (now - 86400,)).fetchone()["n"]
        if recent >= RATE_PER_HOUR or today >= MAX_PER_DAY:
            conn.close()
            return jsonify({"error": "Trop de demandes pour le moment. Réessayez un peu plus tard."}), 429

        os.makedirs(store_dir(), mode=0o700, exist_ok=True)
        stored = f"{int(now)}-{secrets.token_hex(8)}.pdf"
        with open(os.path.join(store_dir(), stored), "wb") as f:
            f.write(data)
        row = {"first_name": first, "last_name": last, "email": email, "phone": phone,
               "original_name": _safe_name(upload.filename), "size": len(data)}
        conn.execute(
            """INSERT INTO submissions (first_name, last_name, email, phone, original_name, stored_name, size, created_at, ip_hash)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (first, last, email, phone, row["original_name"], stored, len(data), now, ip))
        conn.commit()
        conn.close()
        notify(row)
        return jsonify({"status": "ok"})

    # ── Admin ─────────────────────────────────────────────────────

    def _shape(r):
        return {"id": r["id"], "first_name": r["first_name"], "last_name": r["last_name"], "email": r["email"],
                "phone": r["phone"], "file_name": r["original_name"], "size": r["size"], "status": r["status"],
                "note": r["note"], "date": _iso(r["created_at"])}

    @app.route("/api/admin/v2/submissions", methods=["GET"])
    @require_admin
    def ngu_v2_submissions():
        conn = get_db()
        rows = conn.execute("SELECT * FROM submissions ORDER BY created_at DESC").fetchall()
        conn.close()
        items = [_shape(r) for r in rows]
        counts = {s: sum(1 for i in items if i["status"] == s) for s in STATUSES}
        counts["all"] = len(items)
        return jsonify({"items": items, "counts": counts})

    @app.route("/api/admin/v2/submissions/<int:sid>", methods=["POST"])
    @require_admin
    def ngu_v2_submission_update(sid):
        data = request.json or {}
        conn = get_db()
        row = conn.execute("SELECT * FROM submissions WHERE id = ?", (sid,)).fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "proposition introuvable"}), 404
        status = data.get("status", row["status"])
        if status not in STATUSES:
            conn.close()
            return jsonify({"error": "statut invalide"}), 400
        note = _clean(data.get("note", row["note"]), 2000)
        conn.execute("UPDATE submissions SET status = ?, note = ? WHERE id = ?", (status, note, sid))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    @app.route("/api/admin/v2/submissions/<int:sid>/file", methods=["GET"])
    @require_admin
    def ngu_v2_submission_file(sid):
        conn = get_db()
        row = conn.execute("SELECT stored_name, original_name FROM submissions WHERE id = ?", (sid,)).fetchone()
        conn.close()
        path = os.path.join(store_dir(), os.path.basename(row["stored_name"])) if row else None
        if not row or not os.path.exists(path):
            return jsonify({"error": "fichier introuvable"}), 404
        return send_file(path, mimetype="application/pdf", as_attachment=True, download_name=row["original_name"])

    @app.route("/api/admin/v2/submissions/<int:sid>", methods=["DELETE"])
    @require_admin
    def ngu_v2_submission_delete(sid):
        conn = get_db()
        row = conn.execute("SELECT stored_name FROM submissions WHERE id = ?", (sid,)).fetchone()
        if row:
            try:
                os.remove(os.path.join(store_dir(), os.path.basename(row["stored_name"])))
            except OSError:
                pass
            conn.execute("DELETE FROM submissions WHERE id = ?", (sid,))
            conn.commit()
        conn.close()
        return jsonify({"status": "ok"})
