import { supabase } from '@/services/supabase'

const AVATAR_BUCKET = 'avatars'

/**
 * Upload (or replace) the current user's avatar and return its public URL.
 * Stored at `avatars/<userId>/avatar`; a cache-busting query is appended so the
 * new image shows immediately.
 */
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<string> {
  const path = `${userId}/avatar`
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    })
  if (error) throw error

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
