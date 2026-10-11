# Cùng Con — Học tập và giao tiếp AAC

Ứng dụng web tiếng Việt để quản lý hồ sơ trẻ, đánh giá kỹ năng, thực hành giao tiếp AAC và ghi nhận tiến bộ. Backend Node.js dùng **PostgreSQL/Supabase khi deploy**; vẫn hỗ trợ SQLite để chạy local. Video nhập bằng link YouTube hoặc Google Drive trên bản deploy.

**Deploy ngay:** xem [hướng dẫn Render + Supabase](DEPLOY_RENDER.md). Đã có `render.yaml`, `.env.example`, kiểm tra kết nối và công cụ chuyển dữ liệu cũ. Không cần bucket video hoặc khóa `service_role`.

## Khởi động trên máy này

Yêu cầu **Node.js 24 trở lên**. Chạy trong thư mục chứa `package.json`:

```powershell
npm ci
npm start
```

Mở **http://localhost:3000**. Lần đầu, tự tạo tài khoản quản trị với mật khẩu ít nhất 6 ký tự. Không có mật khẩu mặc định. Có thể chạy tệp `KHOI_DONG.cmd` ở thư mục ngoài để mở máy chủ; giữ cửa sổ đó trong khi sử dụng.

Ứng dụng cần thư viện `pg`. `npm ci --omit=dev` cài đủ để chạy production; `npm ci` cài cả kiểm thử. `npm start` đọc `.env` nếu có: đặt `DATABASE_URL` để dùng PostgreSQL, để trống để dùng SQLite local. Không mở trực tiếp `index.html` bằng giao thức `file://` vì ứng dụng cần API máy chủ.

## Vai trò và luồng sử dụng

| Vai trò       | Giao diện và nhiệm vụ                                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quản trị viên | Tổng quan quản lý, danh sách giáo viên, danh sách học sinh; tạo tài khoản, phân công giáo viên và liên kết tài khoản học viên/phụ huynh. Không có bài học, đánh giá, chấm điểm hoặc báo cáo học tập trên giao diện quản trị. |
| Giáo viên     | Chỉ xem học sinh được phân công; cập nhật mục tiêu/ghi chú học tập, đánh giá kỹ năng, soạn bài, dạy học, ghi kết quả và xem tiến bộ. Không tạo học sinh hoặc quản lý tài khoản.                                              |
| Phụ huynh     | Chỉ xem con được liên kết; học tại nhà, ghi nhận tại nhà và theo dõi tiến bộ. Chỉ sửa/xóa bản ghi của mình.                                                                                                                  |
| Học viên      | Màn hình thẻ AAC, ghép câu, nghe đọc và hoàn thành thực hành. Không xem quản lý hoặc tự chấm điểm.                                                                                                                           |

1. Admin thêm học sinh trong **Học sinh**, thêm tài khoản giáo viên trong **Giáo viên**.
2. Admin chọn **Phân công** trên hàng học sinh để giao một hoặc nhiều giáo viên phụ trách. Có thể bỏ phân công khi cần.
3. Trong **Học sinh → Tài khoản học sinh / phụ huynh**, admin cấp tài khoản và chọn học sinh được liên kết.
4. Giáo viên đăng nhập, chọn học sinh được giao, lưu đánh giá 6 lĩnh vực từ 0–4 và chọn bài phù hợp.
5. Học viên chọn thẻ, ghép câu và nghe đọc. Hoàn thành lưu lượt thực hành, không tự gán điểm đúng/sai.
6. Giáo viên/phụ huynh nhập số lượt đúng, tổng lượt, mức nhắc, tập trung và nhận xét sau buổi học. Báo cáo có lọc ngày, bảng kết quả, xuất CSV và in PDF.

Mỗi tài khoản đều có trang riêng để đổi mật khẩu và đăng xuất. Form đăng nhập gồm **Tên đăng nhập → Vai trò → Mật khẩu**. Vai trò chọn phải khớp tài khoản.

Có 8 bài mẫu; giáo viên có thể thêm/sửa học liệu, tối đa 36 thẻ/bài, ảnh PNG/JPEG/WebP dưới 300 KB/thẻ. PDF/PPTX mở để tham khảo, chưa tự động chuyển thành thẻ. Giọng đọc tiếng Việt phụ thuộc trình duyệt/thiết bị.

Phân quyền được kiểm tra tại API. Admin không được gọi các thao tác đánh giá, sửa bài học, ghi điểm hay thực hành. Giáo viên chưa được giao học sinh sẽ thấy thông báo chờ phân công. Việc thay đổi phân công không xóa hồ sơ hoặc lịch sử học.

