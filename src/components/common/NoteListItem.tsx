import { Pin } from 'lucide-react'
import type { Note } from '@/types/note'
import { timeAgo } from '@/utils/time'
import { cn } from '@/lib/utils'

interface NoteListItemProps {
  note: Note
  active: boolean
  onClick: () => void
}

export function NoteListItem({ note, active, onClick }: NoteListItemProps) {
  const preview = note.content.split('\n')[0]
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className={cn(
        'note-item w-full rounded-xl px-4 py-3.5 text-left transition-colors',
        'hover:bg-black/[.03] focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-white/[.05]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            'min-w-0 truncate text-sm font-semibold',
            !note.title && 'font-normal text-muted-foreground italic',
          )}
        >
          {note.title || 'Chưa có tiêu đề'}
        </h3>
        {note.pinned && (
          <Pin className="mt-0.5 size-3 shrink-0 fill-primary text-primary" />
        )}
      </div>
      <p className="mt-1 truncate text-[13px] text-muted-foreground">
        {preview || 'Trống'}
      </p>
      {note.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
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
      <p className="mt-1.5 text-[11px] text-muted-foreground/70">
        {timeAgo(note.updated)}
      </p>
    </button>
  )
}
