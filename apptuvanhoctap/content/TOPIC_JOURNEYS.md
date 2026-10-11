# Hai lộ trình chủ đề

Đã triển khai cục bộ: Động vật và Xe cộ, mỗi lộ trình 12 bài (6 bài cấp 1, 6 bài cấp 2). Một bộ cấp học có 3 đích đến, mỗi đích 2 bài. Học sinh được giao một bộ trong từng lộ trình, không phải học đồng thời cả hai cấp.

| Lộ trình | Đích 1 | Đích 2 | Đích 3 |
| --- | --- | --- | --- |
| Động vật | Nhận biết và tìm thông tin từ hình | Sở thích, cảm xúc, giới hạn tiếp xúc | Quan sát an toàn và chăm sóc có hỗ trợ |
| Xe cộ | Phương tiện và xe hỗ trợ | Trao đổi chuyến đi, báo nhu cầu | Chuẩn bị, chờ và tìm người hỗ trợ |

Mỗi bài có mục tiêu, thẻ ảnh, bản đọc tiếng Việt, vật liệu, các bước hướng dẫn, 5 cơ hội quan sát, cách chấm và thực hành tại nhà. Đã gắn 3 video YouTube vào 12 bài phù hợp; 12 bài còn lại chưa có video. Giáo viên có thể thêm hoặc thay liên kết YouTube/Drive qua trình sửa bài hiện có.

## Video đã bổ sung

- SuRiKa KiDs TV — nhận biết con vật: https://www.youtube.com/watch?v=JuD8GXnjJQw (5 bài Động vật).
- Nhomnhom — Xe gì đây: https://www.youtube.com/watch?v=PLPaBj9yYUA (5 bài Xe cộ).
- Honda Việt Nam Official — Chiếc mũ bảo hiểm: https://www.youtube.com/watch?v=eRQkxlFQRMs (2 bài chuẩn bị chuyến đi).

Danh sách ghép bài, hướng dẫn xem và giới hạn nằm trong `content/topic-videos.mjs`. Đã đối chiếu tiêu đề/kênh nguồn, bản chép lời tiếng Việt, hình storyboard theo mốc 10 giây và kiểm tra cả ba trình nhúng phát tăng thời gian tại localhost ngày 11/10/2026. Chưa nghe trực tiếp toàn bộ âm thanh; không khẳng định đã xem liên tục toàn bộ ba video. Video nhận biết có hình AI và phong cách trẻ nhỏ, giáo viên chọn theo sở thích của em; không dùng như bằng chứng hiệu quả trị liệu. Loại video ZUZU về thú cưng sau khi đọc thấy cách giải thích sức khỏe không phù hợp với mục tiêu bộ bài.

Video chỉ tải sau khi bấm xem, cần Internet và không làm tăng điểm. Có link mở YouTube dự phòng. Nội dung ngoài ứng dụng có thể thay đổi hoặc ngừng phát.

Nạp riêng trên SQLite: `node scripts/seed-topic-videos.mjs`. Lệnh sao lưu trước khi thay đổi, chỉ thêm vào bài gốc chưa có nguồn video. Giữ nguyên bài giáo viên đã sửa, video upload, link Drive/YouTube hiện có và `youtube: null` (giáo viên chủ động bỏ link). Khởi động máy chủ cũng bổ sung an toàn theo cùng quy tắc; không cần tải video về Render/Supabase.

## Cách dùng

Học sinh: chọn một trong ba thẻ → chọn đích đang mở → vào bài học. Chạm thẻ để nghe, ghép câu rồi đọc câu; hoàn thành chỉ ghi lượt thực hành.

Giáo viên: chọn trẻ → Lộ trình của bé → Động vật/Xe cộ → xem bộ cấp 1 hoặc cấp 2 → xem trước rồi lưu. Có thể điều chỉnh từng bài và thứ tự bằng công cụ sẵn có. Đổi bộ bài làm tính lại quyền mở khóa; chỉ giữ điểm của bài còn trong cùng đích.

Lần khởi tạo, bộ mới theo cấp học của bài hướng dẫn đang giao trong lộ trình 1, nếu có; nếu chưa có thì dùng bộ cấp 1 làm điểm bắt đầu. Đây không phải đánh giá năng lực hoặc suy luận theo tuổi. Giáo viên cần chọn bộ và điều chỉnh phù hợp từng học sinh.

Điểm tách theo học sinh + `journeyId` + đích đến. Lộ trình cũ không có `journeyId` được hiểu là `life`. Điểm trung bình đích đến phải **trên 80** mới mở đích tiếp theo; bài chưa chấm tính 0 trong trung bình. Không chấm sự vâng lời, nhìn mắt hay số lần bấm thẻ.

## Dữ liệu và triển khai

`content/topic-journeys.mjs` chứa bài và hàm tạo kế hoạch. Khi máy chủ khởi động, bổ sung bài và kế hoạch còn thiếu; không ghi đè bài đã sửa hoặc điểm hiện có. Thêm học sinh cũng tạo đủ ba kế hoạch. Chạy lại không thêm trùng. Bản sao lưu hỗ trợ tối đa ba lộ trình mỗi trẻ và kiểm tra trùng theo cặp học sinh/lộ trình.

Các bài chủ đề gốc bị xóa sẽ được bổ sung lại khi chạy bước nạp nội dung (khởi động hoặc thêm học sinh). Để cá nhân hóa, dùng điều chỉnh danh sách bài của bé. Không dùng việc xóa bài gốc như cách ẩn bài lâu dài.

Đợt này đã sao lưu SQLite cục bộ vào `data/backups/before-topic-journeys-*.sqlite` trước khi nạp. Không kết nối hay cập nhật Supabase/Render. Lần deploy sau sẽ chạy bước bổ sung trên cơ sở dữ liệu được cấu hình.

Kiểm tra: `npm test` và `npm run test:ui`. Chạy `python scripts/prepare-voice.py` sau khi thay nhãn thẻ để bổ sung bản đọc tiếng Việt; công cụ này chỉ gửi văn bản bài mẫu, không gửi dữ liệu trẻ.
