import { create } from 'zustand'
import { toast } from 'sonner'
import type { Note } from '@/types/note'
import { useAuth } from '@/store/auth'
import * as api from '@/services/notes'

interface NotesState {
  notes: Note[]
  currentId: string | null
  search: string
  activeTag: string | null
  loading: boolean
  setSearch: (search: string) => void
  setActiveTag: (tag: string | null) => void
  load: () => Promise<void>
  clear: () => void
  select: (id: string) => void
  create: () => void
  /** Drop the note if it's still empty (a draft vanishes; a saved note is deleted). */
  discardIfEmpty: (id: string | null) => void
  update: (patch: Partial<Pick<Note, 'title' | 'content'>>) => void
  setTags: (id: string, tags: string[]) => Promise<void>
  setPublic: (id: string, isPublic: boolean) => Promise<void>
  /** Toggle encryption, replacing content with ciphertext/plaintext. */
  applyEncryption: (
    id: string,
    isEncrypted: boolean,
    content: string,
  ) => Promise<void>
  remove: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  /** Persist a note's pending change immediately (skip the debounce). */
  flush: (id: string) => void
  /** Persist every pending change immediately. */
  flushAll: () => void
}

/** True while any debounced write or first-insert is still in flight. */
export function hasPendingWrites() {
  return saveTimers.size > 0 || inserting.size > 0
}

// Debounced writes, one timer per note id.
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()
// Draft ids whose first insert is in flight (guards against double-insert).
const inserting = new Set<string>()
const SAVE_DELAY = 600

function isEmpty(n: Note) {
  return !n.title.trim() && !n.content.trim()
}

// The DB row id: session-created notes keep a stable local id + a remoteId;
// loaded notes use their id directly.
function dbId(n: Note) {
  return n.remoteId ?? n.id
}

