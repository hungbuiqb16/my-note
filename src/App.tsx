import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/layouts/AppLayout'
import { Login, type AuthMode } from '@/pages/Login'
import { ResetPassword } from '@/pages/ResetPassword'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/store/auth'
import { ROUTES } from '@/constants/routes'

// Lazy so the public share page (and markdown renderer) stay out of the main bundle.
const PublicNote = lazy(() =>
  import('@/pages/PublicNote').then((m) => ({ default: m.PublicNote })),
)

// Public landing / about page (no auth required).
const Landing = lazy(() =>
  import('@/pages/Features').then((m) => ({ default: m.Features })),
)

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

// Auth screens: if already signed in, bounce to the app.
function AuthRoute({ mode }: { mode: AuthMode }) {
  const ready = useAuth((s) => s.ready)
  const session = useAuth((s) => s.session)
  if (!ready) return <Splash />
  return session ? <Navigate to={ROUTES.app} replace /> : <Login mode={mode} />
}

// The notes app: requires a session, else send to login.
function AppRoute() {
  const ready = useAuth((s) => s.ready)
  const session = useAuth((s) => s.session)
  if (!ready) return <Splash />
  return session ? <AppLayout /> : <Navigate to={ROUTES.login} replace />
}

function App() {
  const init = useAuth((s) => s.init)

  useEffect(() => init(), [init])

  return (
    <>
      <div className="mesh" />
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path={ROUTES.home} element={<Landing />} />
          <Route path={ROUTES.login} element={<AuthRoute mode="signin" />} />
          <Route path={ROUTES.register} element={<AuthRoute mode="signup" />} />
          <Route
            path={ROUTES.forgotPassword}
            element={<AuthRoute mode="reset" />}
          />
          <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
          <Route path={ROUTES.app} element={<AppRoute />} />
          <Route path={ROUTES.share} element={<PublicNote />} />
          {/* Unknown paths → back to the landing. */}
          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Routes>
      </Suspense>
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
