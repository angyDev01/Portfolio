# Portfolio — Angoa Yao Jean (Angy.Dev)

Ce projet contient :

- `frontend/` : une application React créée avec Vite.
- `backend/` : une API Express minimale exposant `POST /api/contact`.
- `backend/messages.json` : fichier local pour conserver les messages du formulaire de contact.

## Objectif de ce README

Ce document explique comment préparer et mettre en production le frontend et le backend, ainsi que les bonnes pratiques pour un déploiement en production.

---

## 1. Structure du projet

- `frontend/`
  - `src/` : code React.
  - `public/` : fichiers statiques et assets.
  - `package.json` : scripts frontend.
- `backend/`
  - `index.js` : serveur Express.
  - `package.json` : scripts backend.
  - `messages.json` : stockage local des messages (utilisé en développement ou pour une preuve de concept).

---

## 2. Pré-requis

Avant de déployer, assurez-vous d'avoir installé :

- Node.js 18+ ou version recommandée par votre hébergeur.
- npm.
- Un hébergement capable d'exécuter un serveur Node.js (optionnel si le frontend est déployé séparément).

---

## 3. Installation locale

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

---

## 4. Configuration des variables d'environnement

### Backend

Créez un fichier `backend/.env` contenant par exemple :

```env
PORT=4000
```

### Frontend

Créez un fichier `frontend/.env` contenant :

```env
VITE_API_URL=http://localhost:4000
```

> En production, `VITE_API_URL` doit pointer vers l'URL publique de votre backend.

Ne commitez jamais ces fichiers dans Git.

---

## 5. Build pour la production

### Frontend

Dans le dossier `frontend` :

```bash
npm run build
```

Le build de production est généré dans `frontend/dist`.

---

## 6. Mettre en production

### Option 1 : héberger frontend et backend ensemble (même domaine)

1. Construisez le frontend avec `npm run build`.
2. Copiez le dossier `frontend/dist` dans le serveur du backend.
3. Modifiez `backend/index.js` pour servir le contenu statique de `dist` :

```js
import express from 'express'
import cors from 'cors'
import path from 'path'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.resolve('../frontend/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.resolve('../frontend/dist/index.html'))
})
```

4. Déployez le backend sur un hébergeur Node.js.
5. Dans `frontend/.env`, utilisez l'URL de production du backend :

```env
VITE_API_URL=https://votre-domaine.com
```

Cette option est idéale si vous voulez un seul domaine et un seul serveur.

### Option 2 : déployer le frontend séparément

- Frontend : Netlify, Vercel, Cloudflare Pages, ou autre hébergeur de statique.
- Backend : Render, Railway, Heroku, Fly.io, DigitalOcean App Platform, AWS Elastic Beanstalk, etc.

Avantages :

- le frontend est servi très rapidement depuis un CDN.
- le backend reste indépendant.

Dans ce cas, configurez `VITE_API_URL` avec l'URL du backend public.

### Option 3 : serveur Linux + Nginx

1. Construisez le frontend.
2. Placez `frontend/dist` dans le dossier de votre site.
3. Configurez Nginx pour servir le build statique.
4. Déployez `backend/` sur Node.js et utilisez Nginx comme reverse proxy vers le backend.

Exemple de configuration Nginx :

```nginx
server {
  listen 80;
  server_name portfolio.example.com;

  root /var/www/portfolio/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location / {
    try_files $uri /index.html;
  }
}
```

---

## 7. Commandes utiles en production

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

---

## 8. Points importants pour la production

- `backend/messages.json` est pratique en développement, mais n'est pas adapté à un vrai site en production.
- En production, privilégiez une base de données ou un service de stockage (MongoDB, PostgreSQL, Firebase, Airtable, etc.).
- Si l'hébergeur rend le système de fichiers en lecture seule, `messages.json` ne pourra pas être modifié.
- Activez `NODE_ENV=production` sur le backend pour de meilleures performances.
- Protégez les données sensibles et limitez l'accès aux fichiers de configuration.

---

## 9. Vérification après déploiement

- Visitez l'URL du frontend pour vérifier que l'application charge bien.
- Testez le formulaire de contact.
- Vérifiez que le backend répond sur `https://votre-domaine.com/api/contact`.
- Contrôlez les logs du backend en cas d'erreur.

---

## 10. Conseils supplémentaires

- Pour un déploiement rapide, utilisez Vercel ou Netlify pour le frontend et Railway/Render pour le backend.
- Si vous voulez conserver tout sur un seul serveur, servez le build React depuis Express.
- Si vous utilisez un domaine personnalisé, configurez le HTTPS avec Let's Encrypt.

---

## 11. Exemple de déploiement minimal

1. Construisez le frontend.
2. Déployez le backend Node.js sur votre hébergeur.
3. Montez `frontend/dist` en tant que site statique ou servez-le depuis Express.
4. Mettez `VITE_API_URL` à l'URL publique du backend.

Bonne mise en production ! Si vous souhaitez, je peux aussi te fournir un script `deploy.sh` ou une configuration Nginx complète pour ce projet.