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

    console.log('1. Modification des contraintes NOT NULL...')
    await client.query(`
      ALTER TABLE profile ALTER COLUMN name DROP NOT NULL;
      ALTER TABLE profile ALTER COLUMN alias DROP NOT NULL;
      ALTER TABLE profile ALTER COLUMN role DROP NOT NULL;
      ALTER TABLE profile ALTER COLUMN short_bio DROP NOT NULL;
      ALTER TABLE profile ALTER COLUMN full_bio DROP NOT NULL;
      ALTER TABLE profile ALTER COLUMN email DROP NOT NULL;
      ALTER TABLE profile ALTER COLUMN github_url DROP NOT NULL;
      ALTER TABLE profile ALTER COLUMN linkedin_url DROP NOT NULL;
      ALTER TABLE profile ALTER COLUMN is_available DROP NOT NULL;
      ALTER TABLE profile ALTER COLUMN status_label DROP NOT NULL;
    `)

    console.log('2. Ajout des colonnes de compatibilité...')
    await client.query(`
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS title VARCHAR(150);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS bio_short TEXT;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS bio_full TEXT;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(50);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS whatsapp_url VARCHAR(255);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS location VARCHAR(255);
    `)

    console.log('3. Création du trigger de synchronisation bidirectionnelle...')
    await client.query(`
      CREATE OR REPLACE FUNCTION sync_profile_fields()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.full_name IS NOT NULL AND (NEW.name IS NULL OR NEW.name = '') THEN
          NEW.name := NEW.full_name;
        ELSIF NEW.name IS NOT NULL AND (NEW.full_name IS NULL OR NEW.full_name = '') THEN
          NEW.full_name := NEW.name;
        END IF;

        IF NEW.title IS NOT NULL AND (NEW.role IS NULL OR NEW.role = '') THEN
          NEW.role := NEW.title;
        ELSIF NEW.role IS NOT NULL AND (NEW.title IS NULL OR NEW.title = '') THEN
          NEW.title := NEW.role;
        END IF;

        IF NEW.bio_short IS NOT NULL AND (NEW.short_bio IS NULL OR NEW.short_bio = '') THEN
          NEW.short_bio := NEW.bio_short;
        ELSIF NEW.short_bio IS NOT NULL AND (NEW.bio_short IS NULL OR NEW.bio_short = '') THEN
          NEW.bio_short := NEW.short_bio;
        END IF;

        IF NEW.bio_full IS NOT NULL AND (NEW.full_bio IS NULL OR NEW.full_bio = '[]'::jsonb) THEN
          NEW.full_bio := jsonb_build_array(NEW.bio_full);
        END IF;

        IF NEW.alias IS NULL OR NEW.alias = '' THEN
          NEW.alias := 'Angy''s';
        END IF;

        IF NEW.status_label IS NULL OR NEW.status_label = '' THEN
          NEW.status_label := 'Disponible';
        END IF;

        IF NEW.availability_status IS NULL OR NEW.availability_status = '' THEN
          NEW.availability_status := 'available';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_sync_profile_fields ON profile;
      CREATE TRIGGER trg_sync_profile_fields
      BEFORE INSERT OR UPDATE ON profile
      FOR EACH ROW EXECUTE FUNCTION sync_profile_fields();
    `)

    console.log('4. Insertion du profil officiel...')
    await client.query('DELETE FROM profile')
    await client.query(`
      INSERT INTO profile (
        name,
        full_name,
        alias,
        role,
        title,
        short_bio,
        bio_short,
        full_bio,
        bio_full,
        location,
        is_available,
        status_label,
        availability_status,
        accept_direct_messages,
        email,
        phone,
        phone_secondary,
        whatsapp_url,
        github_url,
        linkedin_url,
        twitter_url,
        facebook_url
      ) VALUES (
        'Angoa Yao Jean',
        'Angoa Yao Jean',
        'Angy''s',
        'Développeur Full-Stack Junior',
        'Développeur Full-Stack Junior',
        'Développeur Full-Stack autodidacte passionné par la conception d''applications web modernes, réactives et performantes sous React, Vite et Node.js.',
        'Développeur Full-Stack autodidacte passionné par la conception d''applications web modernes, réactives et performantes sous React, Vite et Node.js.',
        '["Basé à Abidjan, Côte d''Ivoire, et ouvert au télétravail à l''international, je conçois des solutions logicielles complètes avec une attention particulière portée au clean code, à l''ergonomie et à la sécurité."]'::jsonb,
        'Basé à Abidjan, Côte d''Ivoire, et ouvert au télétravail à l''international, je conçois des solutions logicielles complètes avec une attention particulière portée au clean code, à l''ergonomie et à la sécurité.',
        'Abidjan, Côte d''Ivoire (Ouvert au télétravail / remote)',
        TRUE,
        'Disponible',
        'available',
        TRUE,
        'angynewdev@gmail.com',
        '+225 07 20 64 65 26',
        '+225 05 66 40 29 73',
        'https://wa.me/2250720646526',
        'https://github.com/angyDev01',
        'https://www.linkedin.com/in/angy-dev-532293357',
        'https://x.com/Angy656261',
        'https://www.facebook.com/share/1FGHSoJjo9/'
      );
    `)

    await client.query('COMMIT')
    console.log('✅ Profil synchronisé avec succès dans Supabase !')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erreur :', err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()

