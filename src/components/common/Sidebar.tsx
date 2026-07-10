import { useEffect, useMemo, useRef } from 'react'
import { Moon, Plus, Search, Sparkles, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NoteListItem } from '@/components/common/NoteListItem'
import { UserMenu } from '@/components/common/UserMenu'
import { selectAllTags, selectVisibleNotes, useNotes } from '@/store/notes'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onCreate: () => void
  onOpenNote: () => void
}

export function Sidebar({
  className,
  theme,
  onToggleTheme,
  onCreate,
  onOpenNote,
}: SidebarProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const notes = useNotes((s) => s.notes)
  const currentId = useNotes((s) => s.currentId)
  const search = useNotes((s) => s.search)
  const setSearch = useNotes((s) => s.setSearch)
  const activeTag = useNotes((s) => s.activeTag)
  const setActiveTag = useNotes((s) => s.setActiveTag)
  const select = useNotes((s) => s.select)
  const visible = useMemo(
    () => selectVisibleNotes(notes, search, activeTag),
    [notes, search, activeTag],
  )
  const allTags = useMemo(() => selectAllTags(notes), [notes])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleSelect = (id: string) => {
    select(id)
    onOpenNote()
  }

  return (
    <aside
      className={cn(
        'glass flex h-full w-full flex-shrink-0 flex-col border-r border-black/5 md:w-80 md:rounded-2xl md:border md:shadow-soft lg:w-[22rem] dark:border-white/5',
        className,
      )}
    >
      <header className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <span className="grad-btn grid size-7 place-items-center rounded-lg text-white shadow-lift">
              <Sparkles className="size-4" />
            </span>
            <span>
              note<span className="grad-text">flow</span>
            </span>
          </h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                className="rounded-xl text-muted-foreground"
              >
                {theme === 'dark' ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Đổi giao diện sáng / tối</TooltipContent>
          </Tooltip>
        </div>

        <Button
          onClick={onCreate}
          className="grad-btn mt-4 h-auto w-full gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-lift"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
          Ghi chú mới
        </Button>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm…"
            className="h-auto rounded-xl py-2.5 pr-14 pl-9"
          />
          <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 md:block">
            ⌘K
          </kbd>
        </div>

        {allTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activeTag && (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="rounded-full bg-black/[.05] px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground dark:bg-white/[.06]"
              >
                Tất cả
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                  activeTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary hover:bg-primary/20',
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>

      <nav className="flex-1 overflow-x-hidden overflow-y-auto px-3 pb-3">
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Không tìm thấy kết quả nào.
          </p>
        ) : (
          <div className="space-y-1.5">
            {visible.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                active={note.id === currentId}
                onClick={() => handleSelect(note.id)}
              />
            ))}
          </div>
        )}
      </nav>

      <footer className="space-y-1 border-t border-black/5 px-3 py-2.5 dark:border-white/5">
        <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
          <span>{notes.length} ghi chú</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Đã lưu tự
            động
          </span>
        </div>
        <UserMenu />
      </footer>
    </aside>
  )
}
