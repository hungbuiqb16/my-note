import { useEffect, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/common/Sidebar'
import { Editor } from '@/components/common/Editor'
import { AllNotes } from '@/components/common/AllNotes'
import { useNotes } from '@/store/notes'
import { useVault } from '@/store/vault'
import { useTheme } from '@/hooks/useTheme'
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard'

// On mobile only one pane is visible at a time.
type MobileView = 'sidebar' | 'main'
type Mode = 'all' | 'editor'

export function AppLayout() {
  const { theme, toggle } = useTheme()
  const [mobileView, setMobileView] = useState<MobileView>('main')
  const [mode, setMode] = useState<Mode>('all')
  useUnsavedGuard()

  const currentId = useNotes((s) => s.currentId)
  const notes = useNotes((s) => s.notes)
  const create = useNotes((s) => s.create)
  const select = useNotes((s) => s.select)
  const load = useNotes((s) => s.load)
  const clear = useNotes((s) => s.clear)
  const discardIfEmpty = useNotes((s) => s.discardIfEmpty)
  const loadVault = useVault((s) => s.loadMeta)
  const resetVault = useVault((s) => s.reset)
  const currentNote = notes.find((n) => n.id === currentId) ?? null

  const showingEditor = mode === 'editor' && currentNote !== null

  const handleCreate = () => {
    void create()
    setMode('editor')
    setMobileView('main')
  }

  const openNote = (id: string) => {
    select(id)
    setMode('editor')
    setMobileView('main')
  }

  const showGrid = () => {
    discardIfEmpty(currentId) // drop an untouched blank draft when leaving the editor
    setMode('all')
    setMobileView('main')
  }

  // Load this user's notes + vault metadata on mount; clear on logout (unmount).
  useEffect(() => {
    void load()
    void loadVault()
    return () => {
      clear()
      resetVault()
    }
  }, [load, clear, loadVault, resetVault])

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

  const mainClass = mobileView === 'main' ? 'flex' : 'hidden md:flex'

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden p-0 md:gap-4 md:p-4">
        <Sidebar
          className={mobileView === 'sidebar' ? 'flex' : 'hidden md:flex'}
          theme={theme}
          gridActive={!showingEditor}
          onToggleTheme={toggle}
          onCreate={handleCreate}
          onShowAll={showGrid}
        />
        {mode === 'editor' && currentNote ? (
          <Editor
            key={currentNote.id}
            note={currentNote}
            className={mainClass}
            onBack={showGrid}
          />
        ) : (
          <AllNotes
            className={mainClass}
            onOpen={openNote}
            onOpenSidebar={() => setMobileView('sidebar')}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
