import { test, expect } from "@playwright/test";
async function login(page, name, role) {
  await page.goto("/");
  await page.locator("[name=username]").fill(name);
  await page.locator("[name=role]").selectOption(role);
  await page.locator("[name=password]").fill("123456");
  await page.locator("button[type=submit]").click();
  await expect(page.locator(".shell,.focus-shell")).toBeVisible();
}
test("Phase 1 guides, school filters and previewed templates work without replacing a plan until saved", async ({
  page,
  browser,
}) => {
  await login(page, "teacher", "teacher");
  await page.locator(".sidebar [data-view=content]").click();
  await expect(page.locator("#curriculumBand")).toBeVisible();
  await page.locator("#curriculumBand").selectOption("primary");
  await expect(page.locator(".profile-grid > article")).toHaveCount(30);
  await page.locator("[data-action=viewTeachingGuide]").first().click();
  await expect(
    page.getByRole("heading", { name: "5 cơ hội quan sát" }),
  ).toBeVisible();
  await expect(page.locator(".teaching-guide")).toContainText(
    "Thực hành ở nhà",
  );
  await page.locator('#modal [aria-label="Đóng"]').click();
  const before = await (await page.request.get("/api/state")).json();
  const id = "foundation-primary-01";
  await page.locator(`[data-action=editLesson][data-id="${id}"]`).click();
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  await expect(page.locator("#modal")).not.toBeVisible();
  const edited = await (await page.request.get("/api/state")).json();
  expect(edited.data.lessons.find((l) => l.id === id).teachingGuide).toEqual(
    before.data.lessons.find((l) => l.id === id).teachingGuide,
  );
  await page.locator(".sidebar [data-view=pathways]").click();
  await page.locator('[data-action="openJourney"][data-id="life"]').click();
  await page.locator(".curriculum-picker summary").click();
  await page
    .locator("[data-action=previewCurriculum][data-band=primary]")
    .click();
  await expect(page.locator("input[name=stage1]:checked")).toHaveCount(6);
  await expect(page.locator("input[name=stage2]:checked")).toHaveCount(6);
  await expect(page.locator("input[name=stage3]:checked")).toHaveCount(6);
  await page.locator('#modal [aria-label="Đóng"]').click();
  expect(
    (await (await page.request.get("/api/state")).json()).data.learningPlans,
  ).toEqual(before.data.learningPlans);
  await page
    .locator("[data-action=previewCurriculum][data-band=secondary]")
    .click();
  for (const stage of [1, 2, 3]) {
    await expect(page.locator(`input[name=stage${stage}]:checked`)).toHaveCount(6);
  }
  await page.getByRole("button", { name: "Lưu lộ trình của bé" }).click();
  await expect(page.locator("#modal")).not.toBeVisible();
  const saved = await (await page.request.get("/api/state")).json();
  expect(saved.data.learningPlans[0].stages.map(s => s.lessonIds.length)).toEqual([6, 6, 6]);
  expect(saved.data.learningPlans[0].stages[0].lessonIds).toHaveLength(6);
  expect(
    saved.data.learningPlans[0].stages[0].lessonIds.every((id) =>
      id.startsWith("foundation-secondary-"),
    ),
  ).toBe(true);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const learner = await context.newPage();
  await login(learner, "learner", "child");
  await learner.locator('[data-action="openJourney"][data-id="life"]').click();
  await learner.locator('[data-action=openStage][data-id="1"]').click();
  await expect(learner.locator(".pathway-lesson")).toHaveCount(6);
  await expect(
    learner.locator('[data-action=openStage][data-id="2"]'),
  ).toBeDisabled();
  await learner.locator("[data-action=openLesson]").first().click();
  await expect(
    learner.getByRole("button", { name: "Em tên là", exact: true }),
  ).toBeVisible();
  await expect(learner.locator("[data-action=viewTeachingGuide]")).toHaveCount(
    0,
  );
  expect(
    await learner.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await learner.screenshot({
    path: "tmp/phase1-secondary-mobile.png",
    fullPage: true,
  });
  await context.close();
});
