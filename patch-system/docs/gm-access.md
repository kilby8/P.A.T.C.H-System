# GM access

GM is a real sign-in: a Supabase Auth account (email + password) whose id is
listed in `public.gm_admins`. The old shared code (`PATCH-GM`) no longer works.

## One-time setup (Supabase dashboard)

1. **Authentication → Users → Add user → Create new user.** Enter the GM's
   email and a password, tick **Auto Confirm User**, then **Create user**.
2. **SQL Editor → New query**, paste `supabase/gm_admins.sql`, and **Run**.
   The last statement makes `carpenterjames88@gmail.com` a GM; change the
   email (and run just that `insert`) to add someone else.
3. Recommended: **Authentication → Sign In / Providers → Email**, turn off
   **Allow new users to sign up**. GMs are created by hand, so nobody needs to
   sign up from the app.

## Removing a GM

Delete their row in **Table Editor → gm_admins** (or delete the user under
Authentication → Users). Their next sign-in is refused, and a saved GM
sign-in is dropped the next time the app starts.

## What this protects

The GM console, and the GM-only actions in the store, now need a signed-in
account that is listed in `gm_admins`. Shared sessions still use public
Broadcast channels keyed by the session code, so anyone with the code and a
modified client could still send table state; locking that down would mean
private Realtime channels with row-level security, which is a bigger change.