## Dữ liệu và sao lưu

- Với PostgreSQL, dữ liệu/tài khoản/phiên đăng nhập nằm trong schema riêng `aac_private`, không nằm trên ổ đĩa Render. Với SQLite local, tệp là `data/aac.sqlite`. Không đưa thư mục `data` lên Git.
- API bảo trì `GET /api/backup` (quản trị viên) xuất JSON chứa hồ sơ, học liệu, ảnh, điểm, lịch sử đánh giá và lượt thực hành; không chứa tài khoản/mật khẩu.
- Khôi phục kiểm tra cấu trúc và liên kết dữ liệu trước khi thay thế. Máy chủ giữ 5 bản dữ liệu trước khôi phục; API bảo trì `GET /api/recovery` lấy bản gần nhất. Tài khoản được giữ; liên kết tới hồ sơ không còn tồn tại sẽ bị bỏ.
- Muốn sao lưu cả tài khoản: PostgreSQL dùng backup database/`pg_dump`; SQLite thì dừng máy chủ rồi sao chép thư mục `data`. Không chép riêng tệp SQLite khi máy chủ đang ghi.
- Khi hai phiên cùng sửa, phiên có dữ liệu cũ nhận thông báo và tải lại, tránh âm thầm ghi đè.
- Dữ liệu học tập tối đa 22 MB trong phiên bản này. Nên dùng ảnh nhỏ; đây là bản dành cho sử dụng quy mô nhỏ.

Mã giao diện cũ được giữ ở `tmp/original-2026-10-08`. Dữ liệu `localStorage` cũ không bị xóa. Các công cụ sao lưu/khôi phục được giữ ở API bảo trì, không hiển thị trong menu quản lý giáo viên/học sinh. Nếu cần chuyển dữ liệu demo cũ, phải xuất dữ liệu từ trình duyệt cũ và chuyển sang định dạng phiên bản 2 trước khi nhập qua API bảo trì.

## Dùng nhiều thiết bị

Mặc định máy chủ chỉ lắng nghe `127.0.0.1`, dùng trên máy hiện tại. Các tài khoản cùng dùng chung cơ sở dữ liệu khi truy cập cùng một máy chủ.

Trong mạng nội bộ tin cậy, có thể đổi địa chỉ lắng nghe:

```powershell
$env:HOST = '0.0.0.0'
$env:PORT = '3000'
npm start
```

Truy cập qua địa chỉ IP nội bộ của máy chủ và cấu hình tường lửa phù hợp. Bản này **chưa được triển khai lên Internet**. Khi triển khai công khai cần tên miền, HTTPS qua reverse proxy, `COOKIE_SECURE=1`, lưu trữ bền vững, sao lưu định kỳ và quy trình vận hành. Hoàn thành thiết lập quản trị trước khi mở truy cập từ bên ngoài.

## Kiểm thử

```powershell
npm ci
npm test
npm run test:postgres
npm run test:ui
```

- API: thiết lập tài khoản, quyền truy cập, dữ liệu không hợp lệ, lịch sử đánh giá, chống ghi đè, sao lưu/khôi phục, tồn tại sau khi khởi động lại, thu hồi phiên.
- Trình duyệt: chạy bằng Microsoft Edge đã cài trên máy; kiểm tra hành trình học, thứ tự/lặp thẻ AAC, báo cáo 0%, tải CSV, học liệu ảnh, tài khoản phụ huynh, khôi phục và giao diện 390px.
- Kiểm thử dùng SQLite tạm hoặc trong bộ nhớ, không sửa dữ liệu sử dụng thật. Ảnh kiểm tra nằm ở `tmp/completed-desktop.png` và `tmp/completed-mobile.png`.

## Web app / PWA trên điện thoại

Bộ nội dung giao tiếp, kỹ năng sống và tự lập cho cấp 1–cấp 2: [Kế hoạch nạp theo giai đoạn](KE_HOACH_NOI_DUNG.md). Lệnh `npm run seed:phase1` thêm 12 bài nền tảng, có sao lưu trước khi nạp và không ghi đè dữ liệu đang dùng.

Các lệnh `seed:phase1` đến `seed:phase4` dành cho SQLite local. PostgreSQL trống tự nhận đủ 44 bài khi khởi động lần đầu; nếu chuyển dữ liệu cũ thì dùng `db:migrate`, không chạy các bộ nạp SQLite để cập nhật Supabase.

