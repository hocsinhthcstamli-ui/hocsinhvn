export function youtubeId(input) {
  if (typeof input !== 'string' || input.length > 1000) throw new Error('Liên kết YouTube không hợp lệ.');
  let url;
  try { url = new URL(input.trim()); } catch { throw new Error('Dán liên kết HTTPS đầy đủ của video YouTube.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Chỉ dùng liên kết HTTPS của YouTube.');
  let id;
  if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = /^\/(?:shorts|embed)\/([\w-]{11})\/?$/.exec(url.pathname)?.[1];
  }
  if (!/^[\w-]{11}$/.test(id || '')) throw new Error('Chọn liên kết một video YouTube, không dùng kênh hoặc danh sách phát.');
  return id;
}

export function youtubeValue(value) {
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Thông tin video YouTube không hợp lệ.');
  const id = youtubeId(value.url);
  const text = (key, max, required = true) => {
    if (typeof value[key] !== 'string' || value[key].length > max || (required && !value[key].trim())) throw new Error('Điền tên video, tên kênh và hướng dẫn trong giới hạn cho phép.');
    return value[key].trim();
  };
  return { url: `https://www.youtube.com/watch?v=${id}`, title: text('title', 200), channel: text('channel', 150), note: text('note', 1000, false) };
}

// Playback, sampled frames and Vietnamese captions checked 2026-10-11.
// This is an introductory song, not a complete step-by-step demonstration.
export const videoSuggestions = [
  { id: '8dWqtK8jI9o', title: 'Rửa tay với xà phòng cùng ĐSTC UNICEF Xuân Bắc', channel: 'UNICEF Viet Nam', duration: '0:54', lessonIds: ['primary-school-01'], note: 'Xem bài hát mở đầu nếu con thích, rồi chọn thẻ và thực hành rửa tay từng bước với người hỗ trợ. Con có thể bỏ qua video hoặc xin nghỉ.', review: 'Đã kiểm tra phát đến hết, hình ảnh theo mốc 5 giây và phụ đề tiếng Việt. Video dạng bài hát, có chữ tiếng Anh trong hình; phụ đề tự động có lỗi. Dùng mở đầu cho cấp 1, không thay hướng dẫn rửa tay và không yêu cầu học sinh đọc phụ đề.' },
];
