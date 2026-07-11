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

/** Shown after clicking a password-recovery email link (auth.recovery === true). */
export function ResetPassword() {
  const { theme, toggle } = useTheme()
  const updatePassword = useAuth((s) => s.updatePassword)
  const endRecovery = useAuth((s) => s.endRecovery)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự')
      return
    }
    if (password !== confirm) {
      toast.error('Mật khẩu nhập lại không khớp')
      return
    }
    setSaving(true)
    try {
      await updatePassword(password)
      toast.success('Đã đặt lại mật khẩu')
      endRecovery() // drops into the app with the (now recovered) session
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra')
      setSaving(false)
    }
  }

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
          <CardTitle className="text-lg">Đặt lại mật khẩu</CardTitle>
          <CardDescription>
            Nhập mật khẩu mới cho tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                >
                  {show ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
              <Input
                id="confirmPassword"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="grad-btn h-auto w-full rounded-xl py-2.5 font-semibold text-white shadow-lift"
            >
              {saving ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={endRecovery}
              className="font-medium text-primary hover:underline"
            >
              Để sau
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
