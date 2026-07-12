export type FormatAction =
  | 'bold'
  | 'italic'
  | 'inlineCode'
  | 'heading'
  | 'bulletList'
  | 'checklist'
  | 'quote'
  | 'codeBlock'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'

export interface FormatResult {
  value: string
  start: number
  end: number
}

function wrap(
  text: string,
  start: number,
  end: number,
  before: string,
  after = before,
): FormatResult {
  const selected = text.slice(start, end)
  const value =
    text.slice(0, start) + before + selected + after + text.slice(end)
  return { value, start: start + before.length, end: end + before.length }
}

// Add (or remove, if all already present) a line prefix across the selected lines.
function toggleLinePrefix(
  text: string,
  start: number,
  end: number,
  prefix: string,
): FormatResult {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  let lineEnd = text.indexOf('\n', end)
  if (lineEnd === -1) lineEnd = text.length

  const block = text.slice(lineStart, lineEnd)
  const lines = block.split('\n')
  const allHave = lines.every((l) => l.startsWith(prefix))
  const newLines = lines.map((l) =>
    allHave ? l.slice(prefix.length) : prefix + l,
  )
  const newBlock = newLines.join('\n')
  const value = text.slice(0, lineStart) + newBlock + text.slice(lineEnd)
  return { value, start: lineStart, end: lineStart + newBlock.length }
}

function codeBlock(text: string, start: number, end: number): FormatResult {
  const selected = text.slice(start, end) || 'code'
  const insert = '```\n' + selected + '\n```'
  const value = text.slice(0, start) + insert + text.slice(end)
  return { value, start: start + 4, end: start + 4 + selected.length }
}

/** Apply a Markdown formatting action to a text selection. */
export function applyFormat(
  action: FormatAction,
  text: string,
  start: number,
  end: number,
): FormatResult {
  switch (action) {
    case 'bold':
      return wrap(text, start, end, '**')
    case 'italic':
      return wrap(text, start, end, '_')
    case 'inlineCode':
      return wrap(text, start, end, '`')
    case 'heading':
      return toggleLinePrefix(text, start, end, '## ')
    case 'bulletList':
      return toggleLinePrefix(text, start, end, '- ')
    case 'checklist':
      return toggleLinePrefix(text, start, end, '- [ ] ')
    case 'quote':
      return toggleLinePrefix(text, start, end, '> ')
    case 'codeBlock':
      return codeBlock(text, start, end)
    // Alignment via a raw <div align="…"> (allowed by the sanitize schema).
    case 'alignLeft':
      return wrap(text, start, end, '<div align="left">', '</div>')
    case 'alignCenter':
      return wrap(text, start, end, '<div align="center">', '</div>')
    case 'alignRight':
      return wrap(text, start, end, '<div align="right">', '</div>')
    case 'alignJustify':
      return wrap(text, start, end, '<div align="justify">', '</div>')
  }
}

// Matches a GFM task-list marker at the start of a list item, e.g. "- [ ] ".
const TASK_RE = /^(\s*(?:[-*+]|\d+\.)\s+)\[([ xX])\]/gm

/** Toggle the checked state of the `index`-th task checkbox in the source. */
export function toggleTaskAtIndex(src: string, index: number): string {
  let i = -1
  return src.replace(TASK_RE, (match, lead: string, state: string) => {
    i += 1
    if (i !== index) return match
    return `${lead}[${state === ' ' ? 'x' : ' '}]`
  })
}
