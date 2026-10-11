# Bộ ảnh giao diện Cùng Con

Ảnh gốc do người dùng cung cấp trong `anh/`; không đổi tên hay sửa ảnh gốc. 12 bản WebP được chọn cho giao diện, gồm 3 trạm học, 3 sticker, 3 biểu tượng và nền/vườn/ảnh bìa. Xem `sources.json` để đối chiếu từng ảnh với tên tệp gốc.

Các ảnh gốc có kênh alpha nhưng đều đặc hoàn toàn, một số vẽ sẵn ô caro. Bản dùng trên web đã tách nền trung tính, cắt lề và giảm kích thước. Không dùng những ảnh còn họa tiết ô caro hoặc chữ vẽ sẵn làm nút hay sơ đồ tương tác.

- `art.mjs`: danh sách ảnh được phép phục vụ và hàm tạo ảnh trang trí (`alt=""`).
- `pathway-ui.mjs` + `artwork.css`: trạm học, đường nối SVG trên máy tính và đường nối dọc trên điện thoại. Chữ, điểm và nút chọn là HTML, không nằm trong ảnh.
- `app.js`: biểu tượng trang đăng nhập, lời chào giáo viên/phụ huynh, hướng dẫn học, ảnh bìa trang soạn bài và sticker hoàn thành lượt học.
- `sw.js`: lưu bộ ảnh công khai trong cache PWA. Khi đổi ảnh, tăng phiên bản cache.

Tái tạo bản WebP bằng `python scripts/prepare-art.py`. Công cụ chuẩn bị ảnh cần Pillow, NumPy và SciPy trên máy phát triển; máy chủ chạy ứng dụng không cần Python hay các thư viện này. Kiểm tra ảnh xem trước `tmp/prepared-art.jpg` sau khi tái tạo, đặc biệt nếu thay bộ ảnh gốc.

Sticker chỉ minh họa, không tự cấp huy hiệu, cộng điểm hay mở khóa lộ trình.
