import { cardPictures } from "./card-art-manifest.mjs";
const suppliedPictures = {};
for (const [name, words] of [
  ["animal-cat", ["con mèo", "mèo"]],
  ["animal-rabbit", ["con thỏ", "thỏ"]],
  ["animal-hen", ["con gà", "gà", "gà mái"]],
  ["animal-duck", ["con vịt", "vịt"]],
  ["animal-goat", ["con dê", "dê"]],
  ["animal-sheep", ["con cừu", "cừu"]],
  ["animal-frog", ["con ếch", "ếch"]],
  ["animal-elephant", ["con voi", "voi"]],
  ["vehicle-car", ["xe", "ô tô", "xe ô tô"]],
  ["vehicle-motorbike", ["xe máy"]],
  ["vehicle-bus", ["xe buýt"]],
  ["vehicle-ambulance", ["xe cứu thương"]],
  ["vehicle-helicopter", ["trực thăng", "máy bay trực thăng"]],
  ["vehicle-boat", ["thuyền", "thuyền chèo"]],
  ["vehicle-metro", ["tàu điện", "tàu điện đô thị"]],
  ["vehicle-helmet", ["đội mũ bảo hiểm"]],
  ["vehicle-seatbelt", ["thắt dây an toàn"]],
  ["communication-help", ["con cần giúp", "giúp con", "em cần giúp"]],
  ["communication-together", ["đi cùng con", "đi cùng em được không?"]],
]) for (const word of words) suppliedPictures[word] = `/assets/art/${name}.webp`;

// Exact, reviewed equivalents. Never guess a picture from a negated sentence.
const aliases = {};
function equivalents(picture, labels) {
  for (const label of labels) aliases[label.toLocaleLowerCase("vi")] = picture;
}
equivalents("chào", ["Con chào"]);
equivalents("con muốn", ["Con muốn đi"]);
equivalents("chọn", ["Con chọn"]);
equivalents("đặt câu hỏi", ["Con chưa biết"]);
equivalents("thích", ["Con thích"]);
equivalents("không thích", ["Con không thích"]);
equivalents("sợ", ["Con sợ"]);
equivalents("con chó", ["chó"]);
equivalents("không muốn", ["Con không muốn"]);
equivalents("uống nước", ["nước"]);
equivalents("hết rồi", ["Con xong rồi"]);
equivalents("vẽ", ["vẽ tranh"]);
equivalents("giúp", ["giúp con", "Con cần giúp", "Em cần giúp", "Em cần hỗ trợ", "Em cần người hỗ trợ", "Nhờ người hỗ trợ", "Gọi người giúp con", "Em tìm người khác giúp"]);
equivalents("uống nước", ["nước uống", "bình nước", "Con cần nước", "Em cần nước"]);
equivalents("mệt", ["Em thấy mệt", "nghỉ một chút", "Con cần nghỉ", "Con muốn nghỉ", "Em cần nghỉ"]);
equivalents("ồn", ["ồn quá", "âm thanh lớn"]);
equivalents("chờ", ["Con chờ", "Thêm thời gian", "Cho em thêm thời gian", "Em cần thêm thời gian", "Con chờ ở đây", "Em chờ ở điểm hẹn", "Chờ con bên ngoài"]);
equivalents("dừng lại", ["Con dừng lại", "Mình dừng một chút"]);
equivalents("hết rồi", ["Con đã xong", "Con làm xong", "Em đã xong", "Con ăn đủ rồi", "Em ăn đủ rồi"]);
equivalents("rửa tay", ["Con rửa tay", "Em rửa tay", "Chà tay"]);
equivalents("mở nước", ["Làm ướt tay", "Xả sạch"]);
equivalents("đi vệ sinh", ["Con cần đi vệ sinh"]);
equivalents("cất đồ", ["Cất vào đây", "cất vào cặp", "Cất vào túi riêng"]);
equivalents("không", ["Không, cảm ơn", "Con không đồng ý", "Em không đồng ý", "Em chưa đồng ý", "Em không chia sẻ"]);
equivalents("không muốn", ["Con chưa muốn nói", "Em chưa muốn chia sẻ", "Con không chọn món này", "Em không chọn món này", "Con không mua nữa", "Em chưa mua"]);
equivalents("chia sẻ", ["Mình làm cùng nhé", "Em làm cùng bạn", "Cho con mượn nhé", "Cho em mượn được không?", "Con trả bạn", "Em trả lại bạn"]);
equivalents("chọn", ["Con chọn món này", "Em chọn món này", "Con chọn việc này", "Con chọn việc khác", "Con chọn đồ khác", "Con chọn món khác", "Em chọn món khác", "Em chọn phần này", "Em chọn hoạt động này"]);
equivalents("đặt câu hỏi", ["Con chưa hiểu", "Em chưa rõ", "Em chưa rõ yêu cầu", "Em chưa rõ bước này", "Giải thích giúp con", "Giải thích trước giúp em"]);
equivalents("thầy giáo", ["Nhờ cô/thầy giúp", "Gọi cô/thầy giúp con"]);
equivalents("bác sĩ", ["Cô/chú y tế"]);
equivalents("mặc thêm áo", ["mặc áo", "Quần áo thay"]);
equivalents("đầu", ["đau đầu"]);
equivalents("tai", ["đau tai"]);

export function cardImage(card) {
  if (card.image) return card.image;
  const text = card.text.normalize("NFC").trim().toLocaleLowerCase("vi");
  return suppliedPictures[text] || cardPictures[text] || cardPictures[aliases[text]] || "";
}
