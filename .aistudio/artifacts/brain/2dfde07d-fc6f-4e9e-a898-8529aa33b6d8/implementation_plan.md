# Quản lý Trò chơi Hiển thị Trang chủ dành cho Quản trị viên

Hệ thống cho phép Quản trị viên (Admin) kiểm soát tập trung toàn bộ danh sách các trò chơi xuất hiện tại Trang chủ, kết hợp thông minh với danh sách trò chơi yêu thích (thả tim) của người dùng và cơ chế phân trang tối ưu chống tràn giao diện.

---

### Quyết định từ Quản trị viên & Xác nhận thiết kế

> [!IMPORTANT]
> Dựa trên phản hồi khảo sát trực tiếp của Quản trị viên:
> - **Khu vực quản lý tập trung**: Chỉ quản lý trong **Bảng điều khiển Quản trị viên (Admin Dashboard)** để đảm bảo tính an toàn, bảo mật và phân quyền rõ ràng.
> - **Quy tắc hiển thị trên Trang chủ**: **Ưu tiên trò Quản trị viên ghim** kết hợp các trò người dùng thả tim (Favorites), đảm bảo những trò chơi giáo dục hay nhất luôn được giới thiệu ở vị trí nổi bật.
> - **Kiểm soát độ dài trang chủ**: Giới hạn hiển thị 8 trò chơi mỗi trang kèm bộ chuyển trang / "Xem thêm" nhẹ nhàng, ngăn chặn việc danh sách dài làm phá vỡ cấu trúc thẩm mỹ mầm non của trang chủ.

---

## 1. Tổng quan & Mục tiêu

- **Mục tiêu**: Trao quyền cho Quản trị viên chủ động tuyển chọn danh mục trò chơi mẫu và trò chơi nổi bật được khuyến nghị trên Trang chủ (`HomePage`), không để danh sách tự do kéo dài vô tận hoặc hiển thị lộn xộn.
- **Đối tượng sử dụng**:
  - **Quản trị viên (Admin)**: Thao tác ghim / bỏ ghim, thay đổi độ ưu tiên, xem trước số lượng trò chơi đang hiển thị ra ngoài trang chủ.
  - **Giáo viên & Học sinh**: Khi truy cập trang chủ sẽ thấy ngay danh mục trò chơi chất lượng cao được kiểm duyệt cùng các trò mình đã thả tim, với bố cục trực quan, mượt mà và không bị ngợp.
- **Giá trị mang lại**: Giữ cho trang chủ luôn tinh gọn, tươi sáng đúng chuẩn thẩm mỹ giáo dục mầm non, đồng thời linh hoạt thay đổi nội dung nổi bật theo từng sự kiện, chủ đề tuần/tháng.

---

## 2. Trải nghiệm người dùng & Thiết kế giao diện (UX/UI)

### A. Luồng thao tác của Quản trị viên (Admin Dashboard)
1. Quản trị viên vào **Bảng điều khiển Quản trị viên** -> Chọn tab mới: **"Trang chủ & Ghim nổi bật"**.
2. Bảng quản trị hiển thị:
   - Thẻ thống kê: *Tổng trò ghim trang chủ* (ví dụ: `6 / 8 trò tối ưu`), *Trò ghim Banner chính* (1 trò).
   - Thanh công cụ: Tìm kiếm theo tên đề/chủ đề, lọc theo trạng thái (Đang ghim / Chưa ghim).
   - Danh sách trò chơi dạng bảng & lưới trực quan:
     - Nút gạt bật/tắt (Toggle Switch) hoặc nút ngôi sao: **"Ghim Trang chủ"**.
     - Huy hiệu nhận diện trò chơi đang ghim Banner đỉnh trang.
     - Nút xem trước nhanh nội dung bộ câu hỏi.
3. Khi Quản trị viên bật/tắt ghim, dữ liệu được lưu tức thời và đồng bộ ngay với `HomePage`.

### B. Luồng hiển thị trên Trang chủ (`HomePage`)
1. **Banner đỉnh trang**: Vẫn giữ nguyên vị trí danh dự dành cho trò chơi tiêu biểu nhất (có thể đổi trò nhanh qua Admin).
2. **Khu vực "Trò chơi nổi bật & Yêu thích"**:
   - Tab bộ lọc: "Tất cả gợi ý" (mặc định), "Yêu thích của bé" (❤️), "Chữ cái", "Làm quen với toán", "Khám phá xung quanh".
   - **Thứ tự ưu tiên hiển thị**:
     1. Trò do Quản trị viên ghim trên Trang chủ (`Admin Homepage Games`).
     2. Trò người dùng đã bấm thả tim (`Favorite Games`).
     3. Các trò chơi công khai khác nếu số lượng chưa đủ giới hạn hiển thị.
   - **Giới hạn & Phân trang**:
     - Hiển thị tối đa **8 trò chơi / trang** (lưới 4 cột trên Desktop, 2 cột trên Tablet/Mobile).
     - Nếu có hơn 8 trò, hiển thị thanh phân trang thiếu nhi (Trang 1, 2, 3... hoặc nút "Xem thêm trò chơi") để không bao giờ làm tràn trang chủ.

