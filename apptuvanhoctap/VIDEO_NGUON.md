# Video AAC — kết quả giai đoạn 4

Cập nhật 11/10/2026: đã kiểm tra phát thực tế và gắn **1 video vào 1 bài cấp 1**. Các bài chưa có video phù hợp tiếp tục dùng AAC và thực hành có hướng dẫn.

## Nguồn đã chọn

[Rửa tay với xà phòng cùng ĐSTC UNICEF Xuân Bắc](https://www.youtube.com/watch?v=8dWqtK8jI9o) — **UNICEF Viet Nam**, khoảng 54 giây.

- Đối chiếu tên/kênh qua oEmbed chính thức. Trình phát nhúng chạy tới `currentTime = duration = 53.421`, `ended = true`, không có lỗi media trong lượt kiểm tra.
- Đối chiếu hình ảnh mỗi 5 giây và phụ đề tiếng Việt xuyên suốt: khuyến khích rửa tay với xà phòng trước ăn, sau đi vệ sinh, xả nước và lau khô. Đây là **bài hát mở đầu**, không phải hướng dẫn chậm từng bước.
- Có chữ tiếng Anh trong hình và phụ đề tự động tiếng Việt có lỗi. Không dùng phụ đề làm tài liệu đọc hoặc câu AAC. Không đánh giá trực tiếp chất lượng âm thanh; nhận diện nội dung ngôn ngữ dựa trên phụ đề. Có thể bỏ qua nếu âm nhạc không phù hợp học sinh.
- Chỉ gắn vào **Cấp 1 · Con rửa tay và nhờ hỗ trợ** (`primary-school-01`). Không gắn cho cấp 2 vì cách thể hiện thiên về trẻ nhỏ. Thực hành chính theo hướng dẫn và thẻ AAC; không yêu cầu hát, bắt chước tốc độ hoặc xem hết để được điểm.

Minh chứng local: `tmp/wash-transcript.json`, `tmp/wash-contact-sheet.jpg`. Hồ sơ lựa chọn: `content/phase-4.mjs`.

## Nguồn không dùng

[An toàn trên mạng cho trẻ em](https://www.youtube.com/watch?v=_KlRjGlFmgY) — kết quả tìm kiếm ghi UNICEF Viet Nam, 1:55. Trình phát nhúng báo **“Video này không hoạt động”**. Đã bỏ khỏi gợi ý; không kết luận video bị xóa hay không xem được ở mọi nơi. Bài an toàn mạng vẫn dùng tình huống giả lập và AAC, chưa gắn video thay thế.

## Sử dụng và nạp dữ liệu

Giáo viên vào **Soạn bài → Sửa bài → Video YouTube** để xem/sửa liên kết, tên nguồn và gợi ý thực hành. Video rửa tay đã có trong dữ liệu local. Học viên chỉ thấy bài khi giáo viên đã đưa bài vào lộ trình và lộ trình đó được mở khóa.

Trình phát chỉ tải khi bấm **Xem video bài học**, không tự phát. Có liên kết mở YouTube nếu nhúng không hoạt động. Video cần Internet, không lưu ngoại tuyến trong PWA. Xem video không cộng điểm; điểm giáo viên chấm phải trên 80% để mở tiếp.

Chạy `npm run seed:phase4` sau giai đoạn 2. Bộ nạp sao lưu SQLite rồi chỉ thêm liên kết vào bài nguyên bản chưa có video. Bỏ qua bài đã chỉnh, đã có tệp/YouTube, hoặc đã chủ động gỡ liên kết (`youtube: null`). Chạy lại không thay dữ liệu.

Đã nạp local vào `primary-school-01`; bản sao `data/backups/before-phase4-1791666312697.sqlite`. Đối chiếu xác nhận ngoài trường YouTube của bài này, toàn bộ dữ liệu giáo dục giữ nguyên. Đạt **26 kiểm thử logic/API và 7 kiểm thử giao diện**. Kiểm thử giao diện tự động dùng trình phát mô phỏng; phát thật được kiểm tra riêng như mô tả phía trên.
