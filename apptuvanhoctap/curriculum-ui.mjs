import { schoolBands, curriculumReady } from "./curriculum.mjs";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function guideMarkup(guide) {
  const list = (title, items, ordered = false) =>
    `<section><h3>${title}</h3><${ordered ? "ol" : "ul"}>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</${ordered ? "ol" : "ul"}></section>`;
  return `<div class="teaching-guide"><p class="badge">${schoolBands[guide.band]} · Khoảng ${guide.durationMinutes} phút</p>${list("Chuẩn bị", guide.materials)}${list("Các bước tổ chức", guide.steps, true)}${list("5 cơ hội quan sát", guide.practice, true)}<section><h3>Tiêu chí của bài</h3><p>${esc(guide.success)}</p></section><section><h3>Cách chấm 0–100</h3><p>${esc(guide.scoring)}</p></section><section><h3>Điều chỉnh hỗ trợ</h3><p>${esc(guide.support)}</p></section><section><h3>Thực hành ở nhà</h3><p>${esc(guide.homePractice)}</p></section></div>`;
}
export function curriculumChooser(lessons) {
  if (!Object.keys(schoolBands).some((band) => curriculumReady(lessons, band)))
    return "";
  return `<details class="curriculum-picker"><summary>Mẫu lộ trình theo cấp học</summary><p>Chọn theo bối cảnh và nhu cầu hỗ trợ thực tế. Xem số bài của từng lộ trình trong bản xem trước và chỉnh trước khi lưu cho học sinh. Lộ trình chưa có bài sẽ hiển thị đang chuẩn bị nội dung.</p><div class="button-row">${Object.entries(
    schoolBands,
  )
    .map(
      ([band, label]) =>
        `<button class="secondary" data-action="previewCurriculum" data-band="${band}" ${curriculumReady(lessons, band) ? "" : "disabled"}>Xem mẫu ${label}</button>`,
    )
    .join("")}</div></details>`;
}