```
┌────────────────────────────────────────────────────────────────────────┐
│  BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN                                         │
│  [Duyệt bộ đề (0)]  [Giáo viên]  [★ Quản lý Trang chủ]  [Hệ thống]    │
├────────────────────────────────────────────────────────────────────────┤
│  ⚡ Đang ghim 6 trò ra trang chủ | Banner chính: Nhận biết chữ h, k     │
│  🔍 Tìm kiếm trò chơi...                    [Tất cả] [Đã ghim]        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [Icon] Nhận biết chữ h, k  • 5-6 tuổi  [⭐ Banner] [✓ Ghim Home] │  │
│  │ [Icon] Bé vui học toán 1-10 • 4-5 tuổi             [✓ Ghim Home] │  │
│  │ [Icon] Đố vui động vật rừng • 3-4 tuổi             [+ Ghim Home] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼ (Đồng bộ thời gian thực)
┌────────────────────────────────────────────────────────────────────────┐
│  TRANG CHỦ VUI HỌC CÙNG CÔ                                             │
│  [ Banner chính tương tác ]                                            │
│                                                                        │
│  🌟 TRÒ CHƠI NỔI BẬT & ĐƯỢC YÊU THÍCH                                  │
│  [⭐ Tất cả gợi ý] [❤️ Yêu thích (2)] [Chữ cái] [Toán]                │
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Trò ghim │ │ Trò ghim │ │ Trò thả  │ │ Trò thả  │ (Tối đa 8 trò)   │
│  │ Admin 1  │ │ Admin 2  │ │ tim 1    │ │ tim 2    │                   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
│                                                                        │
│         [  <  Trang 1 / 2  >  ]  hoặc  [ ✨ Xem thêm trò chơi ]        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Quyết định sản phẩm & Đánh đổi kỹ thuật

1. **Phương thức lưu trữ danh sách ghim trang chủ**:
   - *Cách tiếp cận*: Mở rộng `gameStorage.ts` với key `vuihoc_admin_homepage_game_ids` được lưu trữ đồng bộ (IndexedDB + localStorage + Cloud sync API khi có kết nối backend).
   - *Lý do*: Tương thích mượt mà với mô hình hiện tại của `vuihoc_featured_game_id`, phản hồi ngay lập tức không có độ trễ giật lag (zero latency), có thể pub/sub listener để cập nhật tức thì qua các component.
2. **Quy tắc phân trang trên Trang chủ**:
   - *Cách tiếp cận*: Giới hạn 8 trò/trang với thanh chuyển trang đánh số và nút Trước/Sau bo tròn màu sắc tươi sáng.
   - *Lý do*: Giải quyết triệt để nỗi lo "kho trò chơi quá nhiều khiến giao diện bị quá dài", đảm bảo phụ huynh và các bé lướt trên máy tính bảng hoặc điện thoại không phải cuộn mỏi tay.
3. **Phân quyền thao tác**:
   - Chỉ hiển thị nút ghim/bỏ ghim trong `AdminDashboard` cho tài khoản Quản trị viên (`isAdmin === true` hoặc email `tranthangit2025@gmail.com`). Khách hoặc giáo viên thông thường chỉ có quyền thả tim yêu thích cá nhân.

---

## 4. Kiến trúc kỹ thuật & Kế hoạch sửa đổi

### A. Dịch vụ lưu trữ (`src/services/gameStorage.ts`)
- Khởi tạo key `ADMIN_HOMEPAGE_GAMES_KEY = 'vuihoc_admin_homepage_game_ids'`.
- Thêm các hàm nghiệp vụ:
  - `getAdminHomepageGameIds(): string[]` (Mặc định khởi tạo các trò tiêu biểu nếu chưa có).
  - `setAdminHomepageGameIds(ids: string[]): void`
  - `toggleAdminHomepageGameId(gameId: string): boolean`
  - `subscribeAdminHomepageGames(listener: (ids: string[]) => void): () => void`

### B. Bảng điều khiển Quản trị viên (`src/components/admin/AdminDashboard.tsx`)
- Bổ sung tab `homepage` ("Ghim Trang chủ") vào thanh điều hướng tab Admin.
- Thiết kế giao diện quản lý ghim:
  - Danh sách toàn bộ trò chơi hợp lệ (bao gồm cả trò hệ thống và trò của giáo viên đã được duyệt).
  - Nút chuyển trạng thái ghim lên trang chủ (On/Off) với âm thanh thông báo vui nhộn (`sounds.playCorrect()`).
  - Nút chọn nhanh làm "Trò chơi Banner chính".
  - Thống kê số lượng trò đang kích hoạt hiển thị ngoài trang chủ.

### C. Trang chủ (`src/pages/HomePage.tsx`)
- Lắng nghe sự thay đổi của danh sách `adminHomepageGameIds`.
- Thuật toán sắp xếp danh sách showcase:
  - **Ưu tiên 1**: Trò chơi nằm trong danh sách Admin ghim trang chủ.
  - **Ưu tiên 2**: Trò chơi nằm trong danh sách yêu thích của người dùng hiện tại (`favoriteIds`).
  - **Ưu tiên 3**: Trò chơi công khai khác theo thứ tự ngày tạo/chủ đề.
- Cơ chế phân trang:
  - `showcasePage` (mặc định trang 1), `GAMES_PER_PAGE = 8`.
  - Nút chuyển trang sinh động phong cách mầm non: số trang, nút chuyển trang trước/sau.

### D. Kiểm thử & Đảm bảo chất lượng
- Chạy `compile_applet` và `lint_applet` kiểm tra cú pháp TypeScript và Tailwind CSS.
- Kiểm tra tính nhất quán giữa tài khoản Quản trị viên và người dùng khách.
