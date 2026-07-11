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
    updated: Date.parse(row.updated_at),
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

/** Server-side full-text search (title + content) for the current user. */
export async function searchNotes(query: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .textSearch('fts', query, { type: 'websearch', config: 'simple' })
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as NoteRow[]).map(toNote)
}

/** All notes for the current user, pinned first then most-recent. */
export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
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

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
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
        ? it.tags.filter((t): t is string => typeof t === 'string')
        : [],
    }))
    .filter((r) => r.title.trim() !== '' || r.content.trim() !== '')

  if (rows.length === 0) return 0
  const { error } = await supabase.from('notes').insert(rows)
  if (error) throw error
  return rows.length
}

/** All raw note rows for the current user, for data export. */
export async function exportNotes(): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as NoteRow[]
}
