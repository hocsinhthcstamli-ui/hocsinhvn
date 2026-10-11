import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../server.mjs";
import { domains, sortedRecords } from "../domain.mjs";

test("Real API: permissions, persistence, validation, backup and concurrency", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "aac-test-"));
  const dbPath = path.join(dir, "test.sqlite");
  let server = await createApp({ dbPath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });
  function client() {
    let cookie = "";
    return async (route, payload) => {
      const res = await fetch(base + route, {
        method: payload === undefined ? "GET" : "POST",
        headers: {
          ...(cookie ? { Cookie: cookie } : {}),
          ...(payload === undefined
            ? {}
            : { "Content-Type": "application/json" }),
        },
        body: payload === undefined ? undefined : JSON.stringify(payload),
      });
      if (res.headers.get("set-cookie"))
        cookie = res.headers.get("set-cookie").split(";")[0];
      const body = await res.json();
      return { status: res.status, ...body, body };
    };
  }
  const admin = client(),
    teacher = client(),
    parent = client(),
    child = client(),
    anon = client();
  const action = async (who, action, payload) => {
    const s = await who("/api/state");
    return who("/api/action", { action, payload, version: s.version });
  };
  let c1, c2, recordId, backup;
  await t.test("initial setup and protected APIs", async () => {
    assert.equal((await anon("/api/state")).status, 401);
    assert.equal((await admin("/api/status")).needsSetup, true);
    assert.equal(
      (
        await admin("/api/setup", {
          name: "Quản trị",
          username: "admin",
          password: "test-password-123",
        })
      ).status,
      201,
    );
    assert.equal((await anon("/api/setup", {})).status, 409);
    const s = await admin("/api/state");
    assert.equal(s.data.lessons.length, 0);
    assert.equal(s.data.children.length, 0);
  });
  await t.test("create profiles and retain assessment snapshots", async () => {
    let r = await action(admin, "saveChild", {
      name: "Minh Anh",
      birthYear: 2021,
      goals: "Giao tiếp",
      supportNote: "",
    });
    assert.equal(r.status, 200);
    c1 = r.data.children[0].id;
    r = await action(admin, "saveChild", {
      name: "Gia Bảo",
      birthYear: 2020,
      goals: "",
      supportNote: "",
    });
    c2 = r.data.children[1].id;
    await admin("/api/users", {
      username: "teacher",
      role: "teacher",
      password: "123456",
      childIds: [c1],
    });
    await teacher("/api/login", {
      username: "teacher",
      password: "123456",
      role: "teacher",
    });
    assert.deepEqual(
      (await teacher("/api/state")).data.children.map((c) => c.id),
      [c1],
    );
    assert.equal(
      (
        await action(teacher, "saveChild", {
          name: "Unauthorized",
          birthYear: 2020,
        })
      ).status,
      403,
    );
    const scores = Object.fromEntries(domains.map(([id]) => [id, 2]));
    r = await action(teacher, "assess", {
      childId: c1,
      date: "2026-10-08",
      scores,
    });
    assert.equal(r.data.assessmentHistory.length, 1);
    scores.communication = 4;
    r = await action(teacher, "assess", {
      childId: c1,
      date: "2026-10-09",
      scores,
    });
    assert.equal(r.data.assessmentHistory[0].scores.communication, 2);
    assert.equal(r.data.children[0].assessment.communication, 4);
  });
  await t.test(
    "parent/child assignments are enforced on the server",
    async () => {
      for (const [username, role] of [
        ["parent", "parent"],
        ["child", "child"],
      ])
        assert.equal(
          (
            await admin("/api/users", {
              username,
              name: username,
              role,
              childIds: [c1],
              password: "test-password-123",
            })
          ).status,
          200,
        );
      await parent("/api/login", {
        username: "parent",
        password: "test-password-123",
      });
      await child("/api/login", {
        username: "child",
        password: "test-password-123",
      });
      const s = await parent("/api/state");
      assert.deepEqual(
        s.data.children.map((c) => c.id),
        [c1],
      );
      assert.equal((await parent("/api/backup")).status, 403);
      assert.equal((await parent("/api/users")).status, 403);
      assert.equal(
        (await action(parent, "saveChild", { id: c1, name: "Changed" })).status,
        403,
      );
      assert.equal(
        (
          await action(parent, "practice", {
            childId: c2,
            lessonId: "aac-request-basic",
            date: "2026-10-08",
            sentence: "Con muốn xe",
          })
        ).status,
        403,
      );
      assert.equal((await action(child, "saveRecord", {})).status, 403);
      const r = await action(child, "practice", {
        childId: c1,
        lessonId: "aac-request-basic",
        date: "2026-10-08",
        sentence: "xe Con muốn xe",
      });
      assert.equal(r.status, 200);
      assert.equal(r.data.practiceSessions.length, 0);
      assert.equal(
        (await teacher("/api/state")).data.practiceSessions[0].sentence,
        "xe Con muốn xe",
      );
      assert.equal(r.data.dailyRecords.length, 0);
    },
  );
  await t.test(
    "scores reject invalid input and parent cannot edit others records",
    async () => {
      const r = {
        childId: c1,
        lessonId: "aac-request-basic",
        date: "2026-10-08",
        correct: 0,
        total: 10,
        prompt: 1,
        focus: 3,
        note: "",
        behavior: "",
      };
      assert.equal(
        (await action(teacher, "saveRecord", { ...r, correct: 11 })).status,
        400,
      );
      assert.equal(
        (await action(teacher, "saveRecord", { ...r, date: "2026-02-30" }))
          .status,
        400,
      );
      let result = await action(teacher, "saveRecord", r);
      recordId = result.data.dailyRecords[0].id;
      assert.equal(result.data.dailyRecords[0].correct, 0);
      assert.equal(
        (await action(parent, "saveRecord", { ...r, id: recordId, correct: 2 }))
          .status,
        403,
      );
      assert.equal(
        (await action(parent, "deleteRecord", { id: recordId })).status,
        403,
      );
      result = await action(parent, "saveRecord", {
        ...r,
        date: "2026-09-01",
        correct: 5,
      });
      assert.equal(result.status, 200);
      assert.equal(
        sortedRecords(result.data.dailyRecords, c1)[0].date,
        "2026-10-08",
      );
    },
  );
  await t.test(
    "admin manages assignments but cannot teach; teachers are scoped",
    async () => {
      for (const actionName of [
        "assess",
        "saveLesson",
        "deleteLesson",
        "saveRecord",
        "deleteRecord",
        "practice",
      ])
        assert.equal(
          (await action(admin, actionName, {})).status,
          403,
          actionName,
        );
      assert.equal(
        (
          await action(teacher, "assess", {
            childId: c2,
            scores: Object.fromEntries(domains.map(([id]) => [id, 2])),
            date: "2026-10-10",
          })
        ).status,
        403,
      );
      assert.equal((await teacher("/api/users")).status, 403);
      let state = await admin("/api/state");
      const teacherId = state.users.find((u) => u.username === "teacher").id;
      assert.equal(
        (
          await teacher("/api/assignments", {
            childId: c1,
            teacherIds: [teacherId],
            version: state.version,
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await admin("/api/assignments", {
            childId: c1,
            teacherIds: [],
            version: state.version,
          })
        ).status,
        200,
      );
      assert.equal((await teacher("/api/state")).data.children.length, 0);
      state = await admin("/api/state");
      assert.equal(
        (
          await admin("/api/assignments", {
            childId: c1,
            teacherIds: [teacherId],
            version: state.version,
          })
        ).status,
        200,
      );
      assert.equal((await teacher("/api/state")).data.children.length, 1);
      assert.equal(state.data.dailyRecords.length, 0);
      assert.equal(state.data.children[0].assessment, undefined);
    },
  );
  await t.test("stale writes are rejected without losing data", async () => {
    const s = await admin("/api/state");
    await action(admin, "saveChild", {
      name: "Hồ sơ mới",
      birthYear: 2022,
      goals: "",
      supportNote: "",
    });
    const r = await admin("/api/action", {
      action: "deleteChild",
      payload: { id: c1 },
      version: s.version,
    });
    assert.equal(r.status, 409);
    assert.ok(
      (await admin("/api/state")).data.children.some((c) => c.id === c1),
    );
  });
  await t.test(
    "backup validates references and restores data without passwords",
    async () => {
      backup = await admin("/api/backup");
      assert.equal(
        JSON.stringify(backup.data).includes("test-password"),
        false,
      );
      const invalid = structuredClone(backup.data);
      invalid.dailyRecords[0].childId = "missing";
      assert.equal((await action(admin, "restore", invalid)).status, 400);
      const unsafe = structuredClone(backup.data);
      unsafe.lessons[0].cards[0].image = "javascript:alert(1)";
      assert.equal((await action(admin, "restore", unsafe)).status, 400);
      assert.equal((await action(admin, "restore", backup.data)).status, 200);
      assert.deepEqual((await admin("/api/recovery")).data, backup.data);
      const malformed = structuredClone(backup.data);
      malformed.lessons[0].cards = [null];
      assert.equal((await action(admin, "restore", malformed)).status, 400);
      assert.equal(
        (await action(teacher, "deleteLesson", { id: "aac-request-basic" }))
          .status,
        400,
      );
    },
  );
  await t.test("data and sessions survive server restart", async () => {
    await new Promise((resolve) => server.close(resolve));
    server = await createApp({ dbPath });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    const r = await teacher("/api/state");
    assert.equal(r.status, 200);
    assert.equal(r.data.dailyRecords.length, 2);
    assert.equal(r.data.children[0].name, "Minh Anh");
  });
  await t.test(
    "password changes invalidate existing sessions; logout revokes session",
    async () => {
      const second = client();
      await second("/api/login", {
        username: "admin",
        password: "test-password-123",
      });
      assert.equal(
        (
          await admin("/api/password", {
            current: "test-password-123",
            password: "changed-password-123",
          })
        ).status,
        200,
      );
      assert.equal((await second("/api/state")).status, 401);
      assert.equal((await admin("/api/state")).status, 200);
      await admin("/api/logout", {});
      assert.equal((await admin("/api/state")).status, 401);
    },
  );
});
