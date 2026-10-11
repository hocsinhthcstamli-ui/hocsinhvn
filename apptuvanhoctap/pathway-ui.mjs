import { stageProgress, stageUnlocked } from "./pathways.mjs";
import { picture } from "./art.mjs";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function pathwayView(plan, lessons, teacher, name, selected, journey = { number: 1 }) {
  if (!plan)
    return '<section class="panel"><h2>Chưa có lộ trình</h2><p>Giáo viên sẽ chuẩn bị bài học cho con.</p></section>';
  const active = plan.stages.find((stage) => stage.id === selected);
  const index = plan.stages.indexOf(active);
  const open = active && (teacher || stageUnlocked(plan, index));
  return `<section class="pathway-intro illustrated-intro"><div class="journey-greeting">${picture("buddy-welcome", "greeting-buddy", true)}<div><p class="eyebrow">TỪNG BƯỚC CÙNG CON</p><h2>Lộ trình ${journey.number} của ${esc(name)}</h2><p>${teacher ? "Chọn bài phù hợp và chấm điểm khi con thực hành." : "Mỗi bước nhỏ, một điều mới. Con muốn khám phá bài nào hôm nay?"}</p></div></div><div class="button-row"><button class="secondary" data-action="refreshPlans">↻ Cập nhật tiến độ</button>${teacher ? '<button class="primary" data-action="editPlan">Điều chỉnh lộ trình</button>' : ""}</div></section>
  <div class="journey-map" aria-label="Sơ đồ 3 đích đến của lộ trình ${journey.number}"><svg class="journey-road" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path class="road-edge" d="M 240 0 C 970 0 970 500 760 500 S 30 500 240 1000"/><path class="road-fill" d="M 240 0 C 970 0 970 500 760 500 S 30 500 240 1000"/><path class="road-dashes" d="M 240 0 C 970 0 970 500 760 500 S 30 500 240 1000"/></svg>${picture("garden", "map-garden")}${plan.stages
    .map((stage, i) => {
      const progress = stageProgress(stage),
        unlocked = stageUnlocked(plan, i);
      const stageStatus = !progress.total
        ? "◌ Nội dung đang được chuẩn bị"
        : !unlocked
          ? "🔒 Mở khi điểm các đích đến trước trên 80%"
          : progress.passed
            ? "✓ Đã đạt điểm chuyển đích đến"
            : "● Đang mở · Sẵn sàng học";
      const stageButton = teacher
        ? "Xem & chấm điểm bài học"
        : !progress.total
          ? "Đang chuẩn bị nội dung"
          : unlocked
            ? "Chọn đích đến"
            : "Chưa mở khóa";
      return `<article class="pathway-card map-stage stage-${i + 1} ${unlocked ? "" : "pathway-locked"} ${selected === stage.id ? "selected" : ""}"><span class="stage-pin" aria-hidden="true">${i + 1}</span><div class="pathway-art">${picture(journey.stages?.[i]?.image || `stage-${i + 1}`, journey.stages ? "preview-stage-art" : "stage-art", true)}</div><div class="stage-content"><span class="eyebrow">ĐÍCH ĐẾN ${i + 1}</span><h3>${esc(stage.title)}</h3><p class="stage-goal">${esc(stage.goal)}</p><div class="pathway-count"><strong>${progress.percent}%</strong><span>${progress.done}/${progress.total} bài đã chấm</span></div><progress max="100" value="${progress.percent}" aria-label="Điểm đích đến ${esc(stage.title)}"></progress><p class="pathway-status">${stageStatus}</p><button class="${unlocked ? "primary" : "secondary"}" data-action="openStage" data-id="${stage.id}" ${!teacher && (!unlocked || !progress.total) ? "disabled" : ""}>${stageButton}</button></div></article>`;
    })
    .join("")}</div>
  ${plan.stages.some((stage) => stageProgress(stage).passed) ? `<aside class="journey-milestone">${picture("buddy-growing", "milestone-art")}<div><strong>Một bước tiến mới của con</strong><p>Con có thể chọn đích đến đã mở hoặc ôn lại bài quen thuộc.</p></div></aside>` : ""}
  <details class="score-explanation"><summary>Cách tính điểm và mở đích đến</summary><p>Điểm đích đến là trung bình điểm giáo viên chấm cho các bài (0–100). Bài chưa chấm tạm tính 0. Trên 80% mới mở đích đến tiếp theo; xem video và số lượt thực hành không cộng điểm.</p></details>
  ${
    open
      ? `<section class="panel pathway-lessons"><div class="section-heading"><div><p class="eyebrow">BÀI HỌC THEO THỨ TỰ</p><h2>${esc(active.title)}</h2></div><span class="badge">${active.lessonIds.length} bài</span></div>${
          active.lessonIds.length
            ? active.lessonIds
                .map((id, i) => {
                  const lesson = lessons.find((l) => l.id === id),
                    score = Object.hasOwn(active.lessonScores || {}, id)
                      ? active.lessonScores[id]
                      : null;
                  if (!lesson) return "";
                  return `<article class="pathway-lesson"><span class="lesson-number">${i + 1}</span><div class="pathway-lesson-info"><h3>${esc(lesson.title)}</h3><p>${esc(lesson.goal)}</p><small>${lesson.videoId || lesson.youtube || lesson.drive ? "▶ Có video hướng dẫn · " : ""}${lesson.cards.length} thẻ thực hành</small><span class="lesson-state">${score !== null ? `✓ Điểm giáo viên: ${score}/100` : "○ Chưa được chấm điểm"}</span></div><div class="pathway-lesson-actions"><button class="primary" data-action="openLesson" data-id="${esc(id)}">${score !== null ? "Ôn lại bài" : "Vào bài học"}</button>${teacher ? `<form data-form="grade" data-stage="${active.id}" data-id="${esc(id)}"><label>Điểm bài ${esc(lesson.title)} (%)<input type="number" name="score" min="0" max="100" step="1" required value="${score ?? ""}" ${!stageUnlocked(plan, index) ? "disabled" : ""}></label><p class="form-error" role="alert"></p><button type="submit" class="secondary" ${!stageUnlocked(plan, index) ? "disabled" : ""}>Lưu điểm</button></form>${score !== null ? `<button class="text-button" data-action="removePlanGrade" data-stage="${active.id}" data-id="${esc(id)}">Xóa điểm bài này</button>` : ""}<div class="button-row"><button class="text-button" data-action="movePlanLesson" data-stage="${active.id}" data-id="${esc(id)}" data-direction="-1" aria-label="Đưa bài ${esc(lesson.title)} lên" ${i === 0 ? "disabled" : ""}>↑ Lên</button><button class="text-button" data-action="movePlanLesson" data-stage="${active.id}" data-id="${esc(id)}" data-direction="1" aria-label="Đưa bài ${esc(lesson.title)} xuống" ${i === active.lessonIds.length - 1 ? "disabled" : ""}>↓ Xuống</button></div>` : ""}</div></article>`;
                })
                .join("")
            : "<p>Giáo viên đang chuẩn bị bài cho đích đến này.</p>"
        }</section>`
      : ""
  }`;
}
export function planEditor(plan, lessons) {
  return `<form data-form="plan" data-plan="${esc(JSON.stringify(plan))}"><p class="hint">Chọn bài riêng cho bé. Sau khi lưu, dùng nút Lên / Xuống để sắp xếp bài. Thay đổi danh sách bài sẽ tính lại điểm đích đến và quyền mở khóa.</p>${plan.stages.map((stage) => `<details class="plan-editor-stage" open><summary>Đích đến ${stage.id}</summary><label>Tên đích đến ${stage.id}<input name="title${stage.id}" value="${esc(stage.title)}" required maxlength="150"></label><label>Mục tiêu đích đến ${stage.id}<textarea name="goal${stage.id}" maxlength="1500">${esc(stage.goal)}</textarea></label><fieldset><legend>Bài học trong đích đến ${stage.id}</legend>${lessons.map((lesson) => `<label class="plan-choice"><input type="checkbox" name="stage${stage.id}" value="${esc(lesson.id)}" ${stage.lessonIds.includes(lesson.id) ? "checked" : ""}><span>${esc(lesson.title)}<small>Mức ${lesson.level}${lesson.videoId || lesson.youtube || lesson.drive ? " · Có video" : ""}</small></span></label>`).join("")}</fieldset></details>`).join("")}<p class="form-error" role="alert"></p><button type="submit" class="primary">Lưu lộ trình của bé</button></form>`;
}
