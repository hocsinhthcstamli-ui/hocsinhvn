import {test, expect} from '@playwright/test';

test('Teacher overview shows real progress and working dashboard actions', async ({page}) => {
  await page.goto('/');
  await page.getByLabel('Tên đăng nhập').fill('teacher');
  await page.getByLabel('Vai trò', {exact:true}).selectOption('teacher');
  await page.getByLabel('Mật khẩu', {exact:true}).fill('123456');
  await page.locator('button[type=submit]').click();
  await page.locator('.sidebar [data-view=dashboard]').click();
  await expect(page.locator('.teacher-dashboard')).toBeVisible();
  await expect.poll(()=>page.locator('.student-avatar-image').evaluateAll(images=>images.length>0&&images.every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
  const {data} = await (await page.request.get('/api/state')).json();
  const selected = await page.locator('#childPicker').inputValue();
  const stages = data.learningPlans.filter(p=>p.childId===selected&&!p.archived).flatMap(p=>p.stages);
  const total = stages.reduce((n,s)=>n+s.lessonIds.length,0);
  const done = stages.reduce((n,s)=>n+s.lessonIds.filter(id=>Object.hasOwn(s.lessonScores||{},id)).length,0);
  await expect(page.locator('.teacher-progress')).toContainText(`${done}/${total} bài`);
  await page.setViewportSize({width:1586,height:1050});
  await page.screenshot({path:'tmp/teacher-dashboard-desktop.png',fullPage:true});
  await page.locator('.teacher-actions [data-view=assessment]').click();
  await expect(page.locator('#view')).toHaveAttribute('data-page','assessment');
  await page.locator('.sidebar [data-view=dashboard]').click();
  for (const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'tmp/teacher-dashboard-mobile.png',fullPage:true});
});
