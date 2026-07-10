-- Let a signed-in user delete their own account from the client.
-- The anon/authenticated roles cannot touch the `auth` schema directly, so we
-- expose a SECURITY DEFINER function that deletes only the caller's auth row.
-- Deleting auth.users cascades to public.notes (ON DELETE CASCADE).

create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Only logged-in users may call it (auth.uid() is null otherwise → no-op anyway).
revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
