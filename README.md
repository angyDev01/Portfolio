# Portfolio — Yao Jean Angoa (Angy)

Développeur **Full-Stack Web Junior** basé à Abidjan (Côte d'Ivoire), ouvert aux opportunités et collaborations en télétravail (remote).

🌐 **Site en ligne :** [angydev.me](https://angydev.me) · 📋 **Historique des évolutions :** [CHANGELOG.md](./CHANGELOG.md)

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-Tests_Unitaires-6E9F18?style=flat-square&logo=vitest&logoColor=white)

---

## 1. Pourquoi ce projet ?

### Ma passion pour le code
Mon envie de coder est née d'une curiosité simple : comprendre comment fonctionnent les applications que nous utilisons chaque jour. En creusant sous le capot, j'ai découvert le plaisir concret de partir d'une idée, de structurer des données proprement côté serveur et de construire une interface fluide, claire et agréable à utiliser.

### Apprendre constamment par des projets concrets
En tant que développeur junior, je suis convaincu que l'on progresse vraiment en se confrontant à des problèmes réels. Plutôt que de partir d'un simple modèle statique pour présenter mon profil, j'ai choisi de concevoir ce portfolio comme **une application Full-Stack complète de bout en bout** : base de données relationnelle PostgreSQL, sécurité par lignes (RLS), espace d'administration, suivi de visites, actualités, sondages interactifs et tests automatisés. Chaque nouvelle fonctionnalité a été l'occasion d'expérimenter, de corriger mes erreurs et d'ancrer de bonnes pratiques.

### Mon ambition
Mon objectif est clair : continuer à apprendre chaque jour, écrire un code de plus en plus lisible, testé et maintenable, et contribuer à des produits utiles et durables. Je souhaite rejoindre une équipe ou participer à des projets stimulants où je pourrai apporter mon énergie, ma rigueur et ma capacité d'adaptation tout en progressant au contact de développeurs expérimentés.

---

## 2. Fonctionnalités principales

### Côté visiteur
- **Accueil éditorial (`/`)** : présentation, bannière de couverture administrable et **bascule *Interface ⇄ Données Supabase*** pour montrer en direct les données servies par la base PostgreSQL.
- **Catalogue de projets (`/projets`)** : filtrage par catégorie et modale détaillée (contexte, description complète, technologies utilisées, liens vers la démo et le code source).
- **Compétences (`/competences`)** : vue structurée par domaines (`Frontend`, `Backend`, `Bases de données`, `Outils & méthodes`, `DevOps & Cloud`, etc.).
- **Actualités & Sondages (`/actualites`)** : suivi des chantiers en cours et événements à venir, commentaires publics modérables et sondages interactifs avec vote anti-doublon via RPC PostgreSQL, accompagnés d'un aperçu conditionnel et d'un bouton CTA sur l'accueil.
- **À propos & Contact (`/contact`)** : parcours personnel, lecteur vidéo en modale à la demande, mode clair/sombre, double canal de contact (message direct enregistré en base + formulaire email / WhatsApp), application installable (**PWA**) et **SEO dynamique** par route (JSON-LD Schema.org, OpenGraph, `robots.txt`, `sitemap.xml`).

### Côté administration (`/admin`)
- **Accès protégé** via Supabase Auth (`ProtectedRoute`), raccourci clavier discret `Ctrl + Shift + A` (ou `Cmd + Shift + A` sur macOS) et redirection automatique de `/dashboard` vers `/admin`.
- **Gestion du profil** : modification de la bio, du statut de disponibilité, de la photo de profil et de la bannière de couverture via **Supabase Storage**.
- **Administration complète (CRUD)** : projets, compétences, actualités, sondages et modération des commentaires visiteurs.
- **Messagerie & Analytics** : tiroir latéral pour consulter, marquer comme lus ou supprimer les messages directs (avec actions rapides email / appel / WhatsApp), et tableau de bord de suivi des visites sur 30 jours avec **Recharts** (excluant l'administrateur).

---

## 3. Ce que j'ai appris en construisant ce projet

Ce dépôt reflète concrètement ma progression sur plusieurs aspects essentiels du développement web :

- **Structurer une application React + TypeScript strict** : découpage propre par couche de services (`projectService`, `skillService`, `announcementService`, `pollService`, `analyticsService`, `profileService`, `contactService`, `authService`), hooks personnalisés et cache client léger, tout en gardant `tsc --noEmit` à 0 erreur.
- **Modéliser et sécuriser une base PostgreSQL / Supabase** : conception relationnelle (`project_skills` en relation N:N, index partiels), mise en place de politiques **Row Level Security (RLS)** avec fonction `public.is_admin()`, écriture de fonctions RPC `SECURITY DEFINER` durcies (`SET search_path`), validation stricte des entrées avec **Zod** et assainissement anti-XSS (`sanitizeUrl`, `sanitizePlainText`).
- **Tester et préparer la production** : rédaction de tests unitaires avec **Vitest** (protection anti-XSS, validation d'URLs et schémas Zod, services et logique des sondages), chargement paresseux des pages (`React.lazy`), découpage du bundle via Vite/Rolldown et mise en cache PWA (`vite-plugin-pwa`).
- **Soigner l'UX, l'accessibilité et le SEO** : navigation clavier, respect de `prefers-reduced-motion`, gestion des états vides sans fuite d'erreur technique et synchronisation dynamique des balises `<title>`, `<meta name="description">` et `<link rel="canonical">`.

---

## 4. Stack technique

| Couche | Technologies utilisées |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 8, Tailwind CSS v4, React Router v7 |
| **Validation, UI & Graphes** | Zod, Recharts, Lucide React, React Icons, `vite-plugin-pwa` |
| **Données, Auth & Storage** | Supabase (PostgreSQL, Auth, Storage, Row Level Security, RPC PL/pgSQL) |
| **Backend & Outils DB** | Node.js, Express, `pg` (API complémentaire, migrations et bilan de santé PostgreSQL) |
| **Qualité & Tests** | TypeScript (`tsc --noEmit`), Vitest |

---

## 5. Architecture du dépôt

```text
portfolio2/
├── frontend/
│   ├── public/                  # Fichiers statiques (robots.txt, sitemap.xml, icônes PWA)
│   ├── src/
│   │   ├── components/          # Composants UI, modales, communauté, contact & dashboard
│   │   ├── config/              # Valeurs de repli centralisées et métadonnées de catégories
│   │   ├── context/             # ThemeContext (mode clair / sombre)
│   │   ├── hooks/               # Hooks de données publiques et d'administration
│   │   ├── lib/                 # Client Supabase configuré
│   │   ├── pages/               # Pages routées (Accueil, Projets, Compétences, Actualités, Contact, Admin)
│   │   ├── services/            # Couche d'accès aux données, cache et gestion d'erreurs
│   │   ├── types/               # Interfaces TypeScript du schéma de base de données
│   │   ├── utils/               # Sécurité (Zod / anti-XSS), tracking visiteurs, validation médias
│   │   ├── App.tsx              # Routage principal et SEO dynamique par route
│   │   └── index.css            # Configuration Tailwind CSS v4 et styles globaux
│   ├── .env.example             # Modèle de variables d'environnement frontend
│   └── package.json
├── backend/
│   ├── db/
│   │   ├── schema.sql           # Schéma SQL complet des tables et fonctions
│   │   ├── policies.sql         # Politiques de sécurité RLS
│   │   ├── migrateAndSeed.js    # Script de migration et de peuplement initial
│   │   └── health_check.js      # Diagnostic de santé et latence PostgreSQL / Supabase
│   ├── index.js                 # Serveur Express complémentaire
│   ├── .env.example             # Modèle de variables d'environnement backend
│   └── package.json
├── CHANGELOG.md                 # Journal détaillé des évolutions techniques
└── package.json                 # Scripts monorepo
```

---

## 6. Lancer le projet en local

### Prérequis
- **Node.js 18+** et **npm**
- Un projet **Supabase** (ou une instance PostgreSQL)

### Installation et configuration

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/angyDev01/Portfolio.git
   cd Portfolio
   ```

2. **Installer les dépendances :**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

3. **Configurer le frontend :**
   Créez un fichier `frontend/.env` à partir de `frontend/.env.example` :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=votre_cle_publique_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_publique_supabase

   # Optionnel : uniquement si vous utilisez aussi le serveur Express local
   VITE_API_URL=http://localhost:4000
   ```

4. **Configurer le backend (optionnel — scripts DB & API Express) :**
   Créez un fichier `backend/.env` à partir de `backend/.env.example` :
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
   ADMIN_PASSWORD=votre_mot_de_passe_admin
   CORS_ORIGIN=http://localhost:5173
   ```

5. **Démarrer le serveur de développement :**
   ```bash
   npm run dev:frontend
   ```

### Commandes disponibles

| Commande | Description |
| :--- | :--- |
| `npm run dev:frontend` | Lance l'application React avec Vite en mode développement |
| `npm run dev:backend` | Lance le serveur Express avec Nodemon (optionnel) |
| `npm run typecheck` | Vérifie le typage TypeScript strict (`tsc --noEmit`) |
| `npm test` | Exécute l'ensemble des tests unitaires Vitest |
| `npm run build` | Contrôle le typage et génère le build de production dans `frontend/dist` |
| `npm run db:deploy` | Exécute la migration et l'amorçage initial (`backend/db/migrateAndSeed.js`) |
| `npm run db:health --prefix backend` | Lance le diagnostic de santé et de performances PostgreSQL |

---

## 7. Déploiement

Le portfolio suit une architecture **Jamstack** légère et simple à héberger :
- **Frontend** : déployable directement sur **Vercel**, **Netlify** ou **Cloudflare Pages** (dossier racine ou build `npm run build`, sortie `frontend/dist`, avec les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`).
- **Base de données & Authentification** : gérées par **Supabase** en production.
- **Backend Express (`backend/`)** : facultatif en production dès lors que le frontend communique directement avec Supabase via les politiques RLS.

> [!IMPORTANT]
> **Rappel sécurité (Supabase Auth) :** avant toute mise en production, pensez à désactiver les inscriptions publiques (*Allow new users to sign up*) dans le tableau de bord Supabase (**Authentication → Providers → Email**), afin que seul le compte administrateur autorisé puisse accéder au panneau `/admin`.

---

## 8. Ce que je continue d'améliorer

Dans la continuité de ma démarche d'apprentissage, voici les prochains chantiers que je souhaite ajouter ou approfondir sur ce projet :
- Mettre en place une pipeline **CI GitHub Actions** (`typecheck` + tests Vitest + build automatique à chaque push).
- Ajouter des tests end-to-end avec **Playwright** pour sécuriser les parcours critiques (navigation, contact, administration).
- Proposer une version bilingue **FR / EN**.
- Continuer à approfondir **PostgreSQL** (plans d'exécution, indexation) et la conteneurisation avec **Docker**.

---

## 9. Journal des évolutions & Me contacter

- L'historique complet des correctifs, audits de sécurité et améliorations est consultable dans [CHANGELOG.md](./CHANGELOG.md).

Si mon profil ou ce projet vous intéresse, n'hésitez pas à me contacter ou à échanger sur le code :

- **Portfolio :** [angydev.me](https://angydev.me)
- **GitHub :** [@angyDev01](https://github.com/angyDev01)
- **LinkedIn :** [Yao Jean Angoa (Angy)](https://www.linkedin.com/in/angy-dev-532293357)
- **X (Twitter) :** [@Angy656261](https://x.com/Angy656261)
- **Email :** [angynewdev@gmail.com](mailto:angynewdev@gmail.com)