# Kế Hoạch Cho Phép Học Sinh Chọn Lại Đội Khi Mất Kết Nối & Không Khóa Chọn Đội Khi Đang Chơi

## User Review & Critical Decisions

> [!IMPORTANT]
> **Điểm mấu chốt được làm rõ theo phản hồi của bạn**:
> - **Chỉ khi đội OFFLINE hoàn toàn mới tính là bị văng**: Một đội chỉ được coi là bị văng ra ngoài khi kết nối mạng hoặc phiên làm việc của đội đó đã mất hẳn (`online === false`). Lúc này, học sinh mới được phép bấm chọn lại đội đó trên màn hình để kết nối lại và chơi tiếp.
> - **Đội đang ONLINE được bảo vệ tuyệt đối**: Nếu máy của đội đó vẫn đang kết nối (`online === true`), hệ thống khóa chặt và không cho bất kỳ máy nào khác chiếm quyền đội đó.
> - **Không khóa chọn đội khi đã bắt đầu câu hỏi**: Học sinh vào phòng muộn hoặc đổi máy vẫn có thể vào màn hình chọn đội bình thường; có thể chọn đội mới (nếu còn chỗ) hoặc chọn lại đội cũ đã bị văng (offline).
> - **Tiếp tục ngay câu hỏi hiện tại**: Khi đội vào lại thành công, học sinh tham gia ngay vào câu hỏi hiện tại mà cô giáo đang tổ chức, bảo toàn toàn bộ điểm số tích lũy trước đó.

---

## 1. Overview & Core Concept

- **Mục tiêu**: Xử lý tình huống thiết bị học sinh bị sập nguồn, mất sóng Wi-Fi, vô tình tắt tab hoặc reload trình duyệt giữa chừng.
- **Tiêu chí cốt lõi**:
  - **Nhận diện chính xác trạng thái "bị văng"**: Chỉ tính là bị văng khi đội đó thực sự offline (`online === false`).
  - **Tái kết nối liền mạch**: Cho phép nhập mã phòng và chọn lại chính đội vừa bị văng để tiếp tục phiên chơi mà không làm mất điểm.
  - **Mở xuyên suốt phiên chơi**: Không bao giờ khóa giao diện chọn đội chỉ vì cô giáo đã bấm bắt đầu câu hỏi.

---

## 2. User Experience & Visual Design

### Quy trình người dùng (User Flow)

1. **Trường hợp máy bị văng (mất mạng / tắt trình duyệt / thoát ra ngoài)**:
   - WebSocket ngắt kết nối $\rightarrow$ Server lập tức chuyển trạng thái của đội sang `online: false` và phát tín hiệu `teams_updated` tới phòng.
   - Khi học sinh mở lại trình duyệt và nhập mã phòng:
     - Đội đang **Online**: Hiển thị trạng thái khóa `🔒 Đã có bạn` (không cho chọn).
     - Đội vừa **Offline (bị văng)**: Hiển thị nhãn nổi bật `⚠️ Bị ngắt kết nối · Bấm để vào lại tiếp`.
     - Đội **Chưa có ai tham gia**: Hiển thị sẵn sàng `Chưa có người chơi` (học sinh mới có thể chọn).
   - Học sinh bấm chọn đội bị văng $\rightarrow$ Bấm nút "TIẾP TỤC CHƠI".
   - Màn hình chuyển ngay vào câu hỏi cô đang chiếu, giữ nguyên điểm tích lũy và bộ câu hỏi được giao.

2. **Trường hợp học sinh vào sau khi trò chơi đã bắt đầu**:
   - Màn hình chọn đội vẫn mở đầy đủ 12 đội (không bị chặn hay báo lỗi "Trò chơi đã bắt đầu").
   - Học sinh có thể chọn đội mới hoặc chọn vào một đội đang bị offline nếu cần hỗ trợ đội đó.

### Thiết kế trạng thái thẻ đội (Team Card States)

- **Trạng thái 1 - Đang Online (`online === true`)**:
  - Nền mờ nhẹ, biểu tượng ổ khóa đỏ `🔒 Đã có bạn`.
  - Vô hiệu hóa (`disabled`) để chống việc hai học sinh tranh chấp cùng một đội.
- **Trạng thái 2 - Bị văng (`online === false` nhưng đã có trong phòng)**:
  - Nền sáng viền hổ phách/cam ấm, nhãn: `🟢 Đội cũ bị văng · Chạm để chơi tiếp`.
  - Cho phép chạm chọn trực tiếp để tái kết nối.
