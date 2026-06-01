// ============================================================
// P.A.T.C.H. SYSTEM — Optional Supabase Client
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function readEnvValue(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (!value) continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return undefined;
}

const supabaseUrl = readEnvValue([
  'EXPO_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
]);
const supabaseAnonKey = readEnvValue([
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
]);

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