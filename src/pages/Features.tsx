import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Cloud,
  Lock,
  Moon,
  NotebookPen,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

interface FeatureGroup {
  icon: typeof NotebookPen
  title: string
  desc: string
}

const GROUPS: FeatureGroup[] = [
  {
    icon: NotebookPen,
    title: 'Soạn thảo mạnh mẽ',
    desc: 'Tạo và chỉnh sửa ghi chú với Markdown, xem trước trực tiếp, tự động lưu, chèn ảnh, tô sáng cú pháp code, đếm từ và nhiều công cụ hỗ trợ viết.',
  },
  {
    icon: Search,
    title: 'Quản lý thông minh',
    desc: 'Sắp xếp ghi chú bằng thẻ (Tags), tìm kiếm toàn văn, bộ lọc nâng cao, ghim ghi chú, phân trang và thùng rác khôi phục trong 30 ngày.',
  },
  {
    icon: Lock,
    title: 'Bảo mật & Riêng tư',
    desc: 'Mã hóa đầu cuối (End-to-End Encryption) cho ghi chú quan trọng, chia sẻ an toàn, mỗi người dùng chỉ truy cập được dữ liệu của chính mình.',
  },
  {
    icon: Cloud,
    title: 'Đồng bộ mọi nơi',
    desc: 'Đồng bộ thời gian thực trên nhiều thiết bị, hỗ trợ Import/Export dữ liệu, giao diện responsive, chế độ sáng/tối và trải nghiệm mượt mà.',
  },
]

export function Features() {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 pt-4 pb-6 md:pt-5 md:pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="grad-btn grid size-7 place-items-center rounded-lg text-white shadow-lift">
              <Sparkles className="size-4" />
            </span>
            <span>
              h<span className="grad-text">note</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={toggle}
              aria-label="Đổi giao diện sáng / tối"
              className="rounded-xl text-muted-foreground [&_svg:not([class*='size-'])]:size-6"
            >
              {theme === 'dark' ? (
                <Moon className="size-6" />
              ) : (
                <Sun className="size-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Hero */}
        <header className="mx-auto mt-14 max-w-2xl text-center md:mt-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Ghi chú nhanh, gọn, riêng tư
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Mọi thứ <span className="grad-text">hnote</span> làm được
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Từ soạn thảo Markdown, mã hóa đầu-cuối đến đồng bộ thời gian thực —
            tất cả trong một ứng dụng ghi chú tối giản.
          </p>
          <Button
            asChild
            size="lg"
            className="grad-btn mt-7 h-auto rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lift"
          >
            <Link to="/">
              Sẵn sàng ghi lại ý tưởng đầu tiên
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </header>

        {/* Feature grid */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {GROUPS.map(({ icon: Icon, title, desc }) => (
            <section
              key={title}
              className="rounded-2xl border border-black/5 bg-card p-6 shadow-soft transition-all hover:-translate-y-[3px] hover:border-brand-2/60 hover:shadow-lift dark:border-white/10 dark:bg-white/[.03] dark:hover:border-brand-2/60"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-display text-lg font-bold tracking-tight">
                  {title}
                </h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-black/5 pt-8 text-center dark:border-white/10">
          <p className="font-display text-lg font-bold tracking-tight">
            h<span className="grad-text">note</span>
            <span className="mx-2 font-sans text-sm font-normal text-muted-foreground">
              Phiên bản 1.0.0
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Phát triển bởi{' '}
            <span className="grad-text font-semibold">Hùng Bùi </span>⚡
          </p>
        </footer>
      </div>
    </div>
  )
}
