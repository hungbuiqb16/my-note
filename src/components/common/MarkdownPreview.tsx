import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { cn } from '@/lib/utils'

// Allow a small, safe set of raw HTML (a `<div align="…">` for text alignment)
// while stripping anything dangerous (scripts, event handlers, etc.).
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), 'align'],
  },
}

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
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
          [rehypeHighlight, { ignoreMissing: true }],
        ]}
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
