# Rapport de corrections — 02/11/2026

**Projet** : Portfolio Full-Stack (`frontend/`)
**Vérifications après correction** : `tsc --noEmit` → 0 erreur · `npm run build` → OK

> [!NOTE]
> Je n'ai pas accès au panneau « Problèmes » de l'IDE. Les 7 erreurs ci-dessous sont celles que j'ai retrouvées dans le code et qui correspondent à ce que l'IDE signale habituellement (Tailwind IntelliSense, validateur CSS). Si le compteur n'est pas à 0 après rechargement, envoyez-moi le texte exact des erreurs restantes.

## Les 7 erreurs signalées

| # | Fichier | Erreur | Correction |
|---|---------|--------|------------|
| 1 | `Hero.tsx` | `bg-gradient-to-r` : ancienne syntaxe Tailwind v3 | `bg-linear-to-r` |
| 2 | `Hero.tsx` | `w-[35rem]` : valeur arbitraire, l'utilitaire standard existe | `w-140` |
| 3 | `Hero.tsx` | `h-[22rem]` | `h-88` |
| 4 | `Hero.tsx` | `w-[20rem]` | `w-80` |
| 5 | `Hero.tsx` | `h-[15rem]` | `h-60` |
| 6 | `Navbar.tsx` | `animate-in fade-in slide-in-from-top-4` : classes inexistantes (plugin `tailwindcss-animate` non installé), l'animation ne marchait pas | Animation `fade-down` déclarée dans `index.css`, utilisée via `motion-safe:animate-fade-down` |
| 7 | `index.css` | `Unknown at rule @theme` (le validateur CSS de l'IDE ne connaît pas Tailwind v4) | Ajout de `.vscode/settings.json` : fichiers `.css` en mode `tailwindcss` + `css.lint.unknownAtRules: ignore` |

## Autres problèmes trouvés et corrigés

| Fichier | Problème | Correction |
|---------|----------|------------|
| `Hero.tsx` | Les halos lumineux (`-z-10`) étaient cachés derrière le fond de `App` : ils ne s'affichaient pas | `isolate` sur la section |
| `About.tsx`, `Navbar.tsx`, `ProjectCard.tsx`, `Contact.tsx` | Textes écrits en dur dans le JSX (« À propos de moi », « Me contacter », « Copier », « Featured », aria-labels…) : contraire à votre règle données / présentation | Tous déplacés dans `portfolioData.ts` (`ui`), typés dans `portfolio.ts` (`UiLabels`) |
| `Footer.tsx`, `About.tsx`, `Contact.tsx` | `text-zinc-600` / `text-zinc-500` sur `zinc-950` : contraste ≈ 2,9 à 4,1:1, sous le seuil WCAG AA (4,5:1) | `text-zinc-400` (≈ 7,8:1) |
| `Contact.tsx` | `setTimeout` jamais nettoyé ; échec de copie silencieux | Timer nettoyé dans un `useEffect`, message d'erreur annoncé (`role="status"`) |
| `Navbar.tsx` | Pas de fermeture du menu avec Échap, pas d'`aria-controls`, `<nav>` sans libellé | Ajoutés |
| `Navbar.tsx`, `Footer.tsx`, `ProjectCard.tsx` | Boutons-icônes de 32–36 px (trop petits au doigt) ; liens externes sans mention « nouvel onglet » | 40 px min. (36 px dans les cartes), mention ajoutée aux aria-labels |
| Sections | `<section>` sans titre associé ; pas de lien d'évitement | `aria-labelledby` sur chaque section, lien « Aller au contenu principal » dans `App.tsx` |
| `Hero.tsx`, `Navbar.tsx` | Animations non désactivées si l'utilisateur demande moins de mouvement | `motion-safe:` + règle `prefers-reduced-motion` |
| `index.html` | Script de thème clair/sombre obsolète, titre et description de l'ancienne version | Nettoyé ; titre, description et `theme-color` mis à jour |
| `Icon.tsx` | Fallback `?? Layers` inutile (type déjà exhaustif) | Supprimé |

## Hors code (pas corrigeable dans le projet)

Les journaux de l'IDE (`%APPDATA%\Antigravity IDE\logs`) contiennent aussi des erreurs qui ne viennent pas du portfolio :
- `getaddrinfo ENOTFOUND oauth2.googleapis.com` / `cloudcode-pa.googleapis.com` : pas d'accès réseau à ces serveurs Google au moment des appels.
- `command 'antigravity.handleAuthRefresh' not found`, `antigravity.isFileGitIgnored not found` : erreurs internes de l'éditeur.
- `File Modified Since` : les onglets ouverts avaient une ancienne version des fichiers. **Fermez puis rouvrez les onglets** (ou « Revenir au fichier ») sans sauvegarder l'ancienne version, sinon les corrections seraient écrasées.

## Point restant

`frontend/src/pages/Dashboard.jsx` est un ancien fichier JavaScript, non importé et non compilé. Je ne l'ai pas supprimé ; dites-moi si je peux le retirer.

