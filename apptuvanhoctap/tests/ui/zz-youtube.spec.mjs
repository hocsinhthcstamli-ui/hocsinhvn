import { test, expect } from "@playwright/test";
test("Drive links work on mobile and deployed mode hides local file uploads", async ({
  page,
  browser,
}) => {
  await page.route("**/api/status", async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    await route.fulfill({ response, json: { ...json, videoUploads: false } });
  });
  await login(page, "teacher", "teacher");
  await page.locator(".sidebar [data-view=content]").click();
  await expect(page.locator("#curriculumBand")).toBeVisible();
  await page.locator("#curriculumBand").selectOption("secondary");
  const id = "foundation-secondary-01";
  await page.locator(`[data-action=editLesson][data-id="${id}"]`).click();
  await expect(page.locator("#lessonVideo")).toHaveCount(0);
  await page.getByText("Video Google Drive", { exact: true }).click();
  const url =
    "https://drive.google.com/file/d/sample_file_123456/view?resourcekey=key_123";
  await page.locator("[name=driveUrl]").fill(url);
  await page.locator("[name=driveTitle]").fill("Video bài học Drive");
  await page.locator("[name=driveChannel]").fill("Giáo viên");
  await page.locator("[name=driveNote]").fill("Chọn thẻ sau khi xem.");
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  await expect(page.locator("#modal")).not.toBeVisible();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    const learner = await context.newPage();
    let loaded = 0;
    await learner.route("https://drive.google.com/**", (route) => {
      loaded++;
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Drive test</title><p>Test frame</p>",
      });
    });
    await login(learner, "learner", "child");
  await learner.locator('[data-action="openJourney"][data-id="life"]').click();
    await learner.locator('[data-action=openStage][data-id="1"]').click();
    await learner.locator(`[data-action=openLesson][data-id="${id}"]`).click();
    await expect(learner.locator("[data-action=playDrive]")).toBeVisible();
    expect(loaded).toBe(0);
    await learner.locator("[data-action=playDrive]").click();
    await expect(learner.locator("iframe")).toHaveAttribute(
      "src",
      url.replace("/view", "/preview"),
    );
    await expect.poll(() => loaded).toBe(1);
    await expect(learner.locator(".lesson-video a")).toHaveAttribute(
      "href",
      url,
    );
    expect(
      await learner.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await context.close();
  }
  await page.locator(`[data-action=editLesson][data-id="${id}"]`).click();
  await page.locator("[data-action=removeDrive]").click();
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  await expect(page.locator("#modal")).not.toBeVisible();
});
async function login(page, username, role) {
  await page.goto("/");
  await page.locator("[name=username]").fill(username);
  await page.locator("[name=role]").selectOption(role);
  await page.locator("[name=password]").fill("123456");
  await page.locator("button[type=submit]").click();
  await expect(page.locator(".shell,.focus-shell")).toBeVisible();
}
test("Teacher attaches a source; mobile learner loads YouTube only on tap; removal preserves scores", async ({
  page,
  browser,
}) => {
  await login(page, "teacher", "teacher");
  await page.locator(".sidebar [data-view=content]").click();
  await expect(page.locator("#curriculumBand")).toBeVisible();
  await page.locator("#curriculumBand").selectOption("primary");
  await expect(page.locator(".profile-grid > article")).toHaveCount(30);
  await page
    .locator('[data-action=editLesson][data-id="primary-school-01"]')
    .click();
  await page.locator(".video-editor details summary").click();
  await expect(page.locator(".video-suggestion")).toContainText(
    "UNICEF Viet Nam",
  );
  await page.locator("[data-action=useYoutubeSuggestion]").click();
  await expect(page.locator("[name=youtubeUrl]")).toHaveValue(
    "https://www.youtube.com/watch?v=8dWqtK8jI9o",
  );
  await page.locator('#modal [aria-label="Đóng"]').click();
  const before = await (await page.request.get("/api/state")).json();
  const id = "foundation-secondary-01";
  await page.locator("#curriculumBand").selectOption("secondary");
  await page.locator(`[data-action=editLesson][data-id="${id}"]`).click();
  await page
    .locator("[name=youtubeUrl]")
    .fill("https://youtu.be/8dWqtK8jI9o?si=test");
  await page.locator("[name=youtubeTitle]").fill("Video minh họa kiểm thử");
  await page.locator("[name=youtubeChannel]").fill("UNICEF Viet Nam");
  await page.locator("[name=youtubeNote]").fill("Chọn thẻ sau khi xem.");
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  await expect(page.locator("#modal")).not.toBeVisible();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    const learner = await context.newPage();
    let requests = 0;
    await learner.route("https://www.youtube-nocookie.com/**", (route) => {
      requests++;
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Test player</title><p>Player placeholder</p>",
      });
    });
    await login(learner, "learner", "child");
  await learner.locator('[data-action="openJourney"][data-id="life"]').click();
    await learner.locator('[data-action=openStage][data-id="1"]').click();
    await learner.locator(`[data-action=openLesson][data-id="${id}"]`).click();
    await expect(learner.locator("[data-action=playYoutube]")).toBeVisible();
    expect(requests).toBe(0);
    await expect(learner.locator(".lesson-video")).toContainText(
      "UNICEF Viet Nam",
    );
    await expect(learner.locator(".lesson-video a")).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=8dWqtK8jI9o",
    );
    await learner.locator("[data-action=playYoutube]").click();
    await expect(learner.locator(".youtube-player iframe")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/8dWqtK8jI9o?playsinline=1&rel=0",
    );
    await expect.poll(() => requests).toBe(1);
    for (const width of [320, 390, 430]) {
      await learner.setViewportSize({ width, height: 844 });
      expect(
        await learner.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await learner.screenshot({
      path: "tmp/youtube-mobile-test.png",
      fullPage: true,
    });
    expect(
      (await (await page.request.get("/api/state")).json()).data.learningPlans,
    ).toEqual(before.data.learningPlans);
  } finally {
    await context.close();
  }
  await page.locator(`[data-action=editLesson][data-id="${id}"]`).click();
  await expect(page.locator("[name=youtubeChannel]")).toHaveValue(
    "UNICEF Viet Nam",
  );
  await page.locator("[data-action=removeYoutube]").click();
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  await expect(page.locator("#modal")).not.toBeVisible();
  const after = await (await page.request.get("/api/state")).json();
  expect(after.data.lessons.find((l) => l.id === id).youtube).toBeNull();
  expect(after.data.learningPlans).toEqual(before.data.learningPlans);
});
