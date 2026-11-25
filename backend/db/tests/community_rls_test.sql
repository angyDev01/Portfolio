-- ==============================================================================
-- TESTS RLS / RPC : Annonces, Commentaires & Sondages
-- À exécuter APRÈS migration_community_and_banner.sql ET migration_community_hardening.sql.
--
-- Le script est 100 % transactionnel : il se termine par ROLLBACK, aucune donnée
-- n'est conservée. Il s'arrête à la première assertion qui échoue (message "ECHEC").
-- Utilisation : coller dans le SQL Editor Supabase, ou
--   psql "$DATABASE_URL" -f backend/db/tests/community_rls_test.sql
-- ==============================================================================

BEGIN;

DO $test$
DECLARE
  v_ann UUID;
  v_draft UUID;
  v_ann_moderated UUID;
  v_poll UUID;
  v_poll_closed UUID;
  v_opt1 UUID;
  v_opt2 UUID;
  v_opt_closed UUID;
  v_status TEXT;
  v_json JSONB;
  v_count INT;
  v_denied BOOLEAN;
  v_visitor TEXT := 'visiteur-test-' || gen_random_uuid()::text;
  i INT;
BEGIN
  -- ---------------------------------------------------------------------------
  -- Jeu de données (rôle propriétaire)
  -- ---------------------------------------------------------------------------
  INSERT INTO announcements (title, kind, content, is_published, allow_comments)
  VALUES ('Annonce publique', 'news', 'Contenu', TRUE, TRUE) RETURNING id INTO v_ann;

  INSERT INTO announcements (title, kind, content, is_published, allow_comments)
  VALUES ('Brouillon', 'news', 'Contenu', FALSE, TRUE) RETURNING id INTO v_draft;

  INSERT INTO announcements (title, kind, content, is_published, allow_comments, comments_moderated)
  VALUES ('Annonce modérée', 'news', 'Contenu', TRUE, TRUE, TRUE) RETURNING id INTO v_ann_moderated;

  INSERT INTO polls (question) VALUES ('Sondage ouvert') RETURNING id INTO v_poll;
  INSERT INTO poll_options (poll_id, label, display_order) VALUES (v_poll, 'A', 0) RETURNING id INTO v_opt1;
  INSERT INTO poll_options (poll_id, label, display_order) VALUES (v_poll, 'B', 1) RETURNING id INTO v_opt2;

  INSERT INTO polls (question, is_active) VALUES ('Sondage clos', FALSE) RETURNING id INTO v_poll_closed;
  INSERT INTO poll_options (poll_id, label, display_order) VALUES (v_poll_closed, 'X', 0) RETURNING id INTO v_opt_closed;

  -- ---------------------------------------------------------------------------
  -- ANON
  -- ---------------------------------------------------------------------------
  SET LOCAL ROLE anon;

  -- T1 : anon ne voit que les annonces publiées
  SELECT count(*) INTO v_count FROM announcements WHERE id IN (v_ann, v_draft, v_ann_moderated);
  IF v_count <> 2 THEN RAISE EXCEPTION 'ECHEC T1 : anon doit voir 2 annonces publiées, vu %', v_count; END IF;
  RAISE NOTICE 'OK T1 : brouillons invisibles pour anon';

  -- T2 : INSERT direct dans announcement_comments refusé
  v_denied := FALSE;
  BEGIN
    INSERT INTO announcement_comments (announcement_id, author_name, content)
    VALUES (v_ann, 'Pirate', 'Insertion directe');
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := TRUE;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'ECHEC T2 : INSERT direct de commentaire autorisé pour anon'; END IF;
  RAISE NOTICE 'OK T2 : INSERT direct de commentaire refusé';

  -- T3 : commentaire valide via RPC
  v_json := public.post_announcement_comment(v_ann, 'Alice', 'Super projet, bravo', v_visitor, '');
  IF v_json ->> 'status' <> 'ok' OR v_json -> 'comment' IS NULL THEN
    RAISE EXCEPTION 'ECHEC T3 : commentaire valide refusé : %', v_json;
  END IF;
  RAISE NOTICE 'OK T3 : commentaire publié via RPC';

  -- T4 : commentaire identique refusé (doublon)
  v_json := public.post_announcement_comment(v_ann, 'Alice', 'Super projet, bravo', v_visitor, '');
  IF v_json ->> 'status' <> 'duplicate' THEN RAISE EXCEPTION 'ECHEC T4 : doublon accepté : %', v_json; END IF;
  RAISE NOTICE 'OK T4 : doublon refusé';

  -- T5 : lien refusé
  v_json := public.post_announcement_comment(v_ann, 'Bob', 'Visitez https://spam.example', v_visitor, '');
  IF v_json ->> 'status' <> 'link_rejected' THEN RAISE EXCEPTION 'ECHEC T5 : lien accepté : %', v_json; END IF;
  RAISE NOTICE 'OK T5 : lien refusé';

  -- T6 : honeypot rempli => réponse factice, rien d'écrit
  v_json := public.post_announcement_comment(v_ann, 'Robot', 'Message automatique', 'robot-visiteur-1', 'http://x');
  IF v_json ->> 'status' <> 'ok' OR v_json -> 'comment' IS NOT NULL THEN
    RAISE EXCEPTION 'ECHEC T6 : honeypot mal géré : %', v_json;
  END IF;
  RESET ROLE;
  SELECT count(*) INTO v_count FROM announcement_comments WHERE author_name = 'Robot';
  IF v_count <> 0 THEN RAISE EXCEPTION 'ECHEC T6 : le honeypot a écrit % ligne(s)', v_count; END IF;
  SET LOCAL ROLE anon;
  RAISE NOTICE 'OK T6 : honeypot ignoré silencieusement';

  -- T7 : limitation de débit (3 commentaires / 10 min / visiteur). 1 déjà posté (T3).
  v_json := public.post_announcement_comment(v_ann, 'Alice', 'Deuxième message', v_visitor, '');
  v_json := public.post_announcement_comment(v_ann, 'Alice', 'Troisième message', v_visitor, '');
  v_json := public.post_announcement_comment(v_ann, 'Alice', 'Quatrième message', v_visitor, '');
  IF v_json ->> 'status' <> 'rate_limited' THEN
    RAISE EXCEPTION 'ECHEC T7 : le 4e commentaire aurait dû être limité : %', v_json;
  END IF;
  RAISE NOTICE 'OK T7 : limitation de débit des commentaires';

  -- T8 : annonce modérée => commentaire en attente, invisible pour anon
  v_json := public.post_announcement_comment(v_ann_moderated, 'Carole', 'En attente de validation', 'carole-visiteur-1', '');
  IF v_json ->> 'status' <> 'pending' THEN RAISE EXCEPTION 'ECHEC T8 : statut attendu pending : %', v_json; END IF;
  SELECT count(*) INTO v_count FROM announcement_comments WHERE announcement_id = v_ann_moderated;
  IF v_count <> 0 THEN RAISE EXCEPTION 'ECHEC T8 : commentaire non approuvé visible par anon (%)', v_count; END IF;
  RAISE NOTICE 'OK T8 : modération préalable respectée';

  -- T9 : commentaire sur un brouillon / annonce inexistante => closed
  v_json := public.post_announcement_comment(v_draft, 'Dan', 'Commentaire sur brouillon', 'dan-visiteur-01', '');
  IF v_json ->> 'status' <> 'closed' THEN RAISE EXCEPTION 'ECHEC T9 : commentaire sur brouillon accepté : %', v_json; END IF;
  RAISE NOTICE 'OK T9 : brouillon fermé aux commentaires';

  -- T10 : visitor_hash illisible côté client
  v_denied := FALSE;
  BEGIN
    PERFORM visitor_hash FROM announcement_comments LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := TRUE;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'ECHEC T10 : visitor_hash lisible par anon'; END IF;
  RAISE NOTICE 'OK T10 : visitor_hash protégé';

  -- T11 : poll_votes illisible
  v_denied := FALSE;
  BEGIN
    PERFORM 1 FROM poll_votes LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := TRUE;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'ECHEC T11 : poll_votes lisible par anon'; END IF;
  RAISE NOTICE 'OK T11 : poll_votes illisible';

  -- T12 : vote OK puis revote sur une autre option => already_voted avec l'option d'origine
  v_json := public.cast_poll_vote(v_poll, v_opt1, v_visitor);
  IF v_json ->> 'status' <> 'ok' THEN RAISE EXCEPTION 'ECHEC T12 : vote refusé : %', v_json; END IF;
  v_json := public.cast_poll_vote(v_poll, v_opt2, v_visitor);
  IF v_json ->> 'status' <> 'already_voted' OR (v_json ->> 'voted_option_id')::uuid <> v_opt1 THEN
    RAISE EXCEPTION 'ECHEC T12 : revote mal géré : %', v_json;
  END IF;
  RAISE NOTICE 'OK T12 : un seul vote par visiteur, option d''origine renvoyée';

  -- T13 : sondage clôturé
  v_json := public.cast_poll_vote(v_poll_closed, v_opt_closed, v_visitor);
  IF v_json ->> 'status' <> 'closed' THEN RAISE EXCEPTION 'ECHEC T13 : vote sur sondage clos : %', v_json; END IF;
  RAISE NOTICE 'OK T13 : sondage clôturé refuse les votes';

  -- T14 : option d'un autre sondage => invalid
  v_json := public.cast_poll_vote(v_poll, v_opt_closed, 'visiteur-option-x-1');
  IF v_json ->> 'status' <> 'invalid' THEN RAISE EXCEPTION 'ECHEC T14 : option étrangère acceptée : %', v_json; END IF;
  RAISE NOTICE 'OK T14 : option étrangère refusée';

  -- T15 : résultats agrégés + vote du visiteur retrouvé
  v_json := public.get_polls_with_results(v_visitor);
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_json) p
    WHERE (p ->> 'id')::uuid = v_poll
      AND (p ->> 'total_votes')::int = 1
      AND (p ->> 'voted_option_id')::uuid = v_opt1
  ) THEN
    RAISE EXCEPTION 'ECHEC T15 : résultats incohérents : %', v_json;
  END IF;
  RAISE NOTICE 'OK T15 : résultats et vote du visiteur corrects';

  -- T16 : limitation de débit des votes (30 / minute / sondage). 1 vote déjà enregistré.
  FOR i IN 1..29 LOOP
    v_json := public.cast_poll_vote(v_poll, v_opt1, 'visiteur-charge-' || i::text || '-xx');
  END LOOP;
  v_json := public.cast_poll_vote(v_poll, v_opt1, 'visiteur-charge-31-xx');
  IF v_json ->> 'status' <> 'rate_limited' THEN
    RAISE EXCEPTION 'ECHEC T16 : limitation de débit absente : %', v_json;
  END IF;
  RAISE NOTICE 'OK T16 : limitation de débit des votes';

  -- T17 : anon ne peut ni créer d'annonce ni de sondage
  v_denied := FALSE;
  BEGIN
    INSERT INTO announcements (title, kind, content) VALUES ('Pirate', 'news', 'x');
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := TRUE;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'ECHEC T17 : anon peut créer une annonce'; END IF;

  v_denied := FALSE;
  BEGIN
    INSERT INTO polls (question) VALUES ('Pirate');
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := TRUE;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'ECHEC T17 : anon peut créer un sondage'; END IF;
  RAISE NOTICE 'OK T17 : création réservée à l''admin (anon)';

  RESET ROLE;

  -- ---------------------------------------------------------------------------
  -- AUTHENTICATED NON ADMIN
  -- ---------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"inconnu@example.com","role":"authenticated"}', TRUE);
  SET LOCAL ROLE authenticated;

  v_denied := FALSE;
  BEGIN
    INSERT INTO announcements (title, kind, content) VALUES ('Intrus', 'news', 'x');
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := TRUE;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'ECHEC T18 : un utilisateur non admin peut créer une annonce'; END IF;

  UPDATE announcements SET title = 'Piraté' WHERE id = v_ann;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 0 THEN RAISE EXCEPTION 'ECHEC T18 : un utilisateur non admin peut modifier une annonce'; END IF;

  SELECT count(*) INTO v_count FROM announcements WHERE id = v_draft;
  IF v_count <> 0 THEN RAISE EXCEPTION 'ECHEC T18 : un utilisateur non admin voit un brouillon'; END IF;
  RAISE NOTICE 'OK T18 : utilisateur authentifié non admin sans droits d''écriture';

  RESET ROLE;

  -- ---------------------------------------------------------------------------
  -- ADMIN (claims simulés)
  -- ---------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims',
    '{"sub":"4f577974-f477-4e9d-97f6-c9b85b441d7e","email":"yaojeanangoa@gmail.com","role":"authenticated"}', TRUE);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO v_count FROM announcements WHERE id IN (v_ann, v_draft, v_ann_moderated);
  IF v_count <> 3 THEN RAISE EXCEPTION 'ECHEC T19 : admin doit voir 3 annonces, vu %', v_count; END IF;

  UPDATE announcement_comments SET is_approved = FALSE WHERE announcement_id = v_ann;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count < 1 THEN RAISE EXCEPTION 'ECHEC T19 : admin ne peut pas modérer les commentaires'; END IF;

  DELETE FROM polls WHERE id = v_poll_closed;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN RAISE EXCEPTION 'ECHEC T19 : admin ne peut pas supprimer un sondage'; END IF;
  RAISE NOTICE 'OK T19 : administrateur autorisé (lecture brouillons, modération, suppression)';

  RESET ROLE;
  RAISE NOTICE '==> TOUS LES TESTS SONT PASSÉS';
END
$test$;

ROLLBACK;
