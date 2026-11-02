# 🚀 Déploiement et Migration Automatique de la Base de Données

Ce guide explique comment provisionner et migrer automatiquement la base de données PostgreSQL de votre portfolio dès que vous disposez de votre URL de connexion distante.

---

## 1. Compatible avec tous les fournisseurs PostgreSQL
Vous pouvez créer une base PostgreSQL gratuite en quelques clics sur :
- **Supabase** (Recommandé) : `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres`
- **Neon.tech** : `postgresql://[user]:[password]@ep-[id].neon.tech/neondb?sslmode=require`
- **Render** : `postgresql://[user]:[password]@[host]:5432/[dbname]`
- **Railway**, **AWS RDS**, **Google Cloud SQL**, etc.

---

## 2. Procédure en 2 Étapes

### Étape A : Définir la variable `DATABASE_URL`
Ouvrez le fichier `backend/.env` (ou créez-le à partir de `backend/.env.example`) et collez l'URL fournie par votre hébergeur :
```env
DATABASE_URL=postgresql://user:password@hostname:5432/dbname?sslmode=require
```

### Étape B : Lancer la migration et le seeding automatique
À la racine du projet ou dans le dossier `backend/`, exécutez simplement :

```bash
# Depuis la racine du projet :
npm run db:deploy

# OU depuis le dossier backend :
cd backend
npm run db:deploy
```

---

## 3. Ce que le script effectue automatiquement

1. **Connexion sécurisée SSL** : s'adapte automatiquement aux certificats distants.
2. **Création des tables relationnelles** :
   - `profile` (bio, coordonnées, disponibilité, réseaux)
   - `skills` (compétences catégorisées et ordonnées)
   - `projects` (projets complets, slugs, tags, liens)
   - `project_skills` (table de liaison N:N)
   - `contact_messages` (réception et archivage des messages)
3. **Peuplement initial (Seeding)** :
   - Injection du profil complet de **Yao Jean Angoa (Angy)**
   - Insertion des compétences techniques (Frontend, Backend, Outils)
   - Insertion des 3 projets phares de démarrage (*OmniPulse*, *ArtisanHub*, *DevConnect*) et de leurs associations.

---

## 4. Consommation côté Frontend

Le client API [portfolioApiClient.ts](file:///c:/Users/BAGATE/Desktop/portfolio2/frontend/src/services/portfolioApiClient.ts) est déjà prêt et typé via [database.ts](file:///c:/Users/BAGATE/Desktop/portfolio2/frontend/src/types/database.ts) pour requêter les données dynamiques dès l'activation du backend.

