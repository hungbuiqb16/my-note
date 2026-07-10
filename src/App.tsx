import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/store/auth'

function App() {
  const ready = useAuth((s) => s.ready)
  const session = useAuth((s) => s.session)
  const init = useAuth((s) => s.init)

  useEffect(() => init(), [init])

  return (
    <>
      <div className="mesh" />
      {!ready ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : session ? (
        <AppLayout />
      ) : (
        <Login />
      )}
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
