-- Secure notes: content is encrypted client-side (AES-GCM). The DB only stores
-- ciphertext in `content`; this flag marks which notes are encrypted.

alter table public.notes
  add column if not exists is_encrypted boolean not null default false;
