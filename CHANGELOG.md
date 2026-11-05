# 📋 Journal de Bord des Modifications (CHANGELOG)

Ce document consigne l'historique exhaustif des évolutions, correctifs, optimisations ergonomiques et modifications de structure de base de données apportées au portfolio.

---

## [2026-11-05] — Persistance Avatar, Upload Projets & Refonte Responsive Dashboard

### 1. Problèmes Identifiés & Comportements Attendus

| Composant / Fonctionnalité | Problème Antérieur | Comportement Attendu & Corrigé |
| :--- | :--- | :--- |
| **Avatar Profil (`DashboardPage.tsx`)** | L'avatar téléversé n'était stocké que dans le state React local temporaire (`profileForm`) sans commit synchrone en base. Au rafraîchissement (F5), la photo disparaissait. | L'image est immédiatement envoyée dans Supabase Storage (`portfolio/avatars/`), son URL publique est générée et un `UPDATE` direct en base de données PostgreSQL (`profile.avatar_url`) est exécuté. L'image persiste définitivement après rafraîchissement. |
| **Affichage Logo / Avatar (`Navbar.tsx` & Top Bar)** | La barre de navigation publique affichait uniquement l'initiale dans un carré arrondi (`rounded-lg`), et le tableau de bord n'affichait pas la photo de profil dans l'en-tête. | Si `profile.avatar_url` existe, affichage de la photo dans un cercle parfait (`rounded-full`, centré, bordure fine). Si aucun avatar n'est renseigné, affichage d'une icône utilisateur moderne et élégante en fallback. |
| **Importation des captures de projets** | Le formulaire réclamait une URL externe textuelle sans possibilité d'importer directement depuis l'appareil. | Suppression définitive du champ texte d'URL. Ajout d'un bouton d'importation de fichier `<input type="file" accept="image/*">` (photothèque smartphone ou explorateur PC) avec prévisualisation immédiate en direct et téléversement automatique dans `portfolio/projects/` à la soumission. |
| **Ergonomie & Responsive de la modale Projet** | Le formulaire débordait de l'écran, le titre disparaissait vers le haut et les boutons de validation étaient inaccessibles sans faire défiler tout l'écran. | Modale enveloppée dans un conteneur contraint `max-h-[90vh]` avec en-tête fixe (Sticky Header), pied de page d'actions fixe (Sticky Footer) et corps de formulaire défilant verticalement en toute fluidité (`overflow-y-auto`). |

---

### 2. Fichiers et Composants Modifiés

1. **`frontend/src/pages/DashboardPage.tsx`** :
   - Ajout des états `projectCoverFile` et `projectCoverPreview` pour la gestion des captures locales.
   - Refonte de la modale de création / édition de projet avec en-tête et pied de page fixes (`Sticky Header` & `Sticky Footer`), corps défilant `max-h-[90vh] overflow-y-auto p-6 rounded-2xl`.
   - Remplacement du champ URL textuel par un sélecteur de fichier direct compatible photothèque mobile et aperçu interactif.
   - Intégration de l'avatar circulaire dans l'en-tête (Top Bar) du Dashboard avec fallback icône utilisateur.
   - Synchronisation automatique et immédiate de l'avatar de profil lors de l'upload et de la suppression (`handleAvatarFileSelect`, `handleRemoveAvatar`).

2. **`frontend/src/services/portfolioService.ts`** :
   - Mise à jour de `uploadMedia` pour générer des chemins uniques avec horodatage : `avatars/${Date.now()}-${file.name}` et `projects/${Date.now()}-${file.name}`.
   - Mise à jour de `updateProfile` avec vérification Supabase PostgREST et bascule automatique sur l'API backend Express en cas de restriction RLS.
   - Mise à jour de `createProject` et `updateProject` pour persister la colonne `cover_image_url` et synchroniser le tableau `images`.
   - Invalidation immédiate du cache mémoire après toute mise à jour.

3. **`frontend/src/components/Navbar.tsx`** :
   - Affichage de l'avatar en cercle parfait (`rounded-full`, objet centré, bordure fine).
   - Fallback élégant avec icône utilisateur `Icon name="user"` au lieu d'une simple initiale textuelle.

4. **`frontend/src/components/ProjectCard.tsx`** :
   - Prise en charge de l'affichage de l'image de couverture `cover_image_url` ou `images[0]` avec ratio vidéo responsive et effet de zoom au survol.

5. **`frontend/src/types/database.ts`** :
   - Ajout du champ optionnel `cover_image_url?: string | null` dans l'interface TypeScript stricte `DbProject`.

6. **`backend/index.js`** :
   - Ajout de la route sécurisée `PUT /api/profile` pour permettre la mise à jour directe en base PostgreSQL par requête paramétrée, assurant la persistance garantie de `avatar_url`.

---

### 3. Évolutions de la Structure des Données (Base de données & Stockage)

- **PostgreSQL / Supabase - Table `projects`** :
  - Ajout de la colonne `cover_image_url TEXT` :
    ```sql
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
    UPDATE projects SET cover_image_url = images->>0 WHERE cover_image_url IS NULL AND images IS NOT NULL;
    ```
- **PostgreSQL / Supabase - Table `profile`** :
  - Colonne `avatar_url TEXT` utilisée pour stocker l'URL publique de l'avatar.
- **Supabase Storage - Bucket `portfolio` (Public)** :
  - Dossier `avatars/` : Stockage des photos de profil au format `avatars/{timestamp}-{clean_filename}`.
  - Dossier `projects/` : Stockage des captures de projets au format `projects/{timestamp}-{clean_filename}`.

---

### 4. Tests et Validation
- **Vitest** : 14/14 tests validés avec succès (`npm --prefix frontend test`).
- **TypeScript & Vite** : Compilation stricte réussie sans aucune erreur ni warning bloquant (`npm --prefix frontend run build`).
- **Persistance** : Validée par requêtes directes en base de données sur la table `profile` et `projects`.
