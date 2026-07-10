-- Public read-only sharing: a note can be exposed via an unguessable share_id.

alter table public.notes
  add column if not exists is_public boolean not null default false,
  add column if not exists share_id uuid not null default gen_random_uuid();

create unique index if not exists notes_share_id_idx on public.notes (share_id);

-- Anyone (including anonymous) may read notes that are marked public.
-- Combined with the owner policy via OR, owners still see all their notes.
grant select on public.notes to anon;

drop policy if exists "notes_select_public" on public.notes;
create policy "notes_select_public"
  on public.notes for select
  using (is_public = true);
