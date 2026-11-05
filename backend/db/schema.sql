-- =============================================================================
-- Schéma de base de données PostgreSQL pour le Portfolio (Angy.Dev)
-- Compatible avec Supabase, Neon, Render, Railway, AWS RDS, GCP Cloud SQL
-- =============================================================================

-- Activation de l'extension UUID si disponible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table PROFILE : Informations personnelles, bio, coordonnées et statut
CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120),
  full_name VARCHAR(150),
  alias VARCHAR(60) DEFAULT 'Angy''s',
  role VARCHAR(150),
  title VARCHAR(150),
  short_bio TEXT,
  bio_short TEXT,
  full_bio JSONB DEFAULT '[]'::jsonb,
  bio_full TEXT,
  email VARCHAR(150),
  avatar_url TEXT,
  phone VARCHAR(50),
  phone_secondary VARCHAR(50),
  whatsapp_url VARCHAR(255),
  location VARCHAR(255),
  github_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  twitter_url VARCHAR(255),
  facebook_url VARCHAR(255),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  status_label VARCHAR(150) NOT NULL DEFAULT 'Disponible',
  availability_status VARCHAR(30) DEFAULT 'available',
  accept_direct_messages BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger de compatibilité bidirectionnelle des champs de profil (name/full_name, role/title, short_bio/bio_short)
CREATE OR REPLACE FUNCTION sync_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_name IS NOT NULL AND (NEW.name IS NULL OR NEW.name = '') THEN
    NEW.name := NEW.full_name;
  ELSIF NEW.name IS NOT NULL AND (NEW.full_name IS NULL OR NEW.full_name = '') THEN
    NEW.full_name := NEW.name;
  END IF;

  IF NEW.title IS NOT NULL AND (NEW.role IS NULL OR NEW.role = '') THEN
    NEW.role := NEW.title;
  ELSIF NEW.role IS NOT NULL AND (NEW.title IS NULL OR NEW.title = '') THEN
    NEW.title := NEW.role;
  END IF;

  IF NEW.bio_short IS NOT NULL AND (NEW.short_bio IS NULL OR NEW.short_bio = '') THEN
    NEW.short_bio := NEW.bio_short;
  ELSIF NEW.short_bio IS NOT NULL AND (NEW.bio_short IS NULL OR NEW.bio_short = '') THEN
    NEW.bio_short := NEW.short_bio;
  END IF;

  IF NEW.bio_full IS NOT NULL AND (NEW.full_bio IS NULL OR NEW.full_bio = '[]'::jsonb) THEN
    NEW.full_bio := jsonb_build_array(NEW.bio_full);
  END IF;

  IF NEW.alias IS NULL OR NEW.alias = '' THEN
    NEW.alias := 'Angy''s';
  END IF;

  IF NEW.status_label IS NULL OR NEW.status_label = '' THEN
    NEW.status_label := 'Disponible';
  END IF;

  IF NEW.availability_status IS NULL OR NEW.availability_status = '' THEN
    NEW.availability_status := 'available';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_profile_fields ON profile;
CREATE TRIGGER trg_sync_profile_fields
BEFORE INSERT OR UPDATE ON profile
FOR EACH ROW EXECUTE FUNCTION sync_profile_fields();

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
  phone VARCHAR(30),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);

-- 6. Table PAGE_VIEWS : Suivi d'audience et visites uniques quotidiennes
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id VARCHAR(100) NOT NULL,
    page_path VARCHAR(100) DEFAULT '/',
    view_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Empêche le même visiteur d'être compté deux fois le même jour sur la même page
    CONSTRAINT unique_daily_visitor UNIQUE (visitor_id, view_date, page_path)
);

-- Index pour la rapidité des requêtes analytics
CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(view_date);

-- Fonction RPC sécurisée pour enregistrer une visite unique
CREATE OR REPLACE FUNCTION track_unique_visit(p_visitor_id VARCHAR, p_page_path VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO page_views (visitor_id, page_path, view_date)
    VALUES (p_visitor_id, p_page_path, CURRENT_DATE)
    ON CONFLICT (visitor_id, view_date, page_path) DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

