import {test,expect} from '@playwright/test';
import {voiceClips} from '../../voice-manifest.mjs';
test('Teacher uploads four activities, learner plays and results remain separate from grades',async({page,browser})=>{
  test.setTimeout(90000);
  const login=async(p,name,role)=>{await p.goto('/');await p.locator('[name=username]').fill(name);await p.locator('[name=role]').selectOption(role);await p.locator('[name=password]').fill('123456');await p.locator('button[type=submit]').click();};
  await login(page,'teacher','teacher');await page.locator('.sidebar [data-view=pathways]').click();await page.locator('[data-action=openJourney][data-id=life]').click();await page.locator('[data-action=openPuzzle]').click();
  await expect(page.getByRole('heading',{name:'Hoạt động vui vẻ'})).toBeVisible();
  for(const kind of ['listen','sequence','sort','pairs']){
    await page.locator('[data-fun=new]').click();await page.locator('[name=title]').fill('Test '+kind);await page.locator('[name=kind]').selectOption(kind);
    for(let i=0;i<2;i++){
      await page.locator(`[data-label="${i}"]`).fill('Ảnh '+i);
      await page.locator(`[data-image="${i}"]`).setInputFiles(`assets/puzzles/animals/animal-${i?'rabbit':'cat'}.webp`);
      await expect(page.locator('.fun-thumb')).toHaveCount(i+1);
      if(kind==='listen'){await page.locator(`[data-audio="${i}"]`).setInputFiles(Object.values(voiceClips)[i].slice(1));await expect(page.locator('audio')).toHaveCount(i+1);}
      if(kind==='sort')await page.locator(`[data-group="${i}"]`).fill('Nhóm '+i);
    }
    await page.locator('form[data-fun-editor] [type=submit]').click();await expect(page.getByRole('heading',{name:'Hoạt động vui vẻ'})).toBeVisible();
  }
  await page.locator('[data-fun=edit]').first().click();
  await page.locator('[name=title]').fill('Bài nghe đã sửa');
  await page.locator('[data-fun=down][data-index="0"]').click();
  await expect(page.locator('[data-label="0"]')).toHaveValue('Ảnh 1');
  await page.locator('form[data-fun-editor] [type=submit]').click();
  await expect(page.getByRole('heading',{name:'Bài nghe đã sửa'})).toBeVisible();
  const before=(await(await page.request.get('/api/state')).json()).data;
  const activities=before.funActivities;
  expect(activities).toHaveLength(4);
  expect(activities[0].items[0].image).toMatch(/^data:image\/webp/);
  const ctx=await browser.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
  try{
    await login(p,'learner','child');await p.locator('[data-action=openJourney][data-id=life]').click();await p.locator('[data-action=openPuzzle]').click();
    await expect(p.locator('[data-fun=new]')).toHaveCount(0);
    let state=await(await p.request.get('/api/state')).json();
    const deny=await p.request.post('/api/action',{data:{version:state.version,action:'deleteFun',payload:{id:activities[0].id,journeyId:'life'}}});expect(deny.status()).toBe(403);
    for(const a of activities){
      await p.locator(`[data-fun=play][data-id="${a.id}"]`).click();
      if(a.kind==='listen'){
        await p.locator('[data-fun=hear]').click();
        await expect.poll(()=>p.locator('fun-activities').evaluate(el=>el.sound?.readyState)).toBeGreaterThan(0);
        const order=await p.locator('fun-activities').evaluate(el=>el.prompts);
        for(const i of order)await p.locator(`[data-fun=choose][data-index="${i}"]`).click();
      }else if(a.kind==='sequence'){
        await p.locator('[data-fun=choose][data-index="1"]').click();await expect(p.locator('.fun-feedback')).toContainText('Chưa khớp');
        for(const i of [0,1])await p.locator(`[data-fun=choose][data-index="${i}"]`).click();
      }else if(a.kind==='sort'){
        for(const i of [0,1]){await p.locator(`[data-fun=choose][data-index="${i}"]`).click();await p.locator(`[data-fun=group][data-group="Nhóm ${i}"]`).click();}
      }else{
        const deck=await p.locator('fun-activities').evaluate(el=>el.deck);
        for(const item of [0,1])for(const [i,value] of deck.entries())if(value===item)await p.locator(`[data-fun=choose][data-index="${i}"]`).click();
      }
      await expect(p.locator('fun-activities')).toContainText('Đã lưu kết quả');
      expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await p.locator('[data-fun=gallery]').click();
    }
    const after=(await(await page.request.get('/api/state')).json()).data;
    expect(after.learningPlans).toEqual(before.learningPlans);
    expect(after.activityResults.filter(r=>activities.some(a=>a.id===r.itemId))).toHaveLength(4);
    // Delete via teacher UI; historical results remain available.
    page.on('dialog',dialog=>dialog.accept());
    await page.locator(`[data-fun=delete][data-id="${activities[0].id}"]`).click();
    await expect(page.locator(`[data-fun=play][data-id="${activities[0].id}"]`)).toHaveCount(0);
    const end=(await(await page.request.get('/api/state')).json()).data;
    expect(end.activityResults.some(r=>r.itemId===activities[0].id)).toBe(true);
  }finally{await ctx.close();}
});
