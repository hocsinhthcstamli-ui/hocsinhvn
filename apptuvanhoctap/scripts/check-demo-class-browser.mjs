// Run only after seed-demo-class.mjs, against the explicitly seeded local demo.
import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import {createApp} from '../server.mjs';
import {DatabaseSync} from 'node:sqlite';
const manifest=JSON.parse(await readFile('data/demo-class-39.json','utf8'));
if(manifest.summary?.students!==39)throw Error('Complete the demo seed first.');
if(!process.env.DEMO_STUDENT_PASSWORD||!process.env.DEMO_TEACHER_PASSWORD)throw Error('Set demo passwords.');
await mkdir('tmp/demo-class',{recursive:true});
let server=await createApp();
await new Promise(resolve=>server.listen(3000,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
const reader=new DatabaseSync('data/aac.sqlite',{readOnly:true});
const practiceCount=id=>JSON.parse(reader.prepare('SELECT data FROM app_state WHERE id=1').get().data).practiceSessions.filter(p=>p.childId===id).length;
try {
  for(const child of manifest.children){
    if(results.length>0&&results.length%15===0){await server.shutdown();server=await createApp();await new Promise(resolve=>server.listen(3000,'127.0.0.1',resolve));}
    const context=await browser.newContext({baseURL:'http://127.0.0.1:3000',viewport:{width:1280,height:900}}),page=await context.newPage();
    try {
      await page.goto('http://127.0.0.1:3000');
      await page.getByLabel('Tên đăng nhập').fill(child.username);
      await page.getByLabel('Vai trò',{exact:true}).selectOption('child');
      await page.getByLabel('Mật khẩu',{exact:true}).fill(process.env.DEMO_STUDENT_PASSWORD);
      await page.locator('button[type=submit]').click();
      await expect(page.locator('.journey-choice')).toHaveCount(5);
      await page.locator('[data-action=openJourney][data-id=animals]').click();
      await page.locator('[data-action=openStage][data-id="1"]').click();
      await page.locator('[data-action=openLesson]').first().click();
      const before=(await(await page.request.get('/api/state')).json()).data;
      const beforeCount=practiceCount(child.id);
      await page.locator('.aac-card').first().click();
      await page.locator('[data-action=completePractice]').click();
      await expect(page.locator('#modal')).toContainText('Em giỏi quá!');
      const after=(await(await page.request.get('/api/state')).json()).data;
      expect(practiceCount(child.id)).toBe(beforeCount+1);
      expect(after.learningPlans).toEqual(before.learningPlans);
      expect(after.children.map(c=>c.id)).toEqual([child.id]);
      results.push({username:child.username,passed:true});
      if(results.length===1)await page.screenshot({path:'tmp/demo-class/learner-completion.png',fullPage:true});
      console.log(`${results.length}/39 browser practice passed`);
      await page.request.post('/api/logout',{data:{}});
    }finally{await context.close();}
  }
  const context=await browser.newContext({baseURL:'http://127.0.0.1:3000',viewport:{width:1586,height:992}}),page=await context.newPage();
  await page.goto('http://127.0.0.1:3000');
  await page.getByLabel('Tên đăng nhập').fill('test2');
  await page.getByLabel('Vai trò',{exact:true}).selectOption('teacher');
  await page.getByLabel('Mật khẩu',{exact:true}).fill(process.env.DEMO_TEACHER_PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.locator('.sidebar [data-view=dashboard]').click();
  const state=(await(await page.request.get('/api/state')).json()).data;
  expect(state.children.filter(c=>c.name.startsWith('[DEMO '))).toHaveLength(39);
  for(const child of manifest.children.filter((_,i)=>i<6)){
    await page.locator('#childPicker').selectOption(child.id);
    await expect(page.locator('.teacher-summary')).toContainText(child.name);
    await page.screenshot({path:`tmp/demo-class/teacher-${child.username}.png`,fullPage:true});
  }
  await page.locator('.sidebar [data-view=reports]').click();
  await expect(page.locator('#view')).toHaveAttribute('data-page','reports');
  await page.screenshot({path:'tmp/demo-class/teacher-report.png',fullPage:true});
  const ids=new Set(manifest.children.map(c=>c.id));
  manifest.summary.practice=state.practiceSessions.filter(p=>ids.has(p.childId)).length;
  manifest.browserCheck={passed:results.length,teacherVerified:true,checkedAt:new Date().toISOString()};
  await writeFile('data/demo-class-39.json',JSON.stringify(manifest,null,2));
  await page.request.post('/api/logout',{data:{}});await context.close();
}finally{await writeFile('tmp/demo-class/browser-results.json',JSON.stringify(results,null,2));reader.close();await browser.close();await server.shutdown();}
