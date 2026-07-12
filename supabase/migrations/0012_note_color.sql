-- Per-note background color. Stores a short key (e.g. 'red', 'sky'); the UI
-- maps it to light/dark Tailwind classes. Empty string = default (card bg).

alter table public.notes
  add column if not exists color text not null default '';
