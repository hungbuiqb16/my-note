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
  Trash2,
  UserRound,
} from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

interface FeatureGroup {
  icon: typeof NotebookPen
  title: string
  items: string[]
}

const GROUPS: FeatureGroup[] = [
  {
    icon: UserRound,
    title: 'Xác thực & Tài khoản',
    items: [
      'Đăng nhập bằng email + mật khẩu',
      'Đăng nhập OAuth Google / GitHub',
      'Quên mật khẩu qua email',
      'Đăng xuất mọi thiết bị',
      'Hồ sơ: tên hiển thị, ảnh đại diện, đổi email / mật khẩu',
      'Xóa tài khoản vĩnh viễn',
    ],
  },
  {
    icon: NotebookPen,
    title: 'Ghi chú & Soạn thảo',
    items: [
      'Tự động lưu, không lưu bản nháp trống',
      'Markdown + xem trước, thanh công cụ đầy đủ',
      'Syntax highlight cho khối code',
      'Đếm từ / ký tự / thời gian đọc',
      'Chèn ảnh (nút / dán / kéo-thả)',
      'Ghim ghi chú quan trọng',
    ],
  },
  {
    icon: Search,
    title: 'Tổ chức & Tìm kiếm',
    items: [
      'Tags + lọc theo tag, gợi ý tag đã có',
      'Tìm kiếm toàn văn + tô đậm từ khớp',
      'Sắp xếp: ngày sửa / ngày tạo / tên',
      'Lọc: chỉ ghi chú ghim / đã mã hóa',
      'Phân trang gọn gàng',
    ],
  },
  {
    icon: Lock,
    title: 'Bảo mật & Chia sẻ',
    items: [
      'Ghi chú bảo mật — mã hóa đầu-cuối (E2E)',
      'Khóa vault chỉ tồn tại trên thiết bị',
      'Chia sẻ link công khai (read-only)',
      'RLS — chỉ bạn thấy ghi chú của mình',
    ],
  },
  {
    icon: Trash2,
    title: 'Thùng rác',
    items: [
      'Xóa mềm, giữ 30 ngày rồi tự dọn',
      'Khôi phục hoặc xóa vĩnh viễn',
      'Xem lại ghi chú đã xóa (read-only)',
      'Dọn sạch thùng rác một chạm',
    ],
  },
  {
    icon: Cloud,
    title: 'Đồng bộ & Dữ liệu',
    items: [
      'Đồng bộ thời gian thực đa thiết bị',
      'Xuất / nhập dữ liệu JSON',
      'Dọn ảnh không dùng',
    ],
  },
  {
    icon: Sparkles,
    title: 'Giao diện & Trải nghiệm',
    items: [
      'Giao diện sáng / tối, nhớ lựa chọn',
      'Thiết kế glassmorphism, hiệu ứng mượt',
      'Responsive — dùng tốt trên điện thoại',
      'Trượt để xóa, phím tắt, FAB tạo nhanh',
    ],
  },
]

export function Features() {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-8 md:py-14">
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
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map(({ icon: Icon, title, items }, i) => (
            <section
              key={title}
              className={`rounded-2xl border border-black/5 bg-card p-5 shadow-soft transition-all hover:-translate-y-[3px] hover:border-brand-2/60 hover:shadow-lift dark:border-white/10 dark:bg-white/[.03] dark:hover:border-brand-2/60 ${
                // Center the lone last card in the 3-column desktop layout.
                i === GROUPS.length - 1 ? 'lg:col-start-2' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-display text-base font-bold tracking-tight">
                  {title}
                </h2>
              </div>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
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
