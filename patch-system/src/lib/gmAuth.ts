// ============================================================
// P.A.T.C.H. SYSTEM — GM Sign-in (Supabase Auth)
// The GM role is tied to real accounts: a Supabase Auth user whose id is
// listed in the public.gm_admins table. Row-level security lets a signed-in
// user read only their own row, so the check below can only ever confirm the
// caller's own access. See docs/gm-access.md for the one-time setup.
// ============================================================
import { getSupabaseClient } from './supabase';

export type GmSignInResult = { ok: true } | { ok: false; error: string };

async function hasGmAccess(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('gm_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !error && Boolean(data);
}

export async function signInAsGm(email: string, password: string): Promise<GmSignInResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, error: 'GM SIGN-IN NEEDS THE SYNC SERVER' };

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) return { ok: false, error: 'ENTER YOUR GM EMAIL AND PASSWORD' };

  const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
  if (error || !data.user) {
    const offline = error && /fetch|network/i.test(error.message);
    return { ok: false, error: offline ? 'CAN’T REACH THE SIGN-IN SERVER — CHECK YOUR CONNECTION' : 'WRONG EMAIL OR PASSWORD' };
  }

  if (!(await hasGmAccess(data.user.id))) {
    await supabase.auth.signOut();
    return { ok: false, error: 'THIS ACCOUNT IS NOT AUTHORIZED AS GM' };
  }
  return { ok: true };
}

/** True when a saved sign-in still belongs to an authorized GM. */
export async function hasActiveGmSession(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  return userId ? hasGmAccess(userId) : false;
}

export async function signOutGm(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}
