import { test, expect } from "@playwright/test";

test("PWA installs public assets and displays a useful offline page", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  }
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map(
            (request) => new URL(request.url).pathname,
          ),
        ),
      )
    ).flat();
  });
  expect(cached).toContain("/offline.html");
  expect(cached.some((path) => path.startsWith("/api/") || path === "/")).toBe(
    false,
  );
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Mình kết nối lại nhé" }),
  ).toBeVisible();
  await expect(page.locator(".offline-card a")).toBeVisible();
  await context.setOffline(false);
  await page.locator(".offline-card a").click();
  await expect(page.locator("form")).toBeVisible();
});

test("Admin cards and navigation fit small and large phones", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("input[name=username]").fill("admin");
  await page.locator("select[name=role]").selectOption("admin");
  await page.locator("input[name=password]").fill("123456");
  await page.locator("button[type=submit]").click();
  await expect(page.locator(".admin-shell")).toBeVisible();
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator(".mobile-tabs [data-view=children]").click();
    await expect(page.locator("#view")).toHaveAttribute(
      "data-page",
      "children",
    );
    await expect(page.locator("tbody td").first()).toHaveAttribute(
      "data-label",
      "Học sinh",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const tabs = await page
      .locator(".mobile-tabs button")
      .evaluateAll((buttons) =>
        buttons.map((button) => ({
          width: button.getBoundingClientRect().width,
          height: button.getBoundingClientRect().height,
        })),
      );
    expect(
      Math.max(...tabs.map((t) => t.width)) -
        Math.min(...tabs.map((t) => t.width)),
    ).toBeLessThan(2);
    expect(tabs.every((t) => t.height >= 48)).toBe(true);
    await page.screenshot({
      path: `tmp/pwa-admin-${width}.png`,
      fullPage: true,
    });
  }
});
