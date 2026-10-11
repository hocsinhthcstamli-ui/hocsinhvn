# Bộ ảnh mới và màn chọn lộ trình

Đợt đầu đã gắn ảnh và màn chọn. Đợt tiếp theo đã nạp bài học Động vật/Xe cộ; xem `content/TOPIC_JOURNEYS.md` để biết nội dung và cách giao bài.

- Lộ trình 1: bài, điểm, phân công và ba đích đến hiện có được giữ nguyên.
- Lộ trình 2 — Khám phá động vật: ba đích đến, bộ bài riêng cấp 1 và cấp 2.
- Lộ trình 3 — Khám phá xe cộ: ba đích đến, bộ bài riêng cấp 1 và cấp 2.
- `journey-ui.mjs` hiển thị ba thẻ; mỗi lộ trình có kế hoạch và điểm riêng, không sao chép điểm cũ.
- Không dùng độ tuổi để suy ra năng lực; giáo viên chọn và điều chỉnh bộ bài.

33 ảnh WebP được tạo bằng `python scripts/prepare-new-art.py`, tổng khoảng 1,2 MB. `new-sources.json` lưu tên gốc, SHA-256, loại ảnh và kích thước đầu ra. Ảnh gốc và bản tải trùng vẫn nằm nguyên trong `anh/`.

Đã chuẩn bị 8 hình con vật, 7 hình phương tiện, 6 sticker, ảnh bìa và tranh tình huống. Một số ảnh dành cho đợt nội dung tiếp theo, chưa xuất hiện trong bài học. `card-art.mjs` ưu tiên ảnh mới cho nhãn phù hợp; ảnh do giáo viên tải lên vẫn được ưu tiên cao nhất. Không dùng ảnh gà mái cho nhãn gà trống, hoặc ảnh tàu điện cho nhãn tàu hỏa.

Không chọn bản ảnh chụp thật ở trạm xe buýt (`r9iqtr…`) vì khác phong cách minh họa đang dùng; không chọn bản đường phố nhiều chữ (`54bluv…`). Không suy ra rằng đã có đủ 70 ảnh: danh mục mới chỉ gồm các ảnh thực tế có và đã chọn. Tranh mũ bảo hiểm, dây an toàn đã dùng trong bài chuẩn bị chuyến đi, kèm hướng dẫn người lớn kiểm tra đồ bảo vệ phù hợp.

PWA cache v14 bao gồm các tài nguyên công khai mới. Không cache dữ liệu riêng; bản đọc tiếng Việt được lưu sau khi sử dụng theo cơ chế hiện có.
