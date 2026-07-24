# Never Give Up Édition — Site web

Site e-commerce pour Never Give Up Édition (livres et ebooks), avec paiement Wave.

## Stack
- React + Vite + Tailwind CSS + shadcn/ui
- Backend indépendant sur DigitalOcean (payment.nguedition.com) : Flask + SQLite

## Développement local
```bash
npm install
npm run dev
```

## Le backend
Le backend (API livres, paiement Wave, admin) tourne déjà en production sur
`https://payment.nguedition.com`. Le frontend l'appelle directement — aucune
config supplémentaire nécessaire pour que le site fonctionne.

## Espace admin
Accessible sur `/admin/login`, mot de passe défini dans le `.env` du serveur
backend (variable `ADMIN_PASSWORD`).
