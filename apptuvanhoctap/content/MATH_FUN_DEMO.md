# 20 hoạt động mẫu — Lộ trình 4

Mỗi loại có 5 bài: nghe chọn hình, trình tự, phân loại, tìm cặp. Nghe/phân loại/tìm cặp dùng 4 ảnh; tìm cặp tạo 8 thẻ. Trình tự dùng 3 bước. Nội dung gồm đếm 1–6, tăng/giảm, thêm hai, chẵn/lẻ, số cạnh và hoạt động Toán trong cuộc sống.

Sáu thẻ số lượng được ghép bằng `scripts/prepare-math-counts.py` từ một khối trong ảnh người dùng cung cấp. Số lượng do vòng lặp xác định; không để mô hình ảnh tự vẽ số lượng. Các ảnh khác lấy từ học liệu hiện có. Có giọng đọc Việt cho từng đáp án nghe. Giáo viên có thể sửa như hoạt động tự tạo.

Chạy `node scripts/seed-math-fun.mjs` để nạp local có sao lưu và giao dịch. Dấu `math-fun-v1` ngăn nạp trùng hoặc ghi đè bài đã sửa/xóa. Giữ nguyên 60 hoạt động lộ trình 1–3, điểm và bộ ghép ảnh. Học sinh phải được giao lộ trình Toán mới thấy các hoạt động này; không tự giao thêm lộ trình khi nạp dữ liệu.
