import { useMemo } from 'react'
import { ChevronLeft, Pin } from 'lucide-react'
import { selectVisibleNotes, useNotes } from '@/store/notes'
import { timeAgo } from '@/utils/time'
import { cn } from '@/lib/utils'

interface AllNotesProps {
  className?: string
  onOpen: (id: string) => void
  onBack: () => void
}

export function AllNotes({ className, onOpen, onBack }: AllNotesProps) {
  const notes = useNotes((s) => s.notes)
  const search = useNotes((s) => s.search)
  const activeTag = useNotes((s) => s.activeTag)
  const visible = useMemo(
    () => selectVisibleNotes(notes, search, activeTag),
    [notes, search, activeTag],
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
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-primary md:hidden"
        >
          <ChevronLeft className="size-4" />
          Danh sách
        </button>
        <h2 className="font-display text-lg font-bold tracking-tight">
          Tất cả ghi chú
        </h2>
        <span className="text-xs text-muted-foreground">{visible.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Không có ghi chú nào.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => onOpen(note.id)}
                className="flex h-44 flex-col rounded-xl border border-black/5 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[.03]"
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
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
