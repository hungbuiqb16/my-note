import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Eye, Loader2, Sparkles } from 'lucide-react'
import {
  fetchPublicNote,
  type PublicNote as PublicNoteData,
} from '@/services/notes'
import { MarkdownPreview } from '@/components/common/MarkdownPreview'
import { timeAgo } from '@/utils/time'
import { ROUTES } from '@/constants/routes'

type Status = 'loading' | 'ready' | 'notfound'

export function PublicNote() {
  const { shareId } = useParams<{ shareId: string }>()
  const [status, setStatus] = useState<Status>('loading')
  const [note, setNote] = useState<PublicNoteData | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!shareId) {
        setStatus('notfound')
        return
      }
      try {
        const data = await fetchPublicNote(shareId)
        if (cancelled) return
        if (!data) {
          setStatus('notfound')
        } else {
          setNote(data)
          setStatus('ready')
        }
      } catch {
        if (!cancelled) setStatus('notfound')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [shareId])

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/5">
        <Link
          to={ROUTES.home}
          className="flex items-center gap-2 font-display text-lg font-bold tracking-tight"
        >
          <span className="grad-btn grid size-7 place-items-center rounded-lg text-white shadow-lift">
            <Sparkles className="size-4" />
          </span>
          <span>
            h<span className="grad-text">note</span>
          </span>
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Eye className="size-3.5" />
          Chỉ đọc
        </span>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 md:py-16">
        {status === 'loading' && (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === 'notfound' && (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold">Không tìm thấy ghi chú</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Liên kết không tồn tại hoặc đã bị thu hồi.
            </p>
            <Link
              to={ROUTES.home}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Về trang chủ
            </Link>
          </div>
        )}

        {status === 'ready' && note && (
          <>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {note.title || 'Chưa có tiêu đề'}
            </h1>
            {note.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Cập nhật {timeAgo(note.updated)}
            </p>
            <div className="grad-divider my-6 h-px w-16 rounded-full" />
            <MarkdownPreview content={note.content} onToggleTask={() => {}} />
          </>
        )}
      </main>
    </div>
  )
}
