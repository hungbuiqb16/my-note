import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Bold,
  ChevronLeft,
  Code,
  Eye,
  Heading,
  Image as ImageIcon,
  Italic,
  List,
  ListChecks,
  Lock,
  Pencil,
  Pin,
  Quote,
  Share2,
  ShieldCheck,
  SquareCode,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { TagInput } from '@/components/common/TagInput'
import { ShareDialog } from '@/components/common/ShareDialog'
import { SecureDialog } from '@/components/common/SecureDialog'
import { selectAllTags, useNotes } from '@/store/notes'
import { useAuth } from '@/store/auth'
import { useVault } from '@/store/vault'
import { uploadNoteImage } from '@/services/storage'
import { timeAgo } from '@/utils/time'
import { textStats } from '@/utils/text'
import {
  applyFormat,
  toggleTaskAtIndex,
  type FormatAction,
} from '@/utils/markdown'
import { cn } from '@/lib/utils'
import type { Note } from '@/types/note'

// Loaded only when the preview is shown — keeps markdown + highlight.js
// out of the initial bundle.
const MarkdownPreview = lazy(() =>
  import('@/components/common/MarkdownPreview').then((m) => ({
    default: m.MarkdownPreview,
  })),
)

type Mode = 'write' | 'preview'

const FORMAT_BUTTONS: {
  action: FormatAction
  icon: typeof Bold
  label: string
}[] = [
  { action: 'heading', icon: Heading, label: 'Tiêu đề' },
  { action: 'bold', icon: Bold, label: 'Đậm' },
  { action: 'italic', icon: Italic, label: 'Nghiêng' },
  { action: 'bulletList', icon: List, label: 'Danh sách' },
  { action: 'checklist', icon: ListChecks, label: 'Checklist' },
  { action: 'quote', icon: Quote, label: 'Trích dẫn' },
  { action: 'inlineCode', icon: Code, label: 'Mã inline' },
  { action: 'codeBlock', icon: SquareCode, label: 'Khối mã' },
]

interface EditorProps {
  note: Note
  className?: string
  onBack: () => void
}

