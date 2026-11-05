# 📋 Journal de Bord des Modifications (CHANGELOG)

Ce document consigne l'historique exhaustif des évolutions, correctifs, optimisations ergonomiques et modifications de structure de base de données apportées au portfolio.

---

## [2026-11-05] — Résolution Définitive du Cache Avatar & Rendu Instantané Synchrone

### 1. Problème Identifié & Cause Racine
- **Problème** : Après la sélection d'une nouvelle photo de profil, la toute première image restait obstinément affichée à l'écran dans le Dashboard et la Navbar.
- **Causes Racines** :
  1. **Cache HTTP Agressif** : Supabase Storage et le navigateur mettaient en cache les images avec un en-tête `cacheControl: '3600'`.
  2. **Réutilisation du DOM HTMLImageElement par React** : La mutation de l'attribut `src` sur une balise `<img>` déjà existante ne forçait pas toujours un rafraîchissement immédiat de la surface de rendu.
  3. **Composants non synchronisés sans rechargement** : La Navbar ne rechargeait le profil qu'au montage initial du composant (`useEffect` unique).
  4. **Fichiers orphelins** : Les anciennes photos de profil n'étaient pas purgées du bucket de stockage.

---

### 2. Solutions Techniques Implémentées

1. **Nom Unique, Cache-Buster & `cacheControl: '0'`** (`portfolioService.ts`) :
   - Génération d'un nom de fichier avec horodatage strict et sel aléatoire : `avatars/avatar-${timestamp}-${rand}.${fileExt}`.
   - Envoi de l'image avec `cacheControl: '0'` et `upsert: true` pour désactiver la mise en cache HTTP intermédiaire.
   - Ajout d'un paramètre de Cache-Buster `?t=${timestamp}` à l'URL publique générée.

2. **Événement Global de Synchronisation & Remontage Forcé (React Keys)** :
   - Émission d'un événement global `window.dispatchEvent(new CustomEvent('portfolio:profile-updated', { detail: updates }))` dès la mise à jour du profil.
   - Écoute active de cet événement dans `Navbar.tsx` pour refléter la nouvelle photo en direct sur toute l'interface sans aucun rafraîchissement.
   - Ajout d'attributs `key={profile.avatar_url}` et `key={profileForm.avatar_url}` sur toutes les balises `<img>` d'avatar (Navbar, Top Bar Dashboard, Onglet Profil) pour forcer le démontage/remontage immédiat dans le Virtual DOM.

3. **Nettoyage & Suppression des Anciennes Photos** (`portfolioService.deleteMedia`) :
   - Fonction dédiée extrayant le chemin de stockage depuis l'URL Supabase pour exécuter `supabase.storage.from('portfolio').remove([path])`.
   - Suppression automatique de l'ancienne photo lors d'un remplacement ou lors d'un retrait d'avatar pour éviter l'accumulation de fichiers orphelins.

4. **Réinitialisation Complète des Inputs Fichiers** :
   - Réinitialisation simultanée de la ref et de l'événement cible (`avatarInputRef.current.value = ''` et `e.target.value = ''`) pour autoriser des modifications répétées illimitées.

---

## [2026-11-05] — Modifications Répétées Illimitées de l'Avatar & Option Upsert

### 1. Problème Identifié & Comportement Corrigé
- **Problème** : Après un premier téléversement d'avatar, la sélection d'une nouvelle photo pouvait être bloquée, car l'élément `<input type="file">` conservait sa valeur précédente (empêchant le déclenchement de l'événement `onChange`), et le nom de fichier ou la politique d'upload pouvait entrer en collision.
- **Comportement Corrigé** :
  1. **Upload Supabase Storage avec `upsert: true`** : L'option `{ cacheControl: '3600', upsert: true }` est systématiquement envoyée, combinée à une convention de nommage avec horodatage dynamique `avatars/avatar-${Date.now()}.${fileExt}` pour contourner le cache navigateur.
  2. **Persistance & Rendu Instantané** : L'URL publique issue de `getPublicUrl(fileName)` met à jour immédiatement la table `profile` (`avatar_url`) et synchronise instantanément l'état local React (`profile` et `profileForm`), reflétant la nouvelle image à l'écran sans aucun rafraîchissement manuel.
  3. **Nettoyage automatique de l'input de fichier** : Réinitialisation systématique (`avatarInputRef.current.value = ''` et `e.target.value = ''`) après chaque sélection, permettant d'enchaîner plusieurs changements de photo consécutifs sans restriction.

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
  - Politiques RLS actives sur `storage.objects` :
    - `Public Access` (SELECT) : Lecture publique de tous les objets du bucket `portfolio`.
    - `Admin Upload` (INSERT) : Upload réservé à l'administrateur authentifié (`auth.uid() IS NOT NULL`).
    - `Admin Update` (UPDATE) : Remplacement / mise à jour d'un fichier existant réservé à l'administrateur (`bucket_id = 'portfolio' AND auth.uid() IS NOT NULL`).
    - `Admin Delete` (DELETE) : Suppression de fichiers (anciennes photos / captures) réservée à l'administrateur (`bucket_id = 'portfolio' AND auth.uid() IS NOT NULL`).

---

### 4. Tests et Validation
- **Vitest** : 14/14 tests validés avec succès (`npm --prefix frontend test`).
- **TypeScript & Vite** : Compilation stricte réussie sans aucune erreur ni warning bloquant (`npm --prefix frontend run build`).
- **Persistance** : Validée par requêtes directes en base de données sur la table `profile` et `projects`.

