# Hệ Thống Phân Quyền Người Dùng & Quản Trị Hệ Thống (RBAC 4 Tầng)

Xây dựng hệ thống phân quyền người dùng chuyên nghiệp cho nền tảng giáo dục mầm non **"Vui Học Cùng Cô"**, hỗ trợ 4 phân quyền rõ ràng: Quản trị viên (Admin), Giáo viên tiêu chuẩn (Member), Giáo viên cao cấp (Premium) và Học sinh tham gia tự do (Guest).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> ### Hạn ngạch & Quyền hạn đã cập nhật theo yêu cầu
> 1. **Phân cấp Hạn ngạch & Quyền hạn Giáo viên**:
>    - **Giáo viên Member (Tài khoản tiêu chuẩn)**:
>      - Giới hạn tối đa **20 câu hỏi / bộ đề**.
>      - Tạo tối đa **2 phòng chơi cùng lúc**.
>      - Xuất kết quả thi đấu **cơ bản** (danh sách xếp hạng và tổng điểm của các đội/bé).
>      - Tùy chọn quyền riêng tư: Riêng tư (Private) hoặc Gửi yêu cầu Admin duyệt công khai (Request Public).
>    - **Giáo viên Premium (Tài khoản cao cấp - VIP)**:
>      - **Không giới hạn** số câu hỏi trên mỗi bộ đề.
>      - **Không giới hạn** số phòng chơi cùng lúc.
>      - Xuất báo cáo thi đấu **nâng cao** (phân tích chi tiết từng câu hỏi, thống kê thời gian phản hồi, tải toàn bộ hình vẽ bài thi của học sinh dạng file nén ZIP / file Excel đầy đủ bảng biểu).
>      - Huy hiệu VIP Hoàng kim nổi bật và quyền truy cập kho câu hỏi Premium độc quyền.
>    - **Quản trị viên (Admin)**:
>      - Quản lý danh sách tài khoản giáo viên (nâng cấp/hạ cấp Member $\leftrightarrow$ Premium $\leftrightarrow$ Admin, khóa/mở tài khoản).
>      - Duyệt các yêu cầu công khai bộ câu hỏi trước khi hiển thị ra toàn website.
>      - Quản lý ngân hàng câu hỏi gốc của hệ thống.
>      - Email `tranthangit2025@gmail.com` tự động được định danh và cấp quyền Admin cao nhất.
>    - **Học sinh (Khách)**:
>      - **100% không yêu cầu đăng ký hay đăng nhập**. Ô nhập mã PIN tham gia trò chơi luôn hiển thị nổi bật và sẵn sàng ở trang chủ.
> 2. **Phương thức Đăng ký & Đăng nhập**: Email và Mật khẩu cho Giáo viên và Admin (có sẵn tài khoản Admin mẫu để kiểm thử ngay lập tức).

---

## 1. Overview & Core Concept

- **Mục tiêu**: Cung cấp cấu trúc quản lý bảo mật, phân định rõ ràng giữa người quản trị hệ thống, giáo viên tiêu chuẩn (giới hạn 20 câu & 2 phòng), giáo viên VIP (không giới hạn) và trẻ mầm non tham gia trò chơi.
- **Đối tượng người dùng**:
  1. `admin` (Quản trị viên): Giám sát hệ sinh thái, phê duyệt nội dung công khai, phân quyền tài khoản giáo viên.
  2. `teacher_member` (Giáo viên Member): Giáo viên đứng lớp tạo tối đa 2 phòng chơi cùng lúc, biên soạn tối đa 20 câu hỏi/bộ, xuất bảng điểm cơ bản.
  3. `teacher_premium` (Giáo viên Premium): Tài khoản VIP không giới hạn câu hỏi/phòng chơi, xuất báo cáo nâng cao và truy cập tài nguyên chuyên sâu.
  4. `student` (Học sinh / Khách): Tham gia trò chơi chỉ với mã PIN và tên đội/bé, không cần tài khoản.

