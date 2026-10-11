# Hoạt động trong màn học

`lesson-activities.mjs` bổ sung hai phần:

- Câu hỏi chọn ảnh: 5 câu cho mỗi nguồn video đã tuyển (con vật, xe cộ, mũ bảo hiểm). Câu hỏi chỉ xuất hiện khi bài đang gắn đúng nguồn; video giáo viên thay hoặc Drive khác không bị gán câu hỏi không liên quan. Có mốc xem lại, câu trả lời đúng/sai nhẹ nhàng và câu hỏi sở thích không chấm đúng/sai.
- 5 lượt luyện câu AAC cho tất cả bài: ba mẫu lấy từ thẻ hiện có, cộng câu nhờ giúp và câu kết thúc. Đây là mẫu tự sinh từ thẻ, không phải 340 câu được biên soạn riêng. Học sinh nghe mẫu, chọn thẻ theo thứ tự, nghe câu vừa ghép và chuyển lượt. Bảng ghép tự do vẫn giữ nguyên. Từ/cụm thẻ đọc bằng MP3 tiếng Việt đã đóng gói.

Hoàn thành đủ 5 câu luyện hoặc 5 câu hỏi video sẽ lưu một lượt kết quả vào cơ sở dữ liệu của máy chủ, gồm bài học, lộ trình, thời gian và số lần thử chưa khớp. Giáo viên xem ở phần kết quả thực hành; kết quả không thay điểm giáo viên dùng để mở đích đến. Tiến trình chưa hoàn thành chỉ tồn tại trong màn học hiện tại. Nút hoàn thành buổi học hiện có vẫn ghi lượt thực hành theo cơ chế cũ. Câu tự nói khác mẫu không được coi là giao tiếp sai; chỉ phản hồi khác thứ tự trong bài tập ghép theo mẫu.

Khi thêm nguồn video mới, cần soạn `videoQuestions` theo nội dung nguồn và kiểm tra lại hình lựa chọn; không suy đoán đáp án từ tên video. Thay từ trong mẫu cần chạy `python scripts/prepare-voice.py` để cập nhật bản đọc. Kiểm thử: `tests/ui/lesson-activities.spec.mjs`.
