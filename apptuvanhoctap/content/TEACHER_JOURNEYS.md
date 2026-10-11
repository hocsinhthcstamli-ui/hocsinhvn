# Quản lý lộ trình của giáo viên

Vào **Lộ trình**, chọn học sinh, rồi sử dụng **Thư viện lộ trình mẫu**. Giáo viên tạo, sửa, xóa mẫu dùng chung; mỗi mẫu có ba đích đến và danh sách bài học. Chọn **Xem trước & giao cho bé** để lưu một bản riêng cho học sinh đang chọn.

Sửa hoặc xóa mẫu không tự đổi bản đã giao. Muốn cập nhật bản đã giao, giáo viên xem trước và lưu lại cho từng học sinh. Các điểm của bài vẫn nằm ở cùng đích đến được giữ. Giáo viên cũng có thể điều chỉnh trực tiếp bản của bé.

**Gỡ lộ trình khỏi màn học** ẩn bản đã giao khỏi học sinh, giữ lịch sử và điểm trong báo cáo. Không xóa dữ liệu lịch sử. Học sinh chỉ thấy các lộ trình được giao còn hoạt động. Giáo viên chỉ giao, sửa và xem kết quả của học sinh được phân công; thư viện mẫu dùng chung giữa các giáo viên.

**Tiến độ và kết quả thực hành** hiển thị điểm từng đích đến cùng lịch sử hoàn thành ghép ảnh, luyện câu và câu hỏi video (50 lượt gần nhất). Dữ liệu thực hành do trình duyệt báo về máy chủ; đây không phải điểm đánh giá. Các lượt thực hành trước phiên bản này không được dựng lại. Điểm trung bình giáo viên chấm phải trên 80% mới mở đích đến kế tiếp.

`journeyTemplates` và `activityResults` nằm trong dữ liệu ứng dụng, được sao lưu/khôi phục cùng dữ liệu khác. Khi triển khai với PostgreSQL, chúng được lưu vào Supabase qua adapter hiện có; chạy local dùng SQLite. Không cần tạo bảng riêng.
