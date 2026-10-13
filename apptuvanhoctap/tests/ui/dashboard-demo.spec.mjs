import {test, expect} from '@playwright/test';
import {seedData, domains} from '../../domain.mjs';

// Read-only visual fixture: never creates or changes real student records.
function demo(role = 'teacher', empty = false) {
  const data = {...seedData(), learningPlans: [], activitySessions: []};
  data.children = ['Minh Anh', 'Gia Huy', 'Ngọc Linh', 'Bảo An'].map((name, i) => ({
    id: `visual-${i}`, name, birthYear: 2018, goals: '', supportNote: '',
    assessment: Object.fromEntries(domains.map(([key]) => [key, i + 1])),
  }));
  data.assessmentHistory = empty ? [] : data.children.map(c => ({id: `a-${c.id}`, childId: c.id, date: '2026-10-13', scores: c.assessment}));
  if (!empty) data.learningPlans = [{id: 'visual-plan', childId: data.children[0].id, title: 'Hành trình của con', stages: [{id: 'stage', title: 'Bắt đầu', lessonIds: data.lessons.slice(0,4).map(l => l.id), lessonScores: {[data.lessons[0].id]: 3}}]}];
  return {data, user: {id: 'visual-user', name: 'Cô Mai', role, username: 'visual'}, version: 1};
}

for (const role of ['teacher', 'parent']) test(`Soft dashboard ${role}: responsive, offline avatars and console`, async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
  await page.route('**/api/status', r => r.fulfill({json: {needsSetup: false}}));
  await page.route('**/api/state', r => r.fulfill({json: demo(role)}));
  await page.goto('/');
  await page.locator('.sidebar [data-view="dashboard"]').click();
  await expect(page.locator('.soft-dashboard-shell')).toBeVisible();
  if (role === 'teacher') {
    for (let level = 1; level <= 4; level++) await expect(page.locator(`.teacher-student.state-${level}`)).toBeVisible();
    const avatars = await page.locator('.teacher-student img').evaluateAll(imgs => imgs.map(i => i.src));
    expect(new Set(avatars).size).toBe(4);
    await expect(page.locator('.teacher-ring')).toHaveAttribute('aria-label', '25% bài trong lộ trình đã có điểm giáo viên');
    // Verify actual rendered status colors meet WCAG AA, not only token values.
    const contrast = await page.locator('.student-level').evaluateAll(chips => {
      const luminance = color => {
        const values = color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => {v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;});
        return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
      };
      return chips.map(chip => {const s = getComputedStyle(chip); const a = luminance(s.color), b = luminance(s.backgroundColor); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
    });
    expect(contrast.every(ratio => ratio >= 4.5)).toBe(true);
  } else await expect(page.locator('[data-view="assessment"]')).toHaveCount(0);
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({width, height: 1000});
    await expect.poll(() => page.locator('.student-avatar-image').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path: `tmp/dashboard-${role}-${width}.png`, fullPage: true});
  }
  expect(errors).toEqual([]);
});

test('Empty progress encourages first assessment using existing navigation', async ({page}) => {
  await page.route('**/api/status', r => r.fulfill({json: {needsSetup: false}}));
  await page.route('**/api/state', r => r.fulfill({json: demo('teacher', true)}));
  await page.goto('/');
  await page.locator('.sidebar [data-view="dashboard"]').click();
  await expect(page.locator('.progress-empty')).toBeVisible();
  await page.getByRole('button', {name: 'Bắt đầu đánh giá đầu tiên'}).click();
  await expect(page.locator('#view')).toHaveAttribute('data-page', 'assessment');
});
