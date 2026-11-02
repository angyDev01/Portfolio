-- Politiques RLS (PostgreSQL 14+)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on profile') THEN
    CREATE POLICY "Allow public read on profile" ON profile FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on skills') THEN
    CREATE POLICY "Allow public read on skills" ON skills FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on projects') THEN
    CREATE POLICY "Allow public read on projects" ON projects FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on project_skills') THEN
    CREATE POLICY "Allow public read on project_skills" ON project_skills FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on contact_messages') THEN
    CREATE POLICY "Allow public insert on contact_messages" ON contact_messages FOR INSERT WITH CHECK (true);
  END IF;
END $$;
