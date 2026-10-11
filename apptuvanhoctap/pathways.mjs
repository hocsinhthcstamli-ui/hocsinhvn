export const pathwayTemplates = [
  [
    "Làm quen & giao tiếp",
    "Nhận biết hình ảnh, chọn điều con muốn và yêu cầu giúp đỡ.",
    "🌱",
  ],
  [
    "Thực hành hằng ngày",
    "Luyện thói quen sinh hoạt, cảm xúc và giao tiếp với người khác.",
    "🌿",
  ],
  [
    "Giao tiếp & tự lập",
    "Ghép câu, thực hiện các bước theo thứ tự và vận dụng vào cuộc sống.",
    "🌳",
  ],
];
export function defaultPlan(childId, lessons) {
  return {
    childId,
    stages: pathwayTemplates.map(([title, goal], index) => ({
      id: String(index + 1),
      title,
      goal,
      lessonIds: lessons
        .filter((lesson) => !lesson.teachingGuide && lesson.level === index + 1)
        .map((lesson) => lesson.id),
      lessonScores: {},
    })),
  };
}
export function stageProgress(stage) {
  const scores = stage.lessonScores || {};
  const done = stage.lessonIds.filter((id) => Object.hasOwn(scores, id)).length;
  const sum = stage.lessonIds.reduce(
    (total, id) => total + (Object.hasOwn(scores, id) ? scores[id] : 0),
    0,
  );
  const total = stage.lessonIds.length;
  return {
    done,
    total,
    percent: total ? Number((sum / total).toFixed(2)) : 0,
    passed: total > 0 && sum > total * 80,
  };
}
export function stageUnlocked(plan, index) {
  return (
    index === 0 ||
    plan.stages.slice(0, index).every((stage) => stageProgress(stage).passed)
  );
}
export function availableLessonIds(plan) {
  return plan && !plan.archived
    ? [
        ...new Set(
          plan.stages.flatMap((stage, index) =>
            stageUnlocked(plan, index) ? stage.lessonIds : [],
          ),
        ),
      ]
    : [];
}
