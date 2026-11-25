-- ==============================================================================
-- DIAGNOSTIC SUPABASE : État de la Base de Données Angy Portfolio
-- Exécutez ce script en lecture seule dans le SQL Editor de Supabase
-- Il n'altère aucune donnée et affiche un bilan complet de votre schéma.
-- ==============================================================================

WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profile',
    'skills',
    'projects',
    'project_skills',
    'contact_messages',
    'page_views',
    'announcements',
    'announcement_comments',
    'polls',
    'poll_options',
    'poll_votes'
  ]) AS table_name
),
table_audit AS (
  SELECT
    et.table_name,
    CASE WHEN t.tablename IS NOT NULL THEN '✅ Présente' ELSE '❌ Manquante' END AS status,
    CASE 
      WHEN t.rowsecurity IS TRUE THEN '🛡️ RLS Activé'
      WHEN t.tablename IS NOT NULL THEN '⚠️ RLS DÉSACTIVÉ'
      ELSE '-'
    END AS rls_status,
    COALESCE(s.n_live_tup, 0) AS estimated_rows
  FROM expected_tables et
  LEFT JOIN pg_tables t ON t.schemaname = 'public' AND t.tablename = et.table_name
  LEFT JOIN pg_stat_user_tables s ON s.schemaname = 'public' AND s.relname = et.table_name
)
SELECT '1. AUDIT DES TABLES & RLS' AS section, table_name AS element, status, rls_status, estimated_rows::text AS details
FROM table_audit

UNION ALL

-- Vérification des colonnes critiques
SELECT
  '2. AUDIT DES COLONNES CRITIQUES' AS section,
  c.col AS element,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = split_part(c.col, '.', 1) AND column_name = split_part(c.col, '.', 2)
  ) THEN '✅ Présente' ELSE '❌ Manquante' END AS status,
  'Type & Contrainte' AS rls_status,
  COALESCE((
    SELECT data_type || CASE WHEN is_nullable = 'NO' THEN ' (NOT NULL)' ELSE '' END
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = split_part(c.col, '.', 1) AND column_name = split_part(c.col, '.', 2)
  ), 'Non trouvée') AS details
FROM (
  VALUES
    ('profile.banner_url'),
    ('announcements.comments_moderated'),
    ('announcement_comments.visitor_hash'),
    ('poll_votes.visitor_hash')
) AS c(col)

UNION ALL

-- Vérification des fonctions & RPC critiques
SELECT
  '3. AUDIT DES FONCTIONS RPC' AS section,
  f.fname AS element,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = f.fname
  ) THEN '✅ Installée' ELSE '❌ Manquante' END AS status,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = f.fname AND p.prosecdef IS TRUE
  ) THEN '🔒 SECURITY DEFINER' ELSE 'Invoker / Manquante' END AS rls_status,
  f.description AS details
FROM (
  VALUES
    ('is_admin', 'Vérification email et UID administrateur'),
    ('track_unique_visit', 'Comptabilisation quotidienne d''audience sans doublon'),
    ('cast_poll_vote', 'Vote atomique, anti-doublon et limitation de débit'),
    ('post_announcement_comment', 'Honeypot, rejet des liens et modération'),
    ('get_polls_with_results', 'Agrégation JSON des résultats et statut de vote'),
    ('cleanup_expired_data', 'Purge RGPD (adresses IP et anciens votes)')
) AS f(fname, description)

UNION ALL

-- Vérification du Storage Bucket 'portfolio'
SELECT
  '4. AUDIT SUPABASE STORAGE' AS section,
  'Bucket portfolio' AS element,
  CASE WHEN EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'portfolio'
  ) THEN '✅ Configuré' ELSE '❌ Manquant' END AS status,
  CASE WHEN EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'portfolio' AND public IS TRUE
  ) THEN '🌐 Public' ELSE '🔒 Privé / Inconnu' END AS rls_status,
  (
    SELECT count(*)::text || ' politiques sur storage.objects'
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%portfolio%' OR policyname LIKE '%Public Access%'
  ) AS details;

