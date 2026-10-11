# Ghép ảnh 4 mảnh — cả ba lộ trình

Vào lộ trình → Chơi ghép ảnh → chọn tranh. Lộ trình 1 có 20 tranh, Động vật có 10 tranh (8 con vật và 2 cảnh), Xe cộ có 10 tranh (7 phương tiện, 2 cảnh bảo vệ và 1 chuyến đi). Mỗi ảnh vuông được chia thành bốn phần bằng vùng hiển thị CSS, trộn vị trí trong khay; không cần tải bốn tệp riêng.

- Kéo bằng chuột hoặc cảm ứng, hoặc chạm mảnh rồi chạm ô. Bàn phím: Tab đến mảnh/ô và Enter hoặc Space.
- Ô đúng giữ mảnh; ô sai báo thử lại bằng chữ. Có ảnh mẫu, trộn lại, chọn tranh, tranh tiếp theo và thông báo hoàn thành.
- Không tính thời gian, trừ điểm hay thay đổi điểm mở khóa. Mỗi lượt ghép đủ 4 mảnh lưu tên tranh, lộ trình, thời gian và số lần đặt chưa khớp vào cơ sở dữ liệu của máy chủ. Giáo viên xem trong phần kết quả thực hành. Dấu hoàn thành trong bộ chọn tranh chỉ tồn tại trong lần mở game; lịch sử đã lưu vẫn được giữ. Lỗi lưu có nút thử lại.
- `puzzlePacks` phân bộ theo lộ trình; bộ tranh, lượt chơi và nút quay về giữ đúng lộ trình đang chọn.

`scripts/prepare-puzzles.py` cắt bớt nền trống từ ảnh có sẵn trong `assets/art`, tạo bản vuông 640px tại `assets/puzzles/{life,animals,vehicles}`, giữ nguyên ảnh gốc. Chạy bằng Python + Pillow. Danh mục và tên tranh nằm trong `puzzle-catalog.mjs`; các tệp công khai được khai báo trong server và PWA cache v18.

Kiểm thử giao diện trong `tests/ui/puzzle.spec.mjs` bao gồm chuột, cảm ứng thật qua CDP, hủy kéo, bàn phím, đặt sai/đúng, chơi lại, ảnh tải được, bố cục 320–1024px, lưu lượt chơi và giữ nguyên điểm giáo viên.
