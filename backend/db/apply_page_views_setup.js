import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: './backend/.env' })

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('1. Mise à niveau des colonnes de page_views...')
    await client.query(`
      ALTER TABLE page_views ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(100);
      ALTER TABLE page_views ADD COLUMN IF NOT EXISTS view_date DATE DEFAULT CURRENT_DATE;
      UPDATE page_views SET visitor_id = 'legacy_visitor' WHERE visitor_id IS NULL;
      UPDATE page_views SET view_date = CURRENT_DATE WHERE view_date IS NULL;
      ALTER TABLE page_views ALTER COLUMN visitor_id SET NOT NULL;
    `)

    console.log('2. Contrainte unique_daily_visitor & index...')
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_daily_visitor'
        ) THEN
          ALTER TABLE page_views ADD CONSTRAINT unique_daily_visitor UNIQUE (visitor_id, view_date, page_path);
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(view_date);
      CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);
    `)

    console.log('3. Création de la fonction RPC track_unique_visit...')
    await client.query(`
      CREATE OR REPLACE FUNCTION track_unique_visit(p_visitor_id VARCHAR, p_page_path VARCHAR)
      RETURNS BOOLEAN AS $$
      BEGIN
          INSERT INTO page_views (visitor_id, page_path, view_date)
          VALUES (p_visitor_id, COALESCE(p_page_path, '/'), CURRENT_DATE)
          ON CONFLICT (visitor_id, view_date, page_path) DO NOTHING;
          
          RETURN FOUND;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)

    console.log('4. Application des GRANT et politiques RLS demandées...')
    await client.query(`
      GRANT EXECUTE ON FUNCTION track_unique_visit(VARCHAR, VARCHAR) TO anon, authenticated;

      ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow anon insert page_views" ON page_views;
      DROP POLICY IF EXISTS "Allow public insert on page_views" ON page_views;
      CREATE POLICY "Allow anon insert page_views" ON page_views
      FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow admin read page_views" ON page_views;
      DROP POLICY IF EXISTS "Authenticated admin can view page_views" ON page_views;
      CREATE POLICY "Allow admin read page_views" ON page_views
      FOR SELECT USING (auth.uid() IS NOT NULL);

      GRANT INSERT ON TABLE page_views TO anon, authenticated;
      GRANT ALL ON TABLE page_views TO authenticated;
    `)

    await client.query('COMMIT')
    console.log('✅ Configuration page_views et track_unique_visit appliquée avec succès sur Supabase !')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erreur lors de l’application :', err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()

