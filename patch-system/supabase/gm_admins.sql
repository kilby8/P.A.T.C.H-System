-- P.A.T.C.H. System — GM accounts
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- The app treats a signed-in user as GM only if their id is in this table.

create table if not exists public.gm_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.gm_admins enable row level security;

-- A signed-in user can see only their own row, so the app can check
-- "am I a GM?" and nothing else. No insert/update/delete policies: GMs are
-- added here in the dashboard, never from the app.
drop policy if exists "gm can read own row" on public.gm_admins;
create policy "gm can read own row"
  on public.gm_admins for select
  to authenticated
  using (user_id = auth.uid());

-- Make an existing account a GM (create the user first under
-- Authentication → Users → Add user). Change the email to add more GMs.
insert into public.gm_admins (user_id)
select id from auth.users where email = 'underthesunsolar24@gmail.com'
on conflict (user_id) do nothing;
