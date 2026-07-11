import { useState } from 'react'
import { Eye, EyeOff, Moon, Sparkles, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { VantaBackground } from '@/components/common/VantaBackground'

type Mode = 'signin' | 'signup' | 'reset'

// Google's multi-color "G" mark (not available in lucide).
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.85 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1a11 11 0 0 0-3.48 21.44c.55.1.75-.24.75-.53v-2.06c-3.06.66-3.71-1.3-3.71-1.3-.5-1.27-1.22-1.61-1.22-1.61-1-.68.07-.67.07-.67 1.1.08 1.69 1.14 1.69 1.14.98 1.68 2.58 1.2 3.21.92.1-.71.38-1.2.7-1.47-2.44-.28-5.01-1.22-5.01-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.51.22 2.63.11 2.91.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.03 5.42.39.34.74 1 .74 2.03v3.01c0 .29.2.64.76.53A11 11 0 0 0 12 1Z"
      />
    </svg>
  )
}

export function Login() {
  const { theme, toggle } = useTheme()
  const signIn = useAuth((s) => s.signIn)
  const signUp = useAuth((s) => s.signUp)
  const resetPassword = useAuth((s) => s.resetPassword)
  const signInWithProvider = useAuth((s) => s.signInWithProvider)

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(
    null,
  )

  const onOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    try {
      // Redirects away to the provider; on success the browser returns to the app.
      await signInWithProvider(provider)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể đăng nhập')
      setOauthLoading(null)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else if (mode === 'signup') {
        await signUp(email, password)
        toast.success('Đăng ký thành công. Kiểm tra email nếu cần xác nhận.')
      } else {
        await resetPassword(email)
        toast.success(
          'Nếu email đã đăng ký, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.',
        )
        setMode('signin')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (mode === 'signin' && /invalid login credentials/i.test(message)) {
        toast.error('Email hoặc mật khẩu không đúng')
      } else {
        toast.error(message || 'Có lỗi xảy ra')
      }
    } finally {
      setLoading(false)
    }
  }

  const title =
    mode === 'signin'
      ? 'Đăng nhập'
      : mode === 'signup'
        ? 'Tạo tài khoản'
        : 'Đặt lại mật khẩu'
  const description =
    mode === 'signin'
      ? 'Đăng nhập để xem ghi chú của bạn.'
      : mode === 'signup'
        ? 'Đăng ký để bắt đầu ghi chú.'
        : 'Nhập email để nhận liên kết đặt lại mật khẩu.'
  const submitLabel =
    mode === 'signin'
      ? 'Đăng nhập'
      : mode === 'signup'
        ? 'Đăng ký'
        : 'Gửi liên kết'

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <VantaBackground theme={theme} />
      <Card className="glass relative w-full max-w-sm border-black/5 shadow-lift dark:border-white/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Đổi giao diện sáng / tối"
          className="absolute top-3 right-3 rounded-xl text-muted-foreground"
        >
          {theme === 'dark' ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </Button>
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex items-center justify-center gap-2 font-display text-2xl font-bold tracking-tight">
            <span className="grad-btn grid size-8 place-items-center rounded-lg text-white shadow-lift">
              <Sparkles className="size-4" />
            </span>
            <span>
              h<span className="grad-text">note</span>
            </span>
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={
                      mode === 'signin' ? 'current-password' : 'new-password'
                    }
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="grad-btn h-auto w-full rounded-xl py-2.5 font-semibold text-white shadow-lift"
            >
              {loading ? 'Đang xử lý…' : submitLabel}
            </Button>
          </form>

          {mode !== 'reset' && (
            <>
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">hoặc</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={oauthLoading !== null}
                  onClick={() => onOAuth('google')}
                  className="h-auto rounded-xl py-2.5"
                >
                  <GoogleIcon className="size-4" />
                  {oauthLoading === 'google' ? 'Đang chuyển…' : 'Google'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={oauthLoading !== null}
                  onClick={() => onOAuth('github')}
                  className="h-auto rounded-xl py-2.5"
                >
                  <GithubIcon className="size-4" />
                  {oauthLoading === 'github' ? 'Đang chuyển…' : 'GitHub'}
                </Button>
              </div>
            </>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'reset' ? (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-medium text-primary hover:underline"
              >
                Quay lại đăng nhập
              </button>
            ) : (
              <>
                {mode === 'signin'
                  ? 'Chưa có tài khoản? '
                  : 'Đã có tài khoản? '}
                <button
                  type="button"
                  onClick={() =>
                    setMode(mode === 'signin' ? 'signup' : 'signin')
                  }
                  className="font-medium text-primary hover:underline"
                >
                  {mode === 'signin' ? 'Đăng ký' : 'Đăng nhập'}
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
