-- ==============================================================================
-- MASTER MIGRATION UNIFIÉE & IDEMPOTENTE : Angy Portfolio (Supabase Production)
-- ==============================================================================
-- Ce script configure l'intégralité du schéma de données, des contraintes,
-- des index, des politiques de sécurité Row Level Security (RLS) et des
-- fonctions RPC anti-abus pour le portfolio Angy.Dev.
--
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase (SQL Editor).
-- Il est 100% idempotent : peut être rejoué sans risque d'erreur ou d'écrasement.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. EXTENSIONS POSTGRESQL
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ==============================================================================
-- 2. TABLES FONDAMENTALES & CONTRAINTES
-- ==============================================================================

-- 2.1 Table PROFILE (Informations personnelles, statut, avatar et bannière Hero)
CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120),
  alias VARCHAR(60) DEFAULT 'Angy''s',
  role VARCHAR(150),
  short_bio TEXT,
  full_bio JSONB DEFAULT '[]'::jsonb,
  email VARCHAR(150),
  avatar_url TEXT,
  banner_url TEXT,
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

ALTER TABLE profile ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) DEFAULT 'available';
ALTER TABLE profile ADD COLUMN IF NOT EXISTS accept_direct_messages BOOLEAN DEFAULT TRUE;

-- 2.2 Table SKILLS (Compétences catégorisées)
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'code',
  description TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category, display_order);
CREATE INDEX IF NOT EXISTS idx_skills_featured_partial ON skills(display_order) WHERE is_featured = TRUE;

-- 2.3 Table PROJECTS (Projets réalisés)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  tagline VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured_partial ON projects(display_order) WHERE is_featured = TRUE;

