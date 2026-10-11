// Sources reviewed 2026-10-11: official watch metadata, Vietnamese transcript,
// storyboard frames every 10 seconds, and playback in the app's embed context.
// These are optional introductions, not complete demonstrations of every goal.
export const topicVideos = [
  {
    id: "JuD8GXnjJQw",
    title: "Bé Học Con Vật Nuôi Trong Gia Đình, Nông Trại | Con Gì Đây?",
    channel: "SuRiKa KiDs TV",
    duration: "3:36",
    lessonIds: ["animals-primary-01", "animals-primary-03", "animals-secondary-01", "animals-secondary-02", "animals-secondary-03"],
    note: "Xem đoạn con thỏ (0:40), mèo (1:14), ếch (1:40), cừu (2:02) hoặc dê (2:24), rồi chọn hình và nói điều con thích. Có thể dừng sau một con vật. Đây là hoạt hình nhận biết, không làm mẫu cách chạm hay chăm sóc động vật. Với cấp 2, dùng như tư liệu quan sát nếu em thích; không bắt hát hoặc nhắc lại.",
    review: "Đã đối chiếu lời tiếng Việt qua bản chép lời và hình theo mốc 10 giây. Hình 3D do AI tạo, có nhân vật em bé và gà trống; không dùng thay hình gà mái, không gắn vào bài chăm sóc/an toàn. Phụ đề tự động có thể sai. Trình nhúng phát được trong lần kiểm tra; không khẳng định đã nghe trực tiếp toàn bộ âm thanh.",
  },
  {
    id: "PLPaBj9yYUA",
    title: "XE GÌ ĐÂY, Ô TÔ GÌ ĐÂY giúp bé học các phương tiện giao thông | Nhạc thiếu nhi hoạt hình | Nhomnhom",
    channel: "Nhomnhom - Nhạc vui cho bé",
    duration: "2:27",
    lessonIds: ["vehicles-primary-01", "vehicles-primary-03", "vehicles-secondary-01", "vehicles-secondary-02", "vehicles-secondary-03"],
    note: "Xem ô tô con ở 0:08–0:29; bài xe hỗ trợ xem xe cứu thương ở 1:07–1:22. Sau đó chọn thẻ phương tiện hoặc ghép câu Con muốn đi. Video không minh họa đủ xe máy, xe buýt, thuyền và tàu điện: tiếp tục học các xe đó bằng thẻ. Có nhạc và tiếng xe; giảm âm lượng hoặc bỏ qua nếu con không thích.",
    review: "Đã đọc lời bài hát do kênh cung cấp, bản chép lời tiếng Việt và xem hình theo mốc 10 giây. Hình minh họa AI, có cảnh xe cứu hỏa và lửa; chỉ dùng đoạn phương tiện phù hợp, không dùng làm hướng dẫn xử trí khẩn cấp. Trình phát trang nguồn đã chạy tới hết trong kiểm tra; phụ đề tự động có lỗi nhận dạng.",
  },
  {
    id: "eRQkxlFQRMs",
    title: "BÉ VUI CHƠI AN TOÀN 3 - CHIẾC MŨ BẢO HIỂM",
    channel: "Honda Việt Nam Official",
    duration: "3:47",
    lessonIds: ["vehicles-primary-05", "vehicles-secondary-05"],
    note: "Cùng xem đoạn giải thích mũ bảo hiểm khoảng 1:19–2:00, rồi chọn thẻ mũ và nhờ người lớn kiểm tra mũ đúng cỡ, cài quai đúng cách. Phim có đua xe đạp trong khu vui chơi; không làm theo cảnh thi đua ngoài đường. Video chỉ hỗ trợ phần mũ bảo hiểm, không dạy thắt dây an toàn trên ô tô. Con có thể bỏ qua video.",
    review: "Nguồn Honda Việt Nam Official. Đã đối chiếu bản chép lời tiếng Việt và hình theo mốc 10 giây: hoạt hình 2D, giải thích bảo vệ đầu và cài quai, có cảnh thi đua và nhận diện thương hiệu. Không dùng phim như đánh giá kỹ năng thực tế hoặc hướng dẫn lựa chọn thiết bị bảo vệ cho từng trẻ.",
  },
];

export function attachTopicVideos(data, originals) {
  const attached = [];
  for (const video of topicVideos) for (const id of video.lessonIds) {
    const lesson = data.lessons.find(l => l.id === id);
    const original = originals.find(l => l.id === id);
    // Preserve teacher content, uploaded/Drive sources and deliberate removals.
    if (!lesson || !original || lesson.videoId || Object.hasOwn(lesson, "youtube") || Object.hasOwn(lesson, "drive")) continue;
    if (!Object.entries(original).every(([key, value]) => JSON.stringify(lesson[key]) === JSON.stringify(value))) continue;
    lesson.youtube = { url: `https://www.youtube.com/watch?v=${video.id}`, title: video.title, channel: video.channel, note: video.note };
    attached.push(id);
  }
  return attached;
}
