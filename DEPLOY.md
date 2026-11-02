# Guide de Déploiement : Portfolio Angy.Dev & Supabase

Ce guide explique comment configurer et héberger le frontend React et le backend Node/Express, soit de manière séparée (recommandé), soit ensemble sur un seul serveur.

---

## Étape 1 : Configuration de la Base de Données (Supabase)

1. Rendez-vous sur [Supabase](https://supabase.com) et créez un compte / projet gratuit.
2. Une fois le projet prêt, allez dans l'onglet **SQL Editor** dans le menu de gauche.
3. Cliquez sur **New query**, copiez le contenu du fichier [schema.sql](file:///c:/Users/BAGATE/Desktop/portfolio2/schema.sql) et collez-le dans l'éditeur.
4. Cliquez sur **Run** pour exécuter le script. Cela va créer les tables `stats`, `projects`, `posts`, et `messages` nécessaires.
5. Allez dans **Project Settings** > **API** et récupérez :
   - `Project URL` (qui sera votre `SUPABASE_URL`)
   - `service_role` API Key (recommandé pour le backend, qui sera votre `SUPABASE_KEY`)

---

## Option A : Hébergement Séparé (Recommandé)

Cette méthode est la plus performante, car le frontend est distribué sur un réseau CDN mondial ultra-rapide (Vercel/Netlify) et le backend tourne sur un serveur dédié aux calculs (Render/Railway).

### A.1. Déploiement du Backend (ex: Render)

1. Créez un compte gratuit sur [Render](https://render.com).
2. Cliquez sur **New +** > **Web Service** et connectez votre dépôt GitHub.
3. Configurez les paramètres suivants :
   - **Name** : `portfolio-api` (ou le nom de votre choix)
   - **Root Directory** : `backend`
   - **Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `node index.js`
4. Cliquez sur **Advanced** pour ajouter les **Environment Variables** :
   - `SUPABASE_URL` : (votre URL Supabase récupérée ci-dessus)
   - `SUPABASE_KEY` : (votre clé API Supabase récupérée ci-dessus)
   - `ADMIN_PASSWORD` : (votre mot de passe sécurisé pour vous connecter au Dashboard)
   - `PORT` : `10000` (ou laissez Render le gérer automatiquement)
5. Cliquez sur **Create Web Service**. Une fois déployé, Render vous fournira une URL publique (ex: `https://portfolio-api.onrender.com`).

### A.2. Déploiement du Frontend (ex: Vercel)

1. Créez un compte gratuit sur [Vercel](https://vercel.com).
2. Importez votre dépôt GitHub.
3. Dans la configuration du projet :
   - **Root Directory** : `frontend`
   - **Framework Preset** : `Vite` (détecté automatiquement)
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. Ajoutez la variable d'environnement suivante :
   - `VITE_API_URL` : (l'URL publique de votre backend Render, sans barre oblique finale, par exemple `https://portfolio-api.onrender.com`)
5. Cliquez sur **Deploy**. Votre site est en ligne !

---

## Option B : Déploiement Ensemble (Serveur Unique)

Si vous préférez n'avoir qu'un seul service à gérer, vous pouvez configurer Express pour compiler et servir directement le frontend React.

### B.1. Modification du Backend (`backend/index.js`)

Pour que le serveur unique fonctionne, ajoutez ces lignes à la fin de `backend/index.js` (juste avant le démarrage du serveur) :

```javascript
import path from 'path'
const __dirname = path.resolve()

// Servir les fichiers statiques du dossier de build frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')))

// Renvoyer l'index.html pour toutes les autres routes (gestion du routage SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})
```

### B.2. Processus de Build & Déploiement (ex: Render)

1. Créez un fichier `package.json` à la racine de votre projet (au même niveau que les dossiers `/frontend` et `/backend`) pour orchestrer le build global :
   ```json
   {
     "name": "angy-portfolio-monolith",
     "version": "1.0.0",
     "scripts": {
       "install-all": "npm install --prefix backend && npm install --prefix frontend",
       "build-frontend": "npm run build --prefix frontend",
       "start": "node backend/index.js"
     }
   }
   ```
2. Créez un **Web Service** sur Render avec la racine du projet comme répertoire principal :
   - **Build Command** : `npm run install-all && npm run build-frontend`
   - **Start Command** : `npm start`
3. Ajoutez les variables d'environnement dans Render :
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `ADMIN_PASSWORD`
   - `VITE_API_URL` : (laissez vide ou mettez `/` car le front et le back partagent le même domaine et port).

*Note : La méthode séparée (Option A) reste la plus facile à déboguer et offre de meilleures performances d'affichage.*
