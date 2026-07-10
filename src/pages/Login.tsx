import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
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

export function Login() {
  const signIn = useAuth((s) => s.signIn)
  const signUp = useAuth((s) => s.signUp)
  const resetPassword = useAuth((s) => s.resetPassword)

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
      <VantaBackground />
      <Card className="glass w-full max-w-sm border-black/5 shadow-lift dark:border-white/5">
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
                placeholder="Email đã đăng ký"
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
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="grad-btn h-auto w-full rounded-xl py-2.5 font-semibold text-white shadow-lift"
            >
              {loading ? 'Đang đăng nhập…' : submitLabel}
            </Button>
          </form>

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
