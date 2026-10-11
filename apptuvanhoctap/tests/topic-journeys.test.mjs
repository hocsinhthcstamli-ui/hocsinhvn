import { test } from "node:test";
import assert from "node:assert/strict";
import { topicLessons, topicDefinitions, addTopicContent, makeTopicPlan } from "../content/topic-journeys.mjs";
import { seedData } from "../domain.mjs";
import { defaultPlan, stageProgress, stageUnlocked } from "../pathways.mjs";
import { validateBackup } from "../server.mjs";
import { cardImage } from "../card-art.mjs";
import { voiceClips } from "../voice-manifest.mjs";
import { createApp } from "../server.mjs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { topicVideos, attachTopicVideos } from "../content/topic-videos.mjs";
import { youtubeValue } from "../youtube.mjs";
import {addMathContent,mathLessons,mathQuestions,mathTemplate} from '../content/math-journey.mjs';
import {activitiesFor} from '../lesson-activities.mjs';
import {puzzlePacks} from '../puzzle-catalog.mjs';
import {computerLessons,computerQuestions,computerTemplate,addComputerContent} from '../content/computer-journey.mjs';
import {validateFun} from '../fun-model.mjs';
import {lifeFunDefinitions} from '../content/life-fun.mjs';
import {materializeLifeFun,mergeLifeFun} from '../scripts/seed-life-fun.mjs';
import {materializeAnimalsFun,mergeAnimalsFun} from '../scripts/seed-animals-fun.mjs';
import {materializeVehiclesFun,mergeVehiclesFun} from '../scripts/seed-vehicles-fun.mjs';
import {materializeMathFun,mergeMathFun} from '../scripts/seed-math-fun.mjs';
import {mathFunDefinitions} from '../content/math-fun.mjs';
import {materializeComputerFun,mergeComputerFun} from '../scripts/seed-computer-fun.mjs';

test('Computer pack completes 100 demo activities, preserves older packs and allows teacher additions',async()=>{
  const data=seedData();mergeLifeFun(data,await materializeLifeFun());mergeAnimalsFun(data,await materializeAnimalsFun());mergeVehiclesFun(data,await materializeVehiclesFun());mergeMathFun(data,await materializeMathFun());
  const before=structuredClone(data),activities=await materializeComputerFun();
  for(const kind of ['listen','sequence','sort','pairs'])assert.equal(activities.filter(a=>a.kind===kind).length,5);
  for(const a of activities){assert.equal(a.journeyId,'computer');assert.deepEqual(validateFun(a),a);assert.equal(a.items.length,a.kind==='sequence'?3:4);}
  assert.equal(mergeComputerFun(data,activities),20);
  assert.deepEqual(data.funActivities.filter(a=>a.journeyId!=='computer'),before.funActivities);
  assert.deepEqual(data.lessons,before.lessons);assert.deepEqual(data.learningPlans,before.learningPlans);
  assert.equal(data.funActivities.length,100);
  data.funActivities.push({...structuredClone(activities[0]),id:'teacher-extra'});
  assert.equal(validateBackup(data).funActivities.length,101);
  data.funActivities.find(a=>a.journeyId==='computer').title='Teacher edit';data.funActivities.splice(99,1);
  const restored=validateBackup(data);assert.equal(mergeComputerFun(restored,activities),0);
  assert.equal(restored.funActivities.length,100);assert.equal(restored.funActivities.find(a=>a.journeyId==='computer').title,'Teacher edit');
});

test('Math activity pack has exact numerical sequences and preserves the three previous packs',async()=>{
  const data=seedData();mergeLifeFun(data,await materializeLifeFun());mergeAnimalsFun(data,await materializeAnimalsFun());mergeVehiclesFun(data,await materializeVehiclesFun());
  const before=structuredClone(data),activities=await materializeMathFun();
  for(const kind of ['listen','sequence','sort','pairs'])assert.equal(activities.filter(a=>a.kind===kind).length,5);
  for(const a of activities){assert.equal(a.journeyId,'math');assert.deepEqual(validateFun(a),a);assert.equal(a.items.length,a.kind==='sequence'?3:4);}
  const counts=mathFunDefinitions.filter(a=>a.kind==='sequence').slice(0,4).map(a=>a.items.map(i=>Number(i.picture.match(/count-(\d)/)[1])));
  assert.deepEqual(counts,[[1,2,3],[6,5,4],[1,3,5],[2,4,6]]);
  assert.equal(mergeMathFun(data,activities),20);
  assert.deepEqual(data.funActivities.filter(a=>a.journeyId!=='math'),before.funActivities);
  assert.deepEqual(data.lessons,before.lessons);assert.deepEqual(data.learningPlans,before.learningPlans);
  data.funActivities.find(a=>a.journeyId==='math').title='Teacher edit';data.funActivities.pop();
  const restored=validateBackup(data);assert.equal(mergeMathFun(restored,activities),0);
  assert.equal(restored.funActivities.length,79);assert.equal(restored.funActivities.find(a=>a.journeyId==='math').title,'Teacher edit');
});

