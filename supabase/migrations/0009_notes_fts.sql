-- Full-text search over title + content (Postgres tsvector, 'simple' config
-- so it works for Vietnamese without English stemming).
-- Note: encrypted notes store ciphertext in `content`, so FTS effectively only
-- matches their (plaintext) title.

alter table public.notes
  add column if not exists fts tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(content, '')
    )
  ) stored;

create index if not exists notes_fts_idx on public.notes using gin (fts);
