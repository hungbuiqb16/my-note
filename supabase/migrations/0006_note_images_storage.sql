-- Public "note-images" bucket for images embedded in notes.
-- Each user uploads under a folder named after their uid; everyone can read.

insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', true)
on conflict (id) do nothing;

drop policy if exists "note_images_public_read" on storage.objects;
create policy "note_images_public_read"
  on storage.objects for select
  using (bucket_id = 'note-images');

drop policy if exists "note_images_insert_own" on storage.objects;
create policy "note_images_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "note_images_delete_own" on storage.objects;
create policy "note_images_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