---

## 2. User Experience & Visual Design

### A. Luồng trải nghiệm người dùng

1. **Học sinh (Không cần tài khoản)**:
   - Truy cập trang chủ $\rightarrow$ Thấy ngay nút lớn **"Tham gia phòng"** hoặc ô nhập mã PIN $\rightarrow$ Nhập 6 chữ số $\rightarrow$ Vào chơi ngay lập tức.
2. **Giáo viên Đăng ký & Đăng nhập**:
   - Bấm nút **"Tài khoản"** trên thanh tiêu đề $\rightarrow$ Mở hộp thoại Đăng nhập/Đăng ký chuẩn mực (Email, Mật khẩu, Họ tên, Trường học).
   - Sau khi đăng nhập: Hiển thị Avatar, tên cô giáo và huy hiệu tương ứng (`Thành viên` hoặc `VIP Premium`).
3. **Quản lý Bộ câu hỏi & Kiểm soát Hạn ngạch (Quota Enforcement)**:
   - Khi tài khoản `Member` tạo câu hỏi: Hệ thống hiển thị thanh đếm số câu hiện tại (VD: `14/20 câu`). Khi đạt tới 20 câu, hiển thị gợi ý thân thiện nâng cấp Premium nếu muốn thêm câu hỏi.
   - Khi tài khoản `Member` mở phòng chơi: Đếm số phòng đang mở (tối đa 2 phòng). Nếu đạt tối đa 2 phòng, nhắc nhở đóng phòng đang mở trước hoặc nâng cấp VIP.
   - Khi lưu bộ đề: Cho phép chọn **"Riêng tư"** hoặc **"Yêu cầu công khai"** (chuyển sang trạng thái `Chờ duyệt`).
4. **Bảng điều khiển Quản trị (Admin Dashboard)**:
   - Khi tài khoản mang quyền `admin` (hoặc email `tranthangit2025@gmail.com`), xuất hiện nút **"Quản trị hệ thống"** trên Header.
   - **Tab 1: Quản lý Giáo viên**: Danh sách tất cả giáo viên đăng ký, ngày tham gia, vai trò, số bộ đề đã tạo, nút chuyển đổi quyền hạn (`Member` $\leftrightarrow$ `Premium` $\leftrightarrow$ `Admin`), và nút khóa/mở tài khoản.
   - **Tab 2: Duyệt Bộ câu hỏi**: Danh sách các bộ đề chờ duyệt với đầy đủ câu hỏi, hình ảnh; nút **"Phê duyệt"** (đưa lên trang chủ) hoặc **"Từ chối"** kèm lý do phản hồi.

### B. Thiết kế Trực quan & Bảng màu (Theme & Palette)

- **Ngôn ngữ thiết kế**: Phong cách giáo dục mầm non tươi sáng, thân thiện và ấm áp.
- **Hệ thống nhận diện vai trò (Zero-Pill Typography & Badges)**:
  - `Admin`: Đỏ cam uy tín (`#DC2626`), biểu tượng Vương miện / Khiên quản trị.
  - `Premium`: Vàng ánh kim sang trọng (`#D97706`), huy hiệu Ngôi sao VIP lấp lánh.
  - `Member`: Xanh dương thanh lịch (`#2563EB`), biểu tượng Sách giáo án / Bút hoa.
  - `Học sinh`: Xanh ngọc rạng rỡ (`#059669`), biểu tượng Nụ cười mặt trời.
- **Không gian bảng điều khiển**: Tối ưu chuẩn desktop 1440px, bố cục rõ ràng, bảng biểu số liệu căn chỉnh chuẩn (`tabular-nums`), tương thích mượt mà trên iPad/máy tính bảng cô giáo.

---

## 3. Key Product Decisions & Trade-Offs

