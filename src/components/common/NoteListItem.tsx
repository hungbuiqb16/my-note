import { useRef, useState } from 'react'
import { Pin, Trash2 } from 'lucide-react'
import type { Note } from '@/types/note'
import { timeAgo } from '@/utils/time'
import { cn } from '@/lib/utils'

interface NoteListItemProps {
  note: Note
  active: boolean
  onClick: () => void
  onDelete: () => void
}

// Fraction of the item width the note must be dragged (right) to delete.
const DELETE_THRESHOLD = 0.45

export function NoteListItem({
  note,
  active,
  onClick,
  onDelete,
}: NoteListItemProps) {
  const preview = note.content.split('\n')[0]

  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const width = useRef(0)
  const moved = useRef(false)

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
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
    if (dx > width.current * DELETE_THRESHOLD) {
      setDx(width.current) // slide fully out, then remove
      window.setTimeout(onDelete, 160)
    } else {
      setDx(0)
    }
  }

  const handleClick = () => {
    if (moved.current) return // was a swipe, not a tap
    onClick()
  }

  return (
    <div className="relative">
      {/* Revealed only while swiping right */}
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
        data-active={active}
        style={{
          transform: `translateX(${dx}px)`,
          touchAction: 'pan-y',
          background: dx > 0 ? 'var(--card)' : undefined,
        }}
        className={cn(
          'note-item relative w-full touch-pan-y rounded-xl px-4 py-3.5 text-left select-none',
          dragging ? '' : 'transition-transform',
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
    </div>
  )
}