Tiếp theo chạy `npm run seed:phase2` để thêm 12 bài cấp 1 cho lộ trình 2–3. Sau hai lần nạp, mẫu cấp 1 có 18 bài (6 bài mỗi lộ trình); giáo viên xem mẫu và lưu cho từng học sinh. Chạy lại các lệnh không ghi đè bài đã chỉnh hoặc lộ trình đang dùng.

Chạy `npm run seed:phase3` để thêm 12 bài cấp 2 cho lộ trình 2–3. Sau ba giai đoạn, cả cấp 1 và cấp 2 đều có mẫu 18 bài, chia thành 3 lộ trình. Giáo viên chọn và điều chỉnh mẫu cho từng học sinh; việc nạp không tự thay lộ trình đang dùng. Video YouTube thuộc giai đoạn 4, chưa được gắn vào các bài mới.

Đã có **Soạn bài → Sửa bài → Video YouTube**: nhập liên kết HTTPS, tên video, tên kênh và gợi ý thực hành rồi lưu. Mỗi bài chọn YouTube hoặc tệp tải lên. Trình phát chính thức cần Internet, chỉ tải khi học viên bấm xem và không cộng điểm. [Danh sách nguồn gợi ý và trạng thái kiểm tra](VIDEO_NGUON.md): nguồn chưa xem toàn bộ không tự gắn cho học viên. Không cần API key hoặc thay `.env` cho chức năng này.

`npm run seed:phase4` gắn video mở đầu rửa tay UNICEF vào bài cấp 1 nguyên bản chưa có video; có sao lưu và bỏ qua bài đã chỉnh hoặc đã chủ động gỡ liên kết. Bản local đã nạp. Video đã kiểm tra phát hết qua nhúng, đối chiếu hình và phụ đề; xem giới hạn trong `VIDEO_NGUON.md`.

Hướng dẫn tải video, cấu hình 3 lộ trình riêng của từng bé, cách tính điểm giáo viên để mở khóa (> 80%) và gợi ý nội dung: [Video và lộ trình học](LO_TRINH.md).

Giao diện tự chuyển sang menu dưới và danh sách quản lý dạng thẻ trên điện thoại. Nút bấm lớn, biểu mẫu dùng cỡ chữ tối thiểu 16px, hỗ trợ vùng an toàn của màn hình và chế độ mở ứng dụng độc lập.

Khi triển khai, phục vụ ứng dụng ở gốc tên miền qua **HTTPS** (localhost được phép dùng HTTP khi phát triển). Giữ nguyên các đường dẫn `/sw.js`, `/manifest.webmanifest`, `/assets/icons/` và chuyển tiếp `/api/` đến máy chủ Node. Sau khi mở trang, Android/Edge/Chrome có thể cài từ menu trình duyệt hoặc nút cài trong trang Tài khoản nếu trình duyệt hỗ trợ. iPhone dùng Safari → Chia sẻ → Thêm vào Màn hình chính.

PWA vẫn cần mạng để đăng nhập, học và lưu dữ liệu. Service worker chỉ lưu tài nguyên giao diện công khai và trang báo mất kết nối; không lưu API, phiên đăng nhập, hồ sơ trẻ hay tài liệu riêng vào Cache Storage. Khi có bản mới, người dùng chọn tải lại sau khi lưu công việc. Khi phát hành thay đổi tài nguyên PWA, tăng phiên bản `CACHE` trong `sw.js` để kích hoạt thông báo cập nhật và dọn bộ nhớ đệm cũ.

## Cấu trúc

| Tệp          | Nội dung                                                 |
| ------------ | -------------------------------------------------------- |
| `server.mjs` | HTTP/API, xác thực, phân quyền, kiểm tra dữ liệu |
| `database.mjs` | PostgreSQL/Supabase và SQLite local, giao dịch và schema riêng |
| `drive.mjs` | Kiểm tra và chuẩn hóa liên kết video Google Drive |
| `domain.mjs` | Lĩnh vực, bài mẫu, tính mức, gợi ý và sắp xếp bản ghi    |
| `app.js`     | Giao diện, biểu mẫu, AAC, báo cáo, xuất/nhập             |
| `styles.css` | Giao diện máy tính/điện thoại và bản in                  |
| `tests/`     | Kiểm thử API và trình duyệt                              |

Gợi ý bài học hiện là quy tắc dựa trên điểm, chưa phải mô hình AI hay công cụ chẩn đoán. Mục tiêu lưu dưới dạng ghi chú; chưa có lịch giao bài theo tuần hay thông báo tự động. Chưa có khôi phục mật khẩu qua email; quản trị viên có thể đặt lại mật khẩu của tài khoản khác.
