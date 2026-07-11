import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/store/auth'

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

  useEffect(() => init(), [init])

  return (
    <>
      <div className="mesh" />
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/share/:shareId" element={<PublicNote />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<MainApp />} />
        </Routes>
      </Suspense>
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
