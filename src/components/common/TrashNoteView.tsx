import { lazy, Suspense, useState } from 'react'
import { ChevronLeft, Lock, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { timeAgo } from '@/utils/time'
import { cn } from '@/lib/utils'
import type { Note } from '@/types/note'

// Loaded only when a trashed note is opened — keeps the markdown renderer
// out of the initial bundle.
const MarkdownPreview = lazy(() =>
  import('@/components/common/MarkdownPreview').then((m) => ({
    default: m.MarkdownPreview,
  })),
)

const RETENTION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

function daysLeft(deletedAt: number) {
  const elapsed = (Date.now() - deletedAt) / DAY_MS
  return Math.max(0, Math.ceil(RETENTION_DAYS - elapsed))
}

interface TrashNoteViewProps {
  note: Note
  className?: string
  onBack: () => void
  onRestore: (id: string) => void
  onPurge: (id: string) => void
}

/** Full-page, read-only view of a note in the trash. */
export function TrashNoteView({
  note,
  className,
  onBack,
  onRestore,
  onPurge,
}: TrashNoteViewProps) {
  const [purgeOpen, setPurgeOpen] = useState(false)

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
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ChevronLeft className="size-4" />
          Quay lại thùng rác
        </button>

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRestore(note.id)}
                aria-label="Khôi phục"
                className="rounded-xl text-muted-foreground"
              >
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Khôi phục</TooltipContent>
          </Tooltip>

          <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Xóa vĩnh viễn"
                    className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Xóa vĩnh viễn</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa vĩnh viễn?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ghi chú “{note.title || 'Chưa có tiêu đề'}” sẽ bị xóa vĩnh
                  viễn, không thể khôi phục.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onPurge(note.id)}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Xóa vĩnh viễn
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8 md:px-12 md:py-12">
          <h1
            className={cn(
              'font-display text-3xl font-bold tracking-tight md:text-4xl',
              !note.title && 'text-muted-foreground/50 italic',
            )}
          >
            {note.title || 'Chưa có tiêu đề'}
          </h1>
          {note.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="grad-divider my-6 h-px w-16 rounded-full" />
          {note.isEncrypted ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground italic">
              <Lock className="size-4" /> Nội dung được mã hóa
            </p>
          ) : note.content ? (
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Đang tải…</p>
              }
            >
              <MarkdownPreview content={note.content} onToggleTask={() => {}} />
            </Suspense>
          ) : (
            <p className="text-sm text-muted-foreground italic">Trống</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-black/5 px-4 py-2 text-xs text-muted-foreground md:px-8 dark:border-white/5">
        {note.deletedAt && <span>Đã xóa {timeAgo(note.deletedAt)}</span>}
        <span className="ml-auto">
          Còn {note.deletedAt ? daysLeft(note.deletedAt) : RETENTION_DAYS} ngày
          trước khi xóa vĩnh viễn
        </span>
      </div>
    </main>
  )
}
