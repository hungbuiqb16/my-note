import { useState } from 'react'
import { Hash, X } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

function normalize(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-')
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('')

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

  return (
    <div className="flex flex-wrap items-center gap-1.5">
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
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
          placeholder="Thêm tag…"
          className="w-24 bg-transparent text-xs placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </span>
    </div>
  )
}
