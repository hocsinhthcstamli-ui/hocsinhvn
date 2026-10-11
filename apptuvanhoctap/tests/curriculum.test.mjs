import { phase3Lessons } from "../content/phase-3.mjs";
import { importPhase3 } from "../scripts/seed-phase3.mjs";
test('Phase 3 fills secondary pathways without mixing bands and detects incomplete imports', () => {
  const data = seedData();
  data.lessons.push(...phase1Lessons, ...phase2Lessons, ...phase3Lessons);
  const validated = validateBackup(data);
  assert.equal(new Set(validated.lessons.map(l => l.id)).size, validated.lessons.length);
  assert.deepEqual(validated.lessons.slice(-12), phase3Lessons);
  assert.ok(phase3Lessons.every(l => l.teachingGuide.band === 'secondary' && l.teachingGuide.phase === 3 && l.cards.length === 6 && l.teachingGuide.steps.length === 4 && l.teachingGuide.practice.length === 5));
  const plan = makeCurriculumPlan('child', 'secondary', validated.lessons);
  assert.deepEqual(plan.stages.map(s => s.lessonIds.length), [6, 6, 6]);
  for (const level of [2, 3]) assert.deepEqual(plan.stages[level - 1].lessonIds, phase3Lessons.filter(l => l.level === level).map(l => l.id));
  assert.deepEqual(makeCurriculumPlan('child', 'primary', validated.lessons), makeCurriculumPlan('child', 'primary', data.lessons.filter(l => l.teachingGuide?.phase !== 3)));
  assert.throws(() => makeCurriculumPlan('child', 'secondary', validated.lessons.slice(0, -1)), /seed:phase3/);
  assert.ok(defaultPlan('child', validated.lessons).stages.every(s => s.lessonIds.every(id => !phase3Lessons.some(l => l.id === id))));
});
import { phase2Lessons } from "../content/phase-2.mjs";
import { importPhase2 } from "../scripts/seed-phase2.mjs";
test('Phase 2 supplies complete primary stages and rejects partial packs', () => {
  const data = seedData();
  data.lessons.push(...phase1Lessons, ...phase2Lessons);
  const validated = validateBackup(data);
  assert.equal(new Set(validated.lessons.map(l => l.id)).size, validated.lessons.length);
  assert.deepEqual(validated.lessons.slice(-12), phase2Lessons);
  assert.ok(phase2Lessons.every(l => l.cards.length === 6 && l.teachingGuide.steps.length === 4 && l.teachingGuide.practice.length === 5));
  const primary = makeCurriculumPlan('child', 'primary', validated.lessons);
  assert.deepEqual(primary.stages.map(s => s.lessonIds.length), [6, 6, 6]);
  assert.deepEqual(primary.stages[1].lessonIds, phase2Lessons.filter(l => l.level === 2).map(l => l.id));
  assert.deepEqual(primary.stages[2].lessonIds, phase2Lessons.filter(l => l.level === 3).map(l => l.id));
  assert.deepEqual(makeCurriculumPlan('child', 'secondary', validated.lessons).stages.map(s => s.lessonIds.length), [6, 0, 0]);
  assert.throws(() => makeCurriculumPlan('child', 'primary', validated.lessons.slice(0, -1)), /seed:phase2/);
  const imported = new Set([...phase1Lessons, ...phase2Lessons].map(l => l.id));
  assert.ok(defaultPlan('child', validated.lessons).stages.every(s => s.lessonIds.every(id => !imported.has(id))));
});
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createApp, validateBackup } from "../server.mjs";
import { seedData } from "../domain.mjs";
import { defaultPlan } from "../pathways.mjs";
import { phase1Lessons } from "../content/phase-1.mjs";
import { makeCurriculumPlan } from "../curriculum.mjs";
import { importPhase1 } from "../scripts/seed-phase1.mjs";

test("Phase 1 import is additive, backed up, repeatable and preserves teacher edits", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "aac-curriculum-"));
  const dbPath = path.join(dir, "app.sqlite");
  t.after(() => rm(dir, { recursive: true, force: true }));
  const server = await createApp({ dbPath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  await new Promise((resolve) => server.close(resolve));
  const read = () => {
    const db = new DatabaseSync(dbPath);
    const result = db
      .prepare("SELECT version,data FROM app_state WHERE id=1")
      .get();
    db.close();
    return { ...result, data: JSON.parse(result.data) };
  };
  const before = read();
  const imported = await importPhase1(dbPath);
  assert.equal(imported.added, 12);
  const after = read();
  assert.equal(after.data.lessons.length, before.data.lessons.length + 12);
  assert.deepEqual(
    after.data.lessons.slice(0, before.data.lessons.length),
    before.data.lessons,
  );
  for (const key of [
    "children",
    "learningPlans",
    "dailyRecords",
    "practiceSessions",
    "assessmentHistory",
  ])
    assert.deepEqual(after.data[key], before.data[key]);
  const backup = new DatabaseSync(imported.backup, { readOnly: true });
  assert.deepEqual(
    JSON.parse(
      backup.prepare("SELECT data FROM app_state WHERE id=1").get().data,
    ),
    before.data,
  );
  backup.close();
  const db = new DatabaseSync(dbPath);
  after.data.lessons.find((l) => l.id === phase1Lessons[0].id).title =
    "Teacher customized title";
  db.prepare("UPDATE app_state SET data=? WHERE id=1").run(
    JSON.stringify(after.data),
  );
  db.close();
  const repeated = await importPhase1(dbPath);
  assert.equal(repeated.added, 0);
  assert.equal(repeated.backup, null);
  assert.equal(read().version, after.version);
  assert.equal(
    read().data.lessons.find((l) => l.id === phase1Lessons[0].id).title,
    "Teacher customized title",
  );
});

