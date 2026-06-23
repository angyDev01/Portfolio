Design guide — Angy.Dev

Palette (bleu & blanc)

- Primary: #0B61B3 — couleur principale pour titres, accents forts
- Accent: #2EA0FF — point, liens, accents lumineux
- Surface: #F6FBFF — cartes / surfaces
- Background: #FFFFFF / dégradé léger — zones principales
- Muted: #5B6B80 — textes secondaires
- Text dark: #072033 — texte principal

CSS tokens (exemple)

:root {
  --color-primary: #0B61B3;
  --color-accent: #2EA0FF;
  --color-surface: #F6FBFF;
  --color-bg: #FFFFFF;
  --color-muted: #5B6B80;
  --color-text: #072033;

  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 20px;
  --space-lg: 32px;
  --space-xl: 48px;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 24px;
}

Principes de design

- Minimaliste: beaucoup d'espace blanc, typographie nette (Inter), hiérarchie claire.
- Futuriste: boutons pill, ombres subtiles bleutées, accents néon pour interactivité.
- Accessibilité: contraste suffisant, textes lisibles et espacés.

Exemples d'usage

- Header: fond transparent, logo à gauche, CTA à droite (bouton pill `--color-primary`).
- Hero: grand titre en `--color-primary`, sous-texte en `--color-muted`, image à droite.
- Cartes: fond `--color-surface`, bord arrondi `--radius-md`, ombre légère.

Fichiers utilitaires

- `public/assets/palette.svg` — visuel de la palette.

Voulez-vous que j'applique ces tokens directement dans le CSS (variables réutilisables) et que je génère un fichier `tokens.css` importé par l'app ?