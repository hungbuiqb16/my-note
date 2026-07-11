import { useEffect, useMemo, useRef } from 'react'
import { LayoutGrid, Moon, Plus, Search, Sparkles, Sun, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UserMenu } from '@/components/common/UserMenu'
import { selectAllTags, useNotes } from '@/store/notes'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
  theme: 'light' | 'dark'
  /** Whether the grid ("all notes") view is currently shown. */
  gridActive: boolean
  onToggleTheme: () => void
  onCreate: () => void
  /** Navigate to the notes grid (also used after picking a filter). */
  onShowAll: () => void
}

export function Sidebar({
  className,
  theme,
  gridActive,
  onToggleTheme,
  onCreate,
  onShowAll,
}: SidebarProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const notes = useNotes((s) => s.notes)
  const search = useNotes((s) => s.search)
  const setSearch = useNotes((s) => s.setSearch)
  const activeTag = useNotes((s) => s.activeTag)
  const setActiveTag = useNotes((s) => s.setActiveTag)
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

  // Setting a filter jumps to the grid so results are visible.
  const pickTag = (tag: string | null) => {
    setActiveTag(tag)
    onShowAll()
  }

  return (
    <aside
      className={cn(
        'glass flex h-full w-1/2 flex-shrink-0 flex-col border-r border-black/5 md:w-72 md:rounded-2xl md:border md:shadow-soft lg:w-80 dark:border-white/5',
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
              h<span className="grad-text">note</span>
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

        <div className="relative mt-3 hidden md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={onShowAll}
            placeholder="Tìm kiếm…"
            className="h-auto rounded-xl py-2.5 pr-14 pl-9"
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                searchRef.current?.focus()
              }}
              aria-label="Xóa tìm kiếm"
              className="absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-black/[.06] hover:text-foreground dark:hover:bg-white/[.08]"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 md:block">
              ⌘K
            </kbd>
          )}
        </div>
      </header>

      <nav className="flex-1 overflow-y-auto px-3">
        <button
          type="button"
          onClick={onShowAll}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            gridActive
              ? 'bg-primary/10 text-primary'
              : 'text-foreground hover:bg-black/[.04] dark:hover:bg-white/[.06]',
          )}
        >
          <LayoutGrid className="size-4" />
          Tất cả ghi chú
          <span className="ml-auto text-xs text-muted-foreground">
            {notes.length}
          </span>
        </button>

        {allTags.length > 0 && (
          <div className="mt-4">
            <p className="px-3 pb-1.5 text-xs font-medium text-muted-foreground">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5 px-2">
              {activeTag && (
                <button
                  type="button"
                  onClick={() => pickTag(null)}
                  className="rounded-full bg-black/[.05] px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground dark:bg-white/[.06]"
                >
                  Tất cả
                </button>
              )}
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => pickTag(activeTag === tag ? null : tag)}
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
          </div>
        )}
      </nav>

      <footer className="border-t border-black/5 px-3 py-2.5 dark:border-white/5">
        <UserMenu />
      </footer>
    </aside>
  )
}
