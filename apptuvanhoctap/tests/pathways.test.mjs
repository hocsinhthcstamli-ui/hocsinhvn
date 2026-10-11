import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp, validateBackup } from "../server.mjs";
import { stageProgress, stageUnlocked } from "../pathways.mjs";

test("Individual pathways, strict 80% gate, private video upload/stream and persistence", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "aac-pathways-"));
  const options = { dbPath: path.join(dir, "app.sqlite") };
  let server = await createApp(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });
  function client() {
    let cookie = "";
    const raw = async (route, options = {}) => {
      const response = await fetch(base + route, {
        ...options,
        headers: { Cookie: cookie, ...options.headers },
      });
      if (response.headers.get("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      return response;
    };
    const json = async (route, payload) => {
      const response = await raw(
        route,
        payload === undefined
          ? {}
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
      );
      return { status: response.status, ...(await response.json()) };
    };
    return {
      raw,
      json,
      action: async (action, payload) =>
        json("/api/action", {
          action,
          payload,
          version: (await json("/api/state")).version,
        }),
    };
  }
  const admin = client(),
    teacher = client(),
    child = client(),
    other = client(),
    parent = client(),
    stranger = client();
  await admin.json("/api/setup", { username: "admin", password: "123456" });
  let response = await admin.action("saveChild", {
    name: "Child One",
    birthYear: 2021,
  });
  const childId = response.data.children[0].id;
  response = await admin.action("saveChild", {
    name: "Child Two",
    birthYear: 2020,
  });
  const otherId = response.data.children[1].id;
  for (const [username, role, ids] of [
    ["teacher", "teacher", [childId]],
    ["child", "child", [childId]],
    ["other", "child", [otherId]],
    ["parent", "parent", [childId]],
  ]) {
    await admin.json("/api/users", {
      username,
      role,
      childIds: ids,
      password: "123456",
    });
  }
  for (const [who, username] of [
    [teacher, "teacher"],
    [child, "child"],
    [other, "other"],
    [parent, "parent"],
  ])
    await who.json("/api/login", { username, password: "123456" });
  let state = await teacher.json("/api/state");
  let plan = state.data.learningPlans[0];
  assert.equal(plan.stages.length, 3);
  assert.equal((await admin.json("/api/state")).data.learningPlans.length, 0);
  assert.equal(
    (await other.json("/api/state")).data.learningPlans[0].childId,
    otherId,
  );
  assert.equal(
    (await teacher.action("savePlan", { ...plan, childId: otherId })).status,
    403,
  );
  assert.equal((await child.action("savePlan", plan)).status, 403);
  assert.equal(
    (
      await parent.action("gradeLesson", {
        childId,
        stageId: "1",
        lessonId: plan.stages[0].lessonIds[0],
        score: 100,
      })
    ).status,
    403,
  );

  const bytes = Buffer.concat([
    Buffer.from([0, 0, 0, 24]),
    Buffer.from("ftypisom"),
    Buffer.alloc(100),
  ]);
  const upload = (who) =>
    who.raw("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "video/mp4" },
      body: bytes,
    });
  assert.equal((await upload(child)).status, 403);
  assert.equal((await upload(admin)).status, 403);
  assert.equal((await upload(stranger)).status, 401);
  assert.equal(
    (
      await teacher.raw("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "video/mp4" },
        body: Buffer.alloc(64),
      })
    ).status,
    415,
  );
  const uploaded = await upload(teacher);
  assert.equal(uploaded.status, 201);
  const video = await uploaded.json();
  const lesson = state.data.lessons.find((l) => l.level === 2);
  assert.equal(
    (await teacher.action("saveLesson", { ...lesson, videoId: video.id }))
      .status,
    200,
  );
  assert.equal((await child.raw("/api/videos/" + video.id)).status, 403);
  assert.equal((await stranger.raw("/api/videos/" + video.id)).status, 401);

  // Exactly four of five is still locked; no self-confirmation or practice bypass.
  plan.stages[0].lessonIds = state.data.lessons
    .filter((l) => l.id !== lesson.id)
    .slice(0, 5)
    .map((l) => l.id);
  plan.stages[1].lessonIds = [lesson.id];
  plan.stages[2].lessonIds = state.data.lessons
    .filter((l) => l.id !== lesson.id)
    .slice(5)
    .map((l) => l.id);
  plan.stages[0].lessonScores = Object.fromEntries(
    plan.stages[0].lessonIds.map((id) => [id, 100]),
  );
  response = await teacher.action("savePlan", plan);
  assert.equal(response.status, 200);
  assert.equal(
    Object.keys(response.data.learningPlans[0].stages[0].lessonScores).length,
    0,
  );
  const confirm = (id) =>
    teacher.action("gradeLesson", {
      childId,
      stageId: "1",
      lessonId: id,
      score: 100,
    });
  for (const score of [-1, 101, 80.5, "81"]) {
    assert.equal(
      (
        await teacher.action("gradeLesson", {
          childId,
          stageId: "1",
          lessonId: plan.stages[0].lessonIds[0],
          score,
        })
      ).status,
      400,
    );
  }
  assert.equal(
    (
      await teacher.action("gradeLesson", {
        childId,
        stageId: "2",
        lessonId: lesson.id,
        score: 100,
      })
    ).status,
    403,
  );
  for (const id of plan.stages[0].lessonIds.slice(0, 4))
    assert.equal((await confirm(id)).status, 200);
  await confirm(plan.stages[0].lessonIds[0]);
  state = await child.json("/api/state");
  assert.equal(
    stageProgress(state.data.learningPlans[0].stages[0]).percent,
    80,
  );
  assert.equal(stageUnlocked(state.data.learningPlans[0], 1), false);
  assert.ok(!state.data.lessons.some((l) => l.id === lesson.id));
  assert.equal(
    (
      await child.action("practice", {
        childId,
        lessonId: lesson.id,
        date: "2026-10-11",
        sentence: "test",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await child.action("gradeLesson", {
        childId,
        stageId: "1",
        lessonId: plan.stages[0].lessonIds[4],
        score: 100,
      })
    ).status,
    403,
  );
  await child.action("practice", {
    childId,
    lessonId: plan.stages[0].lessonIds[0],
    date: "2026-10-11",
    sentence: "test",
  });
  assert.equal(
    stageProgress(
      (await child.json("/api/state")).data.learningPlans[0].stages[0],
    ).percent,
    80,
  );
  assert.equal((await confirm(plan.stages[0].lessonIds[4])).status, 200);
  state = await child.json("/api/state");
  assert.equal(stageUnlocked(state.data.learningPlans[0], 1), true);
  assert.equal(stageUnlocked(state.data.learningPlans[0], 2), false);
  assert.equal(
    stageProgress(
      (await other.json("/api/state")).data.learningPlans[0].stages[0],
    ).percent,
    0,
  );
  assert.equal((await other.raw("/api/videos/" + video.id)).status, 403);
  const partial = await child.raw("/api/videos/" + video.id, {
    headers: { Range: "bytes=4-11" },
  });
  assert.equal(partial.status, 206);
  assert.equal(
    partial.headers.get("content-range"),
    `bytes 4-11/${bytes.length}`,
  );
  assert.equal(partial.headers.get("cache-control"), "no-store");
  assert.deepEqual(
    Buffer.from(await partial.arrayBuffer()),
    bytes.subarray(4, 12),
  );
  assert.equal((await parent.raw("/api/videos/" + video.id)).status, 200);
  const invalidRange = await child.raw("/api/videos/" + video.id, {
    headers: { Range: "bytes=10000-" },
  });
  assert.equal(invalidRange.status, 416);
  const backup = await admin.json("/api/backup");
  assert.deepEqual(
    validateBackup(backup).learningPlans,
    backup.data.learningPlans,
  );
  assert.equal(
    (await teacher.action("deleteLesson", { id: lesson.id })).status,
    400,
  );
  await new Promise((resolve) => server.close(resolve));
  server = await createApp(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  assert.equal(
    stageUnlocked((await child.json("/api/state")).data.learningPlans[0], 1),
    true,
  );
  assert.equal((await child.raw("/api/videos/" + video.id)).status, 200);
  await teacher.action("gradeLesson", {
    childId,
    stageId: "1",
    lessonId: plan.stages[0].lessonIds[4],
    score: null,
  });
  assert.equal((await child.raw("/api/videos/" + video.id)).status, 403);
});

test("Score gate uses the mean of teacher grades, including ungraded lessons", () => {
  const stage = {
    lessonIds: ["a", "b", "c", "d", "e"],
    lessonScores: { a: 90, b: 85, c: 80, d: 85 },
  };
  assert.equal(stageProgress(stage).percent, 68);
  stage.lessonScores.e = 85;
  assert.equal(stageProgress(stage).percent, 85);
  assert.equal(stageProgress(stage).passed, true);
  stage.lessonScores = { a: 80, b: 80, c: 80, d: 80, e: 80 };
  assert.equal(stageProgress(stage).passed, false);
  stage.lessonScores.e = 81;
  assert.equal(stageProgress(stage).percent, 80.2);
  assert.equal(stageProgress(stage).passed, true);
  assert.equal(
    stageProgress({ lessonIds: [], lessonScores: {} }).passed,
    false,
  );
});
