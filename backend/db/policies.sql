-- ==============================================================================
-- POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS) SUPABASE POUR ANGY PORTFOLIO
-- ==============================================================================
-- Ce script active RLS sur toutes les tables du portfolio et garantit que seul
-- l'administrateur légitime vérifié via public.is_admin() a le droit d'insérer,
-- modifier ou supprimer des données (projets, compétences, profil, messages).
-- Le public a accès en lecture seule aux données publiques et en écriture contrôlée
-- sur page_views et contact_messages.

-- ==============================================================================
-- 0. FONCTION D'AUTORISATION STRICTE (ANTI BOLA / IDOR)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT (auth.jwt() ->> 'email') = 'yaojeanangoa@gmail.com' 
      OR auth.uid() = '4f577974-f477-4e9d-97f6-c9b85b441d7e'::uuid;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ==============================================================================
-- 1. Activation de la RLS sur chaque table
-- ==============================================================================
ALTER TABLE IF EXISTS profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS page_views ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- TABLE : profile
-- ==============================================================================
DROP POLICY IF EXISTS "Allow public read on profile" ON profile;
DROP POLICY IF EXISTS "Public can view profile" ON profile;
CREATE POLICY "Public can view profile" 
ON profile FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated admin can update profile" ON profile;
CREATE POLICY "Authenticated admin can update profile" 
ON profile FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can insert profile" ON profile;
CREATE POLICY "Authenticated admin can insert profile" 
ON profile FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

-- ==============================================================================
-- TABLE : projects
-- ==============================================================================
DROP POLICY IF EXISTS "Allow public read on projects" ON projects;
DROP POLICY IF EXISTS "Public can view projects" ON projects;
CREATE POLICY "Public can view projects" 
ON projects FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated admin can insert projects" ON projects;
CREATE POLICY "Authenticated admin can insert projects" 
ON projects FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can update projects" ON projects;
CREATE POLICY "Authenticated admin can update projects" 
ON projects FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can delete projects" ON projects;
CREATE POLICY "Authenticated admin can delete projects" 
ON projects FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- ==============================================================================
-- TABLE : skills
-- ==============================================================================
DROP POLICY IF EXISTS "Allow public read on skills" ON skills;
DROP POLICY IF EXISTS "Public can view skills" ON skills;
CREATE POLICY "Public can view skills" 
ON skills FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated admin can insert skills" ON skills;
CREATE POLICY "Authenticated admin can insert skills" 
ON skills FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can update skills" ON skills;
CREATE POLICY "Authenticated admin can update skills" 
ON skills FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can delete skills" ON skills;
CREATE POLICY "Authenticated admin can delete skills" 
ON skills FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- ==============================================================================
-- TABLE : project_skills
-- ==============================================================================
DROP POLICY IF EXISTS "Allow public read on project_skills" ON project_skills;
DROP POLICY IF EXISTS "Public can view project_skills" ON project_skills;
CREATE POLICY "Public can view project_skills" 
ON project_skills FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated admin can modify project_skills" ON project_skills;
CREATE POLICY "Authenticated admin can modify project_skills" 
ON project_skills FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- TABLE : contact_messages
-- ==============================================================================
-- Le public peut uniquement soumettre des messages avec validation de taille
DROP POLICY IF EXISTS "Allow public insert on contact_messages" ON contact_messages;
CREATE POLICY "Allow public insert on contact_messages" 
ON contact_messages FOR INSERT 
TO public 
WITH CHECK (
  length(name) <= 120 AND 
  length(email) <= 150 AND 
  length(message) <= 5000
);

-- Seul l'administrateur connecté peut consulter, marquer lu/non lu et supprimer les messages
DROP POLICY IF EXISTS "Authenticated admin can view contact_messages" ON contact_messages;
CREATE POLICY "Authenticated admin can view contact_messages" 
ON contact_messages FOR SELECT 
TO authenticated 
USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can update contact_messages" ON contact_messages;
CREATE POLICY "Authenticated admin can update contact_messages" 
ON contact_messages FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can delete contact_messages" ON contact_messages;
CREATE POLICY "Authenticated admin can delete contact_messages" 
ON contact_messages FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- Révocation explicite au niveau des privilèges PostgreSQL (Défense en profondeur)
REVOKE SELECT, UPDATE, DELETE ON TABLE contact_messages FROM anon;
GRANT INSERT ON TABLE contact_messages TO anon, authenticated;
GRANT ALL ON TABLE contact_messages TO authenticated;

-- ==============================================================================
-- TABLE : page_views (Analytics)
-- ==============================================================================
-- Fonction RPC avec search_path sécurisé
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

-- Assure les permissions de lecture pour l'administrateur et d'écriture pour tous
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert page_views" ON page_views;
DROP POLICY IF EXISTS "Allow public insert on page_views" ON page_views;
CREATE POLICY "Allow public insert on page_views" ON page_views
FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin read page_views" ON page_views;
DROP POLICY IF EXISTS "Authenticated admin can view page_views" ON page_views;
CREATE POLICY "Authenticated admin can view page_views" ON page_views
FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated admin can delete page_views" ON page_views;
CREATE POLICY "Authenticated admin can delete page_views" 
ON page_views FOR DELETE 
TO authenticated 
USING (public.is_admin());

GRANT INSERT ON TABLE page_views TO anon, authenticated;
GRANT ALL ON TABLE page_views TO authenticated;

-- ==============================================================================
-- STORAGE : Bucket 'portfolio' (Images & Avatars)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
CREATE POLICY "Admin Upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'portfolio' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
CREATE POLICY "Admin Update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio' AND public.is_admin())
WITH CHECK (bucket_id = 'portfolio' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
CREATE POLICY "Admin Delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'portfolio' AND public.is_admin());
