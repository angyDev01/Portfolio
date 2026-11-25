-- ==============================================================================
-- MIGRATION IDEMPOTENTE : Bannière de couverture, Annonces, Commentaires & Sondages
-- À exécuter dans le SQL Editor de Supabase (ou via psql)
-- ==============================================================================

-- 1. Ajout de la photo de couverture / bannière sur la table profile
ALTER TABLE profile ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. Table ANNOUNCEMENTS : Projets en cours, événements à venir & actualités
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
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_published_order
  ON announcements(is_pinned DESC, created_at DESC)
  WHERE is_published = TRUE;

-- 3. Table ANNOUNCEMENT_COMMENTS : Commentaires publics modérables par annonce
CREATE TABLE IF NOT EXISTS announcement_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  author_name VARCHAR(80) NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcement_comments_ann_created
  ON announcement_comments(announcement_id, created_at ASC);

-- 4. Tables POLLS, POLL_OPTIONS & POLL_VOTES : Sondages interactifs anti-doublon
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question VARCHAR(220) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  closes_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label VARCHAR(140) NOT NULL,
  display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id, display_order);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  visitor_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_poll_visitor UNIQUE (poll_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_option ON poll_votes(option_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Public can view published announcements" ON announcements;
CREATE POLICY "Public can view published announcements"
  ON announcements FOR SELECT TO public
  USING (is_published = TRUE OR (auth.role() = 'authenticated' AND public.is_admin()));

DROP POLICY IF EXISTS "Admin can manage announcements" ON announcements;
CREATE POLICY "Admin can manage announcements"
  ON announcements FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ANNOUNCEMENT_COMMENTS
DROP POLICY IF EXISTS "Public can view approved comments" ON announcement_comments;
CREATE POLICY "Public can view approved comments"
  ON announcement_comments FOR SELECT TO public
  USING (
    (is_approved = TRUE AND EXISTS (
      SELECT 1 FROM announcements a WHERE a.id = announcement_id AND a.is_published = TRUE
    ))
    OR (auth.role() = 'authenticated' AND public.is_admin())
  );

DROP POLICY IF EXISTS "Public can post comments on open announcements" ON announcement_comments;
CREATE POLICY "Public can post comments on open announcements"
  ON announcement_comments FOR INSERT TO public
  WITH CHECK (
    length(trim(author_name)) BETWEEN 2 AND 80
    AND length(trim(content)) BETWEEN 2 AND 1500
    AND is_approved = TRUE
    AND EXISTS (
      SELECT 1 FROM announcements a
      WHERE a.id = announcement_id
        AND a.is_published = TRUE
        AND a.allow_comments = TRUE
    )
  );

DROP POLICY IF EXISTS "Admin can manage comments" ON announcement_comments;
CREATE POLICY "Admin can manage comments"
  ON announcement_comments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- POLLS & POLL_OPTIONS
DROP POLICY IF EXISTS "Public can view polls" ON polls;
CREATE POLICY "Public can view polls"
  ON polls FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admin can manage polls" ON polls;
CREATE POLICY "Admin can manage polls"
  ON polls FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view poll_options" ON poll_options;
CREATE POLICY "Public can view poll_options"
  ON poll_options FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admin can manage poll_options" ON poll_options;
CREATE POLICY "Admin can manage poll_options"
  ON poll_options FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- POLL_VOTES : Aucune lecture directe publique (protège les visitor_id)
DROP POLICY IF EXISTS "Admin can view poll_votes" ON poll_votes;
CREATE POLICY "Admin can view poll_votes"
  ON poll_votes FOR SELECT TO authenticated
  USING (public.is_admin());

REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE poll_votes FROM anon;

-- ==============================================================================
-- FONCTIONS RPC SÉCURISÉES POUR LES SONDAGES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  p_poll_id UUID,
  p_option_id UUID,
  p_visitor_id VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_open BOOLEAN;
BEGIN
  IF p_visitor_id IS NULL OR length(trim(p_visitor_id)) < 3 THEN
    RAISE EXCEPTION 'Identifiant visiteur invalide';
  END IF;

  SELECT (is_active = TRUE AND (closes_at IS NULL OR closes_at > NOW()))
  INTO v_is_open
  FROM polls
  WHERE id = p_poll_id;

  IF COALESCE(v_is_open, FALSE) = FALSE THEN
    RETURN FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM poll_options WHERE id = p_option_id AND poll_id = p_poll_id
  ) THEN
    RAISE EXCEPTION 'Option de sondage invalide';
  END IF;

  INSERT INTO poll_votes (poll_id, option_id, visitor_id)
  VALUES (p_poll_id, p_option_id, p_visitor_id)
  ON CONFLICT (poll_id, visitor_id) DO NOTHING;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_poll_vote(UUID, UUID, VARCHAR) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_polls_with_results(
  p_visitor_id VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'question', p.question,
        'description', p.description,
        'is_active', p.is_active,
        'closes_at', p.closes_at,
        'created_at', p.created_at,
        'total_votes', (
          SELECT COUNT(*)::int FROM poll_votes pv WHERE pv.poll_id = p.id
        ),
        'voted_option_id', (
          CASE
            WHEN p_visitor_id IS NULL OR length(trim(p_visitor_id)) = 0 THEN NULL
            ELSE (
              SELECT pv.option_id FROM poll_votes pv
              WHERE pv.poll_id = p.id AND pv.visitor_id = p_visitor_id
              LIMIT 1
            )
          END
        ),
        'options', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', o.id,
                'poll_id', o.poll_id,
                'label', o.label,
                'display_order', o.display_order,
                'votes_count', (
                  SELECT COUNT(*)::int FROM poll_votes pv WHERE pv.option_id = o.id
                )
              )
              ORDER BY o.display_order ASC, o.id ASC
            ),
            '[]'::jsonb
          )
          FROM poll_options o
          WHERE o.poll_id = p.id
        )
      )
      ORDER BY p.is_active DESC, p.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM polls p;
$$;

GRANT EXECUTE ON FUNCTION public.get_polls_with_results(VARCHAR) TO anon, authenticated;
