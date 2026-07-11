/** A note as used throughout the UI. */
export interface Note {
  id: string
  title: string
  content: string
  pinned: boolean
  tags: string[]
  /** Whether the note is shared publicly (read-only). */
  isPublic: boolean
  /** Unguessable id used in the public share URL. */
  shareId: string
  /** Whether `content` is client-side encrypted (ciphertext). */
  isEncrypted: boolean
  /** Last-update time in ms (derived from `updated_at`). */
  updated: number
  /** Time the note was moved to trash in ms (undefined for active notes). */
  deletedAt?: number
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
  is_public: boolean
  share_id: string
  is_encrypted: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}
