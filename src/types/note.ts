/** A note as used throughout the UI. */
export interface Note {
  id: string
  title: string
  content: string
  pinned: boolean
  tags: string[]
  /** Last-update time in ms (derived from `updated_at`). */
  updated: number
  /** Client-only: a new note not yet persisted (empty drafts are never saved). */
  draft?: boolean
  /** Client-only: DB row id once a draft is saved (the local `id` stays stable). */
  remoteId?: string
}

/** Raw row shape of the `notes` table in Supabase. */
export interface NoteRow {
  id: string
  user_id: string
  title: string
  content: string
  pinned: boolean
  tags: string[] | null
  created_at: string
  updated_at: string
}
