// ============================================================
// P.A.T.C.H. SYSTEM — Optional Supabase Client
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function readEnvValue(key: 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'): string | undefined {
  const value = process.env[key];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const supabaseUrl = readEnvValue('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = readEnvValue('EXPO_PUBLIC_SUPABASE_ANON_KEY');

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}