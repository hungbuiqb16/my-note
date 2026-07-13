import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Cloud,
  Hash,
  Lock,
  Moon,
  PenLine,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

/** Reveals its children (fade + slide up) the first time they scroll into view. */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      className={cn(
        'transition-all duration-700 ease-out',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

// Small highlight chips under the hero copy.
const MINI = [
  {
    icon: PenLine,
    title: 'Markdown',
    sub: 'Editor mạnh mẽ',
    color: 'bg-indigo-500/10 text-indigo-500',
  },
  {
    icon: ShieldCheck,
    title: 'Mã hóa E2E',
    sub: 'Riêng tư tuyệt đối',
    color: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    icon: Cloud,
    title: 'Realtime Sync',
    sub: 'Đồng bộ mọi nơi',
    color: 'bg-sky-500/10 text-sky-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    sub: 'Tối ưu mọi thiết bị',
    color: 'bg-amber-500/10 text-amber-500',
  },
]

const CHECKLIST = [
  'Markdown Editor',
  'Tag thông minh',
  'Đồng bộ thời gian thực',
  'Khóa ghi chú bằng mật khẩu',
  'Tạo liên kết chia sẻ ghi chú',
  'Hỗ trợ Import/Export ghi chú',
]

export function Features() {
  const { theme, toggle } = useTheme()

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Soft glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-brand-2/20 blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-80 -right-24 size-96 rounded-full bg-primary/20 blur-[90px]"
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-4 pb-6 md:pt-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to={ROUTES.home}
            className="flex items-center gap-2 font-display text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="grad-btn grid size-8 place-items-center rounded-lg text-white shadow-lift">
              <Sparkles className="size-4" />
            </span>
            <span>
              h<span className="grad-text">note</span>
            </span>
          </Link>
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

        {/* Hero */}
        <section className="mt-6 grid items-center gap-14 lg:mt-10 lg:grid-cols-2">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <Sparkles className="size-4" />
              Ghi chú nhanh, gọn, riêng tư
            </span>

            <h1 className="mt-6 font-display text-4xl leading-tight font-extrabold tracking-tight md:text-5xl">
              Mọi thứ bạn cần trong <span className="grad-text">hnote</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed font-medium text-muted-foreground">
              Ứng dụng ghi chú hiện đại với Markdown, đồng bộ thời gian thực, mã
              hóa đầu-cuối và trải nghiệm tối giản.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button
                asChild
                size="lg"
                className="btn-shine grad-btn h-auto rounded-xl px-8 py-4 text-base font-semibold text-white shadow-lift"
              >
                <Link to={ROUTES.app}>
                  <span className="animate-text-slide inline-flex items-center gap-1.5">
                    Tạo ghi chú đầu tiên
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {MINI.map(({ icon: Icon, title, sub, color }) => (
                <div key={title} className="flex items-center gap-3">
                  <div
                    className={`grid size-10 shrink-0 place-items-center rounded-lg shadow-sm ${color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="text-xs text-muted-foreground">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor-like note preview */}
          <div className="animate-in fade-in slide-in-from-bottom-4 delay-150 duration-700">
            <div className="animate-float rounded-3xl border border-black/5 bg-card p-6 shadow-lift md:p-8 dark:border-white/10">
              <h3 className="font-display text-2xl font-bold tracking-tight">
                💡 Ý tưởng startup
              </h3>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pr-1.5 pl-2 text-xs font-medium text-primary">
                hnote
                <span className="text-primary/60">×</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Hash className="size-3" />
                Thêm tag…
              </span>
            </div>
            <div className="grad-divider my-5 h-px w-16 rounded-full" />
            <ul className="space-y-3 text-sm">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="grid size-4 shrink-0 place-items-center rounded-[5px] bg-emerald-500 text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            </div>
          </div>
        </section>

        {/* Features — bento grid */}
        <section id="tinh-nang" className="mt-24 scroll-mt-8">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">
              Tất cả tính năng{' '}
              <span className="grad-text whitespace-nowrap">trong một nơi</span>
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {/* Tall gradient card */}
            <Reveal className="lg:row-span-2">
              <div className="grad-btn h-full rounded-3xl p-8 text-white shadow-lift transition-all hover:-translate-y-1">
                <div className="grid size-12 place-items-center rounded-2xl bg-white/15">
                  <PenLine className="size-6" />
                </div>
                <h3 className="mt-8 font-display text-xl font-bold">
                  Soạn thảo mạnh mẽ
                </h3>
                <p className="mt-4 leading-relaxed font-medium text-white/90">
                  Tạo và chỉnh sửa ghi chú với Markdown, xem trước trực tiếp, tự
                  động lưu, chèn ảnh, tô sáng cú pháp code, đếm từ và nhiều công
                  cụ hỗ trợ viết.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-3xl border border-black/5 bg-card p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift dark:border-white/10">
                <div className="grid size-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-500 shadow-sm">
                  <Search className="size-6" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold">
                  Quản lý thông minh
                </h3>
                <p className="mt-3 text-sm leading-relaxed font-medium text-muted-foreground">
                  Sắp xếp ghi chú bằng thẻ (Tags), tìm kiếm toàn văn, bộ lọc
                  nâng cao, ghim ghi chú, phân trang và thùng rác khôi phục
                  trong 30 ngày.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="rounded-3xl border border-black/5 bg-card p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift dark:border-white/10">
                <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-sm">
                  <Lock className="size-6" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold">
                  Bảo mật & Riêng tư
                </h3>
                <p className="mt-3 text-sm leading-relaxed font-medium text-muted-foreground">
                  Mã hóa đầu cuối (End-to-End Encryption) cho ghi chú quan
                  trọng, chia sẻ an toàn, mỗi người dùng chỉ truy cập được dữ
                  liệu của chính mình.
                </p>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-2" delay={300}>
              <div className="rounded-3xl border border-black/5 bg-card p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift dark:border-white/10">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <h3 className="font-display text-xl font-bold">
                      Đồng bộ mọi nơi
                    </h3>
                    <p className="mt-3 font-medium text-muted-foreground">
                      Đồng bộ thời gian thực trên nhiều thiết bị, hỗ trợ
                      Import/Export dữ liệu.
                    </p>
                  </div>
                  <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-500 shadow-sm">
                    <Cloud className="size-8" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-black/5 pt-8 text-center dark:border-white/10">
          <p className="font-display text-lg font-bold tracking-tight">
            h<span className="grad-text">note</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            © {new Date().getFullYear()} · Phát triển bởi{' '}
            <span className="grad-text font-semibold">Hùng Bùi</span> ⚡
          </p>
        </footer>
      </div>
    </div>
  )
}
