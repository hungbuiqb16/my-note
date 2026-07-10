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
  Italic,
  List,
  ListChecks,
  Pencil,
  Pin,
  Quote,
  SquareCode,
  Trash2,
} from 'lucide-react'
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
import { useNotes } from '@/store/notes'
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

  // Default to preview; a brand-new/empty note opens in write so you can type.
  const [mode, setMode] = useState<Mode>(() =>
    !note.title && !note.content ? 'write' : 'preview',
  )
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  // Selection to restore after a toolbar edit re-renders the textarea.
  const pendingSel = useRef<{ start: number; end: number } | null>(null)

  // Auto-grow the content area to fit its text.
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, window.innerHeight * 0.55)}px`
  }, [note.content, note.id, mode])

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
  }, [note.content])

  const applyAction = (action: FormatAction) => {
    const el = contentRef.current
    if (!el) return
    const res = applyFormat(
      action,
      note.content,
      el.selectionStart,
      el.selectionEnd,
    )
    pendingSel.current = { start: res.start, end: res.end }
    update({ content: res.value })
  }

  const handleToggleTask = (index: number) => {
    update({ content: toggleTaskAtIndex(note.content, index) })
  }

  const stats = useMemo(() => textStats(note.content), [note.content])

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
          className="flex items-center gap-1 text-sm font-medium text-primary md:hidden"
        >
          <ChevronLeft className="size-4" />
          Danh sách
        </button>
        <span className="hidden text-xs text-muted-foreground md:block">
          Cập nhật {timeAgo(note.updated)}
        </span>

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
      {mode === 'write' && (
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
              readOnly={mode === 'preview'}
            />
          </div>
          <div className="grad-divider my-6 h-px w-16 rounded-full" />
          {mode === 'write' ? (
            <textarea
              ref={contentRef}
              value={note.content}
              onChange={(e) => update({ content: e.target.value })}
              placeholder="Bắt đầu viết… (hỗ trợ Markdown)"
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
                content={note.content}
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
      </div>
    </main>
  )
}