test('Vehicles pack adds 20 valid activities and preserves both earlier packs and teacher edits',async()=>{
  const data=seedData();mergeLifeFun(data,await materializeLifeFun());mergeAnimalsFun(data,await materializeAnimalsFun());
  const before=structuredClone(data),activities=await materializeVehiclesFun();
  for(const kind of ['listen','sequence','sort','pairs'])assert.equal(activities.filter(a=>a.kind===kind).length,5);
  for(const a of activities){assert.equal(a.journeyId,'vehicles');assert.deepEqual(validateFun(a),a);assert.equal(a.items.length,a.kind==='sequence'?3:4);}
  assert.equal(mergeVehiclesFun(data,activities),20);
  assert.deepEqual(data.funActivities.filter(a=>a.journeyId!=='vehicles'),before.funActivities);
  assert.deepEqual(data.lessons,before.lessons);assert.deepEqual(data.learningPlans,before.learningPlans);
  data.funActivities.find(a=>a.journeyId==='vehicles').title='Teacher edit';data.funActivities.pop();
  const restored=validateBackup(data);assert.equal(mergeVehiclesFun(restored,activities),0);
  assert.equal(restored.funActivities.length,59);assert.equal(restored.funActivities.find(a=>a.journeyId==='vehicles').title,'Teacher edit');
});

test('Animals pack adds five per kind without changing life activities or teacher edits',async()=>{
  const activities=await materializeAnimalsFun(),data=seedData();
  mergeLifeFun(data,await materializeLifeFun());const before=structuredClone(data);
  assert.equal(activities.length,20);
  for(const kind of ['listen','sequence','sort','pairs'])assert.equal(activities.filter(a=>a.kind===kind).length,5);
  for(const a of activities){assert.equal(a.journeyId,'animals');assert.deepEqual(validateFun(a),a);assert.equal(a.items.length,a.kind==='sequence'?3:4);}
  assert.equal(mergeAnimalsFun(data,activities),20);
  assert.deepEqual(data.funActivities.filter(a=>a.journeyId==='life'),before.funActivities);
  assert.deepEqual(data.lessons,before.lessons);assert.deepEqual(data.learningPlans,before.learningPlans);
  data.funActivities.find(a=>a.journeyId==='animals').title='Teacher edit';data.funActivities.pop();
  const restored=validateBackup(data);assert.equal(mergeAnimalsFun(restored,activities),0);
  assert.equal(restored.funActivities.length,39);assert.equal(restored.funActivities.find(a=>a.journeyId==='animals').title,'Teacher edit');
});

test('Life activity pack has five per kind, real media and preserves edits/deletions on repeat import',async()=>{
  const activities=await materializeLifeFun();
  assert.equal(activities.length,20);
  for(const kind of ['listen','sequence','sort','pairs'])assert.equal(activities.filter(a=>a.kind===kind).length,5);
  assert.equal(new Set(activities.map(a=>a.id)).size,20);
  for(const a of activities){assert.equal(a.journeyId,'life');assert.deepEqual(validateFun(a),a);for(const item of a.items){assert.ok(item.image.length>100);if(a.kind==='listen')assert.ok(item.audio.length>1000);}}
  assert.equal(lifeFunDefinitions.filter(a=>a.kind==='sequence').every(a=>a.items.length===3),true);
  const data=seedData();const before=structuredClone(data);
  assert.equal(mergeLifeFun(data,activities),20);
  assert.deepEqual(data.lessons,before.lessons);assert.deepEqual(data.learningPlans,before.learningPlans);
  data.funActivities[0].title='Teacher changed this';data.funActivities.pop();
  const restored=validateBackup(data);assert.equal(mergeLifeFun(restored,activities),0);
  assert.equal(restored.funActivities.length,19);assert.equal(restored.funActivities[0].title,'Teacher changed this');
});

