import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  EllipsisVertical,
  Eraser,
  Lock,
  Menu,
  NotebookPen,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { selectVisibleNotes, useNotes, type SortBy } from '@/store/notes'
import { useAuth } from '@/store/auth'
import {
  emptyTrash,
  exportNotes,
  fetchTrash,
  importNotes,
  purgeNote,
  restoreNote,
} from '@/services/notes'
import { cleanupOrphanImages } from '@/services/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ShareDialog } from '@/components/common/ShareDialog'
import { TrashNoteView } from '@/components/common/TrashNoteView'
import { Highlight } from '@/components/common/Highlight'
import { timeAgo } from '@/utils/time'
import { cn } from '@/lib/utils'
import type { Note } from '@/types/note'

const PAGE_SIZE = 12

interface AllNotesProps {
  className?: string
  onOpen: (id: string) => void
  onOpenSidebar: () => void
  onCreate: () => void
}

// Fraction of the card width to swipe (right) before it triggers delete.
const SWIPE_DELETE_THRESHOLD = 0.4

interface NoteCardProps {
  note: Note
  query: string
  onOpen: (id: string) => void
  onTogglePin: (id: string) => void
  onShare: (id: string) => void
  onRequestDelete: (note: Note) => void
  /** Immediate delete (no confirm) — used by swipe-to-delete. */
  onDelete: (note: Note) => void
}

function NoteCard({
  note,
  query,
  onOpen,
  onTogglePin,
  onShare,
  onRequestDelete,
  onDelete,
}: NoteCardProps) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const width = useRef(0)
  const moved = useRef(false)

  // Swipe-to-delete is touch-only (mobile).
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'touch') return
    startX.current = e.clientX
    width.current = e.currentTarget.offsetWidth
    moved.current = false
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return
    const delta = e.clientX - startX.current
    if (Math.abs(delta) > 6) moved.current = true
    setDx(Math.max(0, Math.min(delta, width.current)))
  }

  const endDrag = () => {
    if (!dragging) return
    setDragging(false)
    const past = dx > width.current * SWIPE_DELETE_THRESHOLD
    setDx(0)
    if (past) onDelete(note)
  }

  const handleClick = () => {
    if (moved.current) return // was a swipe, not a tap
    onOpen(note.id)
  }

  return (
    <div className="group relative">
      {dx > 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center gap-2 rounded-xl bg-destructive px-4 text-sm font-medium text-white">
          <Trash2 className="size-4" />
          Xóa
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          transform: dx > 0 ? `translateX(${dx}px)` : undefined,
          transition: dragging ? 'none' : undefined,
          touchAction: 'pan-y',
          background: dx > 0 ? 'var(--card)' : undefined,
        }}
        className="relative flex h-44 w-full flex-col rounded-xl border border-black/10 bg-card p-4 text-left shadow-soft transition-all select-none hover:-translate-y-[3px] hover:border-brand-2/60 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[.03] dark:hover:border-brand-2/60"
      >
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'min-w-0 truncate font-semibold',
              !note.title && 'font-normal text-muted-foreground italic',
            )}
          >
            {note.title ? (
              <Highlight text={note.title} query={query} />
            ) : (
              'Chưa có tiêu đề'
            )}
          </h3>
          <div className="mt-0.5 flex shrink-0 items-center gap-1">
            {note.isEncrypted && <Lock className="size-3.5 text-primary" />}
            {note.pinned && (
              <Pin className="size-3.5 fill-primary text-primary" />
            )}
          </div>
        </div>
        {note.isEncrypted ? (
          <p className="mt-1 flex flex-1 items-center gap-1.5 text-[13px] text-muted-foreground italic">
            <Lock className="size-3.5" /> Nội dung được mã hóa
          </p>
        ) : (
          <p className="mt-1 line-clamp-3 flex-1 text-[13px] whitespace-pre-wrap text-muted-foreground">
            {note.content ? (
              <Highlight text={note.content} query={query} />
            ) : (
              'Trống'
            )}
          </p>
        )}
        {note.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground/70">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          {timeAgo(note.updated)}
        </p>
      </button>

      <div className="absolute right-2 bottom-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-lg text-muted-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0"
              aria-label="Tùy chọn"
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top">
            <DropdownMenuItem onClick={() => onTogglePin(note.id)}>
              {note.pinned ? <PinOff /> : <Pin />}
              {note.pinned ? 'Bỏ ghim' : 'Ghim'}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={note.isEncrypted}
              onClick={() => onShare(note.id)}
            >
              <Share2 />
              Chia sẻ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onRequestDelete(note)}
            >
              <Trash2 />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

