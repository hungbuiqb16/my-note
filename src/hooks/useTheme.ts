import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'noteflow-theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark' // default interface
}

/**
 * Apply the stored/system theme to <html> immediately at startup so every
 * screen (login, splash, share) is themed before React mounts.
 */
export function initTheme(): void {
  document.documentElement.classList.toggle(
    'dark',
    getInitialTheme() === 'dark',
  )
}

/** Manages the `dark` class on <html>, persisting the choice to localStorage. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
