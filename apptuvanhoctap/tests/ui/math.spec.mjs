import {test,expect} from '@playwright/test';
import {mathQuestions} from '../../content/math-journey.mjs';
import {puzzlePacks} from '../../puzzle-catalog.mjs';

test('Teacher assigns math; learner solves five questions and plays ten-picture pack without unlocking stages',async({page,browser})=>{
  const login=async(p,name,role)=>{await p.goto('/');await p.locator('[name=username]').fill(name);await p.locator('[name=role]').selectOption(role);await p.locator('[name=password]').fill('123456');await p.locator('button[type=submit]').click();};
  await login(page,'teacher','teacher');
  await page.locator('.sidebar [data-view=pathways]').click();
  await page.locator('[data-action=assignTemplate][data-id=math]').click();
  await page.locator('form[data-form=plan] button[type=submit]').click();
  await expect(page.locator('.map-stage')).toHaveCount(3);
  const ctx=await browser.newContext({viewport:{width:390,height:844}});const learner=await ctx.newPage();
  try{
    await login(learner,'learner','child');
    await expect(learner.locator('.journey-choice')).toHaveCount(4);
    await learner.locator('[data-action=openJourney][data-id=math]').click();
    await expect(learner.locator('[data-action=openStage][data-id="2"]')).toBeDisabled();
    await learner.screenshot({path:'tmp/math-map-mobile.png',fullPage:true});
    await learner.locator('[data-action=openStage][data-id="1"]').click();
    await learner.locator('[data-action=openLesson][data-id=math-secondary-01]').click();
    await expect(learner.getByRole('heading',{name:'Cùng giải 5 câu hỏi Toán'})).toBeVisible();
    await learner.getByRole('button',{name:'Trả lời: 4',exact:true}).click();
    await expect(learner.locator('.activity-feedback')).toContainText('Chưa khớp');
    for(const [i,q] of mathQuestions['math-secondary-01'].entries()){
      await learner.getByRole('button',{name:`Trả lời: ${q.answer}`,exact:true}).click();
      if(i<4)await learner.locator('[data-activity=quizNext]').click();
    }
    await expect(learner.locator('lesson-activities')).toContainText('Đã lưu kết quả');
    await expect(learner.locator('.video-question .eyebrow')).toContainText('Đã trả lời đúng 5/5');
    for(const width of [320,390,430]){await learner.setViewportSize({width,height:844});expect(await learner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await learner.screenshot({path:'tmp/math-lesson-mobile.png',fullPage:true});
    await learner.reload();
    // Learner returns to the chooser after reload.
    await learner.locator('[data-action=openJourney][data-id=math]').click();
    await learner.locator('[data-action=openPuzzle]').click();await learner.locator('[data-fun=puzzle]').click();
    await expect(learner.locator('.puzzle-choice')).toHaveCount(10);
    for(const p of puzzlePacks.math)expect((await learner.request.get(p.src)).status()).toBe(200);
    await learner.locator('.puzzle-choice').first().click();
    for(const i of [0,1,2,3]){await learner.locator(`[data-piece="${i}"]`).click();await learner.locator(`[data-slot="${i}"]`).click();}
    await expect(learner.locator('picture-puzzle')).toContainText('Đã lưu kết quả');
    const state=(await(await page.request.get('/api/state')).json()).data;
    const results=state.activityResults.filter(r=>r.journeyId==='math');
    expect(results.map(r=>r.kind)).toEqual(['math','puzzle']);expect(results[0].mistakes).toBe(1);
    expect(state.learningPlans.find(p=>p.journeyId==='math').stages.every(s=>Object.keys(s.lessonScores).length===0)).toBe(true);
  }finally{await ctx.close();}
});