const RETENTION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

// Days left before a trashed note is purged automatically.
function daysLeft(deletedAt: number) {
  const elapsed = (Date.now() - deletedAt) / DAY_MS
  return Math.max(0, Math.ceil(RETENTION_DAYS - elapsed))
}

interface TrashCardProps {
  note: Note
  onOpen: (note: Note) => void
  onRestore: (id: string) => void
  onRequestPurge: (note: Note) => void
}

function TrashCard({ note, onOpen, onRestore, onRequestPurge }: TrashCardProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onOpen(note)}
        className="relative flex h-44 w-full flex-col rounded-xl border border-black/10 bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-[3px] hover:border-brand-2/60 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[.03] dark:hover:border-brand-2/60"
      >
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'min-w-0 truncate font-semibold',
              !note.title && 'font-normal text-muted-foreground italic',
            )}
          >
            {note.title || 'Chưa có tiêu đề'}
          </h3>
          {note.isEncrypted && (
            <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" />
          )}
        </div>
        {note.isEncrypted ? (
          <p className="mt-1 flex flex-1 items-center gap-1.5 text-[13px] text-muted-foreground italic">
            <Lock className="size-3.5" /> Nội dung được mã hóa
          </p>
        ) : (
          <p className="mt-1 line-clamp-3 flex-1 text-[13px] whitespace-pre-wrap text-muted-foreground">
            {note.content || 'Trống'}
          </p>
        )}
        <span className="mt-2 text-[11px] text-muted-foreground/70">
          Còn {note.deletedAt ? daysLeft(note.deletedAt) : RETENTION_DAYS} ngày
        </span>
      </button>

      <div className="absolute right-2 bottom-2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onRestore(note.id)}
          aria-label="Khôi phục"
          className="rounded-lg text-muted-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0"
        >
          <RotateCcw />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onRequestPurge(note)}
          aria-label="Xóa vĩnh viễn"
          className="rounded-lg text-muted-foreground shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:border-transparent focus-visible:ring-0"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}

