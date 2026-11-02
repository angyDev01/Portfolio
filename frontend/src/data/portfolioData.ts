import type { PortfolioData } from '../types/portfolio'

export const portfolioData: PortfolioData = {
  profile: {
    name: 'Yao Jean Angoa',
    alias: 'Angy',
    role: 'Développeur Full-Stack Web',
    shortBio:
      'Développeur autodidacte passionné par la conception d’applications web réactives, modulaires et performantes.',
    fullBio: [
      'Développeur autodidacte passionné par l’ingénierie logicielle web moderne. Je conçois des interfaces nettes, accessibles et des architectures serveur robustes.',
      'Spécialisé dans l’écosystème React, Vite, Node.js et TypeScript, j’accorde une attention méticuleuse à l’ergonomie, aux performances et à la qualité du code.',
      'Constamment en veille technologique, j’aime transformer des exigences complexes en composants réutilisables et faciles à maintenir.',
    ],
    status: {
      available: true,
      label: 'Disponible pour de nouvelles opportunités',
    },
    contact: {
      email: 'contact@angy.dev',
      github: 'https://github.com/angyDev01',
      linkedin: 'https://linkedin.com/in/angydev',
    },
  },

  navigation: [
    { label: 'Projets', href: '/projets' },
    { label: 'Compétences', href: '/competences' },
    { label: 'Contact', href: '/contact', isCta: true },
  ],

  hero: {
    badge: 'Disponible pour de nouvelles opportunités',
    greeting: 'Bonjour, je suis',
    headline: 'Concevoir des architectures web',
    accentWord: 'performantes & fluides.',
    subheadline:
      'Développeur Full-Stack autodidacte orienté React, Vite, TypeScript et Node.js. Je transforme des idées complexes en expériences numériques claires et percutantes.',
    primaryCta: {
      label: 'Voir mes projets',
      href: '/projets',
    },
    secondaryCta: {
      label: 'Me contacter',
      href: '/contact',
    },
    stats: [
      { value: '8+', label: 'Projets réalisés' },
      { value: '100%', label: 'TypeScript Strict' },
      { value: 'Fast', label: 'Vite & Tailwind' },
    ],
  },

  // Les 6 technologies clés mises en avant sur la page vitrine
  featuredTechs: [
    { name: 'React', role: 'UI & State Management' },
    { name: 'TypeScript', role: 'Typage strict & Sécurité' },
    { name: 'Node.js', role: 'Backend Runtime' },
    { name: 'Tailwind CSS', role: 'Design System & Utility' },
    { name: 'Vite', role: 'Tooling & Bundling ultra-rapide' },
    { name: 'Express / REST', role: 'APIs performantes' },
  ],

  projects: {
    eyebrow: 'Travaux & Réalisations',
    title: 'Catalogue des Projets',
    description:
      'Une sélection de projets complets illustrant mon savoir-faire full-stack, des interfaces dynamiques aux architectures d’APIs modulaires.',
    items: [
      {
        id: 'omnipulse',
        title: 'OmniPulse',
        tagline: 'Dashboard Analytics temps réel',
        category: 'Full-Stack',
        description:
          'Plateforme de visualisation métrique en temps réel. Agrégation de flux de données, graphiques interactifs haute performance et alertes automatisées.',
        technologies: ['React', 'Tailwind', 'Recharts', 'Node.js'],
        featured: true,
        links: {
          demo: 'https://github.com/angyDev01',
          repo: 'https://github.com/angyDev01',
        },
      },
      {
        id: 'artisanhub',
        title: 'ArtisanHub',
        tagline: 'Marketplace & E-commerce local',
        category: 'Full-Stack',
        description:
          'E-commerce mettant en relation artisans et consommateurs. Gestion de catalogue, filtrage dynamique par géolocalisation et panier réactif.',
        technologies: ['React', 'TypeScript', 'Context API', 'Node.js'],
        featured: true,
        links: {
          demo: 'https://github.com/angyDev01',
          repo: 'https://github.com/angyDev01',
        },
      },
      {
        id: 'devconnect',
        title: 'DevConnect',
        tagline: 'Espace collaboratif développeurs',
        category: 'Frontend',
        description:
          'Plateforme communautaire de partage de code, revues en temps réel et organisation d’entraide technique entre développeurs indépendants.',
        technologies: ['React', 'Vite', 'Tailwind', 'Supabase'],
        featured: true,
        links: {
          demo: 'https://github.com/angyDev01',
          repo: 'https://github.com/angyDev01',
        },
      },
      {
        id: 'taskflow-pro',
        title: 'TaskFlow Pro',
        tagline: 'Gestionnaire Kanban d’équipes',
        category: 'Frontend',
        description:
          'Application de gestion agile avec drag-and-drop fluide, assignation de tâches, suivi de jalons et synchronisation en local storage.',
        technologies: ['React', 'TypeScript', 'Tailwind CSS'],
        featured: false,
        links: {
          repo: 'https://github.com/angyDev01',
        },
      },
      {
        id: 'nexus-api-gateway',
        title: 'Nexus API Gateway',
        tagline: 'Passerelle microservices & Auth',
        category: 'APIs',
        description:
          'Passerelle d’authentification JWT sécurisée, limitation de débit (rate-limiting) et proxy dynamique vers services internes en Node/Express.',
        technologies: ['Node.js', 'Express.js', 'JWT', 'Redis'],
        featured: false,
        links: {
          repo: 'https://github.com/angyDev01',
        },
      },
      {
        id: 'cryptoviewer',
        title: 'CryptoViewer',
        tagline: 'Tracker de cours crypto & alerts',
        category: 'Frontend',
        description:
          'Interface réactive interrogeant l’API CoinGecko avec actualisation en continu des graphiques de tendances et alertes de seuil.',
        technologies: ['React', 'Vite', 'Chart.js', 'REST API'],
        featured: false,
        links: {
          demo: 'https://github.com/angyDev01',
          repo: 'https://github.com/angyDev01',
        },
      },
      {
        id: 'cloud-vault',
        title: 'CloudVault API',
        tagline: 'Stockage cloud sécurisé',
        category: 'APIs',
        description:
          'API de stockage d’objets avec téléversement multipart, hachage cryptographique et URL pré-signées pour partage éphémère.',
        technologies: ['Node.js', 'TypeScript', 'Express', 'S3 API'],
        featured: false,
        links: {
          repo: 'https://github.com/angyDev01',
        },
      },
      {
        id: 'documint',
        title: 'DocuMint',
        tagline: 'Documentation dynamique Markdown',
        category: 'Full-Stack',
        description:
          'Moteur de documentation technique avec recherche plein texte instantanée, coloration syntaxique avancée et génération de tables des matières.',
        technologies: ['React', 'TypeScript', 'Tailwind', 'Node.js'],
        featured: false,
        links: {
          demo: 'https://github.com/angyDev01',
          repo: 'https://github.com/angyDev01',
        },
      },
    ],
  },

  skills: {
    eyebrow: 'Stack Technique',
    title: 'Compétences & Écosystème',
    description:
      'Une architecture technique moderne structurée autour de standards de qualité éprouvés du frontend au backend.',
    categories: [
      {
        id: 'frontend',
        title: 'Frontend Moderne',
        icon: 'frontend',
        skills: [
          { name: 'React (Hooks, Context, Patterns)', description: 'Architecture modulaire et composants réutilisables' },
          { name: 'TypeScript', description: 'Typage strict, inférence et refactoring sécurisé' },
          { name: 'Tailwind CSS', description: 'Design systems véloces et responsive mobile-first' },
          { name: 'HTML5 & CSS3 Moderne', description: 'Sémantique standard, Flexbox, CSS Grid' },
          { name: 'Accessibilité Web (A11y)', description: 'Respect des normes WCAG et navigation clavier' },
          { name: 'Performance & Optimisation', description: 'Code splitting, memoization et Lazy loading' },
        ],
      },
      {
        id: 'backend',
        title: 'Backend & Données',
        icon: 'backend',
        skills: [
          { name: 'Node.js Runtime', description: 'Conception de serveurs asynchrones robustes' },
          { name: 'Express.js Framework', description: 'Routage REST, middlewares de validation' },
          { name: 'Conception d’APIs RESTful', description: 'Endpoints prédictibles, formats JSON standardisés' },
          { name: 'Authentification & Sécurité', description: 'Tokens JWT, hashage bcrypt, sessions sécurisées' },
          { name: 'Bases de données SQL / NoSQL', description: 'Modélisation relationnelle, requêtes et migrations' },
          { name: 'Supabase & BaaS', description: 'Gestion de bases en temps réel, policies RLS' },
        ],
      },
      {
        id: 'tools',
        title: 'Outils & Pratiques',
        icon: 'tools',
        skills: [
          { name: 'Vite & Bundlers', description: 'Environnement de développement HMR ultra-rapide' },
          { name: 'Git & GitHub Workflow', description: 'Gestion de branches, commits atomiques et PRs' },
          { name: 'Architecture Logicielle', description: 'Séparation données/présentation, Clean Code' },
          { name: 'DevTools & Profiling', description: 'Inspection réseau, audit des performances Lighthouse' },
          { name: 'Tests & Assurance Qualité', description: 'Vérifications typées statiques et tests de régression' },
        ],
      },
    ],
  },

  contact: {
    eyebrow: 'Contact Direct',
    title: 'Démarrons un projet ensemble',
    description:
      'Que ce soit pour une opportunité d’embauche, un projet freelance ou une collaboration technique, n’hésitez pas à me joindre.',
    emailLabel: 'Adresse email professionnelle',
    copySuccess: 'Email copié dans le presse-papier !',
    ctaDirect: 'M’écrire directement via votre messagerie',
  },

  footer: {
    copyright: '© 2026 Yao Jean Angoa (Angy). Tous droits réservés.',
    builtWith: 'Conçu avec React, Vite, TypeScript, React Router & Tailwind CSS.',
  },

  socials: [
    {
      name: 'GitHub',
      label: 'Profil GitHub angyDev01',
      href: 'https://github.com/angyDev01',
      icon: 'github',
      external: true,
    },
    {
      name: 'LinkedIn',
      label: 'Profil LinkedIn Yao Jean Angoa',
      href: 'https://linkedin.com/in/angydev',
      icon: 'linkedin',
      external: true,
    },
    {
      name: 'Email',
      label: 'Envoyer un email à contact@angy.dev',
      href: 'mailto:contact@angy.dev',
      icon: 'mail',
      external: false,
    },
  ],

  ui: {
    skipToContent: 'Aller au contenu principal',
    primaryNavLabel: 'Navigation principale',
    homeAria: (name) => `${name} — retour à l'accueil`,
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    navCta: 'Me contacter',
    socialsTitle: 'Réseaux',
    about: {
      eyebrow: 'Présentation',
      title: 'À propos de moi',
      summaryTitle: 'En résumé',
      summary: [
        { label: 'Rôle', value: 'Full-Stack Web' },
        { label: 'Stack', value: 'React, Node, TS' },
        { label: 'Statut', value: 'Disponible', highlight: true },
      ],
    },
    projects: {
      featuredBadge: 'Featured',
      technologiesLabel: 'Technologies utilisées',
      repoAria: (title) => `Code source de ${title} (nouvel onglet)`,
      demoAria: (title) => `Démo en ligne de ${title} (nouvel onglet)`,
      filterAll: 'Tous',
      emptyFilter: 'Aucun projet ne correspond à ce filtre pour le moment.',
    },
    contact: {
      copy: 'Copier',
      copied: 'Copié !',
      copyAria: (email) => `Copier l'adresse ${email} dans le presse-papiers`,
      copyError: 'Copie impossible : sélectionnez l’adresse manuellement.',
      formName: 'Votre nom',
      formEmail: 'Votre adresse email',
      formMessage: 'Votre message...',
      formSubmit: 'Envoyer le message',
      formSubmitting: 'Envoi en cours...',
      formSuccess: 'Merci pour votre message ! Je vous répondrai dans les plus brefs délais.',
    },
    newTab: '(nouvel onglet)',
  },
}
