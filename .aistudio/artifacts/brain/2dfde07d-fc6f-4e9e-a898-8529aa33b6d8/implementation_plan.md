# Module Bảng Đáp Án QR Xoay 4 Hướng (Preschool QR Response Cards)

Hệ thống trắc nghiệm tương tác không dùng thiết bị cá nhân cho trẻ mầm non. Mỗi trẻ sở hữu một bảng đáp án QR cá nhân độc nhất với 4 hướng xoay tương ứng 4 lựa chọn A, B, C, D. Giáo viên sử dụng điện thoại thông minh lia camera quét đáp án của cả lớp, tự động giải mã danh tính và hướng xoay để chấm điểm tức thì trên màn hình lớn.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Các quyết định kiến trúc đã thống nhất với Giáo viên qua phỏng vấn Turn 1:**
> - **Cơ chế quét camera**: Quét video luồng liên tục (*continuous stream*). Giáo viên chỉ cần lia điện thoại qua lớp học, hệ thống tự động nhận diện từng bảng QR khi lọt vào khung hình, phát tín hiệu âm thanh nhẹ nhàng và đánh dấu học sinh đã trả lời.
> - **Mô hình vận hành**: Hỗ trợ chuẩn **2 màn hình đồng bộ thời gian thực** (Máy tính/Laptop kết nối máy chiếu hoặc TV hiển thị câu hỏi và thống kê sinh động cho cả lớp; Điện thoại của cô giáo quét camera và bấm chốt/chuyển câu) cùng chế độ dự phòng quét trực tiếp trên 1 thiết bị duy nhất.
> - **Ngân hàng câu hỏi**: Xây dựng phân hệ quản lý bộ câu hỏi QR chuyên biệt cho trắc nghiệm 4 đáp án A-B-C-D với hình ảnh to rõ cho trẻ mầm non, đồng thời cho phép nhập/sao chép nhanh từ Kho trò chơi hiện có của website.

---

## 1. Overview & Core Concept

- **Mục tiêu**: Đem lại trải nghiệm thi đua vui nhộn, hào hứng cho trẻ mầm non mà không cần trang bị máy tính bảng hay điện thoại cho từng bé.
- **Đối tượng sử dụng**: Giáo viên mầm non (dùng điện thoại quét và điều khiển) và Học sinh mầm non từ 3–6 tuổi (cầm bảng in xoay hướng đáp án).
- **Quy ước 4 hướng xoay**:
  - Hướng $\mathbf{0^\circ}$ (Cạnh A ở trên đỉnh): Chọn đáp án **A**.
  - Hướng $\mathbf{90^\circ}$ theo chiều kim đồng hồ (Cạnh B ở trên đỉnh): Chọn đáp án **B**.
  - Hướng $\mathbf{180^\circ}$ (Cạnh C ở trên đỉnh): Chọn đáp án **C**.
  - Hướng $\mathbf{270^\circ}$ (Cạnh D ở trên đỉnh): Chọn đáp án **D**.

---

## 2. User Experience & Visual Design

### 5 Phân hệ chính trong Menu Giáo viên:
1. **Quản lý học sinh**:
   - Thêm/sửa/xóa học sinh, phân loại theo Lớp mầm non (Chồi, Mầm, Lá...).
   - Tải ảnh đại diện cho bé, nhập danh sách từ Excel/CSV.
   - Cấp phát mã định danh an toàn (`QR Token`) duy nhất cho từng bé (không chứa thông tin nhạy cảm của trẻ bên trong chuỗi QR).
2. **In bảng đáp án QR**:
   - Bản in chuẩn khổ A4 (2 bảng/trang) hoặc A5 (1 bảng/trang).
   - Tương phản đen trắng tuyệt đối cho mã QR, 4 cạnh in chữ A, B, C, D siêu lớn kèm viền màu nhận biết rõ ràng cho trẻ mầm non.
   - Có khu vực tên bé và ảnh đại diện ở góc nhỏ không che khuất mã quét.
   - Chức năng "Quét thử nghiệm": Cô giáo có thể bật camera quét thử ngay trên màn hình hoặc giấy in để làm quen.