test('Teacher activities validate media, categories and backup history without demo seeds',()=>{
  const image='data:image/png;base64,AAAA';
  const a={id:'test-activity',journeyId:'life',title:'Test',kind:'pairs',items:[{label:'One',image},{label:'Two',image}]};
  assert.equal(validateFun(a).items.length,2);
  assert.throws(()=>validateFun({...a,kind:'listen'}));
  assert.throws(()=>validateFun({...a,kind:'sort',items:a.items.map(i=>({...i,group:'same'}))}));
  assert.throws(()=>validateFun({...a,items:[{label:'One',image:'https://example.com/x.png'},a.items[1]]}));
  assert.throws(()=>validateFun({...a,items:[a.items[0]]}));
  const d=seedData();assert.equal(d.funActivities,undefined);d.funActivities=[a];
  assert.deepEqual(validateBackup(d).funActivities,[validateFun(a)]);
  assert.throws(()=>validateBackup({...d,funActivities:[a,a]}));
});

test('Computer curriculum has reviewed assets, five questions per lesson and preserves library deletions',()=>{
  const data=seedData();addComputerContent(data);
  assert.equal(computerLessons.length,6);assert.equal(puzzlePacks.computer.length,10);
  assert.equal(new Set(puzzlePacks.computer.map(p=>p.id)).size,10);
  assert.deepEqual(computerTemplate().stages.map(s=>s.lessonIds.length),[2,2,2]);
  for(const lesson of computerLessons){
    assert.equal(lesson.teachingGuide.band,'secondary');
    assert.equal(lesson.teachingGuide.practice.length,5);
    assert.equal(activitiesFor(lesson).kind,'computer');
    assert.equal(activitiesFor(lesson).rounds.length,5);
    assert.equal(computerQuestions[lesson.id].length,5);
    for(const c of lesson.cards)assert.ok(cardImage(c));
    for(const q of computerQuestions[lesson.id]){
      assert.ok(q.choices.includes(q.answer));assert.equal(new Set(q.choices).size,q.choices.length);
      for(const text of q.choices)assert.ok(voiceClips[text.toLowerCase().trim()],text);
    }
  }
  assert.equal(data.learningPlans?.length||0,0);
  data.lessons[0].title='Teacher edit';data.journeyTemplates=[];
  const restored=validateBackup(data);assert.equal(addComputerContent(restored),false);
  assert.equal(restored.journeyTemplates.length,0);assert.equal(restored.lessons[0].title,'Teacher edit');
});

test('Math library has six THCS lessons, thirty questions and ten puzzles; import preserves edits and deletions',()=>{
  const d=seedData();addMathContent(d);
  assert.equal(mathLessons.length,6);assert.equal(puzzlePacks.math.length,10);
  assert.deepEqual(mathTemplate().stages.map(s=>s.lessonIds.length),[2,2,2]);
  for(const l of mathLessons){
    assert.equal(l.teachingGuide.band,'secondary');
    assert.equal(activitiesFor(l).rounds.length,5);
    assert.equal(mathQuestions[l.id].length,5);
    for(const q of mathQuestions[l.id]){
      assert.ok(q.choices.includes(q.answer));
      assert.equal(new Set(q.choices).size,q.choices.length);
      for(const choice of q.choices)assert.ok(voiceClips[choice.toLowerCase().trim()],choice);
    }
    for(const c of l.cards)assert.ok(cardImage(c));
  }
  assert.equal(d.learningPlans?.length||0,0);
  d.journeyTemplates=[];d.lessons=d.lessons.filter(l=>l.id!==mathLessons[0].id);
  const restored=validateBackup(d);
  assert.equal(addMathContent(restored),false);
  assert.equal(restored.journeyTemplates.length,0);
  assert.ok(!restored.lessons.some(l=>l.id===mathLessons[0].id));
});

