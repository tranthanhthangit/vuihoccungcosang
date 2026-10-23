# Kế hoạch triển khai - Tích hợp Cloudflare Pages & Supabase (Auth, Database, Realtime)

Kế hoạch chuyển đổi toàn diện ứng dụng "Vui Học Cùng Cô" sang mô hình kết hợp tối ưu:
- **Cloudflare Pages**: Phục vụ giao diện người dùng React 19 + Vite siêu tốc qua mạng lưới máy chủ biên Edge tại Việt Nam (Hà Nội, TP.HCM), miễn phí không giới hạn băng thông, không bao giờ bị tạm dừng (ngủ đông).
- **Supabase**: Quản lý đăng ký/đăng nhập giáo viên (Supabase Auth), lưu trữ các trò chơi và lịch sử thi đua (PostgreSQL Database), và đồng bộ phòng chơi thời gian thực (Supabase Realtime Channels: Broadcast & Presence).

---

## User Review Required

> [!IMPORTANT]
> ### 1. Tính độc lập & Linh hoạt cao
> - **Chế độ Hai tầng (Dual-mode Offline / Online)**: Khi chưa cấu hình Supabase (hoặc khi không có internet), ứng dụng vẫn hoạt động 100% bình thường trên trình duyệt nhờ cơ chế lưu trữ đệm sẵn có (IndexedDB & LocalStorage).
> - Khi cô giáo đăng nhập tài khoản Supabase: Hệ thống tự động đồng bộ tất cả trò chơi lên cơ sở dữ liệu đám mây để mở trên mọi thiết bị khác.
>
> ### 2. Các thông tin cần chuẩn bị trên Supabase (Hoàn toàn miễn phí 0đ)
> Sau khi cài đặt xong mã nguồn, cô chỉ cần tạo 1 Project miễn phí trên [supabase.com](https://supabase.com) và lấy 2 giá trị đưa vào biến môi trường:
> - `VITE_SUPABASE_URL`: Đường dẫn URL dự án (VD: `https://xyzcompany.supabase.co`)
> - `VITE_SUPABASE_ANON_KEY`: Khóa công khai `anon public` của dự án.

---

## Proposed Changes

### Nhóm 1: Thư viện & Cấu hình Kết nối Supabase

#### [MODIFY] `package.json`
- Cài đặt thư viện chính thức: `@supabase/supabase-js`.

#### [NEW] `src/services/supabase.ts`
- Khởi tạo `supabase` client an toàn từ `import.meta.env.VITE_SUPABASE_URL` và `import.meta.env.VITE_SUPABASE_ANON_KEY`.
- Cung cấp hàm kiểm tra trạng thái cấu hình (`isSupabaseConfigured()`) để ứng dụng chuyển đổi nhịp nhàng giữa chế độ Local và Cloud.

#### [NEW] `supabase_schema.sql`
- Kịch bản SQL hoàn chỉnh để tạo:
  - Bảng `games`: `id`, `user_id` (liên kết với `auth.users`), `title`, `description`, `cover_image`, `type`, `questions` (JSONB), `settings` (JSONB), `created_at`, `updated_at`.
  - Bảng `game_history`: Lưu báo cáo kết quả và bảng xếp hạng các lượt chơi của lớp.
  - Chính sách phân quyền bảo mật **Row Level Security (RLS)**: Giáo viên chỉ có quyền chỉnh sửa/xóa bài của mình; học sinh được phép đọc thông tin câu hỏi khi có mã phòng.

---

### Nhóm 2: Hệ thống Xác thực Giáo viên (Teacher Auth)

#### [NEW] `src/context/AuthContext.tsx`
- Tạo React Context quản lý phiên đăng nhập:
  - `user`: Thông tin giáo viên (`id`, `email`, `user_metadata`).
  - `session`: Phiên làm việc Supabase Auth.
  - Các hàm tiện ích: `signUp(email, password, fullName)`, `signIn(email, password)`, `signOut()`, `resetPassword(email)`.

#### [NEW] `src/components/auth/TeacherAuthModal.tsx`
- Hộp thoại đăng nhập & đăng ký được thiết kế chuẩn sư phạm mầm non:
  - Đăng nhập / Đăng ký qua Email & Mật khẩu.
  - Hiển thị thông báo tiếng Việt thân thiện, rõ ràng khi sai mật khẩu hoặc đăng ký thành công.
  - Chức năng quên mật khẩu và ẩn/hiện mật khẩu an toàn.

#### [MODIFY] `src/components/common/Header.tsx`
- Tích hợp nút **"Đăng nhập Giáo viên"** (hoặc hiển thị tên/email cô giáo kèm nút Đăng xuất khi đã đăng nhập) ngay trên thanh tiêu đề ứng dụng.

---

### Nhóm 3: Đồng bộ Dữ liệu Trò chơi (Cloud Sync)

#### [MODIFY] `src/services/gameStorage.ts`
- Cập nhật hàm `saveGame`:
  - Lưu vào `IndexedDB` & `localStorage` ngay tức thì (đảm bảo không bị giật lag).
  - Nếu đã đăng nhập Supabase: Đồng thời gửi lệnh lưu lên bảng `games` của Supabase.
- Cập nhật hàm tải dữ liệu `asyncHydrateFromPersistentStores`:
  - Tự động lấy danh sách trò chơi đám mây của cô giáo về máy khi mở ứng dụng trên máy tính/laptop mới.
- Hỗ trợ thùng rác đám mây (`moveToTrash`, `restoreFromTrash`) đồng bộ 2 chiều.

---

### Nhóm 4: Chuyển đổi Phòng chơi Thời gian thực sang Supabase Realtime Channels

#### [MODIFY] `src/services/realtimeClient.ts`
- Bổ sung adapter **Supabase Realtime Channels** (`room:${roomCode}`):
  - **Presence tracking**: Khi học sinh mở máy tính bảng chọn đội, Supabase tự động theo dõi danh sách các đội đang online mà không cần máy chủ Node.js trung gian.
  - **Broadcast events**:
    - Máy cô giáo phát lệnh: `host:start_game`, `host:next_question`, `host:end_question`, `host:grade_open_ended`.
    - Máy học sinh gửi: `player:submit_answer`, `player:buzz`.
  - Hỗ trợ chế độ kép: Tự động dùng Supabase Realtime khi có cấu hình, hoặc dùng WebSocket cục bộ khi phát triển trên máy lập trình.

---

### Nhóm 5: Cấu hình Triển khai Chuẩn Cloudflare Pages

#### [NEW] `public/_routes.json`
- Cấu hình tệp điều hướng cho Cloudflare Pages để mọi URL con (`/host`, `/player`, `/history`) luôn điều hướng chính xác về `index.html` của React SPA mà không bị lỗi 404 khi người dùng tải lại trang (F5).

#### [NEW] `wrangler.toml`
- Tệp cấu hình chuẩn của Cloudflare, hỗ trợ lệnh build `npm run build` và thư mục xuất bản `dist`.

#### [NEW] `HUONG_DAN_CLOUDFLARE_SUPABASE.md`
- Hướng dẫn chi tiết bằng tiếng Việt có hình ảnh/bước làm cụ thể:
  1. Hướng dẫn tạo tài khoản và Project trên Supabase (0đ) & copy file SQL.
  2. Hướng dẫn kết nối GitHub với Cloudflare Pages.
  3. Cài đặt biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trên Cloudflare Pages.

---

## Verification Plan

### Kiểm tra tự động
- Chạy `npm run build`: Tạo thư mục `dist/` độc lập, tối ưu hóa CSS & JS cho môi trường CDN.
- Chạy `tsc --noEmit` và `npm run lint`: Đảm bảo 0 lỗi kiểu dữ liệu (TypeScript).

### Kiểm tra chức năng thực tế
1. **Kiểm tra Giao diện Xác thực**: Bấm nút Đăng nhập trên Header, kiểm tra modal đăng nhập/đăng ký hoạt động mượt mà.
2. **Kiểm tra Lưu trữ & Đồng bộ**: Thử tạo 1 bộ câu hỏi trắc nghiệm và 1 câu vẽ hình, kiểm tra trò chơi được lưu và hiển thị trong danh sách.
3. **Kiểm tra Tương tác Phòng chơi**: Tạo phòng thi đấu và cho thiết bị học sinh tham gia bằng mã PIN, kiểm tra tín hiệu trả lời câu hỏi và chấm điểm đồng bộ tức thì.
4. **Kiểm tra Đóng gói Cloudflare**: Kiểm tra các tệp cấu hình `_routes.json`, `wrangler.toml` đạt chuẩn quy cách của Cloudflare Pages.
