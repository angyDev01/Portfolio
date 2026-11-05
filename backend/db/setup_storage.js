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

    console.log('1. Ajout de la colonne avatar_url sur profile...')
    await client.query(`
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `)

    console.log('2. Création/Vérification du bucket de stockage portfolio...')
    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('portfolio', 'portfolio', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `)

    console.log('3. Définition des politiques RLS sur storage.objects...')
    await client.query(`
      DROP POLICY IF EXISTS "Public Access" ON storage.objects;
      CREATE POLICY "Public Access" ON storage.objects
      FOR SELECT USING (bucket_id = 'portfolio');

      DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
      CREATE POLICY "Admin Upload" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'portfolio' AND auth.uid() IS NOT NULL);

      DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
      CREATE POLICY "Admin Update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'portfolio' AND auth.uid() IS NOT NULL);

      DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
      CREATE POLICY "Admin Delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'portfolio' AND auth.uid() IS NOT NULL);
    `)

    await client.query('COMMIT')
    console.log('✅ Colonne avatar_url et bucket portfolio configurés avec succès !')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erreur lors de la configuration du stockage :', err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()