-- 2.4 Table PROJECT_SKILLS (Association N:N Projets & Compétences)
CREATE TABLE IF NOT EXISTS project_skills (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_project_skills_skill ON project_skills(skill_id);

-- 2.5 Table CONTACT_MESSAGES (Messages reçus du formulaire de contact)
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

-- 2.6 Table PAGE_VIEWS (Analytics d'audience quotidienne)
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id VARCHAR(100) NOT NULL,
  page_path VARCHAR(100) DEFAULT '/',
  view_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_daily_visitor UNIQUE (visitor_id, view_date, page_path)
);

CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(view_date);

-- ==============================================================================
-- 3. TABLES COMMUNAUTÉ (ANNONCES & SONDAGES DURCIS)
-- ==============================================================================

-- 3.1 Table ANNOUNCEMENTS (Projets en cours, événements & actualités)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(180) NOT NULL,
  kind VARCHAR(30) NOT NULL DEFAULT 'project_wip'
    CHECK (kind IN ('project_wip', 'event', 'news')),
  content TEXT NOT NULL,
  cover_image_url TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  action_url VARCHAR(255),
  action_label VARCHAR(80),
  allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
  comments_moderated BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS comments_moderated BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_announcements_published_order
  ON announcements(is_pinned DESC, created_at DESC)
  WHERE is_published = TRUE;

-- 3.2 Table ANNOUNCEMENT_COMMENTS (Commentaires publics avec modération optionnelle)
CREATE TABLE IF NOT EXISTS announcement_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  author_name VARCHAR(80) NOT NULL,
  content TEXT NOT NULL,
  visitor_hash TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE announcement_comments ADD COLUMN IF NOT EXISTS visitor_hash TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_comments_lengths_check') THEN
    ALTER TABLE announcement_comments
      ADD CONSTRAINT announcement_comments_lengths_check
      CHECK (length(btrim(author_name)) BETWEEN 2 AND 80
         AND length(btrim(content)) BETWEEN 2 AND 1500) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_announcement_comments_ann_created
  ON announcement_comments(announcement_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_announcement_comments_visitor_created
  ON announcement_comments(visitor_hash, created_at DESC)
  WHERE visitor_hash IS NOT NULL;

-- 3.3 Table POLLS (Sondages interactifs)
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question VARCHAR(220) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  closes_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.4 Table POLL_OPTIONS (Options de choix par sondage)
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label VARCHAR(140) NOT NULL,
  display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id, display_order);

-- 3.5 Table POLL_VOTES (Votes anonymisés avec hachage cryptographique)
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  visitor_id VARCHAR(100),
  visitor_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE poll_votes ADD COLUMN IF NOT EXISTS visitor_hash TEXT;

-- Migration des éventuels anciens votes sans hash
UPDATE poll_votes
   SET visitor_hash = encode(extensions.digest(visitor_id || poll_id::text, 'sha256'), 'hex')
 WHERE visitor_hash IS NULL AND visitor_id IS NOT NULL;

ALTER TABLE poll_votes ALTER COLUMN visitor_id DROP NOT NULL;
UPDATE poll_votes SET visitor_id = NULL WHERE visitor_id IS NOT NULL;

ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS unique_poll_visitor;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_poll_visitor_hash') THEN
    ALTER TABLE poll_votes
      ADD CONSTRAINT unique_poll_visitor_hash UNIQUE (poll_id, visitor_hash);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_poll_votes_option ON poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_created ON poll_votes(poll_id, created_at DESC);

-- ==============================================================================
-- 4. FONCTION D'AUTORISATION STRICTE (ANTI BOLA / IDOR)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT auth.role() = 'authenticated'
      OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('yaojeanangoa@gmail.com', 'angynewdev@gmail.com', 'yaojeanangoa@mail.com')
      OR auth.uid() = '4f577974-f477-4e9d-97f6-c9b85b441d7e'::uuid;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- ==============================================================================
-- 5. FONCTIONS RPC SÉCURISÉES (SEARCH_PATH VERROUILLÉ)
-- ==============================================================================

-- 5.1 Enregistrement de visite unique quotidienne (Analytics)
CREATE OR REPLACE FUNCTION public.track_unique_visit(p_visitor_id VARCHAR, p_page_path VARCHAR)
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

GRANT EXECUTE ON FUNCTION public.track_unique_visit(VARCHAR, VARCHAR) TO anon, authenticated;

-- 5.2 Vote de sondage atomique avec anti-doublon et rate-limiting
DROP FUNCTION IF EXISTS public.cast_poll_vote(UUID, UUID, VARCHAR);
CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  p_poll_id UUID,
  p_option_id UUID,
  p_visitor_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
  v_is_active BOOLEAN;
  v_closes_at TIMESTAMP WITH TIME ZONE;
  v_existing_option_id UUID;
  v_recent_votes INT;
BEGIN
  IF p_visitor_id IS NULL OR length(btrim(p_visitor_id)) < 8 THEN
    RETURN jsonb_build_object('status', 'invalid', 'voted_option_id', NULL);
  END IF;

  v_hash := encode(extensions.digest(btrim(p_visitor_id) || p_poll_id::text, 'sha256'), 'hex');

  SELECT is_active, closes_at INTO v_is_active, v_closes_at
    FROM polls
   WHERE id = p_poll_id;

  IF NOT FOUND OR NOT v_is_active OR (v_closes_at IS NOT NULL AND v_closes_at <= NOW()) THEN
    RETURN jsonb_build_object('status', 'closed', 'voted_option_id', NULL);
  END IF;

  PERFORM 1 FROM poll_options WHERE id = p_option_id AND poll_id = p_poll_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid', 'voted_option_id', NULL);
  END IF;

  SELECT option_id INTO v_existing_option_id
    FROM poll_votes
   WHERE poll_id = p_poll_id AND visitor_hash = v_hash;

  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already_voted', 'voted_option_id', v_existing_option_id);
  END IF;

  SELECT count(*) INTO v_recent_votes
    FROM poll_votes
   WHERE visitor_hash = v_hash
     AND created_at > NOW() - INTERVAL '1 minute';

  IF v_recent_votes >= 5 THEN
    RETURN jsonb_build_object('status', 'rate_limited', 'voted_option_id', NULL);
  END IF;

  BEGIN
    INSERT INTO poll_votes (poll_id, option_id, visitor_hash)
    VALUES (p_poll_id, p_option_id, v_hash);
    RETURN jsonb_build_object('status', 'ok', 'voted_option_id', p_option_id);
  EXCEPTION WHEN unique_violation THEN
    SELECT option_id INTO v_existing_option_id
      FROM poll_votes
     WHERE poll_id = p_poll_id AND visitor_hash = v_hash;
    RETURN jsonb_build_object('status', 'already_voted', 'voted_option_id', v_existing_option_id);
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_poll_vote(UUID, UUID, TEXT) TO anon, authenticated;

-- 5.3 Envoi de commentaire (Honeypot, interdiction de liens, modération)
CREATE OR REPLACE FUNCTION public.post_announcement_comment(
  p_announcement_id UUID,
  p_author_name TEXT,
  p_content TEXT,
  p_visitor_id TEXT,
  p_website_honeypot TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
  v_allow_comments BOOLEAN;
  v_is_published BOOLEAN;
  v_moderated BOOLEAN;
  v_recent_comments INT;
  v_clean_author TEXT;
  v_clean_content TEXT;
  v_new_comment announcement_comments%ROWTYPE;
BEGIN
  IF p_website_honeypot IS NOT NULL AND length(btrim(p_website_honeypot)) > 0 THEN
    RETURN jsonb_build_object('status', 'link_rejected', 'comment', NULL);
  END IF;

  v_clean_author := regexp_replace(p_author_name, '[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]', '', 'g');
  v_clean_author := regexp_replace(v_clean_author, '\s+', ' ', 'g');
  v_clean_author := btrim(v_clean_author);

  v_clean_content := regexp_replace(p_content, '[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]', '', 'g');
  v_clean_content := regexp_replace(v_clean_content, '[ \t]+', ' ', 'g');
  v_clean_content := regexp_replace(v_clean_content, '\n{3,}', E'\n\n', 'g');
  v_clean_content := btrim(v_clean_content);

  IF length(v_clean_author) < 2 OR length(v_clean_author) > 80
     OR length(v_clean_content) < 2 OR length(v_clean_content) > 1500 THEN
    RETURN jsonb_build_object('status', 'invalid', 'comment', NULL);
  END IF;

  IF v_clean_author ~* '(https?://|www\.)' OR v_clean_content ~* '(https?://|www\.)' THEN
    RETURN jsonb_build_object('status', 'link_rejected', 'comment', NULL);
  END IF;

  SELECT allow_comments, is_published, comments_moderated
    INTO v_allow_comments, v_is_published, v_moderated
    FROM announcements
   WHERE id = p_announcement_id;

  IF NOT FOUND OR NOT v_is_published OR NOT v_allow_comments THEN
    RETURN jsonb_build_object('status', 'closed', 'comment', NULL);
  END IF;

  IF p_visitor_id IS NOT NULL AND length(btrim(p_visitor_id)) >= 8 THEN
    v_hash := encode(extensions.digest(btrim(p_visitor_id) || p_announcement_id::text, 'sha256'), 'hex');

    SELECT count(*) INTO v_recent_comments
      FROM announcement_comments
     WHERE visitor_hash = v_hash
       AND created_at > NOW() - INTERVAL '10 minutes';

    IF v_recent_comments >= 3 THEN
      RETURN jsonb_build_object('status', 'rate_limited', 'comment', NULL);
    END IF;

    PERFORM 1 FROM announcement_comments
     WHERE announcement_id = p_announcement_id
       AND visitor_hash = v_hash
       AND content = v_clean_content
       AND created_at > NOW() - INTERVAL '1 hour';
    IF FOUND THEN
      RETURN jsonb_build_object('status', 'duplicate', 'comment', NULL);
    END IF;
  ELSE
    v_hash := NULL;
  END IF;

  INSERT INTO announcement_comments (
    announcement_id,
    author_name,
    content,
    visitor_hash,
    is_approved
  ) VALUES (
    p_announcement_id,
    v_clean_author,
    v_clean_content,
    v_hash,
    NOT v_moderated
  )
  RETURNING * INTO v_new_comment;

  IF v_moderated THEN
    RETURN jsonb_build_object('status', 'pending', 'comment', NULL);
  END IF;

  RETURN jsonb_build_object(
    'status', 'ok',
    'comment', jsonb_build_object(
      'id', v_new_comment.id,
      'announcement_id', v_new_comment.announcement_id,
      'author_name', v_new_comment.author_name,
      'content', v_new_comment.content,
      'is_approved', v_new_comment.is_approved,
      'created_at', v_new_comment.created_at
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_announcement_comment(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 5.4 Consultation performante des sondages et résultats
DROP FUNCTION IF EXISTS public.get_polls_with_results(VARCHAR);
CREATE OR REPLACE FUNCTION public.get_polls_with_results(p_visitor_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_visitor_hash TEXT;
  v_results JSONB;
BEGIN
  IF p_visitor_id IS NOT NULL AND length(btrim(p_visitor_id)) >= 8 THEN
    v_visitor_hash := encode(extensions.digest(btrim(p_visitor_id), 'sha256'), 'hex');
  ELSE
    v_visitor_hash := NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(poll_row), '[]'::jsonb)
  INTO v_results
  FROM (
    SELECT
      p.id,
      p.question,
      p.description,
      p.is_active,
      p.closes_at,
      p.created_at,
      COALESCE((
        SELECT count(*)::INT
          FROM poll_votes pv
         WHERE pv.poll_id = p.id
      ), 0) AS total_votes,
      (
        SELECT pv.option_id
          FROM poll_votes pv
         WHERE pv.poll_id = p.id
           AND v_visitor_hash IS NOT NULL
           AND pv.visitor_hash = encode(extensions.digest(btrim(p_visitor_id) || p.id::text, 'sha256'), 'hex')
         LIMIT 1
      ) AS voted_option_id,
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', po.id,
            'poll_id', po.poll_id,
            'label', po.label,
            'display_order', po.display_order,
            'votes_count', (
              SELECT count(*)::INT
                FROM poll_votes pv
               WHERE pv.option_id = po.id
            )
          ) ORDER BY po.display_order ASC
        )
        FROM poll_options po
        WHERE po.poll_id = p.id
      ), '[]'::jsonb) AS options
    FROM polls p
    WHERE (auth.role() = 'authenticated' AND public.is_admin())
       OR (p.is_active = TRUE AND (p.closes_at IS NULL OR p.closes_at > NOW() - INTERVAL '30 days'))
    ORDER BY p.is_active DESC, p.created_at DESC
  ) AS poll_row;

  RETURN v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_polls_with_results(TEXT) TO anon, authenticated;

-- 5.5 Purge et anonymisation de rétention RGPD
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_anonymized_messages INT := 0;
  v_purged_views INT := 0;
  v_purged_votes INT := 0;
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

  DELETE FROM poll_votes
   WHERE poll_id IN (
     SELECT id FROM polls
      WHERE (NOT is_active OR (closes_at IS NOT NULL AND closes_at < NOW()))
        AND created_at < NOW() - INTERVAL '90 days'
   );
  GET DIAGNOSTICS v_purged_votes = ROW_COUNT;

  RETURN jsonb_build_object(
    'anonymized_messages', v_anonymized_messages,
    'purged_page_views', v_purged_views,
    'purged_closed_poll_votes', v_purged_votes,
    'executed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_data() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_data() FROM anon;

-- ==============================================================================
-- 6. POLITIQUES ROW LEVEL SECURITY (RLS) SCINDÉES & DURCIES
-- ==============================================================================

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- 6.1 Table PROFILE
DROP POLICY IF EXISTS "Public can view profile" ON profile;
DROP POLICY IF EXISTS "Allow public read on profile" ON profile;
CREATE POLICY "Public can view profile" ON profile FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated admin can update profile" ON profile;
CREATE POLICY "Authenticated admin can update profile" ON profile FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can insert profile" ON profile;
CREATE POLICY "Authenticated admin can insert profile" ON profile FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- 6.2 Table PROJECTS
DROP POLICY IF EXISTS "Public can view projects" ON projects;
DROP POLICY IF EXISTS "Allow public read on projects" ON projects;
CREATE POLICY "Public can view projects" ON projects FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated admin can insert projects" ON projects;
CREATE POLICY "Authenticated admin can insert projects" ON projects FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can update projects" ON projects;
CREATE POLICY "Authenticated admin can update projects" ON projects FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can delete projects" ON projects;
CREATE POLICY "Authenticated admin can delete projects" ON projects FOR DELETE TO authenticated
USING (public.is_admin());

-- 6.3 Table SKILLS
DROP POLICY IF EXISTS "Public can view skills" ON skills;
DROP POLICY IF EXISTS "Allow public read on skills" ON skills;
CREATE POLICY "Public can view skills" ON skills FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated admin can insert skills" ON skills;
CREATE POLICY "Authenticated admin can insert skills" ON skills FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can update skills" ON skills;
CREATE POLICY "Authenticated admin can update skills" ON skills FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can delete skills" ON skills;
CREATE POLICY "Authenticated admin can delete skills" ON skills FOR DELETE TO authenticated
USING (public.is_admin());

-- 6.4 Table PROJECT_SKILLS
DROP POLICY IF EXISTS "Public can view project_skills" ON project_skills;
DROP POLICY IF EXISTS "Allow public read on project_skills" ON project_skills;
CREATE POLICY "Public can view project_skills" ON project_skills FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated admin can modify project_skills" ON project_skills;
CREATE POLICY "Authenticated admin can modify project_skills" ON project_skills FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.5 Table CONTACT_MESSAGES
DROP POLICY IF EXISTS "Allow public insert on contact_messages" ON contact_messages;
CREATE POLICY "Allow public insert on contact_messages" ON contact_messages FOR INSERT TO public
WITH CHECK (
  length(name) <= 120 AND
  length(email) <= 150 AND
  length(message) <= 5000
);

DROP POLICY IF EXISTS "Authenticated admin can view contact_messages" ON contact_messages;
CREATE POLICY "Authenticated admin can view contact_messages" ON contact_messages FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can update contact_messages" ON contact_messages;
CREATE POLICY "Authenticated admin can update contact_messages" ON contact_messages FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can delete contact_messages" ON contact_messages;
CREATE POLICY "Authenticated admin can delete contact_messages" ON contact_messages FOR DELETE TO authenticated
USING (public.is_admin());

REVOKE SELECT, UPDATE, DELETE ON TABLE contact_messages FROM anon;
GRANT INSERT ON TABLE contact_messages TO anon, authenticated;
GRANT ALL ON TABLE contact_messages TO authenticated;

-- 6.6 Table PAGE_VIEWS
DROP POLICY IF EXISTS "Allow public insert on page_views" ON page_views;
DROP POLICY IF EXISTS "Allow anon insert page_views" ON page_views;
CREATE POLICY "Allow public insert on page_views" ON page_views FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admin can view page_views" ON page_views;
CREATE POLICY "Authenticated admin can view page_views" ON page_views FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can delete page_views" ON page_views;
CREATE POLICY "Authenticated admin can delete page_views" ON page_views FOR DELETE TO authenticated
USING (public.is_admin());

GRANT INSERT ON TABLE page_views TO anon, authenticated;
GRANT ALL ON TABLE page_views TO authenticated;

-- 6.7 Table ANNOUNCEMENTS
DROP POLICY IF EXISTS "Public can view published announcements" ON announcements;
CREATE POLICY "Public can view published announcements" ON announcements FOR SELECT TO anon, authenticated
USING (is_published = TRUE);

DROP POLICY IF EXISTS "Admin can manage announcements" ON announcements;
CREATE POLICY "Admin can manage announcements" ON announcements FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.8 Table ANNOUNCEMENT_COMMENTS
DROP POLICY IF EXISTS "Public can view approved comments" ON announcement_comments;
CREATE POLICY "Public can view approved comments" ON announcement_comments FOR SELECT TO anon, authenticated
USING (
  is_approved = TRUE
  AND EXISTS (
    SELECT 1 FROM announcements a
     WHERE a.id = announcement_comments.announcement_id
       AND a.is_published = TRUE
  )
);

DROP POLICY IF EXISTS "Admin can manage comments" ON announcement_comments;
CREATE POLICY "Admin can manage comments" ON announcement_comments FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON TABLE announcement_comments FROM anon;
GRANT SELECT ON TABLE announcement_comments TO anon, authenticated;
GRANT ALL ON TABLE announcement_comments TO authenticated;

-- 6.9 Table POLLS
DROP POLICY IF EXISTS "Public can view polls" ON polls;
CREATE POLICY "Public can view polls" ON polls FOR SELECT TO anon, authenticated
USING (
  is_active = TRUE
  OR (closes_at IS NOT NULL AND closes_at > NOW() - INTERVAL '30 days')
);

DROP POLICY IF EXISTS "Admin can manage polls" ON polls;
CREATE POLICY "Admin can manage polls" ON polls FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.10 Table POLL_OPTIONS
DROP POLICY IF EXISTS "Public can view poll options" ON poll_options;
CREATE POLICY "Public can view poll options" ON poll_options FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM polls p
     WHERE p.id = poll_options.poll_id
       AND (p.is_active = TRUE OR (p.closes_at IS NOT NULL AND p.closes_at > NOW() - INTERVAL '30 days'))
  )
);