test("Topic video links match real lessons and never replace teacher changes or removals", () => {
  const data = { lessons: structuredClone(topicLessons) };
  assert.equal(attachTopicVideos(data, topicLessons).length, 12);
  const once = structuredClone(data);
  assert.deepEqual(attachTopicVideos(data, topicLessons), []);
  assert.deepEqual(data, once);
  for (const video of topicVideos) {
    for (const id of video.lessonIds) assert.ok(topicLessons.some(l => l.id === id));
    assert.equal(youtubeValue(data.lessons.find(l => l.id === video.lessonIds[0]).youtube).url, `https://www.youtube.com/watch?v=${video.id}`);
  }
  for (const patch of [{youtube:null}, {drive:null}, {title:"Teacher edit"}, {videoId:"uploaded"}]) {
    const changed = { lessons: [structuredClone(topicLessons[0])] };
    Object.assign(changed.lessons[0], patch);
    const before = structuredClone(changed);
    assert.deepEqual(attachTopicVideos(changed, topicLessons), []);
    assert.deepEqual(changed, before);
  }
});

test("Topic curriculum has distinct bands, complete images/audio and observable activities", () => {
  for (const topic of Object.keys(topicDefinitions)) for (const band of ["primary", "secondary"]) {
    const plan = makeTopicPlan("kid", topic, band);
    assert.deepEqual(plan.stages.map(s => s.lessonIds.length), [2, 2, 2]);
    for (const id of plan.stages.flatMap(s => s.lessonIds)) {
      const lesson = topicLessons.find(l => l.id === id);
      assert.equal(lesson.teachingGuide.band, band);
      assert.equal(lesson.teachingGuide.practice.length, 5);
      assert.ok(lesson.teachingGuide.scoring);
      for (const card of lesson.cards) {
        assert.ok(cardImage(card), `Picture: ${card.text}`);
        assert.ok(voiceClips[card.text.toLowerCase().trim()], `Voice: ${card.text}`);
      }
    }
  }
});

