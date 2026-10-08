// ============================================================
// P.A.T.C.H. SYSTEM — Optional Supabase Client
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

function readEnvValue(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (!value) continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return undefined;
}

// The project's public URL and publishable key. Both ship inside every
// client build (web and APK), so they are safe in source. Shared sessions use
// Realtime Broadcast only; there are no tables for this key to reach.
// Set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY to point a
// build at a different project.
const DEFAULT_SUPABASE_URL = 'https://ugnoysbrqxbwixeqqprr.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_2sMehP-zd2MmPKveKIQUcw_fvaWc9hS';

const supabaseUrl =
  readEnvValue(['EXPO_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) ?? DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  readEnvValue(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']) ??
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        // Keeps the GM signed in across app restarts (AsyncStorage is
        // localStorage on web).
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}