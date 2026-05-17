-- RLS Policies untuk RichardMeha AI (Idempotent)
-- Aman dijalankan berulang kali tanpa error

-- 1. ENABLE RLS ON ALL TABLES (safe to run multiple times)
DO $$ BEGIN
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS lesson_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_key TEXT NOT NULL,
  module TEXT,
  topic TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_key)
);

DO $$ BEGIN
  ALTER TABLE lesson_sessions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN provider_order_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN updated_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. USER_PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
-- Profile updates are intentionally routed through SECURITY DEFINER RPCs below.
-- This prevents clients from changing sensitive columns such as is_pro.

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id AND COALESCE(is_pro, false) = false);

DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
CREATE POLICY "Users can delete own profile" ON user_profiles FOR DELETE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
CREATE POLICY "Admin can view all profiles" ON user_profiles FOR SELECT USING (auth.email() = 'richardpl.meha@gmail.com');

DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;
CREATE POLICY "Admin can update all profiles" ON user_profiles FOR UPDATE USING (auth.email() = 'richardpl.meha@gmail.com');

-- 3. USER_PROGRESS POLICIES
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own progress" ON user_progress;
CREATE POLICY "Users can delete own progress" ON user_progress FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can view all progress" ON user_progress;
CREATE POLICY "Admin can view all progress" ON user_progress FOR SELECT USING (auth.email() = 'richardpl.meha@gmail.com');

-- 3b. LESSON_SESSIONS POLICIES
DROP POLICY IF EXISTS "Users can manage own lesson sessions" ON lesson_sessions;
CREATE POLICY "Users can manage own lesson sessions" ON lesson_sessions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can view all lesson sessions" ON lesson_sessions;
CREATE POLICY "Admin can view all lesson sessions" ON lesson_sessions
FOR SELECT USING (auth.email() = 'richardpl.meha@gmail.com');

-- 4. TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own pending transactions" ON transactions;
CREATE POLICY "Users can create own pending transactions" ON transactions
FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admin can manage all transactions" ON transactions;
CREATE POLICY "Admin can manage all transactions" ON transactions FOR ALL USING (auth.email() = 'richardpl.meha@gmail.com');

-- 5. PAYMENT_METHODS POLICIES
DROP POLICY IF EXISTS "Admin can manage payment methods" ON payment_methods;
CREATE POLICY "Admin can manage payment methods" ON payment_methods FOR ALL USING (auth.email() = 'richardpl.meha@gmail.com');

DROP POLICY IF EXISTS "Authenticated users can view active payment methods" ON payment_methods;
CREATE POLICY "Authenticated users can view active payment methods" ON payment_methods
FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- 6. APP_SETTINGS POLICIES
DROP POLICY IF EXISTS "Admin can manage app settings" ON app_settings;
CREATE POLICY "Admin can manage app settings" ON app_settings FOR ALL USING (auth.email() = 'richardpl.meha@gmail.com');

DROP POLICY IF EXISTS "Authenticated users can read app settings" ON app_settings;
-- Never expose server-side AI keys to normal authenticated users.

-- 7. FUNCTION increment_xp
CREATE OR REPLACE FUNCTION increment_xp(user_id UUID, amount INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_id AND auth.email() <> 'richardpl.meha@gmail.com' THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF amount < 1 OR amount > 50 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;
  UPDATE user_profiles SET xp = COALESCE(xp, 0) + amount WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION complete_assessment(level_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET level = level_value,
      has_completed_initial_test = true
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION update_learning_level(level_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET level = level_value
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION reset_learning_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_progress WHERE user_id = auth.uid();
  UPDATE user_profiles
  SET xp = 0,
      level = 'Beginner (A1)',
      has_completed_initial_test = false,
      streak = 0
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION save_learning_progress(skill TEXT, score INT, details JSONB DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF score < 0 OR score > 100 THEN
    RAISE EXCEPTION 'Invalid score';
  END IF;

  INSERT INTO user_progress(user_id, skill_type, score, details)
  VALUES (auth.uid(), skill, score, COALESCE(details, '{}'::jsonb));

  UPDATE user_profiles
  SET xp = COALESCE(xp, 0) + 10
  WHERE id = auth.uid();
END;
$$;

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_created_at ON user_progress(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_order_id ON transactions(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_user_updated ON lesson_sessions(user_id, updated_at DESC);
