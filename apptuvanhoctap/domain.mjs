export const domains = [
  ["communication", "Giao tiếp / AAC"],
  ["receptive", "Ngôn ngữ tiếp nhận"],
  ["cognition", "Nhận thức"],
  ["behavior", "Hành vi xã hội"],
  ["selfcare", "Tự phục vụ"],
  ["emotion", "Cảm xúc và cảm giác"],
];
export const roles = {
  admin: "Quản trị viên",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  child: "Học viên",
};
export const domainName = (id) => domains.find((d) => d[0] === id)?.[1] || id;
export function assessment(child) {
  const average =
    domains.reduce((n, [id]) => n + (child.assessment[id] || 0), 0) /
    domains.length;
  const level = average < 1.5 ? 1 : average < 2.5 ? 2 : average < 3.5 ? 3 : 4;
  return {
    average,
    level,
    label: [
      "Cần hỗ trợ nhiều",
      "Đang hình thành",
      "Thực hành có nhắc",
      "Gần độc lập",
    ][level - 1],
  };
}
export function recommended(child, lessons) {
  const { average, level } = assessment(child);
  return lessons.filter(
    (l) =>
      l.level <= Math.min(level, 3) &&
      (l.level === 1 || child.assessment[l.domain] <= Math.ceil(average)),
  );
}
export function sortedRecords(records, childId) {
  return records
    .filter((r) => r.childId === childId)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
}
export const percent = (correct, total) =>
  Math.round((correct / Math.max(1, total)) * 100);
export function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function seedData() {
  const raw = [
    [
      "aac-request-basic",
      "Con muốn gì?",
      "communication",
      1,
      "Trẻ chọn thẻ để yêu cầu đồ vật hoặc hoạt động.",
      "Con hãy chọn điều con muốn.",
      "topic",
      [
        ["Con muốn", "🙋"],
        ["xe", "🚗"],
        ["con chó", "🐕"],
        ["con mèo", "🐈"],
        ["nữa", "➕"],
        ["hết rồi", "✅"],
      ],
    ],
    [
      "behavior-yes-no",
      "Hành vi nên và không nên",
      "behavior",
      2,
      "Nhận biết và trao đổi về hành vi phù hợp.",
      "Hành vi nào nên làm?",
      "behavior",
      [
        ["gõ cửa", "🚪"],
        ["giơ tay", "✋"],
        ["đánh bạn", "⛔"],
        ["cãi nhau", "😠"],
        ["xếp hàng", "🧍"],
        ["chia sẻ", "🤝"],
      ],
    ],
    [
      "sequence-first-next",
      "Đầu tiên – tiếp theo – sau đó",
      "cognition",
      3,
      "Ghép các bước sinh hoạt theo thứ tự.",
      "Chọn thẻ theo thứ tự việc cần làm.",
      "aac",
      [
        ["Đầu tiên", "1️⃣"],
        ["Tiếp theo", "2️⃣"],
        ["Sau đó", "3️⃣"],
        ["rửa tay", "🧼"],
        ["ăn cơm", "🍚"],
        ["dọn dẹp", "🧹"],
      ],
    ],
    [
      "body-pain",
      "Con đau ở đâu?",
      "selfcare",
      2,
      "Dùng thẻ để diễn đạt vị trí đau và cảm giác.",
      "Con thấy thế nào?",
      "book",
      [
        ["đau đầu", "🤕"],
        ["đau bụng", "🩺"],
        ["đau tai", "👂"],
        ["sốt", "🌡️"],
        ["mệt", "😴"],
        ["ho", "😷"],
      ],
    ],
    [
      "colors-shapes",
      "Màu sắc và hình dạng",
      "cognition",
      1,
      "Nhận biết màu sắc và hình dạng quen thuộc.",
      "Con hãy chọn thẻ theo hướng dẫn.",
      "book",
      [
        ["xanh dương", "🔵"],
        ["xanh lá", "🟢"],
        ["màu tím", "🟣"],
        ["hình sao", "⭐"],
        ["mũi tên", "➡️"],
        ["hình tròn", "⭕"],
      ],
    ],
    [
      "emotion-taste",
      "Cảm xúc và vị giác",
      "emotion",
      3,
      "Diễn đạt cảm xúc và cảm giác.",
      "Con thấy thế nào?",
      "aac",
      [
        ["vui", "😊"],
        ["buồn", "😢"],
        ["nóng", "☀️"],
        ["lạnh", "❄️"],
        ["chua", "🍋"],
        ["ngọt", "🍯"],
      ],
    ],
    [
      "listen-action",
      "Nghe và làm theo",
      "receptive",
      1,
      "Làm theo một yêu cầu đơn giản với hỗ trợ phù hợp.",
      "Nghe hướng dẫn rồi chọn thẻ.",
      "custom",
      [
        ["ngồi xuống", "🪑"],
        ["đứng lên", "🧍"],
        ["vỗ tay", "👏"],
        ["đưa cho cô", "🤲"],
        ["nhìn", "👀"],
        ["nghe", "👂"],
      ],
    ],
    [
      "daily-care",
      "Con tự chăm sóc",
      "selfcare",
      1,
      "Nhận biết những việc chăm sóc bản thân hằng ngày.",
      "Bây giờ con cần làm gì?",
      "custom",
      [
        ["uống nước", "🥤"],
        ["rửa tay", "🧼"],
        ["đánh răng", "🪥"],
        ["đi vệ sinh", "🚽"],
        ["mặc áo", "👕"],
        ["đi ngủ", "🛏️"],
      ],
    ],
  ];
  return {
    schemaVersion: 2,
    children: [],
    dailyRecords: [],
    assessmentHistory: [],
    practiceSessions: [],
    lessons: raw.map(
      ([id, title, domain, level, goal, prompt, source, cards]) => ({
        id,
        title,
        domain,
        level,
        goal,
        prompt,
        source,
        cards: cards.map(([text, icon]) => ({ text, icon })),
      }),
    ),
  };
}
