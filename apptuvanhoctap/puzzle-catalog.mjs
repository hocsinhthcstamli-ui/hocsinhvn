export const puzzlePacks = {
  computer:[
    ['journey-computer','Cùng khám phá máy tính'],['computer-devices','Bộ máy tính'],
    ['computer-practice','Thao tác trên máy'],['computer-break','Nghỉ mắt và vận động'],
    ['computer-mouse','Chuột máy tính'],['computer-keyboard','Bàn phím'],
    ['computer-typing','Luyện gõ phím'],['computer-help','Nhờ giáo viên hỗ trợ'],
    ['computer-folder','Thư mục bài học'],['computer-safe','Bảo vệ tài khoản'],
  ].map(([id,title])=>({id,title,src:`/assets/puzzles/computer/${id}.webp`})),
  math: [
    ['journey-math','Cùng học toán'],['math-shopping','Mua đồ dùng'],
    ['math-stage-2','Khám phá hình học'],['math-counting','Sáu khối đếm'],
    ['math-clock','Đồng hồ ba giờ'],['math-solids','Các hình khối'],
    ['math-shapes','Các hình phẳng'],['math-measuring','Đo độ dài'],
    ['math-fractions','Chia bánh thành bốn phần'],['math-sharing','Chia đều bút'],
  ].map(([id,title])=>({id,title,src:`/assets/puzzles/math/${id}.webp`})),
  animals: [
    ["animal-cat", "Chú mèo"], ["animal-rabbit", "Bạn thỏ"],
    ["animal-hen", "Gà mái"], ["animal-duck", "Chú vịt"],
    ["animal-goat", "Bạn dê"], ["animal-sheep", "Bạn cừu"],
    ["animal-frog", "Ếch xanh"], ["animal-elephant", "Chú voi"],
    ["animals-discover", "Khám phá các con vật"], ["animals-practice", "Cùng quan sát động vật"],
  ].map(([id, title]) => ({ id, title, src: `/assets/puzzles/animals/${id}.webp` })),
  vehicles: [
    ["vehicle-car", "Ô tô con"], ["vehicle-motorbike", "Xe máy"],
    ["vehicle-bus", "Xe buýt"], ["vehicle-ambulance", "Xe cứu thương"],
    ["vehicle-helicopter", "Trực thăng"], ["vehicle-boat", "Thuyền"],
    ["vehicle-metro", "Tàu điện"], ["vehicle-helmet", "Đội mũ bảo hiểm"],
    ["vehicle-seatbelt", "Thắt dây an toàn"], ["vehicles-practice", "Chuyến đi cùng nhau"],
  ].map(([id, title]) => ({ id, title, src: `/assets/puzzles/vehicles/${id}.webp` })),
  life: [
    ["buddy-welcome", "Chào bạn mới"], ["buddy-request", "Con muốn nói"],
    ["buddy-growing", "Cùng con lớn lên"], ["buddy-success", "Con làm được rồi"],
    ["stage-1", "Bước đầu làm quen"], ["stage-2", "Thực hành mỗi ngày"],
    ["stage-3", "Con tự lập"], ["badge-start", "Khởi đầu nhỏ"],
    ["badge-connect", "Kết nối bạn bè"], ["badge-independent", "Tự tin hơn"],
    ["garden", "Khu vườn của con"], ["communication-help", "Cùng giúp nhau"],
    ["lesson-cover", "Cùng nhau học"], ["journey-life", "Hành trình xanh"],
    ["sticker-explore", "Bạn nhỏ khám phá"], ["sticker-care", "Quan tâm nhau"],
    ["sticker-choose", "Con lựa chọn"], ["sticker-together", "Chúng mình cùng làm"],
    ["sticker-step", "Từng bước nhỏ"], ["sticker-wave", "Lời chào thân thương"],
  ].map(([id, title]) => ({ id, title, src: `/assets/puzzles/life/${id}.webp` })),
};
export const puzzleFiles = Object.values(puzzlePacks).flat().map(p => p.src);
export function shuffledPieces(random = Math.random) {
  const result = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.every((n, i) => n === i)) [result[0], result[1]] = [result[1], result[0]];
  return result;
}