3. **Ngân hàng câu hỏi QR**:
   - Tạo bộ câu hỏi trắc nghiệm trực quan với ảnh minh họa phóng to.
   - 4 đáp án A, B, C, D rõ ràng, hỗ trợ giọng đọc câu hỏi tiếng Việt.
   - Quản lý theo chủ đề mầm non: Chữ cái, Toán đếm, Động vật, Thực vật, Giao thông, Kỹ năng sống.
4. **Tổ chức phòng chơi (Host & Scanner)**:
   - **Màn hình máy chiếu (Big Screen)**: Hiển thị câu hỏi, hình ảnh, đồng hồ đếm ngược, danh sách thẻ tên các bé chuyển màu xanh khi cô quét trúng (chưa lộ đáp án trước khi chốt), biểu đồ cột phân bố A/B/C/D và hoạt cảnh vinh danh.
   - **Màn hình điện thoại quét (Mobile Scanner HUD)**: Khung quét camera siêu mượt với vệt quét laser sinh động, hiển thị danh sách các bé vừa quét được kèm âm thanh phản hồi 'ting', nút "Chốt đáp án" và "Câu tiếp theo" cỡ lớn dễ bấm bằng một tay.
5. **Kết quả và Lịch sử**:
   - Bảng tổng kết số câu đúng/sai của từng bé.
   - Tỷ lệ đúng của cả lớp cho từng câu hỏi giúp cô đánh giá mức độ tiếp thu bài học.
   - Lưu trữ lịch sử ván chơi vĩnh viễn vào Supabase & IndexedDB.

---

## 3. Key Technical Decisions & Algorithmic Design

### A. Thuật toán nhận diện góc xoay 4 hướng (QR Angle Detection)
- Thư viện: Tích hợp thư viện giải mã mã QR client-side siêu nhẹ `jsqr`.
- `jsQR` cung cấp tọa độ 4 góc của mã QR trong khung hình video:
  - `topLeftFinder` ($P_{TL}$), `topRightFinder` ($P_{TR}$), `bottomLeftFinder` ($P_{BL}$).
- Vector chỉ hướng "đỉnh" của mã QR trên mặt phẳng ảnh:
  $$\vec{u} = P_{TR} - P_{TL}$$
  $$\vec{v} = P_{TL} - P_{BL}$$
- Tính góc quay $\theta$ của bảng QR so với trục thẳng đứng của khung hình camera:
  $$\theta = \text{atan2}(v_y, v_x)$$
- Ánh xạ $\theta$ vào 4 góc phần tư ($90^\circ$ mỗi cung) có dung sai góc nghiêng $\pm 35^\circ$:
  - Vùng A (Top): $\theta \in [-45^\circ, +45^\circ]$
  - Vùng B (Right): $\theta \in [+45^\circ, +135^\circ]$
  - Vùng C (Bottom): $\theta \in [+135^\circ, +180^\circ] \cup [-180^\circ, -135^\circ]$
  - Vùng D (Left): $\theta \in [-135^\circ, -45^\circ]$
- **Dung sai & Bộ lọc chống rung**: Sử dụng bộ đệm xác thực (Debounce/Confirmation threshold 2 khung hình liên tiếp khớp cùng đáp án) để loại trừ góc nghiêng lỡ tay khi bé giơ bảng.

