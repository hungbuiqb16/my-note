import { useState } from 'react'
import { Check, Copy, Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useNotes } from '@/store/notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Note } from '@/types/note'

interface ShareDialogProps {
  note: Note
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ note, open, onOpenChange }: ShareDialogProps) {
  const setPublic = useNotes((s) => s.setPublic)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = note.shareId
    ? `${window.location.origin}/share/${note.shareId}`
    : ''

  const toggle = async (value: boolean) => {
    setBusy(true)
    await setPublic(note.id, value)
    setBusy(false)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Đã sao chép liên kết')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Không sao chép được')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chia sẻ ghi chú</DialogTitle>
          <DialogDescription>
            Bất kỳ ai có liên kết đều xem được (chỉ đọc).
          </DialogDescription>
        </DialogHeader>

        {note.isPublic ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Globe className="size-4" />
              Đang chia sẻ công khai
            </div>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="flex-1" />
              <Button variant="secondary" onClick={copy}>
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              disabled={busy}
              onClick={() => toggle(false)}
            >
              <Lock />
              Thu hồi chia sẻ
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="size-4" />
              Ghi chú đang ở chế độ riêng tư.
            </div>
            <Button
              className="grad-btn w-full text-white"
              disabled={busy}
              onClick={() => toggle(true)}
            >
              <Globe />
              Tạo liên kết công khai
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
