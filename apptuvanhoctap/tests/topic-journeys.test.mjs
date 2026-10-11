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
