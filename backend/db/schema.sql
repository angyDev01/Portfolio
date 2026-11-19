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
  alias VARCHAR(60) DEFAULT 'Angy''s',
  role VARCHAR(150),
  short_bio TEXT,
  full_bio JSONB DEFAULT '[]'::jsonb,
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

-- 2. Table SKILLS : Compétences catégorisées et ordonnées
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL CONSTRAINT skills_category_check CHECK (LOWER(category) IN ('frontend', 'backend', 'tools', 'database', 'devops', 'mobile', 'other')),
  icon VARCHAR(50) NOT NULL DEFAULT 'code',
  description TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer les requêtes ordonnées par catégorie et mise en avant
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category, display_order);
CREATE INDEX IF NOT EXISTS idx_skills_featured_partial ON skills(display_order) WHERE is_featured = TRUE;

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

-- Index pour recherche rapide et affichage trié (slug est déjà indexé via sa contrainte UNIQUE)
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured_partial ON projects(display_order) WHERE is_featured = TRUE;

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
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO page_views (visitor_id, page_path, view_date)
    VALUES (p_visitor_id, p_page_path, CURRENT_DATE)
    ON CONFLICT (visitor_id, view_date, page_path) DO NOTHING;
    
    RETURN FOUND;
END;
$$;

-- Fonction RGPD : anonymisation des IPs > 30 jours et purge des vues > 365 jours
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_anonymized_messages INT := 0;
  v_purged_views INT := 0;
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé : administrateur requis';
  END IF;

  UPDATE contact_messages
  SET ip_address = NULL,
      user_agent = NULL
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND (ip_address IS NOT NULL OR user_agent IS NOT NULL);
  GET DIAGNOSTICS v_anonymized_messages = ROW_COUNT;

  DELETE FROM page_views
  WHERE view_date < CURRENT_DATE - INTERVAL '365 days';
  GET DIAGNOSTICS v_purged_views = ROW_COUNT;

  RETURN jsonb_build_object(
    'anonymized_messages', v_anonymized_messages,
    'purged_page_views', v_purged_views,
    'executed_at', NOW()
  );
END;
$$;

