import { useState } from 'react'
import { Hash, X } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  /** Existing tags (across all notes) to suggest while typing. */
  suggestions?: string[]
  /** Display tags without the ability to add/edit/remove. */
  readOnly?: boolean
}

function normalize(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-')
}

export function TagInput({
  tags,
  onChange,
  suggestions = [],
  readOnly = false,
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  if (readOnly) {
    if (tags.length === 0) return null
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {tag}
          </span>
        ))}
      </div>
    )
  }

  const addTag = (raw: string) => {
    const tag = normalize(raw)
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setDraft('')
  }

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag))

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  const q = draft.trim().toLowerCase()
  const matches = q
    ? suggestions
        .filter((t) => t.includes(q) && !tags.includes(t))
        .slice(0, 8)
    : []

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pr-1 pl-2 text-xs font-medium text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="grid size-4 place-items-center rounded-full hover:bg-primary/20"
            aria-label={`Xóa tag ${tag}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Hash className="size-3.5" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.toLowerCase())}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
          placeholder="Thêm tag…"
          className="w-24 bg-transparent text-xs placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </span>

      {matches.length > 0 && (
        <div className="absolute top-full left-0 z-10 mt-1 flex max-w-full flex-wrap gap-1 rounded-lg border border-black/10 bg-popover p-1.5 shadow-lift dark:border-white/10">
          {matches.map((tag) => (
            <button
              key={tag}
              type="button"
              // mousedown (not click) so the input doesn't blur-add the draft first
              onMouseDown={(e) => {
                e.preventDefault()
                addTag(tag)
              }}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