export function Editor({ note, className, onBack }: EditorProps) {
  const update = useNotes((s) => s.update)
  const remove = useNotes((s) => s.remove)
  const togglePin = useNotes((s) => s.togglePin)
  const setTags = useNotes((s) => s.setTags)
  const allNotes = useNotes((s) => s.notes)
  const tagSuggestions = useMemo(() => selectAllTags(allNotes), [allNotes])
  const userId = useAuth((s) => s.user?.id)
  const vaultKey = useVault((s) => s.key)
  const vaultEncrypt = useVault((s) => s.encrypt)
  const vaultDecrypt = useVault((s) => s.decrypt)

  // Default to preview; a brand-new/empty note opens in write so you can type.
  const [mode, setMode] = useState<Mode>(() =>
    !note.title && !note.content ? 'write' : 'preview',
  )
  const [shareOpen, setShareOpen] = useState(false)
  const [secureOpen, setSecureOpen] = useState(false)
  const [imgBusy, setImgBusy] = useState(false)
  // Decrypted content for a secure note (null = not yet decrypted).
  const [plain, setPlain] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  // Selection to restore after a toolbar edit re-renders the textarea.
  const pendingSel = useRef<{ start: number; end: number } | null>(null)
  const encTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const encrypted = note.isEncrypted
  const locked = encrypted && !vaultKey
  const decrypting = encrypted && !locked && plain === null
  // The plaintext the editor works on (decrypted for secure notes).
  const content = encrypted ? (plain ?? '') : note.content

  // Decrypt a secure note once the vault is unlocked.
  useEffect(() => {
    if (!encrypted || !vaultKey) return
    let alive = true
    void vaultDecrypt(note.content)
      .then((text) => alive && setPlain(text))
      .catch(() => alive && setPlain(null))
    return () => {
      alive = false
    }
    // note.content is intentionally excluded (edits are tracked via `plain`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encrypted, vaultKey, note.id, vaultDecrypt])

  // Cancel any pending encrypt when unmounting (e.g. switching notes).
  useEffect(() => () => clearTimeout(encTimer.current), [])

  // Persist a content change: plaintext directly, or debounced-encrypt if secure.
  const writeContent = (next: string) => {
    if (!encrypted) {
      update({ content: next })
      return
    }
    setPlain(next)
    clearTimeout(encTimer.current)
    encTimer.current = setTimeout(() => {
      void vaultEncrypt(next)
        .then((cipher) => update({ content: cipher }))
        .catch(() => toast.error('Không mã hóa được nội dung'))
    }, 300)
  }

  // Auto-grow the content area to fit its text.
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, window.innerHeight * 0.55)}px`
  }, [content, note.id, mode])

  // Focus the title when opening a brand-new (empty) note.
  useEffect(() => {
    if (mode === 'write' && !note.title && !note.content)
      titleRef.current?.focus()
  }, [note.id, note.title, note.content, mode])

  // Restore caret/selection after a toolbar formatting action.
  useEffect(() => {
    const sel = pendingSel.current
    if (!sel) return
    pendingSel.current = null
    const el = contentRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(sel.start, sel.end)
  }, [content])

  const applyAction = (action: FormatAction) => {
    const el = contentRef.current
    if (!el) return
    const res = applyFormat(action, content, el.selectionStart, el.selectionEnd)
    pendingSel.current = { start: res.start, end: res.end }
    writeContent(res.value)
  }

  const handleToggleTask = (index: number) => {
    writeContent(toggleTaskAtIndex(content, index))
  }

  // Insert text at the caret and place the caret `caretOffset` chars in.
  const insertAtCursor = (text: string, caretOffset = text.length) => {
    const el = contentRef.current
    const start = el ? el.selectionStart : content.length
    const end = el ? el.selectionEnd : content.length
    const value = content.slice(0, start) + text + content.slice(end)
    const caret = start + caretOffset
    pendingSel.current = { start: caret, end: caret }
    writeContent(value)
  }

  const insertImages = async (files: FileList | null) => {
    const file = files
      ? Array.from(files).find((f) => f.type.startsWith('image/'))
      : undefined
    if (!file || !userId) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB')
      return
    }
    setImgBusy(true)
    try {
      const url = await uploadNoteImage(userId, file)
      insertAtCursor(`![](${url})`, 2) // caret inside the [] for alt text
      toast.success('Đã chèn ảnh')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được ảnh')
    } finally {
      setImgBusy(false)
    }
  }

  const stats = useMemo(() => textStats(content), [content])

  return (
    <main
      className={cn(
        'flex h-full flex-1 flex-col overflow-hidden border border-black/5 bg-card md:rounded-2xl md:shadow-soft dark:border-white/5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-black/5 px-4 py-3 md:px-8 dark:border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ChevronLeft className="size-4" />
          Tất cả ghi chú
        </button>

        <div className="flex items-center gap-1.5">
          {/* Write / Preview toggle */}
          <div className="flex rounded-lg bg-muted p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode('write')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 transition-colors',
                mode === 'write'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">Soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 transition-colors',
                mode === 'preview'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Xem trước</span>
            </button>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSecureOpen(true)}
                className={cn(
                  'rounded-xl text-muted-foreground',
                  encrypted && 'text-primary',
                )}
              >
                {encrypted ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <Lock className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {encrypted ? 'Ghi chú bảo mật' : 'Bảo mật ghi chú'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (encrypted) {
                    toast.error('Không thể chia sẻ ghi chú đã mã hóa')
                    return
                  }
                  setShareOpen(true)
                }}
                className={cn(
                  'rounded-xl text-muted-foreground',
                  note.isPublic && 'text-primary',
                  encrypted && 'opacity-40',
                )}
              >
                <Share2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {encrypted
                ? 'Ghi chú mã hóa không thể chia sẻ'
                : note.isPublic
                  ? 'Đang chia sẻ công khai'
                  : 'Chia sẻ'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePin(note.id)}
                className={cn(
                  'rounded-xl text-muted-foreground',
                  note.pinned && 'text-primary',
                )}
              >
                <Pin className={cn('size-4', note.pinned && 'fill-primary')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {note.pinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
            </TooltipContent>
          </Tooltip>

          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Xóa ghi chú</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa ghi chú?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ghi chú “{note.title || 'Chưa có tiêu đề'}” sẽ bị xóa vĩnh
                  viễn.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => remove(note.id)}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Markdown formatting toolbar (write mode only) */}
      {mode === 'write' && !locked && !decrypting && (
        <div className="flex items-center gap-0.5 overflow-x-auto border-b border-black/5 px-3 py-1.5 md:px-8 dark:border-white/5">
          {FORMAT_BUTTONS.map(({ action, icon: Icon, label }) => (
            <Tooltip key={action}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => applyAction(action)}
                  className="shrink-0 rounded-lg text-muted-foreground"
                >
                  <Icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}

          <span className="mx-1 h-4 w-px shrink-0 bg-border" />
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void insertImages(e.target.files)
              e.target.value = ''
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={imgBusy}
                onClick={() => imageRef.current?.click()}
                className="shrink-0 rounded-lg text-muted-foreground"
              >
                <ImageIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chèn ảnh (hoặc dán / kéo-thả)</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8 md:px-12 md:py-12">
          <input
            ref={titleRef}
            type="text"
            value={note.title}
            onChange={(e) => update({ title: e.target.value })}
            readOnly={mode === 'preview'}
            placeholder="Tiêu đề ghi chú…"
            className="w-full bg-transparent font-display text-3xl font-bold tracking-tight placeholder:text-muted-foreground/50 focus:outline-none md:text-4xl"
          />
          <div className="mt-4">
            <TagInput
              tags={note.tags}
              onChange={(tags) => setTags(note.id, tags)}
              suggestions={tagSuggestions}
              readOnly={mode === 'preview'}
            />
          </div>
          <div className="grad-divider my-6 h-px w-16 rounded-full" />
          {locked ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
              <ShieldCheck className="size-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                Ghi chú này được mã hóa. Nhập mật khẩu bảo mật để xem.
              </p>
              <Button onClick={() => setSecureOpen(true)}>
                <Lock />
                Mở khóa
              </Button>
            </div>
          ) : decrypting ? (
            <div className="min-h-[40vh] text-sm text-muted-foreground">
              Đang giải mã…
            </div>
          ) : mode === 'write' ? (
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => writeContent(e.target.value)}
              onPaste={(e) => {
                if (
                  Array.from(e.clipboardData.files).some((f) =>
                    f.type.startsWith('image/'),
                  )
                ) {
                  e.preventDefault()
                  void insertImages(e.clipboardData.files)
                }
              }}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes('Files')) e.preventDefault()
              }}
              onDrop={(e) => {
                if (
                  Array.from(e.dataTransfer.files).some((f) =>
                    f.type.startsWith('image/'),
                  )
                ) {
                  e.preventDefault()
                  void insertImages(e.dataTransfer.files)
                }
              }}
              placeholder="Bắt đầu viết… (hỗ trợ Markdown, dán/kéo-thả ảnh)"
              className="min-h-[55vh] w-full resize-none bg-transparent font-mono text-[14px] leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none md:text-[15px]"
            />
          ) : (
            <Suspense
              fallback={
                <div className="min-h-[55vh] text-sm text-muted-foreground">
                  Đang tải…
                </div>
              }
            >
              <MarkdownPreview
                content={content}
                onToggleTask={handleToggleTask}
                className="min-h-[55vh]"
              />
            </Suspense>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-black/5 px-4 py-2 text-xs text-muted-foreground md:px-8 dark:border-white/5">
        <span>{stats.words} từ</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{stats.chars} ký tự</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{stats.readingMinutes} phút đọc</span>
        <span className="ml-auto">Cập nhật {timeAgo(note.updated)}</span>
      </div>

      <ShareDialog note={note} open={shareOpen} onOpenChange={setShareOpen} />
      <SecureDialog
        note={note}
        open={secureOpen}
        onOpenChange={setSecureOpen}
      />
    </main>
  )
}
