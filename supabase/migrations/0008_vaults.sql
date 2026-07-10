-- Per-user vault metadata for Secure Notes: KDF salt + a verifier (both
-- non-secret). The passphrase and derived key never leave the browser.

create table if not exists public.vaults (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  salt       text not null,
  verifier   text not null,
  created_at timestamptz not null default now()
);

alter table public.vaults enable row level security;

drop policy if exists "vaults_select_own" on public.vaults;
create policy "vaults_select_own"
  on public.vaults for select
  using (auth.uid() = user_id);

drop policy if exists "vaults_insert_own" on public.vaults;
create policy "vaults_insert_own"
  on public.vaults for insert
  with check (auth.uid() = user_id);

drop policy if exists "vaults_update_own" on public.vaults;
create policy "vaults_update_own"
  on public.vaults for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
