# Video và lộ trình học của từng bé

## Chức năng đã triển khai

- Giáo viên vào **Soạn bài → Thêm bài học / Chỉnh sửa → Video bài học**, chọn MP4 hoặc WebM tối đa 100 MB rồi lưu. Video là phần đính kèm tùy chọn; bài vẫn có mục tiêu, hướng dẫn và thẻ AAC để thực hành.
- Giáo viên chọn học sinh, mở **Lộ trình của bé → Điều chỉnh lộ trình** để đổi tên, mục tiêu và chọn bài cho từng lộ trình. Dùng **Lên / Xuống** ở danh sách bài để sắp xếp thứ tự. Mỗi bé có đúng 3 lộ trình, được cấu hình độc lập.
- Học viên đăng nhập sẽ thấy 3 lộ trình, chọn lộ trình đang mở rồi vào bài. Video có nút phát, tạm dừng, tua và toàn màn hình; không tự phát. Thẻ AAC và đọc tiếng Việt giữ nguyên.
- Giáo viên chấm từng bài từ 0 đến 100 tại **Lộ trình của bé → Xem & chấm điểm bài học**. Điểm này dùng cho mở khóa lộ trình; khác với phiếu kỹ năng 0–4 và nhật ký số lượt đúng trong một buổi học.
- Điểm lộ trình = tổng điểm các bài / tổng số bài trong lộ trình. Bài chưa chấm tạm tính 0, nhưng vẫn hiển thị “Chưa được chấm điểm”, không coi là giáo viên đã chấm 0. Mỗi bài có một điểm hiện tại; lần chấm sau thay điểm cũ.
- Lộ trình 1 mở ngay. Lộ trình 2 yêu cầu điểm lộ trình 1 **> 80%**. Lộ trình 3 yêu cầu cả hai lộ trình trước **> 80%**. Đúng 80% vẫn khóa. Lộ trình trống không đạt điều kiện. Các bài trong một lộ trình đang mở có thể chọn để học hoặc ôn lại, không khóa từng bài theo thứ tự.
- Ví dụ: 5 bài có điểm 90, 85, 80, 85 và chưa chấm → 68%. Khi bài cuối được chấm 85, điểm lộ trình thành 85%, mở lộ trình tiếp theo.
- Xem video, ghép câu hoặc bấm hoàn thành lượt thực hành không tự tăng điểm. Phụ huynh/học viên không có quyền tự chấm hay mở khóa. Máy chủ kiểm tra quyền tải video và ghi thực hành, kể cả khi gọi API trực tiếp.
- Đổi danh sách bài, sửa/xóa điểm sẽ tính lại điểm và quyền mở khóa. Học viên dùng **Cập nhật tiến độ**, hoặc quay về lộ trình, để nhận điểm mới.
- Admin tiếp tục chỉ quản lý giáo viên, học sinh và phân công.

## Gợi ý nội dung để giáo viên chuẩn bị

Tên và bài mặc định chỉ là điểm bắt đầu. Giáo viên điều chỉnh theo khả năng thực tế của từng bé; 3 lộ trình không phải các mốc bắt buộc theo tuổi.

| Lộ trình                | Mục tiêu                                     | Bài gợi ý để soạn thêm                                                                                   |
| ----------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1. Làm quen & giao tiếp | Nhận biết hình, lựa chọn và thể hiện nhu cầu | Con muốn gì; chọn đồ vật; gọi tên người quen; yêu cầu giúp đỡ; nói “nữa”, “hết rồi”                      |
| 2. Thực hành hằng ngày  | Giao tiếp trong các hoạt động quen thuộc     | Rửa tay; ăn/uống; đi vệ sinh; chờ lượt; chia sẻ; nhận biết đau và khó chịu                               |
| 3. Giao tiếp & tự lập   | Ghép câu và vận dụng trong nhiều tình huống  | Ghép câu nhu cầu; kể lại hoạt động; thực hiện 2–3 bước; diễn đạt cảm xúc; lựa chọn cách xử lý tình huống |

Nên bắt đầu khoảng 4–6 bài mỗi lộ trình rồi tăng khi cần. Một bài nên có:

1. **Một mục tiêu quan sát được:** ví dụ “Con chọn thẻ nước để yêu cầu uống”.
2. **Video mẫu 1–3 phút:** giáo viên làm mẫu chậm, nói tiếng Việt, tập trung một kỹ năng; đưa chữ hướng dẫn vào video khi quay/dựng.
3. **Thẻ thực hành:** ít lựa chọn ở bài đầu, tăng dần theo khả năng của bé.
4. **Hoạt động ngoài màn hình:** phụ huynh cho con thử với đồ vật hoặc tình huống thật; ghi cách thực hành vào phần mục tiêu/hướng dẫn hiện có.
5. **Điểm giáo viên:** dựa trên tiêu chí đã thống nhất, như số lượt làm đúng và mức hỗ trợ cần dùng. Giáo viên cần dùng cùng tiêu chí giữa các lần chấm.

Hiện ứng dụng có các bài AAC mẫu; video do giáo viên tải lên. Không có video mẫu tự sinh, tự chấm bằng AI, phụ đề tự động hay theo dõi phần trăm xem video.

## Triển khai và sao lưu

- Video lưu riêng tại `data/videos/` khi dùng cơ sở dữ liệu mặc định `data/aac.sqlite`; metadata video lưu trong SQLite. Gắn ổ lưu trữ bền vững cho toàn bộ `data/` khi deploy, không dùng ổ tạm của container.
- Cấu hình reverse proxy cho phép request ít nhất 100 MB và đủ thời gian tải lên. HTTPS cần thiết để cài PWA. Video đi qua API xác thực, không đặt kho video vào thư mục công khai.
- Khuyến nghị MP4 mã hóa H.264/AAC để tương thích điện thoại. WebM phụ thuộc phiên bản trình duyệt; ứng dụng không chuyển mã video.
- Bản JSON sao lưu giữ lộ trình, điểm và tham chiếu video, **không chứa nội dung tệp video**. Sao lưu đầy đủ cần cả SQLite và thư mục video; dừng máy chủ trước khi sao chép hoặc dùng công cụ SQLite backup phù hợp. Khôi phục JSON có video chỉ được phép khi video đã có trên máy chủ đó.
- Bỏ video khỏi bài chỉ gỡ liên kết; tệp vẫn nằm trong kho để bản sao lưu cũ còn dùng được. Cần tính dung lượng lưu trữ khi vận hành lâu dài.
- PWA không lưu video hay điểm/hồ sơ riêng vào Cache Storage. Cần mạng để tải video và lưu điểm.
