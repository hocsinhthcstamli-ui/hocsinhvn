export const schoolBands = {
  primary: "Cấp 1 · Lớp 1–5",
  secondary: "Cấp 2 · Lớp 6–9",
};
export const curriculumTemplates = {
  primary: [
    [
      "Giao tiếp và làm quen trường lớp",
      "Bày tỏ nhu cầu, cảm xúc và yêu cầu hỗ trợ trong hoạt động quen thuộc.",
    ],
    [
      "Sinh hoạt học đường",
      "Thực hành tự chăm sóc, chuẩn bị và phối hợp với bạn.",
    ],
    [
      "Vận dụng và tự lập",
      "Dùng kỹ năng trong nhiều bối cảnh và lựa chọn cách giải quyết.",
    ],
  ],
  secondary: [
    [
      "Chủ động giao tiếp và tự hỗ trợ",
      "Nêu lựa chọn, yêu cầu điều chỉnh và tham gia hoạt động học đường.",
    ],
    [
      "Quản lý sinh hoạt cá nhân",
      "Lập kế hoạch, chăm sóc bản thân và phối hợp trong trường.",
    ],
    [
      "Vận dụng trong cộng đồng",
      "Ra quyết định, giao tiếp an toàn và tự lập có hỗ trợ.",
    ],
  ],
};
export function makeCurriculumPlan(childId, band, lessons) {
  if (!Object.hasOwn(curriculumTemplates, band))
    throw new Error("Cấp học không hợp lệ.");
  const ids = Array.from(
    { length: 6 },
    (_, index) => `foundation-${band}-${String(index + 1).padStart(2, "0")}`,
  );
  if (!ids.every((id) => lessons.some((lesson) => lesson.id === id)))
    throw new Error("Chưa nạp đủ bộ bài giai đoạn 1 trên máy chủ.");
  const groups = band === 'primary' ? ['school', 'apply'] : ['daily', 'community'];
  const packs = groups.map(group => {
    const pack = Array.from({length: 6}, (_, i) => `${band}-${group}-${String(i + 1).padStart(2, '0')}`);
    const count = pack.filter(id => lessons.some(l => l.id === id)).length;
    if (count && count !== pack.length) throw new Error(`Bộ bài ${schoolBands[band]} chưa đầy đủ. Hãy chạy lại seed:phase${band === 'primary' ? 2 : 3} trước khi dùng mẫu.`);
    return count ? pack : [];
  });
  return {
    childId,
    stages: curriculumTemplates[band].map(([title, goal], index) => ({
      id: String(index + 1),
      title,
      goal,
      lessonIds: index === 0 ? ids : packs[index - 1],
      lessonScores: {},
    })),
  };
}
export function curriculumReady(lessons, band) {
  return Array.from(
    { length: 6 },
    (_, i) => `foundation-${band}-${String(i + 1).padStart(2, "0")}`,
  ).every((id) => lessons.some((l) => l.id === id));
}
