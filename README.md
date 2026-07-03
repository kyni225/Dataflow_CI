# DataFlow CI

## En 2 minutes

DataFlow CI est une plateforme qui permet aux entreprises d'ingérer des fichiers CSV/Excel de leurs clients et de valider automatiquement les données selon des schémas prédéfinis.

**Comment ça marche :**
1. Vous créez une "source" (par exemple : Orange CI, Banque Atlantique)
2. Vous importez un schéma JSON qui définit les colonnes attendues, leurs types et contraintes
3. Vos clients uploadent leurs fichiers CSV/Excel
4. Le fichier est traité en arrière-plan et validé ligne par ligne
5. Vous obtenez un rapport détaillé : lignes valides, erreurs par ligne/colonne
6. Vous pouvez exporter uniquement les lignes valides en CSV

**Cas d'usage :**
- Orange CI envoie des fichiers de ventes avec des dates au format `YYYY-MM-DD` et séparateur `,`
- Banque Atlantique envoie des fichiers de stock avec des dates au format `DD/MM/YYYY` et séparateur `;`
- DataFlow CI valide automatiquement chaque fichier selon le schéma de sa source

## Lancer le projet en local

### Prérequis

- Node.js 22+
- Docker Desktop
- npm

### Installation

```bash
cd ChallengeArtefact
npm install
Copy-Item .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
```

### Démarrage

Terminal 1 (serveur web) :
```bash
npm run dev
```

Terminal 2 (worker BullMQ) :
```bash
npm run worker
```

Accès local : http://localhost:3000

## Accéder à la version déployée

Application déployée sur Railway : https://web-production-6fbcc6.up.railway.app

## Identifiants de test

Pour le développement local (après avoir lancé `npm run db:seed`) :

- **Email** : `demo@dataflow.ci`
- **Mot de passe** : `DemoPassword123!`

Pour la version déployée, créez un compte via le formulaire d'inscription.

## Stack technique

- Next.js 15 (App Router)
- PostgreSQL + Prisma
- BullMQ + Redis
- NextAuth.js
- TailwindCSS + Shadcn UI