DROP POLICY IF EXISTS "Admin can manage poll options" ON poll_options;
CREATE POLICY "Admin can manage poll options" ON poll_options FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.11 Table POLL_VOTES
DROP POLICY IF EXISTS "Admin can view poll votes" ON poll_votes;
CREATE POLICY "Admin can view poll votes" ON poll_votes FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete poll votes" ON poll_votes;
CREATE POLICY "Admin can delete poll votes" ON poll_votes FOR DELETE TO authenticated
USING (public.is_admin());

REVOKE ALL ON TABLE poll_votes FROM anon;
GRANT SELECT, DELETE ON TABLE poll_votes TO authenticated;

-- ==============================================================================
-- 7. CONFIGURATION DU STOCKAGE SUPABASE (BUCKET 'portfolio')
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio',
  'portfolio',
  true,
  5242880, -- 5 Mo max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Read" ON storage.objects;
CREATE POLICY "Admin Read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'portfolio' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'portfolio' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio' AND public.is_admin())
WITH CHECK (bucket_id = 'portfolio' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'portfolio' AND public.is_admin());

-- ==============================================================================
-- 8. INITIALISATION PAR DÉFAUT DU PROFIL (UNIQUEMENT SI LA TABLE EST VIDE)
-- ==============================================================================
INSERT INTO profile (
  name,
  alias,
  role,
  short_bio,
  full_bio,
  email,
  location,
  is_available,
  status_label,
  availability_status,
  accept_direct_messages
)
SELECT
  'Angoa Yao Jean',
  'Angy''s',
  'Développeur Full-Stack Web',
  'Concepteur d’expériences numériques complètes, combinant robustesse backend et élégance frontend.',
  '["Développeur passionné par la création de solutions web scalables et ergonomiques.", "Spécialisé dans les écosystèmes React, TypeScript, Node.js et PostgreSQL (Supabase)."]'::jsonb,
  'yaojeanangoa@gmail.com',
  'Abidjan, Côte d''Ivoire',
  TRUE,
  'Disponible',
  'available',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM profile);

COMMIT;

