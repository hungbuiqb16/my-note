/**
 * Centralized route paths. Keep these in sync with the <Routes> in `App.tsx`;
 * import them instead of hardcoding path strings across the app.
 */
export const ROUTES = {
  /** Public landing / about page. */
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  /** The authenticated notes app. */
  app: '/app',
  /** Route pattern for the public share page (param: `shareId`). */
  share: '/share/:shareId',
} as const

/** Build the path to a note's public share page. */
export function sharePath(shareId: string): string {
  return `/share/${shareId}`
}
