import { useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  EllipsisVertical,
  Eraser,
  Menu,
  Pin,
  PinOff,
  Settings,
  Share2,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { selectVisibleNotes, useNotes } from '@/store/notes'
import { useAuth } from '@/store/auth'
import { exportNotes, importNotes } from '@/services/notes'
import { cleanupOrphanImages } from '@/services/storage'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { timeAgo } from '@/utils/time'
import { cn } from '@/lib/utils'
import type { Note } from '@/types/note'

const PAGE_SIZE = 12

interface AllNotesProps {
  className?: string
  onOpen: (id: string) => void
  onOpenSidebar: () => void
}

export function AllNotes({ className, onOpen, onOpenSidebar }: AllNotesProps) {
  const notes = useNotes((s) => s.notes)
  const search = useNotes((s) => s.search)
  const activeTag = useNotes((s) => s.activeTag)
  const togglePin = useNotes((s) => s.togglePin)
  const remove = useNotes((s) => s.remove)
  const loadNotes = useNotes((s) => s.load)
  const userId = useAuth((s) => s.user?.id)
  const visible = useMemo(
    () => selectVisibleNotes(notes, search, activeTag),
    [notes, search, activeTag],
  )

  const importRef = useRef<HTMLInputElement>(null)
  const [dataBusy, setDataBusy] = useState(false)

  const handleExport = async () => {
    setDataBusy(true)
    try {
      const rows = await exportNotes()
      const json = JSON.stringify(rows, null, 2)
      const filename = `hnote-export-${new Date().toISOString().slice(0, 10)}.json`

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
              { description: 'JSON', accept: { 'application/json': ['.json'] } },
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
      toast.error(err instanceof Error ? err.message : 'Không xuất được dữ liệu')
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
    toast.success('Đã xóa ghi chú')
    setDeleteTarget(null)
  }

  const [page, setPage] = useState(1)
  // Reset to page 1 when the filter changes (React's adjust-state-on-change
  // pattern using state, not a ref).
  const filterKey = `${search}::${activeTag ?? ''}`
  const [prevFilter, setPrevFilter] = useState(filterKey)
  if (prevFilter !== filterKey) {
    setPrevFilter(filterKey)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <main
      className={cn(
        'flex h-full flex-1 flex-col overflow-hidden border border-black/5 bg-card md:rounded-2xl md:shadow-soft dark:border-white/5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-black/5 px-4 py-3 md:px-8 dark:border-white/5">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Mở menu"
          className="text-muted-foreground md:hidden"
        >
          <Menu className="size-5" />
        </button>
        <h2 className="font-display text-lg font-bold tracking-tight">
          Tất cả ghi chú
        </h2>

        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImport}
        />
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
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExport}>
              <Download />
              Xuất dữ liệu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => importRef.current?.click()}>
              <Upload />
              Nhập dữ liệu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCleanup}>
              <Eraser />
              Dọn ảnh không dùng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Không có ghi chú nào.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((note) => (
              <div key={note.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onOpen(note.id)}
                  className="flex h-44 w-full flex-col rounded-xl border border-black/5 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[.03]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={cn(
                        'min-w-0 truncate font-semibold',
                        !note.title &&
                          'font-normal text-muted-foreground italic',
                      )}
                    >
                      {note.title || 'Chưa có tiêu đề'}
                    </h3>
                    {note.pinned && (
                      <Pin className="mt-0.5 size-3.5 shrink-0 fill-primary text-primary" />
                    )}
                  </div>
                  <p className="mt-1 line-clamp-3 flex-1 text-[13px] whitespace-pre-wrap text-muted-foreground">
                    {note.content || 'Trống'}
                  </p>
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
                        variant="secondary"
                        size="icon-sm"
                        className="rounded-lg shadow-sm"
                        aria-label="Tùy chọn"
                      >
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top">
                      <DropdownMenuItem onClick={() => togglePin(note.id)}>
                        {note.pinned ? <PinOff /> : <Pin />}
                        {note.pinned ? 'Bỏ ghim' : 'Ghim'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShareId(note.id)}>
                        <Share2 />
                        Chia sẻ
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(note)}
                      >
                        <Trash2 />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>

      {shareNote && (
        <ShareDialog
          note={shareNote}
          open={shareNote !== null}
          onOpenChange={(o) => !o && setShareId(null)}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ghi chú?</AlertDialogTitle>
            <AlertDialogDescription>
              Ghi chú “{deleteTarget?.title || 'Chưa có tiêu đề'}” sẽ bị xóa
              vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
