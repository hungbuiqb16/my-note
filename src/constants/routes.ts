/**
 * Centralized route paths. Keep these in sync with the <Routes> in `App.tsx`;
 * import them instead of hardcoding path strings across the app.
 */
export const ROUTES = {
  home: '/',
  about: '/about',
  /** Route pattern for the public share page (param: `shareId`). */
  share: '/share/:shareId',
} as const

/** Build the path to a note's public share page. */
export function sharePath(shareId: string): string {
  return `/share/${shareId}`
}
