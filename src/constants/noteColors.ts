/**
 * Note background palette. Each entry maps a stored `color` key to a Tailwind
 * class that works in both light and dark mode. Empty key = default card bg.
 */
export interface NoteColorOption {
  key: string
  label: string
  /** Background class applied to the note card / editor (both themes). */
  bg: string
}

export const NOTE_COLORS: NoteColorOption[] = [
  { key: '', label: 'Mặc định', bg: '' },
  { key: 'red', label: 'Đỏ', bg: 'bg-red-100 dark:bg-red-500/20' },
  { key: 'orange', label: 'Cam', bg: 'bg-orange-100 dark:bg-orange-500/20' },
  { key: 'amber', label: 'Vàng', bg: 'bg-amber-100 dark:bg-amber-500/20' },
  { key: 'green', label: 'Xanh lá', bg: 'bg-green-100 dark:bg-green-500/20' },
  { key: 'teal', label: 'Teal', bg: 'bg-teal-100 dark:bg-teal-500/20' },
  { key: 'sky', label: 'Xanh dương', bg: 'bg-sky-100 dark:bg-sky-500/20' },
  { key: 'violet', label: 'Tím', bg: 'bg-violet-100 dark:bg-violet-500/20' },
  { key: 'pink', label: 'Hồng', bg: 'bg-pink-100 dark:bg-pink-500/20' },
  { key: 'slate', label: 'Xám', bg: 'bg-slate-200 dark:bg-white/[.08]' },
]

/** Background class for a stored color key ('' or unknown → default). */
export function noteColorBg(key: string | undefined): string {
  return NOTE_COLORS.find((c) => c.key === key)?.bg ?? ''
}
