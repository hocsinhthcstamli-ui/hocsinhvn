# Ảnh thẻ và âm thanh tiếng Việt

- `cards/`: ảnh tách từ PDF người dùng đã cung cấp. `cards/sources.json` ghi rõ tài liệu, trang và vùng cắt. Nhãn vẫn hiển thị bằng HTML. Không coi ảnh trang trí lộ trình là hình mô tả đồ vật.
- `art/buddy-request.webp`: ảnh giao tiếp do người dùng cung cấp (`hmogv3…`), dùng ở đầu màn hình thực hành; sơ đồ, linh vật và sticker cũ tiếp tục dùng ở các màn tương ứng.
- `voice/`: 229 bản đọc cho các nội dung thẻ trong 44 bài hiện có, giọng `vi-VN-HoaiMyNeural`, tốc độ -10%. Tạo trước bằng `edge-tts`; Render và điện thoại chỉ phát MP3, không gọi dịch vụ TTS lúc học, không cần API key hoặc cài giọng tiếng Việt.

`card-art.mjs` chọn ảnh theo nhãn và danh sách từ tương đương đã khai báo; ảnh giáo viên tải lên luôn được ưu tiên. Thẻ chưa có ảnh tương ứng vẫn dùng biểu tượng cũ, không tự gán một hình sai nghĩa. Các ảnh nguồn giữ nguyên, không thay dữ liệu Supabase hay ghi đè bài giáo viên đã sửa.

Nút đọc câu phát lần lượt các bản đọc của thẻ đã ghép. Đây là ghép âm thanh theo thẻ, chưa phải tổng hợp ngữ điệu của cả câu. Chọn thẻ mới, xóa câu hoặc rời màn hình sẽ dừng lượt đọc cũ. Nội dung mới do giáo viên tự nhập có thể dùng giọng tiếng Việt của trình duyệt nếu sẵn có; nếu không, cần bổ sung bản thu cho nội dung đó. Không tự phát bằng giọng tiếng Anh.

PWA lưu ảnh và bản đọc công khai khi đã tải; không lưu dữ liệu học sinh vào cache này. Lần tải âm thanh đầu cần mạng. Chức năng đăng nhập và lưu tiến độ vẫn cần kết nối máy chủ.

Tái tạo tài nguyên trên máy phát triển:

```sh
python -m pip install Pillow pymupdf edge-tts
python scripts/prepare-card-art.py
python scripts/prepare-voice.py
```

Kiểm tra trực quan ảnh sau khi đổi vùng cắt hoặc gán nhãn. Khi thay nội dung hoặc giọng đọc của tài nguyên đã phát hành, tăng phiên bản cache trong `sw.js`. Không đưa tên trẻ, ghi chú cá nhân hoặc dữ liệu tài khoản vào công cụ tạo bản đọc.
