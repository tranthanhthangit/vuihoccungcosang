# HƯỚNG DẪN TRIỂN KHAI: CLOUDFLARE PAGES KẾT HỢP SUPABASE

Tài liệu hướng dẫn từng bước giúp cô giáo/quản trị viên triển khai website **"Vui Học Cùng Cô"** lên mạng lưới máy chủ biên **Cloudflare Pages** (miễn phí, tốc độ siêu tốc tại Việt Nam, không giới hạn băng thông) kết hợp với **Supabase** (xác thực người dùng, lưu trữ cơ sở dữ liệu và kênh thi đấu thời gian thực).

---

## BƯỚC 1: Tạo Dự án Supabase & Khởi tạo Cơ sở dữ liệu (0đ Miễn phí)

1. Truy cập trang web chính thức: **[https://supabase.com](https://supabase.com)** và đăng ký/đăng nhập (bằng tài khoản Google hoặc GitHub).
2. Bấm nút **"New project"** (Dự án mới):
   - **Name**: Nhập `vui-hoc-cung-co`
   - **Database Password**: Đặt mật khẩu bất kỳ (hãy lưu lại mật khẩu này).
   - **Region**: Chọn **Singapore (ap-southeast-1)** để có tốc độ truyền tải nhanh nhất về Việt Nam.
   - Bấm **"Create new project"** và chờ khoảng 1-2 phút để Supabase chuẩn bị máy chủ.
3. **Chạy kịch bản tạo bảng dữ liệu:**
   - Ở thanh điều hướng bên trái, bấm vào biểu tượng **SQL Editor** (hoặc hình trang giấy có chữ SQL).
   - Bấm **"New query"**.
   - Mở tệp `supabase_schema.sql` có sẵn trong thư mục dự án này, copy toàn bộ nội dung và dán vào ô soạn thảo.
   - Bấm nút xanh lá **"Run"** (hoặc phím tắt Ctrl + Enter).
   - Khi hiện thông báo *"Success. No rows returned"*, cơ sở dữ liệu gồm bảng `games`, `game_history` và bảo mật đã được tạo thành công!
4. **Lấy mã kết nối (API Keys):**
   - Bấm vào biểu tượng **Project Settings** (hình bánh răng cưa ở góc dưới bên trái).
   - Chọn mục **API** (nằm dưới mục Configuration).
   - Bạn sẽ nhìn thấy 2 thông tin quan trọng:
     - **Project URL**: dạng `https://abcdefghijkl.supabase.co`
     - **Project API keys** -> copy khóa **`anon public`** (chuỗi ký tự dài bắt đầu bằng `eyJhbGci...`).

---

## BƯỚC 2: Đẩy Mã Nguồn lên GitHub

Nếu bạn đã có kho lưu trữ GitHub của dự án:
```bash
git add .
git commit -m "Tích hợp Cloudflare Pages và Supabase"
git push origin main
```

---

## BƯỚC 3: Triển khai lên Cloudflare (2 cách tùy theo màn hình bạn đang thấy)

### CÁCH A: Tiếp tục ngay trên màn hình bạn đang đứng ("Configure your Worker project")
*(Đây là giao diện mới nhất Cloudflare tự động đề xuất khi thấy mã nguồn dự án)*

1. Bạn giữ nguyên các ô:
   - **Project name**: `vuihoccungcosang`
   - **Build command**: `npm run build`
   - **Deploy command**: `npx wrangler deploy`
2. **Thêm biến môi trường Supabase**:
   - Cuộn thanh cuộn bên phải xuống phía dưới (ngay dưới mục *Enable Preview builds*), bạn sẽ thấy mục **Environment variables**.
   - Bấm **Add variable** và điền 2 dòng:
     - Dòng 1: Tên `VITE_SUPABASE_URL` | Giá trị: *(Dán Project URL từ Bước 1)*
     - Dòng 2: Tên `VITE_SUPABASE_ANON_KEY` | Giá trị: *(Dán khóa anon public từ Bước 1)*
   *(Lưu ý: Nếu không thấy mục này, bạn cứ bấm nút xanh **Deploy** luôn. Sau khi Deploy hoàn tất, vào tab **Settings** -> **Variables and Secrets** để thêm rồi bấm **Redeploy** là xong!)*
3. Bấm nút màu xanh **"Deploy"** ở góc dưới cùng bên phải.

---

### CÁCH B: Sử dụng giao diện Cloudflare Pages truyền thống
Nếu bạn muốn giao diện có đầy đủ ô chọn Framework (Vite) và thư mục `dist`:

1. Bấm nút **"Back"** ở góc dưới bên trái màn hình.
2. Tại màn hình tạo ứng dụng của Cloudflare:
   - Hãy để ý ở phía trên có 2 tab: **"Workers"** và **"Pages"**.
   - Bấm chọn tab **Pages** -> Bấm **Connect to Git** (Kết nối GitHub).
3. Chọn repo `tranthanhthangit/vuihoccungcosang`:
   - **Framework preset**: Chọn **Vite**
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - Mở rộng **Environment variables** và thêm:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
4. Bấm **"Save and Deploy"**. Sau 1 phút, trang web sẽ hoạt động tại link `https://vuihoccungcosang.pages.dev`!

---

## BƯỚC 4: Trải nghiệm & Sử dụng

- **Đăng ký / Đăng nhập Giáo viên**:
  - Mở website trên bất kỳ trình duyệt nào.
  - Bấm nút **"Tài khoản"** trên thanh tiêu đề góc trên bên phải.
  - Chọn *"Đăng ký miễn phí"*, nhập email và mật khẩu của cô giáo.
  - Từ nay, mọi trò chơi cô tạo hoặc sửa đổi sẽ được lưu trữ vĩnh viễn trên đám mây Supabase và tự động đồng bộ sang mọi máy tính, máy tính bảng khác.
- **Tạo phòng thi đấu thời gian thực**:
  - Bấm **"Tạo phòng"** để chiếu mã PIN lên màn hình tivi / máy chiếu.
  - Học sinh dùng điện thoại hoặc máy tính bảng truy cập vào cùng link web, bấm **"Tham gia phòng"**, nhập mã PIN và chọn đội để bắt đầu thi đấu trực tiếp qua kênh Supabase Realtime!

---

## (TÙY CHỌN) Nếu muốn triển khai lên Netlify thay vì Cloudflare

Dự án đã được tạo sẵn tệp `netlify.toml` và `_redirects`. Nếu bạn thích dùng Netlify:
1. Đăng nhập **[https://app.netlify.com](https://app.netlify.com)**.
2. Chọn **"Add new site"** -> **"Import an existing project"** -> Kết nối GitHub.
3. Phần Build command: `npm run build`, Publish directory: `dist`.
4. Thêm 2 biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong mục **Site configuration -> Environment variables**.
5. Bấm **Deploy Site**.
