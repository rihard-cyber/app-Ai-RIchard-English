import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Guard: prevent crash if env vars are missing during build
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env variables are missing. Auth features will be disabled.');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
