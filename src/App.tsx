import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { ResetPassword } from '@/pages/ResetPassword'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/store/auth'
import { ROUTES } from '@/constants/routes'

// Lazy so the public share page (and markdown renderer) stay out of the main bundle.
const PublicNote = lazy(() =>
  import('@/pages/PublicNote').then((m) => ({ default: m.PublicNote })),
)

// Public "About" page listing every feature (no auth required).
const About = lazy(() =>
  import('@/pages/Features').then((m) => ({ default: m.Features })),
)

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function MainApp() {
  const ready = useAuth((s) => s.ready)
  const session = useAuth((s) => s.session)

  if (!ready) return <Splash />
  return session ? <AppLayout /> : <Login />
}

function App() {
  const init = useAuth((s) => s.init)
  const recovery = useAuth((s) => s.recovery)

  useEffect(() => init(), [init])

  return (
    <>
      <div className="mesh" />
      {/* A recovery link takes over the whole app until a new password is set. */}
      {recovery ? (
        <ResetPassword />
      ) : (
        <Suspense fallback={<Splash />}>
          <Routes>
            <Route path={ROUTES.home} element={<MainApp />} />
            <Route path={ROUTES.share} element={<PublicNote />} />
            <Route path={ROUTES.about} element={<About />} />
            {/* Unknown paths → back to the app root. */}
            <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
          </Routes>
        </Suspense>
      )}
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
