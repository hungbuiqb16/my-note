import { useEffect, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/common/Sidebar'
import { Editor } from '@/components/common/Editor'
import { EmptyState } from '@/components/common/EmptyState'
import { AllNotes } from '@/components/common/AllNotes'
import { useNotes } from '@/store/notes'
import { useTheme } from '@/hooks/useTheme'
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard'

type MobileView = 'list' | 'editor'
type Mode = 'editor' | 'all'

export function AppLayout() {
  const { theme, toggle } = useTheme()
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [mode, setMode] = useState<Mode>('editor')
  useUnsavedGuard()

  const currentId = useNotes((s) => s.currentId)
  const notes = useNotes((s) => s.notes)
  const create = useNotes((s) => s.create)
  const select = useNotes((s) => s.select)
  const load = useNotes((s) => s.load)
  const clear = useNotes((s) => s.clear)
  const currentNote = notes.find((n) => n.id === currentId) ?? null

  const handleCreate = () => {
    void create()
    setMode('editor')
    setMobileView('editor')
  }

  // Open a note in the editor (from the sidebar list or the grid).
  const openNote = () => {
    setMode('editor')
    setMobileView('editor')
  }

  const openFromGrid = (id: string) => {
    select(id)
    openNote()
  }

  const showAll = () => {
    setMode('all')
    setMobileView('editor') // use the main pane on mobile
  }

  // Load this user's notes on mount; clear them on logout (unmount).
  useEffect(() => {
    void load()
    return () => clear()
  }, [load, clear])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleCreate()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mainHidden = mobileView === 'list' ? 'hidden md:flex' : 'flex'

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden p-0 md:gap-4 md:p-4">
        <Sidebar
          className={mobileView === 'editor' ? 'hidden md:flex' : 'flex'}
          theme={theme}
          activeId={mode === 'all' ? null : currentId}
          onToggleTheme={toggle}
          onCreate={handleCreate}
          onOpenNote={openNote}
          onShowAll={showAll}
        />
        {mode === 'all' ? (
          <AllNotes
            className={mainHidden}
            onOpen={openFromGrid}
            onBack={() => setMobileView('list')}
          />
        ) : currentNote ? (
          <Editor
            key={currentNote.id}
            note={currentNote}
            className={mainHidden}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <EmptyState className="hidden flex-1 md:flex" />
        )}
      </div>
    </TooltipProvider>
  )
}