### Quyết định 1: Thiết lập Hạn ngạch Rõ ràng cho Member vs. Premium
- **Hạn ngạch Member**:
  - Số câu hỏi mỗi bộ đề: $\le 20$ câu (phù hợp trọn vẹn cho 1 tiết học mầm non tiêu chuẩn 15-20 phút).
  - Số phòng chơi đồng thời: $\le 2$ phòng (1 phòng chính và 1 phòng dự phòng/nhóm).
  - Báo cáo kết quả: Xuất bảng xếp hạng và điểm số cơ bản.
- **Đặc quyền Premium**:
  - Không giới hạn số câu hỏi, không giới hạn số phòng đồng thời.
  - Xuất báo cáo nâng cao (phân tích từng câu, tải ảnh bài vẽ dạng ZIP).
- **Lý do**: Tạo sự cân bằng lý tưởng: Member hoàn toàn đủ dùng cho tiết học hàng ngày, trong khi các tính năng nâng cao và quy mô lớn dành cho tài khoản VIP Premium.

### Quyết định 2: Cơ chế Lưu trữ & Xác thực Độc lập Đa Tầng (Hybrid Offline/Online)
- **Giải pháp**: Xây dựng tầng Auth Service tích hợp:
  - Hỗ trợ lưu trữ cục bộ (`localStorage` + `IndexedDB`) với đầy đủ tính năng mã hóa, duy trì phiên đăng nhập và ghi nhớ vai trò người dùng ngay cả khi không có kết nối Supabase Cloud.
  - Nếu đã cấu hình Supabase Cloud (`VITE_SUPABASE_URL`), hệ thống tự động đồng bộ tài khoản người dùng và vai trò qua `user_metadata` hoặc bảng `user_profiles`.

### Quyết định 3: Tự động Gán Quyền Admin cho Email Chủ sở hữu
- **Giải pháp**: Bất kỳ khi nào email `tranthangit2025@gmail.com` đăng ký hoặc đăng nhập, hệ thống tự động nâng cấp vai trò thành `admin` vĩnh viễn.

---

## 4. Technical Architecture & Data Strategy

### A. Sơ đồ Kiến trúc & Phân quyền Hệ thống

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VUI HỌC CÙNG CÔ PLATFORM                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
 ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
 │   HỌC SINH (GUEST)│    │ GIÁO VIÊN (MEMBER)│    │ QUẢN TRỊ (ADMIN)  │
 │ - Zero Auth       │    │ & TEACHER PREMIUM │    │                   │
 │ - Nhập PIN 6 số   │    │ - Đăng ký / Login │    │ - Dashboard Admin │
 │ - Trả lời / Vẽ thi│    │ - Member: <=20 câu│    │ - Quản lý Giáo viên│
 │ - Xem bảng xếp hạng│   │   <=2 phòng chơi  │    │   (Member<->VIP)  │
 └───────────────────┘    │ - Premium: Không  │    │ - Phê duyệt đề thi│
                          │   giới hạn + B/cáo│    │ - Quản lý đề gốc  │
                          └─────────┬─────────┘    └─────────┬─────────┘
                                    │                        │
                                    ▼                        ▼
                          ┌────────────────────────────────────┐
                          │         AuthContext & RBAC         │
                          │  (Role, CurrentUser, Permissions)  │
                          └─────────────────┬──────────────────┘
                                            │
                       ┌────────────────────┴────────────────────┐
                       ▼                                         ▼
            ┌──────────────────────┐                  ┌──────────────────────┐
            │   GameStorage & DB   │                  │   Supabase Cloud     │
            │ (Local & IndexedDB)  │                  │  (Khi có cấu hình)   │
            │ - questions_library  │                  │ - user_profiles (RLS)│
            │ - pending_approvals  │                  │ - games / history    │
            │ - teacher_accounts   │                  └──────────────────────┘
            └──────────────────────┘
