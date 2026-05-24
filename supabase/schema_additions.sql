-- ============================================================
-- Preply schema additions — run this in the Supabase SQL editor
-- Safe to run multiple times (all use IF NOT EXISTS / IF NOT EXISTS checks)
-- ============================================================

-- 1. Add is_quick_add to recipes (used by Food Library quick-add feature)
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS is_quick_add boolean NOT NULL DEFAULT false;

-- 2. Add is_favorite to recipes
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- 3. Add onboarding + dietary fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text[] NOT NULL DEFAULT '{}';

-- macro_goals may already exist as jsonb from schema.sql; this is a no-op if so
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'macro_goals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN macro_goals jsonb;
  END IF;
END $$;

-- 4. food_database table (searched in the calendar's Food Library tab)
CREATE TABLE IF NOT EXISTS food_database (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  category     text NOT NULL,
  serving_label text NOT NULL DEFAULT '1 serving',
  calories     numeric NOT NULL DEFAULT 0,
  protein      numeric NOT NULL DEFAULT 0,
  carbs        numeric NOT NULL DEFAULT 0,
  fat          numeric NOT NULL DEFAULT 0,
  fiber        numeric NOT NULL DEFAULT 0
);

-- Full-text index for fast name searches
CREATE INDEX IF NOT EXISTS food_database_name_idx ON food_database (lower(name));

-- Anyone can read food_database (it's public reference data)
ALTER TABLE food_database ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'food_database' AND policyname = 'Anyone can read food database'
  ) THEN
    CREATE POLICY "Anyone can read food database" ON food_database FOR SELECT USING (true);
  END IF;
END $$;

-- 5. daily_logs table — water intake + future daily notes
CREATE TABLE IF NOT EXISTS daily_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date         date NOT NULL,
  water_glasses int NOT NULL DEFAULT 0,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_logs' AND policyname = 'Users manage own daily logs'
  ) THEN
    CREATE POLICY "Users manage own daily logs"
      ON daily_logs FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS daily_logs_user_date ON daily_logs (user_id, date);
