import { videoSuggestions } from '../youtube.mjs';
const source = videoSuggestions.find(v => v.id === '8dWqtK8jI9o');
export const reviewedVideos = [{
  lessonIds: ['primary-school-01'],
  youtube: {
    url: `https://www.youtube.com/watch?v=${source.id}`,
    title: source.title,
    channel: source.channel,
    note: source.note,
  },
  review: {
    date: '2026-10-11',
    durationSeconds: 53.421,
    playback: 'Trình phát chính thức chạy tới ended=true, không có lỗi media trong lượt kiểm tra.',
    method: 'Đối chiếu thông tin oEmbed của UNICEF Viet Nam; xem khung hình mỗi 5 giây và phụ đề tiếng Việt xuyên suốt. Không đánh giá trực tiếp chất lượng âm thanh.',
    limits: 'Bài hát mở đầu, chữ tiếng Anh có trong hình, phụ đề tự động có lỗi. Không dùng như quy trình vệ sinh chuẩn hoặc nội dung cấp 2.',
  },
}];