- **Trạng thái 3 - Đội mới (`chưa có trong session.teams`)**:
  - Nền trắng chuẩn, viền xám sáng, nhãn: `Đội trống`.
  - Cho phép chọn bình thường.

---

## 3. Key Product Decisions & Trade-Offs

- **Quyết định 1: Định nghĩa chuẩn xác "Bị văng" dựa trên kết nối Socket và Heartbeat**
  - *Cơ chế*: Khi một socket của học sinh bị đóng (`close`/`error`) hoặc watchdog ping-pong không nhận được phản hồi, server lập tức đánh dấu `online = false` cho đội đó.
  - *Ý nghĩa*: Đảm bảo đúng yêu cầu của cô: "đội offline luôn mới tính là bị văng và vào lại bằng đội đó". Khi đội vẫn online thì máy khác tuyệt đối không thể vào thay thế.

- **Quyết định 2: Giữ nguyên dữ liệu điểm số và bài làm khi tái kết nối**
  - Khi học sinh chọn lại đội bị offline, server gán socket mới và `deviceId` mới vào bản ghi đội hiện có trong `session.teams[teamId]`.
  - Giữ nguyên `score`, `teamName`, `assignedSet` (trong phòng kết hợp 2 bộ câu hỏi) và lịch sử trả lời `answers`.

- **Quyết định 3: Không chặn `session.status === 'playing'` ở màn hình PlayerJoin**
  - Trước đây một số hệ thống khóa chọn đội khi game bắt đầu. Ta loại bỏ hoàn toàn hạn chế này, cho phép học sinh vào phòng và chọn đội bất kỳ thời điểm nào.

---

## 4. Technical Architecture & Data Strategy

### Sơ đồ xử lý trạng thái

```
┌─────────────────────────────────────────────────────────────┐
│                   HỌC SINH MỞ PLAYERJOIN                    │
│  - Nhập mã phòng                                            │
│  - Nhận danh sách session.teams với cờ online từng đội      │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ws: player:watch_room / player:join
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (server.ts)                      │
│                                                             │
│  Kiểm tra session.teams[teamId]:                            │
│  ├── Đội đã tồn tại:                                        │
│  │   ├── existingTeam.online === true && diff deviceId:     │
│  │   │   └── REJECT: "Đội này đang có bạn kết nối online"   │
│  │   └── existingTeam.online === false:                     │
│  │       └── ACCEPT (TÁI KẾT NỐI):                          │
│  │           • Gán existingTeam.deviceId = newDeviceId      │
│  │           • existingTeam.online = true                   │
│  │           • Giữ nguyên score, assignedSet, answers       │
│  │           • Gửi join_success kèm câu hỏi hiện tại        │
│  └── Đội chưa tồn tại:                                      │
│      └── ACCEPT (TẠO ĐỘI MỚI BÌNH THƯỜNG)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PLAYER VIEW ROUTING                     │
│  - Nếu session đang diễn ra (playing + active):             │
│    → Chuyển thẳng vào màn hình làm bài của câu hỏi hiện tại │
└─────────────────────────────────────────────────────────────┘
```

### Các tệp nguồn sẽ triển khai

1. **`server.ts`**:
   - Trong `ws.on('close')`: Khi socket của player đóng, cập nhật `team.online = false` ngay lập tức và gửi broadcast `teams_updated` để tất cả các máy đang ở màn hình chọn đội thấy trạng thái offline.
   - Trong `player:join`:
     - Nếu `existingTeam` tồn tại: chỉ cho phép nhận lại đội nếu `!existingTeam.online` hoặc cùng `deviceId`.
     - Cho phép gia nhập phòng khi `session.status === 'playing'`.
     - Phản hồi gói `join_success` với trạng thái câu hỏi hiện tại.

2. **`src/components/player/PlayerJoin.tsx`**:
   - Hiển thị trực quan 3 trạng thái cho từng nút đội:
     - Online: Khóa (`🔒 Đã có bạn`).
     - Offline (bị văng): Cho phép chọn kèm nhãn `Bị ngắt kết nối · Vào lại`.
     - Đội trống: Cho phép chọn bình thường.
   - Không khóa form chọn đội khi phòng đang diễn ra câu hỏi.

3. **`src/pages/PlayerPage.tsx`**:
   - Khi nhận `join_success` lúc câu hỏi đang diễn ra, tự động render ngay màn hình câu hỏi tương ứng (`PlayerQuestion`, `PlayerOpenEndedQuestion`, `PlayerDragDropQuestion`, `PlayerWordDragQuestion`, v.v.) cùng số điểm hiện tại của đội.
