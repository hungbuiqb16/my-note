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

const NOTE_IMAGE_BUCKET = 'note-images'

/** Upload an image embedded in a note; returns its public URL. */
export async function uploadNoteImage(
  userId: string,
  file: File,
): Promise<string> {
  const ext = (file.name.split('.').pop() ?? 'png')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const path = `${userId}/${crypto.randomUUID()}.${ext || 'png'}`
  const { error } = await supabase.storage
    .from(NOTE_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type })
  if (error) throw error

  const { data } = supabase.storage.from(NOTE_IMAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Delete images under the user's note-images folder that are no longer
 * referenced by any of their notes' content. Files created in the last
 * 5 minutes are skipped (may belong to a note not yet saved).
 * Returns the number of files removed.
 */
export async function cleanupOrphanImages(userId: string): Promise<number> {
  // 1. Collect referenced object paths from every note's content.
  const { data: notes, error } = await supabase
    .from('notes')
    .select('content')
    .eq('user_id', userId)
  if (error) throw error

  const referenced = new Set<string>()
  const re = new RegExp(`${NOTE_IMAGE_BUCKET}/([^)\\s"']+)`, 'g')
  for (const n of notes ?? []) {
    const content = (n as { content: string }).content ?? ''
    let match: RegExpExecArray | null
    while ((match = re.exec(content)) !== null) {
      referenced.add(decodeURIComponent(match[1].split('?')[0]))
    }
  }

  // 2. List the user's uploaded files.
  const { data: files, error: listErr } = await supabase.storage
    .from(NOTE_IMAGE_BUCKET)
    .list(userId, { limit: 1000 })
  if (listErr) throw listErr

  const cutoff = Date.now() - 5 * 60 * 1000
  const toDelete = (files ?? [])
    .filter((f) => !f.name.startsWith('.'))
    .filter((f) => {
      const created = f.created_at ? Date.parse(f.created_at) : 0
      return created < cutoff && !referenced.has(`${userId}/${f.name}`)
    })
    .map((f) => `${userId}/${f.name}`)

  if (toDelete.length === 0) return 0
  const { error: delErr } = await supabase.storage
    .from(NOTE_IMAGE_BUCKET)
    .remove(toDelete)
  if (delErr) throw delErr
  return toDelete.length
}
