import { supabase } from '@/services/supabase'
import type { Note, NoteRow } from '@/types/note'

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    pinned: row.pinned,
    tags: row.tags ?? [],
    isPublic: row.is_public,
    shareId: row.share_id,
    isEncrypted: row.is_encrypted,
    created: Date.parse(row.created_at),
    updated: Date.parse(row.updated_at),
    deletedAt: row.deleted_at ? Date.parse(row.deleted_at) : undefined,
  }
}

/** Set a note's content + encrypted flag together (toggle secure). */
export async function setNoteEncryption(
  id: string,
  isEncrypted: boolean,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ is_encrypted: isEncrypted, content })
    .eq('id', id)
  if (error) throw error
}

/** Toggle a note's public (read-only share) state. */
export async function setNotePublic(
  id: string,
  isPublic: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ is_public: isPublic })
    .eq('id', id)
  if (error) throw error
}

export interface PublicNote {
  title: string
  content: string
  tags: string[]
  updated: number
}

/** Fetch a publicly-shared note by its share id (anonymous-readable via RLS). */
export async function fetchPublicNote(
  shareId: string,
): Promise<PublicNote | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('title, content, tags, updated_at')
    .eq('share_id', shareId)
    .eq('is_public', true)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    title: data.title,
    content: data.content,
    tags: data.tags ?? [],
    updated: Date.parse(data.updated_at),
  }
}

/** Map a raw DB row to a Note (used by realtime handlers). */
export { toNote as rowToNote }

/**
 * Server-side full-text search (title + content) for the current user.
 * Builds a prefix `to_tsquery` (each word gets `:*`) so partial words match —
 * e.g. "mark" finds "Markdown" without typing the whole word.
 */
export async function searchNotes(
  userId: string,
  query: string,
): Promise<Note[]> {
  const tsQuery = query
    .trim()
    .split(/\s+/)
    // Strip tsquery-special chars, keeping letters/numbers (incl. Vietnamese).
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .map((word) => `${word}:*`)
    .join(' & ')
  if (!tsQuery) return []

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    // No `type` → to_tsquery, which supports the `:*` prefix operator.
    .textSearch('fts', tsQuery, { config: 'simple' })
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as NoteRow[]).map(toNote)
}

/**
 * All notes for the current user, pinned first then most-recent.
 * Must filter by user_id: the public-share RLS policy would otherwise let
 * this read other users' public notes too.
 */
export async function fetchNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as NoteRow[]).map(toNote)
}

/** Number of notes currently in the trash for this user. */
export async function countTrash(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
  if (error) throw error
  return count ?? 0
}

/** Notes currently in the trash for this user, most-recently-deleted first. */
export async function fetchTrash(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw error
  return (data as NoteRow[]).map(toNote)
}

type NotePatch = Partial<Pick<Note, 'title' | 'content' | 'pinned' | 'tags'>>

/** Insert a note owned by the current user, optionally with initial fields. */
export async function createNote(
  userId: string,
  fields: NotePatch = {},
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: fields.title ?? '',
      content: fields.content ?? '',
      pinned: fields.pinned ?? false,
      tags: fields.tags ?? [],
    })
    .select('*')
    .single()
  if (error) throw error
  return toNote(data as NoteRow)
}

/** Persist a partial change; `updated_at` is bumped by a DB trigger. */
export async function updateNote(id: string, patch: NotePatch): Promise<void> {
  const { error } = await supabase.from('notes').update(patch).eq('id', id)
  if (error) throw error
}

/**
 * Move a note to the trash (soft delete). It stays recoverable for 30 days,
 * then a pg_cron job purges it. Public sharing is turned off so a trashed
 * note can't still be read via its share link.
 */
export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ deleted_at: new Date().toISOString(), is_public: false })
    .eq('id', id)
  if (error) throw error
}

/** Restore a trashed note back to the active list. */
export async function restoreNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) throw error
}

/** Permanently delete a note (hard delete) — used for purging the trash. */
export async function purgeNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

/** Permanently delete every trashed note for this user; returns the count. */
export async function emptyTrash(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .select('id')
  if (error) throw error
  return data?.length ?? 0
}

interface ImportItem {
  title?: unknown
  content?: unknown
  pinned?: unknown
  tags?: unknown
}

/**
 * Bulk-insert notes owned by the current user (from an export file).
 * Ignores ids/timestamps; skips items with no title and no content.
 * Returns the number of notes actually inserted.
 */
export async function importNotes(
  userId: string,
  items: ImportItem[],
): Promise<number> {
  const rows = items
    .map((it) => ({
      user_id: userId,
      title: typeof it.title === 'string' ? it.title : '',
      content: typeof it.content === 'string' ? it.content : '',
      pinned: Boolean(it.pinned),
      tags: Array.isArray(it.tags)
        ? [
            ...new Set(
              it.tags
                .filter((t): t is string => typeof t === 'string')
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean),
            ),
          ]
        : [],
    }))
    .filter((r) => r.title.trim() !== '' || r.content.trim() !== '')

  if (rows.length === 0) return 0
  const { error } = await supabase.from('notes').insert(rows)
  if (error) throw error
  return rows.length
}

/** All raw note rows for the current user, for data export. */
export async function exportNotes(userId: string): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as NoteRow[]
}
