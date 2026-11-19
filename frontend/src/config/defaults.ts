import type { SkillCategoryType } from '../types/database'

/**
 * Valeurs de repli centralisées pour les coordonnées et liens publics
 * lorsque la table `profile` est en cours de chargement ou incomplète.
 */
export const DEFAULT_PROFILE_CONTACT = {
  email: 'angynewdev@gmail.com',
  phone: '+225 07 20 64 65 26',
  phoneSecondary: '+225 05 66 40 29 73',
  whatsappUrl: 'https://wa.me/2250720646526',
  location: "Abidjan, Côte d'Ivoire — remote",
  locationShort: 'Abidjan (Remote)',
  githubUrl: 'https://github.com/angyDev01',
  linkedinUrl: 'https://www.linkedin.com/in/angy-dev-532293357',
  twitterUrl: 'https://x.com/Angy656261',
  facebookUrl: 'https://www.facebook.com/share/1FGHSoJjo9/',
} as const

export interface SkillCategoryMeta {
  title: string
  shortLabel: string
  subtitle: string
  color: string
}

export const ALL_SKILL_CATEGORIES: readonly SkillCategoryType[] = [
  'frontend',
  'backend',
  'database',
  'tools',
  'devops',
  'mobile',
  'other',
] as const

export const PRIMARY_SKILL_CATEGORIES: readonly SkillCategoryType[] = [
  'frontend',
  'backend',
  'database',
  'tools',
] as const

export const SKILL_CATEGORY_META: Record<SkillCategoryType, SkillCategoryMeta> = {
  frontend: {
    title: 'Frontend',
    shortLabel: 'Frontend',
    subtitle: 'Interfaces réactives et typées',
    color: '#6366f1',
  },
  backend: {
    title: 'Backend & APIs',
    shortLabel: 'Backend',
    subtitle: 'Services serveur et sécurité',
    color: '#10b981',
  },
  database: {
    title: 'Bases de données',
    shortLabel: 'Base de données',
    subtitle: 'Modélisation relationnelle et requêtes',
    color: '#06b6d4',
  },
  tools: {
    title: 'Outils & méthodes',
    shortLabel: 'Outils & DevOps',
    subtitle: 'Flux de travail quotidien',
    color: '#f59e0b',
  },
  devops: {
    title: 'DevOps & Cloud',
    shortLabel: 'Cloud / DevOps',
    subtitle: 'Déploiement et intégration continue',
    color: '#ec4899',
  },
  mobile: {
    title: 'Mobile',
    shortLabel: 'Mobile',
    subtitle: 'Applications multi-plateformes',
    color: '#8b5cf6',
  },
  other: {
    title: 'Autres technologies',
    shortLabel: 'Autre',
    subtitle: 'Compétences complémentaires',
    color: '#71717a',
  },
}
