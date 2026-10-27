"""Coordonnées de livraison des commandes.

Le formulaire de commande physique envoie les coordonnées du client avec la
demande de paiement. Ce module les enregistre, rattachées à la référence de la
commande, et les ajoute à la liste des commandes que l'admin reçoit.
Il ne modifie ni la table des commandes ni le fonctionnement du paiement.
"""
import time

from flask import request

DELIVERY_FIELDS = ("first_name", "last_name", "phone", "address", "district", "city", "country")
MAX_LEN = 200


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
        """
    )
    conn.commit()
    conn.close()


def register(app, get_db, require_admin):
    init_tables(get_db)

    @app.before_request
    def ngu_capture_delivery():
        try:
            if request.method == "POST" and request.path == "/create-payment":
                data = request.get_json(silent=True) or {}
                ref = str(data.get("client_reference") or "").strip()
                delivery = data.get("delivery")
                if ref and isinstance(delivery, dict):
                    values = {k: str(delivery.get(k) or "").strip()[:MAX_LEN] for k in DELIVERY_FIELDS}
                    if any(values.values()):
                        conn = get_db()
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
            print(f"Erreur enregistrement coordonnées: {e}")
        return None

    @app.after_request
    def ngu_add_delivery_to_orders(resp):
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
                    dumps = getattr(getattr(app, "json", None), "dumps", None)
                    if dumps is None:
                        import json
                        dumps = json.dumps
                    resp.set_data(dumps(data))
        except Exception as e:
            print(f"Erreur ajout coordonnées aux commandes: {e}")
        return resp