```

### B. Cấu trúc Mô hình Dữ liệu (TypeScript Entities)

1. **User Role & Profile**:
   ```typescript
   export type UserRole = 'admin' | 'teacher_member' | 'teacher_premium' | 'student';

   export interface UserQuota {
     maxQuestionsPerGame: number; // 20 cho Member, Infinity cho Premium/Admin
     maxActiveRooms: number;       // 2 cho Member, Infinity cho Premium/Admin
     canExportAdvancedReport: boolean;
     hasVipBadge: boolean;
   }

   export interface UserProfile {
     id: string;
     email: string;
     fullName: string;
     schoolName?: string;
     role: UserRole;
     status: 'active' | 'suspended';
     createdAt: number;
     lastLoginAt: number;
     createdGamesCount: number;
   }
   ```

2. **Question Set Visibility & Approval**:
   ```typescript
   export type GameVisibility = 'private' | 'pending_approval' | 'public';

   export interface Game {
     // ... các thuộc tính game hiện tại
     authorId?: string;
     authorName?: string;
     authorEmail?: string;
     visibility: GameVisibility; // 'private' | 'pending_approval' | 'public'
     submittedForApprovalAt?: number;
     approvedAt?: number;
     approvedBy?: string;
     rejectionReason?: string;
     isSystemDefault?: boolean; // Bộ đề chuẩn của website do Admin quản lý
   }
   ```

### C. Các luồng tương tác và kiểm soát hạn ngạch

1. **Kiểm tra Hạn ngạch khi Tạo Câu Hỏi (Builder)**:
   - Giáo viên Member thêm câu hỏi thứ 21 $\rightarrow$ Hiển thị thông báo thân thiện: *"Tài khoản Member hỗ trợ tối đa 20 câu hỏi/bộ đề. Nâng cấp Premium để tạo không giới hạn câu hỏi!"*.
2. **Kiểm tra Hạn ngạch khi Mở Phòng (Host)**:
   - Giáo viên Member mở phòng thứ 3 $\rightarrow$ Thông báo đóng bớt 1 trong 2 phòng đang mở trước hoặc nâng cấp VIP.
3. **Giao diện Admin Dashboard**:
   - Tab Quản lý Giáo viên: Xem danh sách tài khoản, chuyển đổi quyền `Member` $\leftrightarrow$ `Premium` $\leftrightarrow$ `Admin`, khóa/kích hoạt tài khoản.
   - Tab Duyệt Bộ Đề: Xem trước chi tiết bộ đề chờ duyệt $\rightarrow$ Bấm **Phê duyệt** (công khai toàn website) hoặc **Từ chối** kèm lý do.
4. **Học sinh tham gia**:
   - Mở trang chủ $\rightarrow$ Nhập PIN 6 số $\rightarrow$ Tham gia thi đấu tức thì, không bị yêu cầu đăng nhập.

---

## Verification & Testing Plan

1. **Kiểm thử Giới hạn Hạn ngạch Member (20 câu, 2 phòng)**:
   - Thử thêm câu hỏi trong Game Builder với tài khoản Member để kiểm tra giới hạn 20 câu và thanh đếm số câu hỏi (`x/20 câu`).
   - Kiểm tra giới hạn 2 phòng chơi cùng lúc và tính năng xuất kết quả cơ bản.
2. **Kiểm thử Tài khoản Premium**:
   - Kiểm tra biểu tượng VIP trên Header, tạo trên 20 câu hỏi thành công, xuất báo cáo thi đấu nâng cao.
3. **Kiểm thử Tài khoản Admin**:
   - Đăng nhập với `tranthangit2025@gmail.com` $\rightarrow$ Truy cập Admin Dashboard $\rightarrow$ Nâng/hạ quyền giáo viên $\rightarrow$ Phê duyệt bộ đề gửi lên.
4. **Kiểm thử Trải nghiệm Học sinh**:
   - Mở màn hình tham gia phòng bằng mã PIN $\rightarrow$ Xác nhận không có bất kỳ rào cản đăng nhập nào.
5. **Kiểm tra Biên dịch & Không có lỗi**:
   - Chạy `compile_applet` để xác thực toàn bộ TypeScript và Component không có lỗi build.
