import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const subscribeRealtime = useNotes((s) => s.subscribeRealtime)
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
    const unsubscribe = subscribeRealtime()
    return () => {
      unsubscribe()
      clear()
      resetVault()
    }
  }, [load, clear, loadVault, resetVault, subscribeRealtime])

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

  // Main is always visible; on mobile the sidebar floats over it as a drawer.
  const mainClass = 'flex'

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden p-0 md:gap-4 md:p-4">
        {/* Transparent backdrop: shows content behind, tap to close (mobile). */}
        {mobileView === 'sidebar' && (
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMobileView('main')}
            className="fixed inset-0 z-20 md:hidden"
          />
        )}
        <Sidebar
          className={cn(
            'fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-out md:static md:z-auto md:translate-x-0',
            // Opaque + elevated on mobile so the drawer reads clearly over content.
            'max-md:bg-card max-md:shadow-2xl',
            mobileView === 'sidebar' ? 'translate-x-0' : '-translate-x-full',
          )}
          theme={theme}
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

      {!showingEditor && mobileView === 'main' && (
        <button
          type="button"
          onClick={handleCreate}
          aria-label="Ghi chú mới"
          className="grad-btn fab fixed right-6 bottom-6 z-20 grid size-14 place-items-center rounded-full text-white"
        >
          <Plus className="fab-icon size-6" strokeWidth={2.5} />
        </button>
      )}
    </TooltipProvider>
  )
}