test("API isolates journey scores, enforces child locks and preserves all plans after restart", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "aac-topics-"));
  const options = { dbPath: path.join(dir, "app.sqlite") };
  let server = await createApp(options);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(dir, {recursive: true, force: true}); });
  function client() {
    let cookie = "";
    const json = async (route, body) => {
      const response = await fetch(base + route, { method: body ? "POST" : "GET", headers: { Cookie: cookie, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie").split(";")[0];
      return { status: response.status, ...await response.json() };
    };
    return {json, action: async (action, payload) => json("/api/action", { action, payload, version: (await json("/api/state")).version })};
  }
  const admin = client(), teacher = client(), child = client();
  await admin.json("/api/setup", { username: "admin", password: "123456" });
  const created = await admin.action("saveChild", { name: "Topic learner", birthYear: 2016 });
  const childId = created.data.children[0].id;
  for (const [username, role, who] of [["teacher", "teacher", teacher], ["learner", "child", child]]) {
    await admin.json("/api/users", { username, role, childIds: [childId], password: "123456" });
    await who.json("/api/login", { username, password: "123456" });
  }
  let state = (await teacher.json("/api/state")).data;
  assert.equal(state.learningPlans.length, 3);
  const beforeLife = structuredClone(state.learningPlans.find(p => !p.journeyId || p.journeyId === "life"));
  for (const journeyId of ["animals", "vehicles"]) {
    const plan = state.learningPlans.find(p => p.journeyId === journeyId);
    const grade = (lessonId, score, stageId = "1") => teacher.action("gradeLesson", { childId, journeyId, stageId, lessonId, score });
    assert.equal((await child.action("gradeLesson", {childId, journeyId, stageId: "1", lessonId: plan.stages[0].lessonIds[0], score: 100})).status, 403);
    const practice = lessonId => child.action("practice", {childId, lessonId, date: "2026-10-11", sentence: ""});
    assert.equal((await practice(plan.stages[0].lessonIds[0])).status, 200);
    assert.equal((await practice(plan.stages[1].lessonIds[0])).status, 403);
    for (const id of plan.stages[0].lessonIds) assert.equal((await grade(id, 80)).status, 200);
    assert.equal((await grade(plan.stages[1].lessonIds[0], 90, "2")).status, 403);
    await grade(plan.stages[0].lessonIds[0], 81);
    assert.equal((await practice(plan.stages[1].lessonIds[0])).status, 200);
    assert.equal((await grade(plan.stages[1].lessonIds[0], 90, "2")).status, 200);
    assert.equal((await teacher.action("gradeLesson", {childId, journeyId: "life", stageId: "1", lessonId: plan.stages[0].lessonIds[0], score: 100})).status, 400);
  }
  state = (await teacher.json("/api/state")).data;
  assert.deepEqual(state.learningPlans.find(p => !p.journeyId), beforeLife);
  const backup = validateBackup(state);
  assert.equal(backup.learningPlans.length, 3);
  const templateDraft = {...state.journeyTemplates[1], id:undefined, title:'Shared test template'};
  assert.equal((await child.action('saveTemplate',templateDraft)).status,403);
  const saved=await teacher.action('saveTemplate',templateDraft);
  assert.equal(saved.status,200);
  const template=saved.data.journeyTemplates.find(t=>t.title===templateDraft.title);
  const assigned={...template,childId,journeyId:template.id};
  assert.equal((await teacher.action('savePlan',{...assigned,childId:'other-child'})).status,404);
  const other=await admin.action('saveChild',{name:'Other learner',birthYear:2017});
  const otherId=other.data.children.find(c=>c.id!==childId).id;
  assert.equal((await teacher.action('savePlan',{...assigned,childId:otherId})).status,403);
  assert.equal((await teacher.action('savePlan',assigned)).status,200);
  await teacher.action('saveTemplate',{...template,title:'Updated shared template'});
  let current=(await teacher.json('/api/state')).data;
  assert.equal(current.learningPlans.find(p=>p.journeyId===template.id).title,template.title);
  const record={id:'practice-test',childId,journeyId:template.id,kind:'sentences',itemId:assigned.stages[0].lessonIds[0],total:5,completed:5,mistakes:2};
  assert.equal((await child.action('activityResult',{...record,completed:4})).status,400);
  assert.equal((await child.action('activityResult',record)).status,200);
  assert.equal((await child.action('activityResult',record)).status,200);
  current=(await teacher.json('/api/state')).data;
  assert.equal(current.activityResults.length,1);
  assert.deepEqual(current.learningPlans.find(p=>p.journeyId===template.id).stages,assigned.stages);
  assert.deepEqual((await child.json('/api/state')).data.activityResults,[]);
  assert.equal((await teacher.action('deleteTemplate',{id:template.id})).status,200);
  assert.ok((await teacher.json('/api/state')).data.learningPlans.some(p=>p.journeyId===template.id));
  assert.equal((await teacher.action('archivePlan',{childId,journeyId:template.id})).status,200);
  assert.equal((await child.action('activityResult',{...record,id:'after-archive'})).status,403);
  assert.ok(!(await child.json('/api/state')).data.learningPlans.some(p=>p.journeyId===template.id));
  state=(await teacher.json('/api/state')).data;
  assert.equal(validateBackup(state).activityResults.length,1);
  await new Promise(resolve => server.close(resolve));
  server = await createApp(options);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  assert.deepEqual((await teacher.json("/api/state")).data.learningPlans, state.learningPlans);
});
test("Topic migration preserves original scores, teacher edits and unrelated records on repeat", () => {
  const data = seedData();
  data.children = [{ id: "kid", name: "Kid", birthYear: 2016, assessment: Object.fromEntries(["communication", "receptive", "cognition", "behavior", "selfcare", "emotion"].map(k => [k, 1])) }];
  const original = defaultPlan("kid", data.lessons);
  original.stages[0].lessonScores[original.stages[0].lessonIds[0]] = 95;
  data.learningPlans = [original];
  const copy = structuredClone(original);
  assert.equal(addTopicContent(data), true);
  data.lessons.find(l => l.id === "animals-primary-01").title = "Teacher edit";
  assert.equal(addTopicContent(data), false);
  assert.deepEqual(data.learningPlans[0], copy);
  assert.equal(data.lessons.find(l => l.id === "animals-primary-01").title, "Teacher edit");
  const restored = validateBackup(data);
  assert.equal(restored.learningPlans.length, 1 + Object.keys(topicDefinitions).length);
  const animals = restored.learningPlans.find(p => p.journeyId === "animals");
  animals.stages[0].lessonScores = Object.fromEntries(animals.stages[0].lessonIds.map(id => [id, 80]));
  assert.equal(stageUnlocked(animals, 1), false);
  animals.stages[0].lessonScores[animals.stages[0].lessonIds[0]] = 81;
  assert.equal(stageUnlocked(animals, 1), true);
  assert.equal(stageProgress(restored.learningPlans[0].stages[0]).percent, stageProgress(copy.stages[0]).percent);
  assert.throws(() => validateBackup({ ...data, learningPlans: [...data.learningPlans, animals] }));
});
