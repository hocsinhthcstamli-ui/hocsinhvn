import {test,expect} from '@playwright/test';
import {activitiesFor,videoQuestions} from '../../lesson-activities.mjs';
import {completeSeedData} from '../../content/seed.mjs';
import {voiceClips} from '../../voice-manifest.mjs';

test('All built-in lessons have five spoken models; video exercises give feedback without changing scores',async({page})=>{
  for(const lesson of completeSeedData().lessons){
    const content=activitiesFor(lesson);expect(content.rounds).toHaveLength(5);
    for(const round of content.rounds)for(const word of round.words)expect(voiceClips[word.toLowerCase().trim()]).toBeTruthy();
  }
  for(const questions of Object.values(videoQuestions))expect(questions).toHaveLength(5);
  await page.goto('/');
  await page.locator('[name=username]').fill('teacher');await page.locator('[name=role]').selectOption('teacher');await page.locator('[name=password]').fill('123456');await page.locator('button[type=submit]').click();
  await page.locator('.sidebar [data-view=pathways]').click();await page.locator('[data-action=openJourney][data-id=vehicles]').click();
  await page.locator('[data-action=openStage][data-id="1"]').click();await page.locator('[data-action=openLesson][data-id="vehicles-primary-01"]').click();
  const before=(await(await page.request.get('/api/state')).json()).data;
  await expect(page.locator('.video-activity')).toContainText('0:08–0:29');
  await page.locator('[data-activity=answer]').filter({hasText:'xe máy'}).click();await expect(page.locator('.activity-feedback')).toContainText('thử chọn');
  await page.locator('[data-activity=answer]').filter({hasText:'ô tô'}).click();await expect(page.locator('.activity-feedback')).toContainText('Đúng rồi');
  await page.locator('[data-activity=quizNext]').click();await expect(page.locator('.video-question h3')).toContainText('xe cứu thương');
  const rounds=activitiesFor(completeSeedData().lessons.find(l=>l.id==='vehicles-primary-01')).rounds;
  for(let i=0;i<5;i++){
    for(const word of rounds[i].words)await page.locator('[data-activity=word]').filter({has:page.getByText(word,{exact:true})}).click();
    await expect(page.locator('.guided-feedback')).toContainText(i===4?'đủ 5 câu':'ghép được');
    if(i<4)await page.locator('[data-activity=next]').click();
  }
  for(const width of [320,390,430]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.screenshot({path:'tmp/lesson-activities-mobile.png',fullPage:true});
  await expect(page.locator('lesson-activities')).toContainText('Đã lưu kết quả');
  const after=(await(await page.request.get('/api/state')).json()).data;
  expect(after.learningPlans).toEqual(before.learningPlans);
  expect(after.activityResults.length).toBe((before.activityResults||[]).length+1);
});
