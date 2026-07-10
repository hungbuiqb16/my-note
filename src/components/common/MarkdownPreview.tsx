import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownPreviewProps {
  content: string
  /** Called with the source order index of the task checkbox that was clicked. */
  onToggleTask: (index: number) => void
  className?: string
}

export function MarkdownPreview({
  content,
  onToggleTask,
  className,
}: MarkdownPreviewProps) {
  // Task checkboxes render in source order; count them to map clicks back.
  const counter = { n: -1 }

  return (
    <div className={cn('md-preview prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          input: ({ type, checked }) => {
            if (type !== 'checkbox') return null
            const index = (counter.n += 1)
            return (
              <input
                type="checkbox"
                checked={Boolean(checked)}
                onChange={() => onToggleTask(index)}
              />
            )
          },
        }}
      >
        {content || '*Chưa có nội dung. Chuyển sang “Soạn thảo” để viết.*'}
      </ReactMarkdown>
    </div>
  )
}
