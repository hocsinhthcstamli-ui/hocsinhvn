# Lớp mô phỏng 39 học sinh

Dữ liệu dành cho thử nghiệm local, không phải hồ sơ học sinh thật. Tên hồ sơ có tiền tố `[DEMO 01]` đến `[DEMO 39]`. Không đẩy dữ liệu này lên Supabase hoặc nhập đè production.

Bản xuất để lưu trên Git: `content/demo-class-39.json` gồm 39 hồ sơ mô phỏng, 195 lộ trình, 342 buổi học, 99 lần đánh giá, 381 lượt AAC và 342 kết quả hoạt động. ID học sinh/người ghi đã được đổi thành mã demo. Không chứa tài khoản, mật khẩu, phiên đăng nhập, hồ sơ cũ hoặc chuỗi kết nối database. Các bài học được tham chiếu bằng ID trong bộ nội dung ứng dụng.

Tệp này là dữ liệu mẫu để nhập ở bước riêng, không phải bản sao lưu toàn bộ database và không dùng trực tiếp với API restore. Push Git/Render deploy **không tự nhập** lớp demo vào Supabase. Việc nhập database production được để lại sau.

## Xem thử

- Giáo viên `test2`: Tổng quan → chọn học sinh → Tiến bộ / Lộ trình của bé.
- Học viên `demo.hs01` đến `demo.hs39`: chọn vai trò Học viên.
- Mật khẩu truyền qua biến môi trường khi chạy script, không ghi vào mã nguồn hay manifest.
- Mỗi học sinh được giao 5 lộ trình, có điểm giáo viên và kết quả thực hành riêng.

## Kịch bản

| Nhóm | Số học sinh | Đặc điểm dữ liệu |
| --- | ---: | --- |
| Tiến bộ đều | 7 | Số lượt đúng tăng, mức nhắc giảm |
| Cần hỗ trợ nhiều | 7 | Kết quả thấp, mức nhắc 3/3 |
| Kết quả dao động | 7 | Số lượt đúng thay đổi giữa các buổi |
| Vững kỹ năng nền | 6 | Điểm cao, ít nhắc, đủ điều kiện mở các đích tiếp theo |
| Điểm tốt nhưng cần nhắc | 6 | Kết quả tốt nhưng mức nhắc 2/3 |
| Mới bắt đầu | 6 | Chỉ có hai buổi mô phỏng, chưa có đánh giá kỹ năng |

Ngày các buổi lịch sử là 02–11/10/2026; lịch sử đánh giá là 01, 06, 11/10/2026. Đây là ngày kịch bản giả lập. Thời điểm ghi nhận hoạt động được API đóng dấu tại lúc chạy, không giả mạo thời gian máy chủ. Lượt học qua trình duyệt có ngày thực tế do ứng dụng ghi.

Các nhóm trên là **nhãn kịch bản do người tạo dữ liệu đặt**, không phải kết luận hệ thống phân tích. Hiện ứng dụng hiển thị báo cáo, gợi ý bài dựa trên đánh giá, điều kiện mở khóa trên 80% và danh sách cần theo dõi (thiếu đánh giá, thiếu buổi học hoặc còn cần hỗ trợ). Chưa có mô hình AI hay thuật toán xác nhận xu hướng qua nhiều buổi.

## Công cụ và an toàn dữ liệu

1. Dừng máy chủ local trước khi chạy `node scripts/seed-demo-class.mjs`.
2. Đặt `DEMO_ADMIN_PASSWORD`, `DEMO_TEACHER_PASSWORD`, `DEMO_STUDENT_PASSWORD` trong môi trường tiến trình.
3. Script sao lưu SQLite bằng API backup nhất quán vào `data/backups/` trước lần nạp đầu. Đường dẫn nằm trong `data/demo-class-39.json`.
4. Mọi thao tác ghi dùng API có xác thực: admin tạo/phân công, giáo viên chấm điểm, học viên thực hành. Chỉ đọc revision trực tiếp từ SQLite để tránh tải lại snapshot ảnh lớn.
5. Manifest lưu các bước đã thành công để tiếp tục khi lỗi. Nếu tiến trình bị dừng ngay sau khi server ghi nhưng trước khi ghi manifest, cần kiểm tra bản ghi cuối trước khi chạy lại vì lượt thực hành/buổi học chưa hỗ trợ khóa chống trùng.
6. Kiểm thử trình duyệt: `node scripts/check-demo-class-browser.mjs`. Công cụ đăng nhập từng học viên, hoàn thành một lượt AAC, đối chiếu dữ liệu và kiểm tra màn giáo viên. Mỗi lần chạy thêm một lượt học cho mỗi tài khoản.
7. Máy chủ kiểm thử được khởi động theo đợt để không vượt giới hạn đăng nhập. Không sửa hoặc vô hiệu hóa giới hạn trong mã ứng dụng.
8. Sau kiểm thử, chạy lại `npm start`. Dữ liệu và manifest nằm trong `data/`, ảnh kiểm tra trong `tmp/demo-class/`; các thư mục này bị loại khỏi Git.

Muốn quay về trước khi nạp: dừng ứng dụng và khôi phục bản SQLite đã sao lưu. Việc đó cũng loại các thay đổi phát sinh sau bản sao lưu, nên cần xem lại trước khi thực hiện.
