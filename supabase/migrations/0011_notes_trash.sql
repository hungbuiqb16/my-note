-- Soft-delete ("Thùng rác"): notes are flagged with `deleted_at` instead of
-- being removed. They stay recoverable for 30 days, after which a daily
-- pg_cron job purges them permanently.

alter table public.notes
  add column if not exists deleted_at timestamptz;

-- Speeds up filtering active (deleted_at is null) vs. trashed notes.
create index if not exists notes_deleted_at_idx
  on public.notes (deleted_at);

-- Scheduled cleanup. pg_cron is a free Postgres extension available on all
-- Supabase plans; the job runs inside this database (no extra cost).
create extension if not exists pg_cron;

-- Re-running this migration is safe: cron.schedule upserts by job name.
select cron.schedule(
  'purge-trashed-notes',
  '0 3 * * *', -- 03:00 UTC daily
  $$
    delete from public.notes
    where deleted_at is not null
      and deleted_at < now() - interval '30 days'
  $$
);
