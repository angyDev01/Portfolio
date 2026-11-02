-- =============================================================================
-- Schéma de base de données PostgreSQL pour le Portfolio (Angy.Dev)
-- Compatible avec Supabase, Neon, Render, Railway, AWS RDS, GCP Cloud SQL
-- =============================================================================

-- Activation de l'extension UUID si disponible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table PROFILE : Informations personnelles, bio, coordonnées et statut
CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  alias VARCHAR(60) NOT NULL,
  role VARCHAR(150) NOT NULL,
  short_bio TEXT NOT NULL,
  full_bio JSONB NOT NULL DEFAULT '[]'::jsonb,
  email VARCHAR(150) NOT NULL,
  github_url VARCHAR(255) NOT NULL,
  linkedin_url VARCHAR(255) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  status_label VARCHAR(150) NOT NULL DEFAULT 'Disponible pour de nouvelles opportunités',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table SKILLS : Compétences catégorisées et ordonnées
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('frontend', 'backend', 'tools')),
  icon VARCHAR(50) NOT NULL DEFAULT 'code',
  description TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer les requêtes ordonnées par catégorie et mise en avant
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category, display_order);
CREATE INDEX IF NOT EXISTS idx_skills_featured ON skills(is_featured);

-- 3. Table PROJECTS : Catalogue complet des projets
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  tagline VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Full-Stack', 'Frontend', 'APIs')),
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  demo_url VARCHAR(255),
  repo_url VARCHAR(255),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide et affichage trié
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured, display_order);

-- 4. Table PROJECT_SKILLS : Table d'association N:N entre projets et compétences
CREATE TABLE IF NOT EXISTS project_skills (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_project_skills_skill ON project_skills(skill_id);

-- 5. Table CONTACT_MESSAGES : Messages reçus depuis le formulaire de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);

