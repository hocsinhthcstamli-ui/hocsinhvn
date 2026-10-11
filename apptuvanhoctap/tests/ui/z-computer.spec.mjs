import {test,expect} from '@playwright/test';
import {computerQuestions} from '../../content/computer-journey.mjs';
import {puzzlePacks} from '../../puzzle-catalog.mjs';

test('Computer assignment, quiz results, locked stages and ten puzzles work on mobile',async({page,browser})=>{
  const login=async(p,name,role)=>{await p.goto('/');await p.locator('[name=username]').fill(name);await p.locator('[name=role]').selectOption(role);await p.locator('[name=password]').fill('123456');await p.locator('button[type=submit]').click();};
  await login(page,'teacher','teacher');await page.locator('.sidebar [data-view=pathways]').click();
  await page.locator('[data-action=assignTemplate][data-id=computer]').click();
  await page.locator('form[data-form=plan] button[type=submit]').click();
  const ctx=await browser.newContext({viewport:{width:390,height:844}});const learner=await ctx.newPage();
  try{
    await login(learner,'learner','child');await learner.locator('[data-action=openJourney][data-id=computer]').click();
    await expect(learner.locator('.map-stage')).toHaveCount(3);
    await expect(learner.locator('[data-action=openStage][data-id="2"]')).toBeDisabled();
    await learner.screenshot({path:'tmp/computer-map-mobile.png',fullPage:true});
    const state=await(await learner.request.get('/api/state')).json();
    const childId=state.data.children[0].id;
    const locked=await learner.request.post('/api/action',{data:{version:state.version,action:'activityResult',payload:{id:'computer-locked',childId,journeyId:'computer',itemId:'computer-secondary-05',kind:'computer',total:5,completed:5,mistakes:0}}});
    expect(locked.status()).toBe(403);
    await learner.locator('[data-action=openStage][data-id="1"]').click();
    await learner.locator('[data-action=openLesson][data-id=computer-secondary-01]').click();
    await expect(learner.getByRole('heading',{name:'Cùng thực hành 5 câu hỏi Máy tính'})).toBeVisible();
    await learner.getByRole('button',{name:'Trả lời: bàn phím',exact:true}).click();
    await expect(learner.locator('.activity-feedback')).toContainText('Chưa khớp');
    for(const [i,q] of computerQuestions['computer-secondary-01'].entries()){
      await learner.getByRole('button',{name:`Trả lời: ${q.answer}`,exact:true}).click();
      if(i<4)await learner.locator('[data-activity=quizNext]').click();
    }
    await expect(learner.locator('lesson-activities')).toContainText('Đã lưu kết quả');
    await expect(learner.locator('.video-question .eyebrow')).toContainText('Đã trả lời đúng 5/5');
    for(const width of [320,390,430]){await learner.setViewportSize({width,height:844});expect(await learner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await learner.screenshot({path:'tmp/computer-lesson-mobile.png',fullPage:true});
    await learner.reload();await learner.locator('[data-action=openJourney][data-id=computer]').click();
    await learner.locator('[data-action=openPuzzle]').click();await learner.locator('[data-fun=puzzle]').click();await expect(learner.locator('.puzzle-choice')).toHaveCount(10);
    for(const p of puzzlePacks.computer)expect((await learner.request.get(p.src)).status()).toBe(200);
    await learner.locator('.puzzle-choice').first().click();
    for(const i of [0,1,2,3]){await learner.locator(`[data-piece="${i}"]`).click();await learner.locator(`[data-slot="${i}"]`).click();}
    await expect(learner.locator('picture-puzzle')).toContainText('Đã lưu kết quả');
    const after=(await(await page.request.get('/api/state')).json()).data;
    const results=after.activityResults.filter(r=>r.journeyId==='computer');
    expect(results.map(r=>r.kind)).toEqual(['computer','puzzle']);expect(results[0].mistakes).toBe(1);
    expect(after.learningPlans.find(p=>p.journeyId==='computer').stages.every(s=>Object.keys(s.lessonScores).length===0)).toBe(true);
    await page.locator('[data-action=viewJourneyResults]').click();
    await expect(page.getByRole('cell',{name:'Bài tập Máy tính',exact:true})).toBeVisible();
  }finally{await ctx.close();}
});
