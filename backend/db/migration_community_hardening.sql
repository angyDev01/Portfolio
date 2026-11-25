-- ==============================================================================
-- MIGRATION v2 (DURCISSEMENT) : Annonces, Commentaires & Sondages
-- À exécuter APRÈS migration_community_and_banner.sql, dans le SQL Editor Supabase.
-- Idempotente : peut être rejouée sans effet de bord.
--
-- Contenu :
--   1. Colonnes : announcements.comments_moderated, visitor_hash (commentaires, votes)
--   2. Hachage des identifiants visiteurs (plus d'identifiant brut dans poll_votes)
--   3. RLS : politiques publiques / admin scindées, lecture de colonnes restreinte
--   4. RPC cast_poll_vote v2 (statut explicite + limitation de débit)
--   5. RPC post_announcement_comment (honeypot, liens refusés, limitation de débit)
--   6. RPC get_polls_with_results v2
--   7. Rétention RGPD (cleanup_expired_data étendue)
--   8. Bucket Storage : taille max et types MIME autorisés
-- ==============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.poll_votes') IS NULL
     OR to_regclass('public.announcement_comments') IS NULL
     OR to_regclass('public.announcements') IS NULL THEN
    RAISE EXCEPTION 'Exécutez d''abord migration_community_and_banner.sql';
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ==============================================================================
-- 1. COLONNES
-- ==============================================================================
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS comments_moderated BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE announcement_comments ADD COLUMN IF NOT EXISTS visitor_hash TEXT;
ALTER TABLE poll_votes ADD COLUMN IF NOT EXISTS visitor_hash TEXT;

-- ==============================================================================
-- 2. HACHAGE DES VISITEURS (minimisation des données personnelles)
-- ==============================================================================
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

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_comments_lengths_check') THEN
    ALTER TABLE announcement_comments
      ADD CONSTRAINT announcement_comments_lengths_check
      CHECK (length(btrim(author_name)) BETWEEN 2 AND 80
         AND length(btrim(content)) BETWEEN 2 AND 1500) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_created
  ON poll_votes(poll_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcement_comments_visitor_created
  ON announcement_comments(visitor_hash, created_at DESC)
  WHERE visitor_hash IS NOT NULL;

-- ==============================================================================
-- 3. RLS : politiques scindées (aucun appel à is_admin() depuis le rôle anon)
-- ==============================================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Public can view published announcements" ON announcements;
CREATE POLICY "Public can view published announcements"
  ON announcements FOR SELECT TO anon, authenticated
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "Admin can manage announcements" ON announcements;
CREATE POLICY "Admin can manage announcements"
  ON announcements FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ANNOUNCEMENT_COMMENTS (écriture publique uniquement via la RPC post_announcement_comment)
DROP POLICY IF EXISTS "Public can view approved comments" ON announcement_comments;
CREATE POLICY "Public can view approved comments"
  ON announcement_comments FOR SELECT TO anon, authenticated
  USING (
    is_approved = TRUE
    AND EXISTS (
      SELECT 1 FROM announcements a
      WHERE a.id = announcement_id AND a.is_published = TRUE
    )
  );

DROP POLICY IF EXISTS "Public can post comments on open announcements" ON announcement_comments;

DROP POLICY IF EXISTS "Admin can manage comments" ON announcement_comments;
CREATE POLICY "Admin can manage comments"
  ON announcement_comments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE INSERT ON TABLE announcement_comments FROM anon, authenticated;

-- visitor_hash n'est jamais lisible côté client : lecture limitée aux colonnes publiques
REVOKE SELECT ON TABLE announcement_comments FROM anon, authenticated;
GRANT SELECT (id, announcement_id, author_name, content, is_approved, created_at)
  ON TABLE announcement_comments TO anon, authenticated;

-- POLL_VOTES : aucun accès direct pour anon (résultats via get_polls_with_results)
REVOKE ALL ON TABLE poll_votes FROM anon;

-- ==============================================================================
-- 4. RPC cast_poll_vote v2
-- ==============================================================================
DROP FUNCTION IF EXISTS public.cast_poll_vote(UUID, UUID, VARCHAR);

CREATE FUNCTION public.cast_poll_vote(
  p_poll_id UUID,
  p_option_id UUID,
  p_visitor_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
  v_existing UUID;
  v_recent INT;
BEGIN
  IF length(btrim(coalesce(p_visitor_id, ''))) < 8 THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM polls
    WHERE id = p_poll_id
      AND is_active = TRUE
      AND (closes_at IS NULL OR closes_at > now())
  ) THEN
    RETURN jsonb_build_object('status', 'closed');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM poll_options WHERE id = p_option_id AND poll_id = p_poll_id
  ) THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  v_hash := encode(digest(p_visitor_id || p_poll_id::text, 'sha256'), 'hex');

  SELECT option_id INTO v_existing
  FROM poll_votes
  WHERE poll_id = p_poll_id AND visitor_hash = v_hash;

  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already_voted', 'voted_option_id', v_existing);
  END IF;

  -- Limitation de débit : au plus 30 votes par minute et par sondage
  SELECT count(*) INTO v_recent
  FROM poll_votes
  WHERE poll_id = p_poll_id AND created_at > now() - interval '1 minute';

  IF v_recent >= 30 THEN
    RETURN jsonb_build_object('status', 'rate_limited');
  END IF;

  INSERT INTO poll_votes (poll_id, option_id, visitor_hash)
  VALUES (p_poll_id, p_option_id, v_hash)
  ON CONFLICT (poll_id, visitor_hash) DO NOTHING;

  IF NOT FOUND THEN
    -- Double clic concurrent : un autre appel a déjà enregistré ce vote
    SELECT option_id INTO v_existing
    FROM poll_votes
    WHERE poll_id = p_poll_id AND visitor_hash = v_hash;
    RETURN jsonb_build_object('status', 'already_voted', 'voted_option_id', v_existing);
  END IF;

  RETURN jsonb_build_object('status', 'ok', 'voted_option_id', p_option_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_poll_vote(UUID, UUID, VARCHAR) TO anon, authenticated;

-- ==============================================================================
-- 5. RPC post_announcement_comment
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.post_announcement_comment(
  p_announcement_id UUID,
  p_author_name VARCHAR,
  p_content TEXT,
  p_visitor_id VARCHAR,
  p_website TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_name TEXT := btrim(coalesce(p_author_name, ''));
  v_content TEXT := btrim(coalesce(p_content, ''));
  v_ann announcements%ROWTYPE;
  v_hash TEXT;
  v_row announcement_comments%ROWTYPE;
BEGIN
  -- Honeypot : un robot remplit le champ caché ; réponse factice, rien n'est écrit
  IF btrim(coalesce(p_website, '')) <> '' THEN
    RETURN jsonb_build_object('status', 'ok');
  END IF;

  IF length(btrim(coalesce(p_visitor_id, ''))) < 8
     OR length(v_name) NOT BETWEEN 2 AND 80
     OR length(v_content) NOT BETWEEN 2 AND 1500 THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF v_content ~* '(https?://|www\.)' OR v_name ~* '(https?://|www\.)' THEN
    RETURN jsonb_build_object('status', 'link_rejected');
  END IF;

  SELECT * INTO v_ann
  FROM announcements
  WHERE id = p_announcement_id AND is_published = TRUE AND allow_comments = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'closed');
  END IF;

  v_hash := encode(digest(p_visitor_id || ':comment', 'sha256'), 'hex');

  IF EXISTS (
    SELECT 1 FROM announcement_comments
    WHERE announcement_id = p_announcement_id
      AND visitor_hash = v_hash
      AND content = v_content
      AND created_at > now() - interval '1 hour'
  ) THEN
    RETURN jsonb_build_object('status', 'duplicate');
  END IF;

  -- Limitation de débit : 3 commentaires / 10 min / visiteur
  IF (
    SELECT count(*) FROM announcement_comments
    WHERE visitor_hash = v_hash AND created_at > now() - interval '10 minutes'
  ) >= 3 THEN
    RETURN jsonb_build_object('status', 'rate_limited');
  END IF;

  -- Limitation de débit : 30 commentaires / heure / annonce
  IF (
    SELECT count(*) FROM announcement_comments
    WHERE announcement_id = p_announcement_id AND created_at > now() - interval '1 hour'
  ) >= 30 THEN
    RETURN jsonb_build_object('status', 'rate_limited');
  END IF;

  INSERT INTO announcement_comments (announcement_id, author_name, content, is_approved, visitor_hash)
  VALUES (p_announcement_id, v_name, v_content, NOT v_ann.comments_moderated, v_hash)
  RETURNING * INTO v_row;

  IF v_row.is_approved THEN
    RETURN jsonb_build_object(
      'status', 'ok',
      'comment', jsonb_build_object(
        'id', v_row.id,
        'announcement_id', v_row.announcement_id,
        'author_name', v_row.author_name,
        'content', v_row.content,
        'is_approved', v_row.is_approved,
        'created_at', v_row.created_at
      )
    );
  END IF;

  RETURN jsonb_build_object('status', 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_announcement_comment(UUID, VARCHAR, TEXT, VARCHAR, TEXT)
  TO anon, authenticated;

-- ==============================================================================
-- 6. RPC get_polls_with_results v2 (vote du visiteur retrouvé via le hash)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_polls_with_results(
  p_visitor_id VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
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
            WHEN p_visitor_id IS NULL OR length(btrim(p_visitor_id)) < 8 THEN NULL
            ELSE (
              SELECT pv.option_id FROM poll_votes pv
              WHERE pv.poll_id = p.id
                AND pv.visitor_hash = encode(digest(p_visitor_id || p.id::text, 'sha256'), 'hex')
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

-- ==============================================================================
-- 7. RÉTENTION RGPD : anonymisation des empreintes visiteurs après 90 jours
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_anonymized_messages INT := 0;
  v_purged_views INT := 0;
  v_anonymized_votes INT := 0;
  v_anonymized_comments INT := 0;
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

  -- Les lignes de votes sont conservées (compteurs de résultats) ; seule l'empreinte est effacée
  UPDATE poll_votes
  SET visitor_hash = NULL
  WHERE visitor_hash IS NOT NULL
    AND created_at < NOW() - INTERVAL '90 days'
    AND poll_id IN (
      SELECT id FROM polls
      WHERE is_active = FALSE
         OR (closes_at IS NOT NULL AND closes_at < NOW() - INTERVAL '90 days')
    );
  GET DIAGNOSTICS v_anonymized_votes = ROW_COUNT;

  UPDATE announcement_comments
  SET visitor_hash = NULL
  WHERE visitor_hash IS NOT NULL
    AND created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_anonymized_comments = ROW_COUNT;

  RETURN jsonb_build_object(
    'anonymized_messages', v_anonymized_messages,
    'purged_page_views', v_purged_views,
    'anonymized_votes', v_anonymized_votes,
    'anonymized_comments', v_anonymized_comments,
    'executed_at', NOW()
  );
END;
$$;

-- ==============================================================================
-- 8. BUCKET STORAGE : taille maximale et types MIME autorisés
-- ==============================================================================
UPDATE storage.buckets
   SET file_size_limit = 10485760, -- 10 Mo (le client limite déjà les images à 5 Mo)
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']
 WHERE id = 'portfolio';

COMMIT;