test("Templates separate school bands, preserve guides in backups and do not auto-assign by level", () => {
  const data = seedData();
  data.lessons.push(...phase1Lessons);
  const validated = validateBackup(data);
  for (const band of ["primary", "secondary"]) {
    const lessons = validated.lessons.filter(
      (l) => l.teachingGuide?.band === band,
    );
    assert.equal(lessons.length, 6);
    assert.ok(
      lessons.every(
        (l) =>
          l.level === 1 &&
          l.teachingGuide.practice.length === 5 &&
          l.cards.length === 6,
      ),
    );
    const plan = makeCurriculumPlan("test", band, validated.lessons);
    assert.equal(plan.stages[0].lessonIds.length, 6);
    assert.ok(plan.stages[0].lessonIds.every((id) => id.includes(band)));
    assert.equal(plan.stages[1].lessonIds.length, 0);
    assert.equal(plan.stages[2].lessonIds.length, 0);
  }
  const generic = defaultPlan("new-student", validated.lessons);
  assert.ok(
    generic.stages.every((stage) =>
      stage.lessonIds.every((id) => !id.startsWith("foundation-")),
    ),
  );
  assert.throws(() => makeCurriculumPlan("test", "unknown", validated.lessons));
  const bad = structuredClone(data);
  bad.lessons.at(-1).teachingGuide.practice = ["x".repeat(1600)];
  assert.throws(() => validateBackup(bad));
});

test("Phase 2 import is additive, backed up, repeatable and preserves teacher edits", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "aac-curriculum-"));
  const dbPath = path.join(dir, "app.sqlite");
  t.after(() => rm(dir, { recursive: true, force: true }));
  const server = await createApp({ dbPath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  await new Promise((resolve) => server.close(resolve));
  const read = () => {
    const db = new DatabaseSync(dbPath);
    const result = db
      .prepare("SELECT version,data FROM app_state WHERE id=1")
      .get();
    db.close();
    return { ...result, data: JSON.parse(result.data) };
  };
  await importPhase1(dbPath);
  const before = read();
  const imported = await importPhase2(dbPath);
  assert.equal(imported.added, 12);
  const after = read();
  assert.equal(after.data.lessons.length, before.data.lessons.length + 12);
  assert.deepEqual(
    after.data.lessons.slice(0, before.data.lessons.length),
    before.data.lessons,
  );
  for (const key of [
    "children",
    "learningPlans",
    "dailyRecords",
    "practiceSessions",
    "assessmentHistory",
  ])
    assert.deepEqual(after.data[key], before.data[key]);
  const backup = new DatabaseSync(imported.backup, { readOnly: true });
  assert.deepEqual(
    JSON.parse(
      backup.prepare("SELECT data FROM app_state WHERE id=1").get().data,
    ),
    before.data,
  );
  backup.close();
  const db = new DatabaseSync(dbPath);
  after.data.lessons.find((l) => l.id === phase2Lessons[0].id).title =
    "Teacher customized title";
  db.prepare("UPDATE app_state SET data=? WHERE id=1").run(
    JSON.stringify(after.data),
  );
  db.close();
  const repeated = await importPhase2(dbPath);
  assert.equal(repeated.added, 0);
  assert.equal(repeated.backup, null);
  assert.equal(read().version, after.version);
  assert.equal(
    read().data.lessons.find((l) => l.id === phase2Lessons[0].id).title,
    "Teacher customized title",
  );
});

test("Phase 3 import is additive, backed up, repeatable and preserves teacher edits", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "aac-curriculum-"));
  const dbPath = path.join(dir, "app.sqlite");
  t.after(() => rm(dir, { recursive: true, force: true }));
  const server = await createApp({ dbPath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  await new Promise((resolve) => server.close(resolve));
  const read = () => {
    const db = new DatabaseSync(dbPath);
    const result = db
      .prepare("SELECT version,data FROM app_state WHERE id=1")
      .get();
    db.close();
    return { ...result, data: JSON.parse(result.data) };
  };
  await importPhase1(dbPath);
  await importPhase2(dbPath);
  const before = read();
  const imported = await importPhase3(dbPath);
  assert.equal(imported.added, 12);
  const after = read();
  assert.equal(after.data.lessons.length, before.data.lessons.length + 12);
  assert.deepEqual(
    after.data.lessons.slice(0, before.data.lessons.length),
    before.data.lessons,
  );
  for (const key of [
    "children",
    "learningPlans",
    "dailyRecords",
    "practiceSessions",
    "assessmentHistory",
  ])
    assert.deepEqual(after.data[key], before.data[key]);
  const backup = new DatabaseSync(imported.backup, { readOnly: true });
  assert.deepEqual(
    JSON.parse(
      backup.prepare("SELECT data FROM app_state WHERE id=1").get().data,
    ),
    before.data,
  );
  backup.close();
  const db = new DatabaseSync(dbPath);
  after.data.lessons.find((l) => l.id === phase3Lessons[0].id).title =
    "Teacher customized title";
  db.prepare("UPDATE app_state SET data=? WHERE id=1").run(
    JSON.stringify(after.data),
  );
  db.close();
  const repeated = await importPhase3(dbPath);
  assert.equal(repeated.added, 0);
  assert.equal(repeated.backup, null);
  assert.equal(read().version, after.version);
  assert.equal(
    read().data.lessons.find((l) => l.id === phase3Lessons[0].id).title,
    "Teacher customized title",
  );
});
