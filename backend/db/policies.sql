-- ==============================================================================
-- POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS) SUPABASE POUR ANGY PORTFOLIO
-- ==============================================================================
-- Ce script active RLS sur toutes les tables du portfolio et garantit que seules
-- les personnes authentifiées avec Supabase Auth (auth.uid() IS NOT NULL) ont
-- le droit d'insérer, modifier ou supprimer des données (projets, compétences, profil, messages).
-- Le public a accès en lecture seule aux données publiques et en écriture sur
-- page_views et contact_messages.

-- 1. Activation de la RLS sur chaque table
ALTER TABLE IF EXISTS profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS page_views ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- TABLE : profile
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view profile" ON profile;
CREATE POLICY "Public can view profile" 
ON profile FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated admin can update profile" ON profile;
CREATE POLICY "Authenticated admin can update profile" 
ON profile FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated admin can insert profile" ON profile;
CREATE POLICY "Authenticated admin can insert profile" 
ON profile FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- ==============================================================================
-- TABLE : projects
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view projects" ON projects;
CREATE POLICY "Public can view projects" 
ON projects FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated admin can insert projects" ON projects;
CREATE POLICY "Authenticated admin can insert projects" 
ON projects FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated admin can update projects" ON projects;
CREATE POLICY "Authenticated admin can update projects" 
ON projects FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated admin can delete projects" ON projects;
CREATE POLICY "Authenticated admin can delete projects" 
ON projects FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- ==============================================================================
-- TABLE : skills
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view skills" ON skills;
CREATE POLICY "Public can view skills" 
ON skills FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated admin can insert skills" ON skills;
CREATE POLICY "Authenticated admin can insert skills" 
ON skills FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated admin can update skills" ON skills;
CREATE POLICY "Authenticated admin can update skills" 
ON skills FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated admin can delete skills" ON skills;
CREATE POLICY "Authenticated admin can delete skills" 
ON skills FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- ==============================================================================
-- TABLE : project_skills
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view project_skills" ON project_skills;
CREATE POLICY "Public can view project_skills" 
ON project_skills FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated admin can modify project_skills" ON project_skills;
CREATE POLICY "Authenticated admin can modify project_skills" 
ON project_skills FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ==============================================================================
-- TABLE : contact_messages
-- ==============================================================================
-- Le public peut uniquement soumettre des messages
DROP POLICY IF EXISTS "Allow public insert on contact_messages" ON contact_messages;
CREATE POLICY "Allow public insert on contact_messages" 
ON contact_messages FOR INSERT 
TO public 
WITH CHECK (true);

-- Seul l'administrateur connecté peut consulter, marquer lu/non lu et supprimer les messages
DROP POLICY IF EXISTS "Authenticated admin can view contact_messages" ON contact_messages;
CREATE POLICY "Authenticated admin can view contact_messages" 
ON contact_messages FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated admin can update contact_messages" ON contact_messages;
CREATE POLICY "Authenticated admin can update contact_messages" 
ON contact_messages FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated admin can delete contact_messages" ON contact_messages;
CREATE POLICY "Authenticated admin can delete contact_messages" 
ON contact_messages FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- ==============================================================================
-- TABLE : page_views (Analytics)
-- ==============================================================================
-- Le public peut enregistrer des consultations de page
DROP POLICY IF EXISTS "Allow public insert on page_views" ON page_views;
CREATE POLICY "Allow public insert on page_views" 
ON page_views FOR INSERT 
TO public 
WITH CHECK (true);

-- Seul l'administrateur connecté peut consulter les statistiques analytiques
DROP POLICY IF EXISTS "Authenticated admin can view page_views" ON page_views;
CREATE POLICY "Authenticated admin can view page_views" 
ON page_views FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated admin can delete page_views" ON page_views;
CREATE POLICY "Authenticated admin can delete page_views" 
ON page_views FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);