export function AllNotes({
  className,
  onOpen,
  onOpenSidebar,
  onCreate,
}: AllNotesProps) {
  const notes = useNotes((s) => s.notes)
  const search = useNotes((s) => s.search)
  const setSearch = useNotes((s) => s.setSearch)
  const searchResults = useNotes((s) => s.searchResults)
  const searching = useNotes((s) => s.searching)
  const activeTag = useNotes((s) => s.activeTag)
  const trashView = useNotes((s) => s.trashView)
  const setTrashView = useNotes((s) => s.setTrashView)
  const trashCount = useNotes((s) => s.trashCount)
  const setTrashCount = useNotes((s) => s.setTrashCount)
  const bumpTrashCount = useNotes((s) => s.bumpTrashCount)
  const togglePin = useNotes((s) => s.togglePin)
  const remove = useNotes((s) => s.remove)
  const loadNotes = useNotes((s) => s.load)
  const userId = useAuth((s) => s.user?.id)
  const email = useAuth((s) => s.user?.email)

  // Sort & filter options for the active notes list.
  const [sortBy, setSortBy] = useState<SortBy>('updated')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [encryptedOnly, setEncryptedOnly] = useState(false)
  const filtersActive =
    sortBy !== 'updated' || pinnedOnly || encryptedOnly

  const isSearching = search.trim().length > 0
  const visible = useMemo(() => {
    // Base list: server search results when searching, else all notes.
    const list = isSearching ? (searchResults ?? []) : notes
    return selectVisibleNotes(list, activeTag, {
      sortBy,
      pinnedOnly,
      encryptedOnly,
    })
  }, [
    isSearching,
    searchResults,
    notes,
    activeTag,
    sortBy,
    pinnedOnly,
    encryptedOnly,
  ])

  const importRef = useRef<HTMLInputElement>(null)
  const [dataBusy, setDataBusy] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // Trash view (in the store so the logo / "Tất cả ghi chú" can exit it).
  // null items = still loading.
  const [trashItems, setTrashItems] = useState<Note[] | null>(null)
  const [purgeTarget, setPurgeTarget] = useState<Note | null>(null)
  const [emptyOpen, setEmptyOpen] = useState(false)
  // Read-only preview of a trashed note.
  const [previewNote, setPreviewNote] = useState<Note | null>(null)

  // Fetch the trash whenever we enter the trash view.
  useEffect(() => {
    if (!trashView || !userId) return
    let alive = true
    fetchTrash(userId)
      .then((rows) => alive && setTrashItems(rows))
      .catch(() => {
        if (!alive) return
        setTrashItems([])
        toast.error('Không tải được thùng rác')
      })
    return () => {
      alive = false
    }
  }, [trashView, userId])

  const closeTrash = () => {
    setTrashView(false)
    setTrashItems(null)
    setPreviewNote(null)
  }

  const handleRestore = async (id: string) => {
    setPreviewNote(null)
    try {
      await restoreNote(id)
      setTrashItems((xs) => (xs ?? []).filter((n) => n.id !== id))
      bumpTrashCount(-1)
      await loadNotes()
      toast.success('Đã khôi phục ghi chú')
    } catch {
      toast.error('Không khôi phục được ghi chú')
    }
  }

  const handlePurgeById = async (id: string) => {
    setPreviewNote(null)
    try {
      await purgeNote(id)
      setTrashItems((xs) => (xs ?? []).filter((n) => n.id !== id))
      bumpTrashCount(-1)
      toast.success('Đã xóa vĩnh viễn')
    } catch {
      toast.error('Không xóa được ghi chú')
    }
  }

  const confirmPurge = async () => {
    if (!purgeTarget) return
    await handlePurgeById(purgeTarget.id)
    setPurgeTarget(null)
  }

  const confirmEmpty = async () => {
    setEmptyOpen(false)
    if (!userId) return
    try {
      const n = await emptyTrash(userId)
      setTrashItems([])
      setTrashCount(0)
      toast.success(n > 0 ? `Đã xóa ${n} ghi chú` : 'Thùng rác trống')
    } catch {
      toast.error('Không dọn được thùng rác')
    }
  }

  const handleExport = async () => {
    if (!userId) return
    setDataBusy(true)
    try {
      const rows = await exportNotes(userId)
      const json = JSON.stringify(rows, null, 2)

      // Filename: hnote-export-{name}-YY-MM-DD-h-i-s
      const now = new Date()
      const p = (n: number) => String(n).padStart(2, '0')
      const stamp =
        `${p(now.getFullYear() % 100)}-${p(now.getMonth() + 1)}-${p(now.getDate())}` +
        `-${p(now.getHours())}-${p(now.getMinutes())}-${p(now.getSeconds())}`
      const name = email?.split('@')[0] ?? 'user'
      const filename = `hnote-export-${name}-${stamp}.json`

      const picker = (
        window as unknown as {
          showSaveFilePicker?: (options?: {
            suggestedName?: string
            types?: { description?: string; accept: Record<string, string[]> }[]
          }) => Promise<FileSystemFileHandle>
        }
      ).showSaveFilePicker

      if (picker) {
        // Native "Save As" dialog — lets the user choose where to save.
        let handle: FileSystemFileHandle
        try {
          handle = await picker({
            suggestedName: filename,
            types: [
              {
                description: 'JSON',
                accept: { 'application/json': ['.json'] },
              },
            ],
          })
        } catch (err) {
          // User cancelled the save dialog → do nothing.
          if (err instanceof DOMException && err.name === 'AbortError') return
          throw err
        }
        const writable = await handle.createWritable()
        await writable.write(json)
        await writable.close()
      } else {
        // Fallback: direct download (Firefox/Safari).
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success(`Đã xuất ${rows.length} ghi chú`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không xuất được dữ liệu',
      )
    } finally {
      setDataBusy(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !userId) return
    setDataBusy(true)
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!Array.isArray(parsed)) throw new Error('Tệp JSON không hợp lệ')
      const count = await importNotes(userId, parsed)
      await loadNotes()
      toast.success(
        count > 0 ? `Đã nhập ${count} ghi chú` : 'Không có ghi chú hợp lệ',
      )
    } catch (err) {
      toast.error(
        err instanceof SyntaxError
          ? 'Tệp JSON không hợp lệ'
          : err instanceof Error
            ? err.message
            : 'Không nhập được dữ liệu',
      )
    } finally {
      setDataBusy(false)
    }
  }

  const handleCleanup = async () => {
    if (!userId) return
    setDataBusy(true)
    try {
      const removed = await cleanupOrphanImages(userId)
      toast.success(
        removed > 0 ? `Đã xóa ${removed} ảnh không dùng` : 'Không có ảnh thừa',
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không dọn được ảnh')
    } finally {
      setDataBusy(false)
    }
  }

  const [shareId, setShareId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)
  // Live note (reflects store updates like toggling public).
  const shareNote = shareId
    ? (notes.find((n) => n.id === shareId) ?? null)
    : null

  const confirmDelete = () => {
    if (!deleteTarget) return
    void remove(deleteTarget.id)
    toast.success('Đã chuyển vào thùng rác')
    setDeleteTarget(null)
  }

  // Swipe-to-delete deletes immediately, without the confirm dialog.
  const handleSwipeDelete = (note: Note) => {
    void remove(note.id)
    toast.success('Đã chuyển vào thùng rác')
  }

  // The list currently shown: trashed notes in trash view, else active notes.
  const displayList = trashView ? (trashItems ?? []) : visible

  const [page, setPage] = useState(1)
  // Reset to page 1 when the filter (or view) changes (React's
  // adjust-state-on-change pattern using state, not a ref).
  const filterKey = `${trashView ? 'trash' : 'notes'}::${search}::${activeTag ?? ''}::${pinnedOnly}::${encryptedOnly}`
  const [prevFilter, setPrevFilter] = useState(filterKey)
  if (prevFilter !== filterKey) {
    setPrevFilter(filterKey)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(displayList.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = displayList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  // Full-page, read-only view when a trashed note is opened.
  if (trashView && previewNote) {
    return (
      <TrashNoteView
        note={previewNote}
        className={className}
        onBack={() => setPreviewNote(null)}
        onRestore={handleRestore}
        onPurge={handlePurgeById}
      />
    )
  }

  return (
    <main
      className={cn(
        'flex h-full flex-1 flex-col overflow-hidden border border-black/5 bg-card md:rounded-2xl md:shadow-soft dark:border-white/5',
        className,
      )}
    >
      <div className="relative flex items-center gap-2 border-b border-black/5 px-4 py-3 md:px-8 dark:border-white/5">
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImport}
        />

        {trashView ? (
          <>
            <button
              type="button"
              onClick={closeTrash}
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              <ChevronLeft className="size-4" />
              Tất cả ghi chú
            </button>
            <h2 className="pointer-events-none absolute inset-x-0 text-center font-display text-lg font-bold tracking-tight">
              Thùng rác
              <span className="ml-1.5 font-sans text-sm font-medium text-muted-foreground">
                ({trashItems?.length ?? 0})
              </span>
            </h2>
            <div className="ml-auto flex items-center gap-1">
              {trashItems && trashItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmptyOpen(true)}
                  className="rounded-xl text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Dọn sạch
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onOpenSidebar}
              aria-label="Mở menu"
              className="shrink-0 text-muted-foreground md:hidden"
            >
              <Menu className="size-5" />
            </button>

            {searchOpen ? (
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm…"
                  className="h-auto rounded-xl py-2 pr-9 pl-9"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setSearchOpen(false)
                  }}
                  aria-label="Đóng tìm kiếm"
                  className="absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-black/[.06] hover:text-foreground dark:hover:bg-white/[.08]"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <h2 className="pointer-events-none absolute inset-x-0 text-center font-display text-lg font-bold tracking-tight">
                Tất cả ghi chú
                <span className="ml-1.5 font-sans text-sm font-medium text-muted-foreground">
                  ({notes.length})
                </span>
              </h2>
            )}

            <div className="ml-auto flex items-center gap-1">
              {!searchOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Tìm kiếm"
                  className="rounded-xl text-muted-foreground md:hidden"
                >
                  <Search className="size-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Sắp xếp & lọc"
                    className={cn(
                      'rounded-xl text-muted-foreground',
                      filtersActive && 'text-primary',
                    )}
                  >
                    <SlidersHorizontal className="size-[18px]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-44 [&_[role=menuitemcheckbox]]:whitespace-nowrap [&_[role=menuitemradio]]:whitespace-nowrap"
                >
                  <DropdownMenuLabel>Sắp xếp theo</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as SortBy)}
                  >
                    <DropdownMenuRadioItem value="updated">
                      Ngày sửa
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created">
                      Ngày tạo
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="title">
                      Tên
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Lọc</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={pinnedOnly}
                    onCheckedChange={(c) => setPinnedOnly(c === true)}
                  >
                    Chỉ ghi chú ghim
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={encryptedOnly}
                    onCheckedChange={(c) => setEncryptedOnly(c === true)}
                  >
                    Chỉ đã mã hóa
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={dataBusy}
                    aria-label="Dữ liệu & cài đặt"
                    className="rounded-xl text-muted-foreground"
                  >
                    <Settings className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-44 [&_[role=menuitem]]:whitespace-nowrap"
                >
                  <DropdownMenuItem
                    disabled={notes.length === 0}
                    onClick={handleExport}
                  >
                    <Download />
                    Xuất dữ liệu
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => importRef.current?.click()}>
                    <Upload />
                    Nhập dữ liệu
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCleanup}>
                    <Eraser />
                    Xóa ảnh không dùng
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={trashCount === 0}
                    onClick={() => {
                      setPreviewNote(null)
                      setTrashItems(null)
                      setTrashView(true)
                    }}
                  >
                    <Trash2 />
                    Thùng rác
                    {trashCount > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {trashCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {trashView ? (
          trashItems === null ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Đang tải…
            </p>
          ) : trashItems.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Thùng rác trống.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((note) => (
                <TrashCard
                  key={note.id}
                  note={note}
                  onOpen={setPreviewNote}
                  onRestore={handleRestore}
                  onRequestPurge={setPurgeTarget}
                />
              ))}
            </div>
          )
        ) : isSearching && searching && searchResults === null ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Đang tìm kiếm…
          </p>
        ) : visible.length === 0 ? (
          !isSearching && notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <NotebookPen className="size-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold tracking-tight">
                  Chưa có ghi chú nào
                </h3>
                <p className="text-sm whitespace-nowrap text-muted-foreground">
                  Ghi lại ý tưởng, đoạn code, mật khẩu hoặc bất kỳ điều gì.
                </p>
              </div>
              <Button
                onClick={onCreate}
                className="grad-btn h-auto gap-2 rounded-xl py-2.5 font-semibold text-white shadow-lift"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Ghi chú đầu tiên
              </Button>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {isSearching
                ? 'Không tìm thấy kết quả nào.'
                : 'Không có ghi chú phù hợp.'}
            </p>
          )
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                query={search}
                onOpen={onOpen}
                onTogglePin={togglePin}
                onShare={setShareId}
                onRequestDelete={setDeleteTarget}
                onDelete={handleSwipeDelete}
              />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-black/10 bg-card/70 px-4 py-1.5 backdrop-blur-md dark:border-white/10">
          <Button
            variant="secondary"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            aria-label="Trang trước"
            className="size-8"
          >
            <ChevronLeft />
          </Button>
          <span className="text-xs text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
            aria-label="Trang sau"
            className="size-8"
          >
            <ChevronRight />
          </Button>
        </div>
      )}

      {shareNote && (
        <ShareDialog
          note={shareNote}
          open={shareNote !== null}
          onOpenChange={(o) => !o && setShareId(null)}
        />
      )}

      <AlertDialog
        open={purgeTarget !== null}
        onOpenChange={(o) => !o && setPurgeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn?</AlertDialogTitle>
            <AlertDialogDescription>
              Ghi chú “{purgeTarget?.title || 'Chưa có tiêu đề'}” sẽ bị xóa vĩnh
              viễn, không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPurge}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={emptyOpen}
        onOpenChange={(o) => !o && setEmptyOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dọn sạch thùng rác?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ {trashItems?.length ?? 0} ghi chú trong thùng rác sẽ bị
              xóa vĩnh viễn, không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEmpty}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ghi chú?</AlertDialogTitle>
            <AlertDialogDescription>
              Ghi chú “{deleteTarget?.title || 'Chưa có tiêu đề'}” sẽ được
              chuyển vào thùng rác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
