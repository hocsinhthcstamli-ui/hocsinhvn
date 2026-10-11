import {test, expect} from "@playwright/test";
import {puzzlePacks, shuffledPieces} from "../../puzzle-catalog.mjs";

test("Life puzzle: 20 images, drag/tap/keyboard, feedback, replay and no grade writes", async ({page}) => {
  await page.goto('/');
  await page.locator('[name=username]').fill('learner');
  await page.locator('[name=role]').selectOption('child');
  await page.locator('[name=password]').fill('123456');
  await page.locator('button[type=submit]').click();
  await page.locator('[data-action=openJourney][data-id=life]').click();
  const before = (await (await page.request.get('/api/state')).json()).data;
  const writes=[];
  page.on('request', r=>{if(r.method()==='POST')writes.push(r.url());});
  await page.locator('[data-action=openPuzzle]').click();
  await expect(page.locator('.puzzle-choice')).toHaveCount(20);
  for (const picture of puzzlePacks.life) expect((await page.request.get(picture.src)).status()).toBe(200);
  for(let i=0;i<30;i++) expect(shuffledPieces()).not.toEqual([0,1,2,3]);
  await page.locator('.puzzle-choice').first().click();
  expect(await page.locator('.puzzle-piece').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).backgroundImage.includes('/assets/puzzles/life/')))).toBe(true);
  await page.locator('[data-piece="0"]').click();
  await page.locator('[data-slot="1"]').click();
  await expect(page.locator('.puzzle-status')).toContainText('chưa khớp');
  await expect(page.locator('.puzzle-slot.filled')).toHaveCount(0);
  const source=await page.locator('[data-piece="0"]').boundingBox();
  const target=await page.locator('[data-slot="0"]').boundingBox();
  await page.mouse.move(source.x+source.width/2,source.y+source.height/2);
  await page.mouse.down();
  await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:12});
  await page.mouse.up();
  await expect(page.locator('.puzzle-slot.filled')).toHaveCount(1);
  for(const piece of [1,2,3]) {
    await page.locator(`[data-piece="${piece}"]`).focus();await page.keyboard.press('Enter');
    await page.locator(`[data-slot="${piece}"]`).focus();await page.keyboard.press('Enter');
  }
  await expect(page.locator('.puzzle-result')).toBeVisible();
  await expect(page.locator('.puzzle-count')).toContainText('4/4');
  await page.locator('[data-puzzle=next]').click();
  await expect(page.locator('.puzzle-slot.filled')).toHaveCount(0);
  await page.locator('[data-puzzle=gallery]').click();
  await expect(page.locator('.puzzle-choice').first()).toContainText('Đã ghép');
  await page.locator('.puzzle-choice').nth(19).click();
  await expect.poll(()=>page.locator('.puzzle-reference details img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  for(const width of [320,390,430,1024]){
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'tmp/puzzle-mobile.png',fullPage:true});
  await page.locator('[data-puzzle=restart]').first().click();
  await expect(page.locator('.puzzle-slot.filled')).toHaveCount(0);
  await page.locator('[data-action=closePuzzle]').click();
  await expect(page.locator('.map-stage')).toHaveCount(3);
  await page.locator('[data-action=showJourneys]').click();
  for (const journey of ['animals','vehicles']) {
    await page.locator(`[data-action=openJourney][data-id=${journey}]`).click();
    await expect(page.locator('.puzzle-entry')).toContainText('10 bức tranh');
    await page.locator('[data-action=openPuzzle]').click();
    await expect(page.locator('.puzzle-choice')).toHaveCount(10);
    for(const picture of puzzlePacks[journey])expect((await page.request.get(picture.src)).status()).toBe(200);
    await page.locator('.puzzle-choice').first().click();
    await expect(page.locator('.puzzle-reference details img')).toHaveAttribute('src',puzzlePacks[journey][0].src);
    for(const piece of [0,1,2,3]){
      await page.locator(`[data-piece="${piece}"]`).click();
      await page.locator(`[data-slot="${piece}"]`).click();
    }
    await expect(page.locator('.puzzle-result')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`tmp/puzzle-${journey}-mobile.png`,fullPage:true});
    await page.locator('[data-action=closePuzzle]').click();
    await expect(page.locator('.map-stage')).toHaveCount(3);
    await page.locator('[data-action=showJourneys]').click();
  }
  expect((await (await page.request.get('/api/state')).json()).data.learningPlans).toEqual(before.learningPlans);
  expect(writes).toHaveLength(3);
});

test("Touch puzzle supports dragging and cancellation on a phone", async ({browser}) => {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  try {
    // Exercise the same public component in an isolated page; no learner data needed.
    await page.goto('/');
    await page.evaluate(async()=>{await import('/puzzle-game.mjs');document.body.innerHTML='<picture-puzzle journey="life"></picture-puzzle>';});
    await page.locator('.puzzle-choice').first().tap();
    await page.locator('[data-piece="1"]').tap();
    await page.locator('[data-slot="1"]').tap();
    await expect(page.locator('.puzzle-slot.filled')).toHaveCount(1);
    await page.locator('[data-piece="0"]').scrollIntoViewIfNeeded();
    const from=await page.locator('[data-piece="0"]').boundingBox(),to=await page.locator('[data-slot="0"]').boundingBox();
    const cdp=await context.newCDPSession(page);
    const a={x:from.x+from.width/2,y:from.y+from.height/2},b={x:to.x+to.width/2,y:to.y+to.height/2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[b]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect(page.locator('.puzzle-slot.filled')).toHaveCount(2);
    const remaining=await page.locator('[data-piece="2"]').boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:remaining.x+20,y:remaining.y+20}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[b]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await expect(page.locator('.puzzle-drag-ghost')).toHaveCount(0);
    await expect(page.locator('.puzzle-slot.filled')).toHaveCount(2);
  } finally {await context.close();}
});
