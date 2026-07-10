import { useEffect } from 'react'
import { hasPendingWrites, useNotes } from '@/store/notes'

/**
 * Protects unsaved (debounced) note edits when leaving the page:
 * - flushes pending writes when the tab is hidden or closing;
 * - warns with the browser's confirm dialog if writes are still in flight.
 */
export function useUnsavedGuard() {
  useEffect(() => {
    const flushAll = () => useNotes.getState().flushAll()

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushAll()
    }

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasPendingWrites()) return
      flushAll()
      e.preventDefault()
      e.returnValue = ''
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flushAll)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flushAll)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [])
}
