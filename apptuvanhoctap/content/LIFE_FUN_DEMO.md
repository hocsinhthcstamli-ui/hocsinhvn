# 20 hoạt động mẫu cho lộ trình 1

Nội dung trong `life-fun.mjs`: 5 bài nghe chọn hình (sinh hoạt, cảm xúc, giao tiếp, vệ sinh, vui chơi); 5 bài trình tự (rửa tay, chơi/cất đồ, gõ cửa/chào, bữa cơm, lịch buổi sáng); 5 bài phân loại; 5 bộ tìm cặp theo đồ ăn, quần áo, cảm xúc, giao tiếp và tự chăm sóc.

Nghe, phân loại và tìm cặp dùng 4 ảnh mỗi bài; tìm cặp tạo 8 thẻ. Trình tự dùng 3 bước mỗi bài, là lịch/tình huống minh họa có hướng dẫn, không phải quy trình vệ sinh đầy đủ hoặc thứ tự bắt buộc cho mọi học sinh. Không chia cảm xúc thành tốt/xấu. Giáo viên có thể sửa tên, ảnh, âm thanh và đáp án như hoạt động tự tạo.

Ảnh lấy từ các thẻ AAC đã có và ảnh người dùng cung cấp, đã xem lại ảnh ghép tổng hợp. Bài nghe có giọng Việt đóng gói, kể cả các bản đọc bổ sung trong `prepare-voice.py`.

Nạp vào SQLite local đã khởi tạo:

```powershell
node scripts/seed-life-fun.mjs
```

Script sao lưu SQLite trước khi ghi, dùng giao dịch, kiểm tra giới hạn 22 MB và ghi nhật ký. Dấu `life-fun-v1` ngăn nạp trùng hoặc dựng lại bài giáo viên đã xóa. Bài có ID cố định `life-fun-LOAI-SO`; bản trùng ID hiện có được giữ. Không đổi bài học, bản giao, điểm, tài khoản hoặc các lộ trình khác. Bộ dữ liệu sau nạp local khoảng 1,3 MB.

Chỉ nạp local theo yêu cầu hiện tại; không tự nạp trên mỗi lần máy chủ khởi động. Khi triển khai production, cần nhập bổ sung bộ hoạt động qua quy trình cập nhật dữ liệu, không thay snapshot production bằng SQLite local.
