import { useRef, useState } from 'react'
import { Download, LogOut, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
import { exportNotes } from '@/services/notes'
import { uploadAvatar } from '@/services/storage'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function errMsg(err: unknown) {
  return err instanceof Error ? err.message : 'Có lỗi xảy ra'
}

function displayName(email: string, meta?: string) {
  return meta || email.split('@')[0] || 'Người dùng'
}

function initialsOf(name: string) {
  return name
    .split(/[\s.]+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Read-only profile overview. */
export function ProfileDialog({ open, onOpenChange }: DialogProps) {
  const user = useAuth((s) => s.user)
  const email = user?.email ?? ''
  const name = displayName(email, user?.user_metadata?.full_name as string)
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const created = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('vi-VN')
    : '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hồ sơ của tôi</DialogTitle>
          <DialogDescription>Thông tin tài khoản của bạn.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="grad-btn text-lg font-semibold text-white">
              {initialsOf(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{name}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <Separator />

        <dl className="grid grid-cols-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="col-span-2 truncate">{email}</dd>
          <dt className="text-muted-foreground">Xác nhận</dt>
          <dd className="col-span-2">
            {user?.email_confirmed_at ? 'Đã xác nhận' : 'Chưa xác nhận'}
          </dd>
          <dt className="text-muted-foreground">Ngày tạo</dt>
          <dd className="col-span-2">{created}</dd>
        </dl>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Đóng</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Edit display name + avatar URL (stored in user_metadata). */
export function EditProfileDialog({ open, onOpenChange }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
          <DialogDescription>
            Cập nhật tên hiển thị và ảnh đại diện.
          </DialogDescription>
        </DialogHeader>
        {open && <EditProfileForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function EditProfileForm({ onDone }: { onDone: () => void }) {
  const user = useAuth((s) => s.user)
  const updateProfile = useAuth((s) => s.updateProfile)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState(
    () => (user?.user_metadata?.full_name as string) ?? '',
  )
  const [avatarUrl, setAvatarUrl] = useState(
    () => (user?.user_metadata?.avatar_url as string) ?? '',
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const email = user?.email ?? ''
  const previewName = displayName(email, fullName)

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp ảnh')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ảnh tối đa 2MB')
      return
    }
    setUploading(true)
    try {
      const url = await uploadAvatar(user.id, file)
      setAvatarUrl(url)
      toast.success('Đã tải ảnh lên. Bấm “Lưu” để áp dụng.')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim(),
      })
      toast.success('Đã cập nhật hồ sơ')
      onDone()
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={avatarUrl} alt={previewName} />
          <AvatarFallback className="grad-btn text-lg font-semibold text-white">
            {initialsOf(previewName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPickFile}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload />
            {uploading ? 'Đang tải…' : 'Tải ảnh lên'}
          </Button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl('')}
              className="text-left text-xs font-medium text-destructive hover:underline"
            >
              Xóa ảnh
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Tên hiển thị</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Tên của bạn"
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Hủy
          </Button>
        </DialogClose>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Change email and password. */
export function AccountSettingsDialog({ open, onOpenChange }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cài đặt tài khoản</DialogTitle>
          <DialogDescription>Đổi email hoặc mật khẩu.</DialogDescription>
        </DialogHeader>
        {open && <AccountSettingsForm />}
      </DialogContent>
    </Dialog>
  )
}

function AccountSettingsForm() {
  const user = useAuth((s) => s.user)
  const updateEmail = useAuth((s) => s.updateEmail)
  const updatePassword = useAuth((s) => s.updatePassword)

  const [email, setEmail] = useState(() => user?.email ?? '')
  const [savingEmail, setSavingEmail] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const onSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim() === user?.email) {
      toast.info('Email không thay đổi')
      return
    }
    setSavingEmail(true)
    try {
      await updateEmail(email.trim())
      toast.success('Đã gửi email xác nhận để đổi địa chỉ')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSavingEmail(false)
    }
  }

  const onSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự')
      return
    }
    if (password !== confirm) {
      toast.error('Mật khẩu nhập lại không khớp')
      return
    }
    setSavingPassword(true)
    try {
      await updatePassword(password)
      toast.success('Đã đổi mật khẩu')
      setPassword('')
      setConfirm('')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <form onSubmit={onSaveEmail} className="space-y-2">
        <Label htmlFor="accEmail">Email</Label>
        <div className="flex gap-2">
          <Input
            id="accEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={savingEmail}>
            {savingEmail ? 'Đang lưu…' : 'Đổi'}
          </Button>
        </div>
      </form>

      <Separator />

      <form onSubmit={onSavePassword} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? 'Đang lưu…' : 'Đổi mật khẩu'}
          </Button>
        </div>
      </form>
    </>
  )
}

/** Data export, global sign-out, and account deletion. */
export function PrivacyDialog({ open, onOpenChange }: DialogProps) {
  const signOutAll = useAuth((s) => s.signOutAll)
  const deleteAccount = useAuth((s) => s.deleteAccount)
  const [exporting, setExporting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const rows = await exportNotes()
      const blob = new Blob([JSON.stringify(rows, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `noteflow-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Đã xuất ${rows.length} ghi chú`)
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setExporting(false)
    }
  }

  const handleSignOutAll = async () => {
    setSigningOut(true)
    try {
      await signOutAll()
      // Session clears → app returns to the login screen automatically.
    } catch (err) {
      toast.error(errMsg(err))
      setSigningOut(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Đã xóa tài khoản')
    } catch (err) {
      toast.error(errMsg(err))
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quyền riêng tư</DialogTitle>
          <DialogDescription>
            Quản lý dữ liệu và tài khoản của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Xuất dữ liệu</p>
              <p className="text-xs text-muted-foreground">
                Tải toàn bộ ghi chú dưới dạng JSON.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download />
              {exporting ? 'Đang xuất…' : 'Tải xuống'}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Đăng xuất mọi thiết bị</p>
              <p className="text-xs text-muted-foreground">
                Thu hồi tất cả phiên đăng nhập.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleSignOutAll}
              disabled={signingOut}
            >
              <LogOut />
              {signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-destructive">
                Xóa tài khoản
              </p>
              <p className="text-xs text-muted-foreground">
                Xóa vĩnh viễn tài khoản và mọi ghi chú.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 />
                  {deleting ? 'Đang xóa…' : 'Xóa'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa tài khoản?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Toàn bộ ghi chú của bạn sẽ
                    bị xóa vĩnh viễn.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Xóa vĩnh viễn
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
