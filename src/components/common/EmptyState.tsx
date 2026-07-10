import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center border border-black/5 bg-card px-6 text-center md:rounded-2xl md:shadow-soft dark:border-white/5',
        className,
      )}
    >
      <div className="grad-btn mb-4 grid size-14 place-items-center rounded-2xl text-white shadow-lift">
        <Sparkles className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground">
        Chọn một ghi chú, hoặc tạo mới để bắt đầu.
      </p>
    </div>
  )
}
