-- Add tags to notes. Stored as a text[] on the row (RLS already restricts access).

alter table public.notes
  add column if not exists tags text[] not null default '{}';

-- Speeds up "notes having tag X" lookups.
create index if not exists notes_tags_idx on public.notes using gin (tags);
