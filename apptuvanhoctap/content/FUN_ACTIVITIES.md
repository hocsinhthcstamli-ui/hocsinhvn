# Hoạt động vui vẻ

Trong mỗi lộ trình, mục **Hoạt động vui vẻ** thay mục Ghép ảnh. Học sinh chọn Ghép ảnh 4 mảnh hoặc một hoạt động do giáo viên tạo: Nghe rồi chọn hình, Xếp đúng trình tự, Kéo thả phân loại, Lật thẻ tìm cặp.

Giáo viên mở lộ trình đã giao, vào mục này và chọn **Tạo hoạt động**. Mỗi bài gồm 2–8 ảnh. Ảnh tải lên tối đa 10 MB được trình duyệt thu nhỏ thành WebP; mỗi ảnh lưu dưới 300 KB. Bài nghe cần tệp giọng đọc tiếng Việt riêng cho từng ảnh (MP3/WAV/OGG/WebM, tối đa 1 MB mỗi tệp), không dùng giọng hệ điều hành. Phân loại cần 2–4 tên nhóm. Trình tự dùng thứ tự ảnh trong biểu mẫu; nút Lên/Xuống chỉnh đáp án. Tìm cặp tự tạo hai thẻ cho mỗi ảnh.

Giáo viên có thể sửa hoặc xóa; bài dùng chung cho những học sinh được giao cùng ID lộ trình. Chỉnh bài áp dụng cho lượt mở tiếp theo. Hoạt động chưa gắn với một đích đến riêng: học sinh được giao lộ trình còn hoạt động có thể chơi. Không tự sao chép hoạt động sang bộ mẫu có ID khác.

Kết quả lưu số nhiệm vụ hoàn thành và lần thử chưa khớp; không thay điểm giáo viên hoặc mở khóa đích đến. Xóa bài giữ lịch sử. Hoạt động nằm trong `funActivities`, được lọc theo lộ trình có quyền truy cập và được sao lưu cùng dữ liệu ứng dụng. Backend chỉ cho giáo viên quản lý, kiểm tra quyền học sinh khi ghi kết quả. Giới hạn toàn ứng dụng 200 bài hoạt động và snapshot 22 MB như cơ chế hiện có.

Lộ trình 1 đã có bộ 20 hoạt động demo nạp riêng, mô tả tại `LIFE_FUN_DEMO.md`. Các lộ trình khác chưa nạp demo cho bốn loại mới. Bộ tranh ghép đã có vẫn giữ. Nội dung kiểm thử tự động chỉ được tạo trong cơ sở dữ liệu tạm.
