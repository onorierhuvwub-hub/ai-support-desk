import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Standard client for public operations (Browser & Client Components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side API routes (bypasses RLS when service role key is available)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
