import { Fragment } from 'react'

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface HighlightProps {
  text: string
  query: string
}

/** Render `text` with occurrences of the query terms wrapped in <mark>. */
export function Highlight({ text, query }: HighlightProps) {
  const terms = query.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return <>{text}</>

  const lower = terms.map((t) => t.toLowerCase())
  const parts = text.split(
    new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi'),
  )

  return (
    <>
      {parts.map((part, i) =>
        lower.includes(part.toLowerCase()) ? (
          <mark
            key={i}
            className="rounded bg-primary/25 px-0.5 text-inherit dark:bg-primary/35"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
