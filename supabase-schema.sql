-- =============================================
-- PIKMI baza podataka - SQL šema
-- Pokreni u Supabase > SQL Editor
-- =============================================

-- 1. Tabela profila
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  service_title TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  website TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  github TEXT DEFAULT '',
  profile_url TEXT UNIQUE DEFAULT '',
  hourly_rate TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  availability TEXT DEFAULT 'available',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela pitch linkova
CREATE TABLE IF NOT EXISTS pitch_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Moj Pitch Link',
  slug TEXT UNIQUE NOT NULL,
  template TEXT NOT NULL DEFAULT 'minimal',
  views INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) - svako vidi samo svoje podatke
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_links ENABLE ROW LEVEL SECURITY;

-- Politike za profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Politike za pitch_links
CREATE POLICY "Users can view own links" ON pitch_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own links" ON pitch_links
  FOR ALL USING (auth.uid() = user_id);

-- Javni pristup profilima (za pitch preview stranicu)
CREATE POLICY "Public profiles viewable" ON profiles
  FOR SELECT USING (profile_url IS NOT NULL AND profile_url != '');

-- 4. Automatski updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pitch_links_updated_at
  BEFORE UPDATE ON pitch_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. View stats (views counter za pitch linkove)
CREATE TABLE IF NOT EXISTS link_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_link_id UUID REFERENCES pitch_links(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash TEXT,
  referrer TEXT,
  user_agent TEXT
);
