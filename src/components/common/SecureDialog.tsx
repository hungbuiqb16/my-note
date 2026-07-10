import { useState } from 'react'
import { Lock, LockOpen, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useVault } from '@/store/vault'
import { useNotes } from '@/store/notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Note } from '@/types/note'

interface SecureDialogProps {
  note: Note
  open: boolean
  onOpenChange: (open: boolean) => void
}

function errMsg(err: unknown) {
  return err instanceof Error ? err.message : 'Có lỗi xảy ra'
}

export function SecureDialog({ note, open, onOpenChange }: SecureDialogProps) {
  const key = useVault((s) => s.key)
  const hasVault = useVault((s) => s.hasVault)
  const setup = useVault((s) => s.setup)
  const unlock = useVault((s) => s.unlock)
  const encrypt = useVault((s) => s.encrypt)
  const decrypt = useVault((s) => s.decrypt)
  const applyEncryption = useNotes((s) => s.applyEncryption)

  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const vaultExists = hasVault()
  const unlocked = key !== null

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault()
    if (pass.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự')
    if (pass !== confirm) return toast.error('Mật khẩu nhập lại không khớp')
    void run(async () => {
      await setup(pass)
      await applyEncryption(note.id, true, await encrypt(note.content))
      toast.success('Đã bật bảo mật cho ghi chú')
      onOpenChange(false)
    })
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    void run(async () => {
      await unlock(pass)
      // Fulfil the intent: if opening on a not-yet-secure note, encrypt it now.
      if (!note.isEncrypted) {
        await applyEncryption(note.id, true, await encrypt(note.content))
        toast.success('Đã bật bảo mật cho ghi chú')
        onOpenChange(false)
      }
    })
  }

  const handleEncrypt = () =>
    void run(async () => {
      await applyEncryption(note.id, true, await encrypt(note.content))
      toast.success('Đã bật bảo mật cho ghi chú')
      onOpenChange(false)
    })

  const handleDecrypt = () =>
    void run(async () => {
      await applyEncryption(note.id, false, await decrypt(note.content))
      toast.success('Đã tắt bảo mật cho ghi chú')
      onOpenChange(false)
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Ghi chú bảo mật
          </DialogTitle>
          <DialogDescription>
            Nội dung được mã hóa trên máy bạn — máy chủ không đọc được.
          </DialogDescription>
        </DialogHeader>

        {note.draft ? (
          <p className="text-sm text-muted-foreground">
            Hãy nhập nội dung để lưu ghi chú trước khi bật bảo mật.
          </p>
        ) : !vaultExists ? (
          <form onSubmit={handleSetup} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tạo <b>mật khẩu bảo mật</b> (dùng chung cho mọi ghi chú mã hóa).
              Nếu quên, nội dung sẽ không thể khôi phục.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="vaultPass">Mật khẩu bảo mật</Label>
              <Input
                id="vaultPass"
                type="password"
                autoComplete="new-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vaultConfirm">Nhập lại</Label>
              <Input
                id="vaultConfirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              <Lock />
              Tạo & mã hóa
            </Button>
          </form>
        ) : !unlocked ? (
          <form onSubmit={handleUnlock} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {note.isEncrypted
                ? 'Nhập mật khẩu bảo mật để mở khóa.'
                : 'Bạn đã có mật khẩu bảo mật. Nhập để mã hóa ghi chú này.'}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="vaultUnlock">Mật khẩu bảo mật</Label>
              <Input
                id="vaultUnlock"
                type="password"
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              <LockOpen />
              Mở khóa
            </Button>
          </form>
        ) : note.isEncrypted ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ghi chú đang được mã hóa.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={handleDecrypt}
            >
              <LockOpen />
              Tắt bảo mật
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Mã hóa ghi chú này bằng mật khẩu bảo mật của bạn.
            </p>
            <Button className="w-full" disabled={busy} onClick={handleEncrypt}>
              <Lock />
              Mã hóa ghi chú
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
