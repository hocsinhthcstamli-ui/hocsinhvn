import { test, expect } from "@playwright/test";
test.describe.configure({ mode: "serial" });

async function sampleVideo(page) {
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#64866a";
    ctx.fillRect(0, 0, 320, 180);
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
    });
    const chunks = [];
    const ready = new Promise((resolve) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        resolve([...new Uint8Array(await new Blob(chunks).arrayBuffer())]);
      };
    });
    recorder.start();
    let frame = 0;
    const draw = setInterval(() => {
      ctx.fillStyle = frame++ % 2 ? "#64866a" : "#e8f0e5";
      ctx.fillRect(0, 0, 320, 180);
    }, 80);
    setTimeout(() => {
      clearInterval(draw);
      recorder.stop();
    }, 900);
    return ready;
  });
  return Buffer.from(bytes);
}
async function login(page, username, role) {
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Vai trò", { exact: true }).selectOption(role);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.locator('form[data-form="login"] button[type="submit"]').click();
  await expect(page.locator(".shell,.focus-shell")).toBeVisible();
}
async function navigate(page, view) {
  if (await page.locator(".focus-shell").count()) {
    await page.locator(".learning-exit").click();
    await expect(page.locator("#view")).toHaveAttribute("data-page", "lessons");
  }
  if (page.viewportSize().width > 800) {
    await page.locator(`.sidebar [data-view="${view}"]`).click();
    await expect(page.locator("#view")).toHaveAttribute("data-page", view);
    return;
  }
  const quick = page.locator(`.mobile-tabs [data-view="${view}"]`);
  if (await quick.count()) {
    await quick.click();
    await expect(page.locator("#view")).toHaveAttribute("data-page", view);
    return;
  }
  await page.locator('.mobile-tabs [data-action="openMenu"]').click();
  await page.locator(`#modal [data-view="${view}"]`).click();
  await expect(page.locator("#view")).toHaveAttribute("data-page", view);
}
async function assertFits(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
}
test("Admin only manages teachers, students, assignments and linked accounts", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập").fill("admin");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await expect(page.getByLabel("Tên của bạn")).toHaveCount(0);
  await page.getByRole("button", { name: "Tạo tài khoản & bắt đầu" }).click();
  await expect(
    page.getByRole("heading", { name: "Tổng quan quản lý" }),
  ).toBeVisible();
  await expect(page.locator(".sidebar nav .nav-item")).toHaveText([
    "Tổng quan",
    "Giáo viên",
    "Học sinh",
  ]);
  for (const id of [
    "lessons",
    "kid",
    "assessment",
    "daily",
    "reports",
    "content",
  ])
    await expect(page.locator(`[data-view="${id}"]`)).toHaveCount(0);
  await expect(page.locator("#childPicker")).toHaveCount(0);
  await expect(page.getByText("Mức kỹ năng", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "+ Thêm học sinh" }).click();
  await page.getByLabel("Tên học sinh").fill("Minh Anh");
  await page.getByLabel("Năm sinh").fill("2021");
  await expect(page.getByLabel("Mục tiêu học tập")).toHaveCount(0);
  await page.getByRole("button", { name: "Lưu học sinh" }).click();
  await page.getByRole("button", { name: "+ Thêm giáo viên" }).click();
  await page.getByLabel("Tên đăng nhập").fill("teacher");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await expect(page.getByLabel("Vai trò", { exact: true })).toHaveValue(
    "teacher",
  );
  await page.getByRole("button", { name: "Lưu tài khoản" }).click();
  await page.getByRole("button", { name: "Phân công", exact: true }).click();
  await page.getByRole("checkbox", { name: "teacher", exact: true }).check();
  await page.getByRole("button", { name: "Lưu phân công" }).click();
  await expect(
    page.getByText("Tất cả học sinh đã có giáo viên phụ trách."),
  ).toBeVisible();
  await navigate(page, "children");
  await expect(
    page.getByRole("cell", { name: "teacher", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Tài khoản học sinh / phụ huynh",
      exact: true,
    })
    .click();
  for (const [username, role] of [
    ["parent", "parent"],
    ["learner", "child"],
  ]) {
    await page.getByRole("button", { name: "+ Tạo tài khoản" }).click();
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.getByLabel("Vai trò", { exact: true }).selectOption(role);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
    await page.getByRole("checkbox", { name: "Minh Anh", exact: true }).check();
    await page.getByRole("button", { name: "Lưu tài khoản" }).click();
  }
  await navigate(page, "dashboard");
  await page.screenshot({
    path: "tmp/admin-management-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const view of ["dashboard", "teachers", "children", "settings"]) {
    await navigate(page, view);
    await assertFits(page);
  }
  await navigate(page, "dashboard");
  await page.screenshot({
    path: "tmp/admin-management-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("Assigned teacher assesses, teaches and records; parent and learner have distinct screens", async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "teacher", "teacher");
  await expect(page.getByText("Hôm nay Minh Anh")).toBeVisible();
  await expect(
    page.locator('[data-view="teachers"],[data-view="users"]'),
  ).toHaveCount(0);
  await navigate(page, "children");
  await expect(page.getByRole("button", { name: "+ Thêm hồ sơ" })).toHaveCount(
    0,
  );
  await navigate(page, "assessment");
  await page.locator('input[name="communication"][value="2"]').check();
  await page.getByRole("button", { name: "Lưu lần đánh giá" }).click();
  await expect(page.getByText("Điểm trung bình:")).toBeVisible();
  await navigate(page, "content");
  await page.getByRole("button", { name: "+ Thêm bài học" }).click();
  await page
    .getByLabel("Tên bài học", { exact: true })
    .fill("Trái cây của con");
  await page
    .getByLabel("Mục tiêu", { exact: true })
    .fill("Chọn trái cây quen thuộc.");
  await page.getByLabel("Nội dung 1", { exact: true }).fill("quả táo");
  await page.getByLabel("Biểu tượng thẻ 1").fill("🍎");
  await page.getByRole("button", { name: "Lưu bài học" }).click();
  await expect(
    page.getByRole("heading", { name: "Trái cây của con" }),
  ).toBeVisible();
  await navigate(page, "lessons");
  await page.getByLabel("Tìm bài học").fill("Con muốn");
  await page.getByRole("button", { name: "Mở bài học" }).click();
  await expect(page.locator(".sidebar,.mobile-tabs")).toHaveCount(0);
  await page.getByLabel("Đọc khi chọn thẻ").uncheck();
  for (const word of ["xe", "Con muốn", "xe"])
    await page.getByRole("button", { name: word, exact: true }).click();
  await expect(page.locator(".sentence-word")).toHaveText([
    "xe",
    "Con muốn",
    "xe",
  ]);
  await page.getByRole("button", { name: "Hoàn thành lượt học" }).click();
  await page
    .getByRole("button", { name: "Ghi kết quả buổi học", exact: true })
    .click();
  await page
    .getByLabel("Nhận xét và bước tiếp theo")
    .fill("Cần thêm hỗ trợ trực quan.");
  await page.getByRole("button", { name: "Lưu buổi học" }).click();
  await navigate(page, "reports");
  await expect(
    page.locator(".metric").filter({ hasText: "Tỷ lệ đúng tổng hợp" }),
  ).toContainText("0%");
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất CSV" }).click();
  expect((await csv).suggestedFilename()).toMatch(/\.csv$/);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const view of [
    "dashboard",
    "children",
    "assessment",
    "lessons",
    "daily",
    "reports",
    "content",
    "settings",
  ]) {
    await navigate(page, view);
    await assertFits(page);
  }
  await navigate(page, "lessons");
  await page.getByRole("button", { name: "Mở bài học" }).click();
  expect(
    (await page.locator(".aac-card").first().boundingBox()).y,
  ).toBeLessThan(650);
  await page.screenshot({
    path: "tmp/teacher-learning-mobile.png",
    fullPage: true,
  });

  for (const [username, role] of [
    ["parent", "parent"],
    ["learner", "child"],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const other = await context.newPage();
    await login(other, username, role);
    for (const id of ["teachers", "users", "content", "assessment"])
      await expect(other.locator(`[data-view="${id}"]`)).toHaveCount(0);
    if (role === "parent") {
      await navigate(other, "daily");
      await expect(other.getByText("Cần thêm hỗ trợ trực quan.")).toBeVisible();
      await expect(
        other.locator('[data-action="editRecord"][data-id]'),
      ).toHaveCount(0);
    } else {
      await expect(other.locator(".focus-shell")).toBeVisible();
      await expect(other.locator(".sidebar,.mobile-tabs")).toHaveCount(0);
      await expect(other.locator(".pathway-card")).toHaveCount(3);
      await expect(
        other.locator('[data-action="openStage"][data-id="2"]'),
      ).toBeDisabled();
      await other.locator('[data-action="openStage"][data-id="1"]').click();
      await other
        .locator('[data-action="openLesson"][data-id="aac-request-basic"]')
        .click();
      await other.getByLabel("Đọc khi chọn thẻ").uncheck();
      await other
        .getByRole("button", { name: "Con muốn", exact: true })
        .click();
      await other.getByRole("button", { name: "Hoàn thành lượt học" }).click();
      await expect(
        other.getByRole("button", { name: "Ghi kết quả buổi học" }),
      ).toHaveCount(0);
    }
    await assertFits(other);
    await context.close();
  }
  expect(errors).toEqual([]);
});

test("Teacher uploads a playable video and customizes a child pathway; confirmation unlocks the next stage", async ({
  page,
  browser,
}) => {
  await login(page, "teacher", "teacher");
  const video = await sampleVideo(page);
  await navigate(page, "content");
  await page
    .locator('[data-action="editLesson"][data-id="aac-request-basic"]')
    .click();
  await page.locator("#lessonVideo").setInputFiles({
    name: "bai-hoc.webm",
    mimeType: "video/webm",
    buffer: video,
  });
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  await expect(page.locator("#modal")).not.toBeVisible();
  await navigate(page, "pathways");
  await page.getByRole("button", { name: "Điều chỉnh lộ trình" }).click();
  const choices = page.locator('input[name="stage1"]');
  for (let i = 0; i < (await choices.count()); i++)
    await choices.nth(i).uncheck();
  await page.locator('input[name="stage1"][value="aac-request-basic"]').check();
  await page
    .getByLabel("Tên lộ trình 1", { exact: true })
    .fill("Giao tiếp của Minh Anh");
  await page.getByRole("button", { name: "Lưu lộ trình của bé" }).click();
  await expect(page.locator("#modal")).not.toBeVisible();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const learner = await context.newPage();
  await login(learner, "learner", "child");
  await expect(learner.locator(".pathway-card")).toHaveCount(3);
  await expect(
    learner.locator('[data-action="openStage"][data-id="2"]'),
  ).toBeDisabled();
  for (const width of [320, 390, 430]) {
    await learner.setViewportSize({ width, height: 844 });
    await assertFits(learner);
  }
  await learner.setViewportSize({ width: 390, height: 844 });
  await learner.screenshot({
    path: "tmp/learner-pathways-mobile.png",
    fullPage: true,
  });
  await learner.locator('[data-action="openStage"][data-id="1"]').click();
  await learner
    .locator('[data-action="openLesson"][data-id="aac-request-basic"]')
    .click();
  const player = learner.locator("video");
  await expect(player).toBeVisible();
  await expect
    .poll(() => player.evaluate((video) => video.readyState))
    .toBeGreaterThanOrEqual(2);
  await player.evaluate(async (video) => {
    video.muted = true;
    await video.play();
  });
  await expect
    .poll(() => player.evaluate((video) => video.currentTime))
    .toBeGreaterThan(0);
  await assertFits(learner);
  await learner.screenshot({
    path: "tmp/learner-video-mobile.png",
    fullPage: true,
  });
  await page.locator('[data-action="openStage"][data-id="1"]').click();
  await page.locator('form[data-form="grade"] input[name="score"]').fill("80");
  await page.getByRole("button", { name: "Lưu điểm", exact: true }).click();
  await expect(page.locator(".pathway-card").first()).toContainText("80%");
  await learner.getByRole("button", { name: "Về lộ trình của con" }).click();
  await expect(
    learner.locator('[data-action="openStage"][data-id="2"]'),
  ).toBeDisabled();
  await page.locator('form[data-form="grade"] input[name="score"]').fill("81");
  await page.getByRole("button", { name: "Lưu điểm", exact: true }).click();
  await expect(page.locator(".pathway-card").first()).toContainText("81%");
  await learner.getByRole("button", { name: "Cập nhật tiến độ" }).click();
  await expect(
    learner.locator('[data-action="openStage"][data-id="2"]'),
  ).toBeEnabled();
  await expect(
    learner.locator('[data-action="openStage"][data-id="3"]'),
  ).toBeDisabled();
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await assertFits(page);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "tmp/teacher-pathways-mobile.png",
    fullPage: true,
  });
  await context.close();
});