### B. Cơ chế kết nối 2 màn hình (TV Display $\leftrightarrow$ Mobile Scanner)
- **Kênh chính**: WebSocket Server hiện có trên Node/Express (`/ws`) với room code chuyên dụng cho phiên quét QR.
- **Dự phòng đám mây**: Supabase Realtime Broadcast channel khi chạy trên môi trường serverless/preview.
- Khi camera điện thoại quét trúng học sinh, gửi gói tin `{ type: 'STUDENT_ANSWERED', studentId, answer, timestamp }`. Màn hình TV lập tức cập nhật trạng thái thẻ tên của bé mà không làm lộ đáp án A/B/C/D cho đến khi cô bấm **Chốt đáp án**.

---

## 4. Technical Architecture & System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HỆ THỐNG BẢNG ĐÁP ÁN QR VUI HỌC CÙNG CÔ              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────┐                     ┌───────────────────────────┐
│     MÀN HÌNH MÁY CHIẾU    │                     │   ĐIỆN THOẠI QUÉT CỦA CÔ  │
│      (Laptop / Big TV)    │                     │      (Mobile Scanner)     │
├───────────────────────────┤                     ├───────────────────────────┤
│ • Chiếu câu hỏi & hình ảnh│ ◄─── WebSocket ───► │ • Video Camera Stream     │
│ • Danh sách học sinh lớp  │     Realtime Sync   │ • jsQR Corner Math Engine │
│ • Biểu đồ tỷ lệ A,B,C,D   │                     │ • Rung haptic + Ting sfx  │
│ • Hoạt cảnh tuyên dương   │                     │ • Nút Chốt & Chuyển câu   │
└──────────┬────────────────┘                     └─────────────┬─────────────┘
           │                                                    │
           └────────────────────────┬───────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        TẦNG DỮ LIỆU & LƯU TRỮ                          │
├────────────────────────────────────────────────────────────────────────┤
│ • qr_students (Hồ sơ học sinh & QR Token)                              │
│ • qr_questions & qr_question_packs (Ngân hàng câu hỏi trắc nghiệm)     │
│ • qr_sessions & qr_session_history (Lịch sử câu trả lời & chấm điểm)   │
│ • Supabase Cloud DB + IndexedDB / LocalStorage Offline-first           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Kế hoạch triển khai chi tiết theo 6 giai đoạn

1. **Giai đoạn 1: Thuật toán nhận diện & Module in bảng QR chuẩn**
   - Cài đặt thư viện `jsqr` để phân tích góc xoay camera.
   - Xây dựng component thiết kế & in bảng QR học sinh A4/A5 với độ tương phản cao, 4 nhãn A, B, C, D rõ nét.
   - Thử nghiệm quét camera ngay trong trình duyệt.
2. **Giai đoạn 2: Quản lý học sinh & Lớp học**
   - Giao diện danh sách học sinh theo lớp, thêm mới, sửa, xóa, tìm kiếm.
   - Hỗ trợ tải ảnh đại diện bé, nhập danh sách từ CSV/Excel, in hàng loạt bảng QR theo lớp.
3. **Giai đoạn 3: Ngân hàng câu hỏi QR trắc nghiệm**
   - Quản lý bộ câu hỏi 4 đáp án A-B-C-D, hỗ trợ hình ảnh to, âm thanh đọc câu hỏi.
   - Cho phép tạo bộ câu hỏi theo chủ đề mầm non và nhập từ kho trò chơi sẵn có.
4. **Giai đoạn 4: Màn hình tổ chức trò chơi & Đồng bộ 2 thiết bị**
   - Màn hình trình chiếu (Host TV view) và Màn hình camera điện thoại quét (Mobile Scanner view).
   - Đồng bộ thời gian thực qua WebSocket/Realtime với mã PIN phòng quét.
5. **Giai đoạn 5: Chấm điểm, Báo cáo & Lịch sử**
   - Thống kê tỷ lệ đúng sai, biểu đồ phân bố đáp án, bảo toàn bản chụp câu hỏi lịch sử.
6. **Giai đoạn 6: Tối ưu UI/UX mầm non & Kiểm thử tổng thể**
   - Kiểm tra linter, TypeScript build và dev server đảm bảo không phát sinh lỗi.
