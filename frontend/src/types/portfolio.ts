/**
 * Types stricts pour l'architecture React Router.
 */

export type IconName =
  | 'github'
  | 'linkedin'
  | 'mail'
  | 'external'
  | 'code'
  | 'arrowRight'
  | 'copy'
  | 'check'
  | 'menu'
  | 'close'
  | 'sparkles'
  | 'frontend'
  | 'backend'
  | 'tools'
  | 'send'

export interface NavLink {
  label: string
  href: string
  isCta?: boolean
}

export interface SocialLink {
  name: string
  label: string
  href: string
  icon: IconName
  external: boolean
}

export interface ProjectLink {
  demo?: string
  repo?: string
}

export type ProjectCategory = 'Full-Stack' | 'Frontend' | 'APIs'

export interface Project {
  id: string
  title: string
  tagline: string
  description: string
  category: ProjectCategory
  technologies: string[]
  featured?: boolean
  links: ProjectLink
}

export interface SkillItem {
  name: string
  description?: string
}

export interface SkillCategory {
  id: 'frontend' | 'backend' | 'tools'
  title: string
  icon: IconName
  skills: SkillItem[]
}

export interface FeaturedTech {
  name: string
  role: string
  icon?: IconName
}

export interface ProfileData {
  name: string
  alias: string
  role: string
  shortBio: string
  fullBio: string[]
  status: {
    available: boolean
    label: string
  }
  contact: {
    email: string
    github: string
    linkedin: string
  }
}

export interface HeroData {
  badge: string
  greeting: string
  headline: string
  accentWord: string
  subheadline: string
  primaryCta: {
    label: string
    href: string
  }
  secondaryCta: {
    label: string
    href: string
  }
  stats: Array<{
    value: string
    label: string
  }>
}

export interface SummaryRow {
  label: string
  value: string
  highlight?: boolean
}

export interface UiLabels {
  skipToContent: string
  primaryNavLabel: string
  homeAria: (name: string) => string
  openMenu: string
  closeMenu: string
  navCta: string
  socialsTitle: string
  about: {
    eyebrow: string
    title: string
    summaryTitle: string
    summary: SummaryRow[]
  }
  projects: {
    featuredBadge: string
    technologiesLabel: string
    repoAria: (title: string) => string
    demoAria: (title: string) => string
    filterAll: string
    emptyFilter: string
  }
  contact: {
    copy: string
    copied: string
    copyAria: (email: string) => string
    copyError: string
    formName: string
    formEmail: string
    formMessage: string
    formSubmit: string
    formSubmitting: string
    formSuccess: string
  }
  newTab: string
}

export interface PortfolioData {
  profile: ProfileData
  navigation: NavLink[]
  hero: HeroData
  featuredTechs: FeaturedTech[]
  projects: {
    eyebrow: string
    title: string
    description: string
    items: Project[]
  }
  skills: {
    eyebrow: string
    title: string
    description: string
    categories: SkillCategory[]
  }
  contact: {
    eyebrow: string
    title: string
    description: string
    emailLabel: string
    copySuccess: string
    ctaDirect: string
  }
  footer: {
    copyright: string
    builtWith: string
  }
  socials: SocialLink[]
  ui: UiLabels
}
