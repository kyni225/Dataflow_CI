# DataFlow CI

Plateforme d'ingestion de fichiers CSV/Excel avec validation de données basée sur des schémas versionnés.

## Fonctionnalités

- **Authentification** : Login/Register avec NextAuth.js et bcrypt
- **Gestion des sources** : Import de schémas JSON, versionning immuable
- **Upload de fichiers** : CSV/XLSX jusqu'à 10 MB, traitement asynchrone
- **Validation** : Ligne par ligne avec conservation des erreurs détaillées
- **Rapport d'ingestion** : Statut, volumes, erreurs, aperçu des lignes valides
- **Export CSV** : Export des lignes valides
- **Dashboard** : Visualisations avec Recharts

## Stack technique

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Base de données** : PostgreSQL + Prisma
- **Queue** : BullMQ + Redis
- **Auth** : NextAuth.js
- **UI** : TailwindCSS + Shadcn UI
- **Charts** : Recharts
- **Tests** : Vitest

## Installation locale

Prérequis :

- Node.js 22+
- Docker Desktop
- npm

```bash
npm install
Copy-Item .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
```

Lancer l'application :

```bash
npm run dev
```

Lancer le worker (dans un autre terminal) :

```bash
npm run worker
```

URL locale : http://localhost:3000

Pour utiliser l'application, créez un compte via le formulaire d'inscription.

## Variables d'environnement

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL |
| `AUTH_SECRET` | Secret NextAuth |
| `AUTH_URL` | URL pour Auth.js |
| `NEXTAUTH_URL` | URL publique |
| `REDIS_URL` | URL Redis pour BullMQ |
| `UPLOAD_DIR` | Répertoire de stockage des fichiers |
| `MAX_UPLOAD_BYTES` | Taille maximale (défaut: 10 MB) |

## Commandes utiles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run worker       # Worker BullMQ
npm run lint         # ESLint
npm run test         # Tests Vitest
npm run db:generate  # Générer client Prisma
npm run db:migrate   # Appliquer migrations
npm run db:seed      # Peupler la base de données
```

## Déploiement

### Railway

L'application est configurée pour Railway avec :

- Service web : Next.js standalone
- Service worker : BullMQ worker
- PostgreSQL : Base de données
- Redis : Queue BullMQ
- Volume persistant : Stockage des fichiers

Configuration requise :

- Variables d'environnement configurées
- Volume persistant monté sur `/app/uploads`
- Commande de démarrage web : `npx prisma migrate deploy && node .next/standalone/server.js`
- Commande de démarrage worker : `npx prisma generate && npm run worker`

## Données de test

Le dossier `samples/` contient les fichiers officiels :

- `source-ventes-orange.json` + `ventes-orange-clean.csv` + `ventes-orange-dirty.csv`
- `source-stock-banque.json` + `stock-banque-clean.csv` + `stock-banque-dirty.csv`

Spécificités :

- Orange CI : séparateur `,`, dates `YYYY-MM-DD`
- Banque Atlantique : séparateur `;`, dates `DD/MM/YYYY`
