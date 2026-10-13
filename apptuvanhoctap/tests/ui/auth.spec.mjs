import { test, expect } from '@playwright/test';

test('Sign-in layout supports password visibility, help and narrow screens', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json: { needsSetup: false } }));
  await page.route('**/api/state', route => route.fulfill({ status: 401, json: { error: 'Đăng nhập để tiếp tục.' } }));
  await page.setViewportSize({ width: 1586, height: 992 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await expect(page.locator('#app-update')).toBeHidden();
  const password = page.getByLabel('Mật khẩu', { exact: true });
  await password.fill('example-password');
  await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await password.fill('');
  await page.locator('.auth-illustration').evaluate(img => img.decode());
  await page.screenshot({ path: 'tmp/auth-desktop.png', fullPage: true });
  await page.locator('.auth-help summary').click();
  await expect(page.locator('.auth-help p')).toBeVisible();
  for (const width of [320, 390, 700, 900]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'tmp/auth-mobile.png', fullPage: true });
});