export const useNotes = create<NotesState>((set, get) => {
  function cancelTimer(id: string) {
    clearTimeout(saveTimers.get(id))
    saveTimers.delete(id)
  }

  // Persist a note: create it on first content, update it afterwards.
  // Empty notes are never written as records.
  function persist(id: string) {
    const note = get().notes.find((n) => n.id === id)
    if (!note || isEmpty(note)) return

    if (note.draft) {
      if (inserting.has(id)) return
      const userId = useAuth.getState().user?.id
      if (!userId) return
      inserting.add(id)
      void api
        .createNote(userId, {
          title: note.title,
          content: note.content,
          pinned: note.pinned,
          tags: note.tags,
        })
        .then((row) => {
          inserting.delete(id)
          // Keep the stable local id (so the editor doesn't remount and lose
          // focus); record the DB id and clear the draft flag. Any edits made
          // in-flight stay local and are flushed by the follow-up save.
          set((s) => ({
            notes: s.notes.map((n) =>
              n.id === id
                ? {
                    ...n,
                    remoteId: row.id,
                    draft: false,
                    shareId: row.shareId,
                    isPublic: row.isPublic,
                  }
                : n,
            ),
          }))
          scheduleSave(id)
        })
        .catch(() => {
          inserting.delete(id)
          toast.error('Không lưu được thay đổi')
        })
      return
    }

    void api
      .updateNote(dbId(note), { title: note.title, content: note.content })
      .catch(() => toast.error('Không lưu được thay đổi'))
  }

  function scheduleSave(id: string) {
    cancelTimer(id)
    saveTimers.set(
      id,
      setTimeout(() => {
        saveTimers.delete(id)
        persist(id)
      }, SAVE_DELAY),
    )
  }

  // Drop a note if it is still empty — a draft vanishes locally, a previously
  // saved note has its record deleted.
  function discardIfEmpty(id: string | null) {
    if (!id) return
    const note = get().notes.find((n) => n.id === id)
    if (!note || !isEmpty(note)) return
    cancelTimer(id)
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
    if (!note.draft) void api.deleteNote(dbId(note)).catch(() => {})
  }

  return {
    notes: [],
    currentId: null,
    search: '',
    activeTag: null,
    loading: false,

    setSearch: (search) => set({ search }),

    setActiveTag: (activeTag) => set({ activeTag }),

    load: async () => {
      set({ loading: true })
      try {
        const notes = await api.fetchNotes()
        set((s) => ({
          notes,
          loading: false,
          currentId: notes.some((n) => n.id === s.currentId)
            ? s.currentId
            : (notes[0]?.id ?? null),
        }))
      } catch {
        set({ loading: false })
        toast.error('Không tải được ghi chú')
      }
    },

    clear: () => {
      saveTimers.forEach((t) => clearTimeout(t))
      saveTimers.clear()
      inserting.clear()
      set({ notes: [], currentId: null, search: '', activeTag: null })
    },

    flush: (id) => {
      cancelTimer(id)
      persist(id)
    },

    flushAll: () => {
      for (const id of [...saveTimers.keys()]) {
        cancelTimer(id)
        persist(id)
      }
    },

    discardIfEmpty,

    select: (id) => {
      const prev = get().currentId
      if (prev && prev !== id) {
        discardIfEmpty(prev)
        // Only write the note we're leaving if it has an unsaved change —
        // otherwise switching notes would needlessly bump its updated_at.
        if (saveTimers.has(prev)) {
          cancelTimer(prev)
          persist(prev)
        }
      }
      set({ currentId: id })
    },

    create: () => {
      discardIfEmpty(get().currentId)
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `draft-${Date.now()}`
      const note: Note = {
        id,
        title: '',
        content: '',
        pinned: false,
        tags: [],
        isPublic: false,
        shareId: '',
        isEncrypted: false,
        updated: Date.now(),
        draft: true,
      }
      set((s) => ({ notes: [note, ...s.notes], currentId: id }))
    },

    update: (patch) => {
      const id = get().currentId
      if (!id) return
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === id ? { ...n, ...patch, updated: Date.now() } : n,
        ),
      }))
      scheduleSave(id)
    },

    setTags: async (id, tags) => {
      const note = get().notes.find((n) => n.id === id)
      if (!note) return
      const prev = note.tags
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === id ? { ...n, tags, updated: Date.now() } : n,
        ),
      }))
      if (note.draft) return // persisted when the note is first saved
      try {
        await api.updateNote(dbId(note), { tags })
      } catch {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, tags: prev } : n)),
        }))
        toast.error('Không cập nhật được tag')
      }
    },

    setPublic: async (id, isPublic) => {
      const note = get().notes.find((n) => n.id === id)
      if (!note) return
      if (note.draft) {
        toast.error('Hãy nhập nội dung để lưu ghi chú trước khi chia sẻ')
        return
      }
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? { ...n, isPublic } : n)),
      }))
      try {
        await api.setNotePublic(dbId(note), isPublic)
      } catch {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, isPublic: !isPublic } : n,
          ),
        }))
        toast.error('Không cập nhật được chia sẻ')
      }
    },

    applyEncryption: async (id, isEncrypted, content) => {
      const note = get().notes.find((n) => n.id === id)
      if (!note || note.draft) return
      cancelTimer(id) // avoid a plaintext autosave racing this write
      const prev = { content: note.content, isEncrypted: note.isEncrypted }
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === id ? { ...n, content, isEncrypted, updated: Date.now() } : n,
        ),
      }))
      try {
        await api.setNoteEncryption(dbId(note), isEncrypted, content)
        // An encrypted note must not stay publicly shared (would leak ciphertext).
        if (isEncrypted && note.isPublic) {
          await api.setNotePublic(dbId(note), false)
          set((s) => ({
            notes: s.notes.map((n) =>
              n.id === id ? { ...n, isPublic: false } : n,
            ),
          }))
        }
      } catch {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...prev } : n)),
        }))
        toast.error('Không cập nhật được bảo mật')
      }
    },

    remove: async (id) => {
      cancelTimer(id)
      const prev = get().notes
      const note = prev.find((n) => n.id === id)
      const notes = prev.filter((n) => n.id !== id)
      set((s) => ({
        notes,
        currentId: s.currentId === id ? (notes[0]?.id ?? null) : s.currentId,
      }))
      if (!note || note.draft) return // never existed in the DB
      try {
        await api.deleteNote(dbId(note))
      } catch {
        set({ notes: prev }) // rollback
        toast.error('Không xóa được ghi chú')
      }
    },

    togglePin: async (id) => {
      const note = get().notes.find((n) => n.id === id)
      if (!note) return
      const pinned = !note.pinned
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === id ? { ...n, pinned, updated: Date.now() } : n,
        ),
      }))
      if (note.draft) return // pin is persisted when the note is first saved
      try {
        await api.updateNote(dbId(note), { pinned })
      } catch {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, pinned: !pinned } : n,
          ),
        }))
        toast.error('Không cập nhật được ghim')
      }
    },
  }
})

/**
 * Notes filtered by `search` + `activeTag`, sorted pinned-first then by recency.
 * Pure helper — call it inside a `useMemo`, never as a Zustand selector
 * (it returns a fresh array, which would loop in useSyncExternalStore).
 */
export function selectVisibleNotes(
  notes: Note[],
  search: string,
  activeTag: string | null,
): Note[] {
  const q = search.toLowerCase().trim()
  return notes
    .filter((n) => !activeTag || n.tags.includes(activeTag))
    .filter(
      (n) =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q),
    )
    .sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.updated - a.updated,
    )
}

/** Unique tags across all notes, alphabetically sorted. */
export function selectAllTags(notes: Note[]): string[] {
  const set = new Set<string>()
  for (const n of notes) for (const t of n.tags) set.add(t)
  return [...set].sort((a, b) => a.localeCompare(b))
}
