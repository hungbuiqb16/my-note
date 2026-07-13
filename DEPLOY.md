# Deploy lên Vercel

Hướng dẫn triển khai Noteflow (Vite + React SPA + Supabase) lên Vercel.

> Deploy chỉ đẩy **frontend**. Toàn bộ schema/DB nằm ở Supabase và phải được
> chạy migration trước (xem [mục 6](#6-migration-database)).

## Tổng quan

| Hạng mục         | Giá trị                              |
| ---------------- | ------------------------------------ |
| Framework        | Vite (Vercel tự nhận diện)           |
| Build command    | `npm run build` (`tsc -b` + vite)    |
| Output directory | `dist`                               |
| Node version     | ≥ 20.19 (khuyến nghị 22.x)           |
| Backend          | Supabase (Postgres + Auth + Storage) |

---

## 1. Biến môi trường (quan trọng nhất)

`.env.local` bị gitignore nên **không** lên Vercel. Vào **Project → Settings →
Environment Variables**, thêm cho cả **Production** và **Preview**:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

- Biến `VITE_*` được **nhúng lúc build** → phải có sẵn trước khi build; đổi biến
  xong phải **Redeploy** mới có hiệu lực.
- Chỉ dùng **anon public key** (an toàn để lộ — RLS là lớp bảo vệ).
- **Tuyệt đối không** đưa `service_role` key lên client.

## 2. Cấu hình Auth URL trên Supabase

Hay bị quên → link reset mật khẩu / xác nhận email sẽ về `localhost` hoặc bị chặn.

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: domain production, ví dụ `https://noteflow.vercel.app`.
- **Redirect URLs**: thêm domain production **và** `https://*.vercel.app`. Nên
  dùng dạng bao trọn path (`https://your-domain/**`, `http://localhost:5174/**`)
  vì OAuth / xác nhận email hiện `redirectTo` về **`/app`** — nếu chỉ khai báo
  domain trần (không có path) thì URL `.../app` có thể bị chặn.

Lý do: OAuth và xác nhận email dùng `redirectTo` = `origin + /app`; link đặt lại
mật khẩu dùng `origin + /reset-password`. Khai `/**` sẽ bao hết các path này.

### 2.1 Đăng nhập OAuth (Google / GitHub) — nếu dùng

Hai nút **Google** / **GitHub** ở màn hình đăng nhập gọi
`supabase.auth.signInWithOAuth`. **Bắt buộc** phải bật provider trên Supabase,
nếu không bấm nút sẽ báo lỗi kiểu _"provider is not enabled"_.

Dashboard → **Authentication → Providers** → bật **Google** và **GitHub**, rồi
điền **Client ID** / **Client Secret** lấy từ:

- **Google** — [Google Cloud Console](https://console.cloud.google.com) → _APIs &
  Services → Credentials → Create OAuth client ID_ (loại **Web application**).
  - **Authorized redirect URI**:
    `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- **GitHub** — GitHub → _Settings → Developer settings → OAuth Apps → New OAuth
  App_.
  - **Authorization callback URL**:
    `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

> `<PROJECT_REF>` là phần đầu của `VITE_SUPABASE_URL` (ví dụ `abcd1234` trong
> `https://abcd1234.supabase.co`). Callback URL này trỏ về **Supabase**, không
> phải về app.

Ngoài ra, **Redirect URLs** ([mục 2](#2-cấu-hình-auth-url-trên-supabase)) phải
chứa origin của app (`http://localhost:5174` khi dev **và** domain production) —
flow OAuth dùng `redirectTo: window.location.origin` để quay lại app sau khi xác
thực xong.

## 3. Build & Node version

- Vercel tự nhận **Vite** → không cần chỉnh Build/Output.
- `npm run build` chạy `tsc -b && vite build` ⇒ **lỗi TypeScript sẽ fail deploy**.
  Kiểm tra trước ở local: `npm run build`.
- Đặt **Settings → Build & Development → Node.js Version = 22.x**, hoặc khai báo
  trong `package.json`:

  ```json
  "engines": { "node": ">=20.19" }
  ```

## 4. Husky trên CI

`"prepare": "husky"` chạy khi `npm install`. Nếu build log báo lỗi liên quan husky,
thêm biến môi trường **`HUSKY=0`** trên Vercel để tắt git hooks lúc build (hooks chỉ
cần ở máy dev).

## 5. SPA routing

App hiện **chưa có react-router** (không có client route) nên **không cần** rewrite.

Khi nào thêm router dùng path (vd `/note/:id`), tạo `vercel.json` ở gốc để tránh 404
khi refresh route con:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## 6. Migration database

Chạy trên Supabase **SQL Editor** theo thứ tự (nếu chưa chạy):

| File                                           | Nội dung                                  |
| ---------------------------------------------- | ----------------------------------------- |
| `supabase/migrations/0001_init_notes.sql`      | Bảng `notes` + RLS + trigger `updated_at` |
| `supabase/migrations/0002_delete_user.sql`     | RPC `delete_user` (xóa tài khoản)         |
| `supabase/migrations/0003_tags.sql`            | Cột `tags` + GIN index                    |
| `supabase/migrations/0004_avatars_storage.sql` | Bucket `avatars` + storage policies       |

> Thiếu migration nào thì tính năng tương ứng sẽ lỗi (vd chưa chạy `0003` → tạo
> note báo "Không lưu được thay đổi"; chưa chạy `0004` → upload avatar lỗi).

## 7. Các bước deploy

1. Push code lên GitHub/GitLab.
2. Trên Vercel: **Add New → Project** → import repo.
3. Kiểm tra preset **Vite** (Build `npm run build`, Output `dist`).
4. Thêm Environment Variables ([mục 1](#1-biến-môi-trường-quan-trọng-nhất)).
5. **Deploy**.
6. Cập nhật **Site URL / Redirect URLs** trên Supabase bằng domain vừa nhận
   ([mục 2](#2-cấu-hình-auth-url-trên-supabase)).
7. Redeploy nếu vừa mới thêm/sửa biến môi trường.

## 8. Kiểm tra sau khi deploy

- [ ] Trang tải được, hiện màn hình đăng nhập.
- [ ] Đăng ký / đăng nhập hoạt động (không lỗi redirect).
- [ ] Đăng nhập Google / GitHub hoạt động (nếu đã bật provider ở [mục 2.1](#21-đăng-nhập-oauth-google--github--nếu-dùng)).
- [ ] Tạo / sửa / ghim / xóa note lưu vào Supabase.
- [ ] Lọc theo tag hoạt động.
- [ ] Upload avatar hiển thị được.
- [ ] Quên mật khẩu: nhận được email và link quay về đúng domain.
- [ ] Dark mode + reload giữ nguyên trạng thái đăng nhập.
- [ ] PWA: có nút "Cài đặt" trên trình duyệt; DevTools → Application thấy
      Service Worker + Manifest.

## PWA

App là PWA (cài được + mở offline) qua `vite-plugin-pwa`. Không cần cấu hình
Vercel thêm:

- Vercel phục vụ `sw.js` / `manifest.webmanifest` như **file tĩnh** (ưu tiên
  trước `rewrites` trong `vercel.json`), nên SPA rewrite không nuốt chúng.
- Vercel mặc định **HTTPS** → đủ điều kiện cài PWA.
- `registerType: 'autoUpdate'` → sau mỗi lần deploy, service worker tự cập nhật
  ở lần truy cập kế tiếp (không cần xóa cache thủ công).

## Không cần lo

- **CORS**: Supabase cho phép mọi origin với anon key — không cần cấu hình.
- **Bucket `avatars`** public → ảnh hiển thị được từ mọi domain.
- **Preview deployments**: mỗi PR có URL `*.vercel.app` riêng; chỉ cần đã thêm
  wildcard vào Redirect URLs ở [mục 2](#2-cấu-hình-auth-url-trên-supabase).
