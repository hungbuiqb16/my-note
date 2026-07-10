export interface TextStats {
  words: number
  chars: number
  /** Estimated reading time in minutes (rounded up; 0 when empty). */
  readingMinutes: number
}

// Average adult reading speed (words per minute).
const WORDS_PER_MINUTE = 200

/** Word count, character count and reading time for a block of text. */
export function textStats(text: string): TextStats {
  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  return {
    words,
    chars: text.length,
    readingMinutes: words === 0 ? 0 : Math.ceil(words / WORDS_PER_MINUTE),
  }
}
