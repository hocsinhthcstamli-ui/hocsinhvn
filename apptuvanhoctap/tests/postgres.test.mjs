import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import EmbeddedPostgres from "embedded-postgres";
import { createApp } from "../server.mjs";
import { migrateSQLite } from "../scripts/migrate-supabase.mjs";
import { postgresOptions } from "../database.mjs";

test(
  "PostgreSQL: real transactions, cross-instance conflicts, persistence, roles and SQLite migration",
  { timeout: 120000 },
  async (t) => {
    const root = path.resolve("tmp");
    const directory = await mkdtemp(path.join(root, "pg-test-"));
    assert.ok(directory.startsWith(root + path.sep));
    const probe = net.createServer();
    await new Promise((r) => probe.listen(0, "127.0.0.1", r));
    const port = probe.address().port;
    await new Promise((r) => probe.close(r));
    const cluster = new EmbeddedPostgres({
      databaseDir: path.join(directory, "cluster"),
      port,
      user: "postgres",
      password: "local-test-only",
      persistent: true,
      initdbFlags: ["--encoding=UTF8", "--locale=C"],
      onLog: () => {},
      onError: () => {},
    });
    const servers = [];
    t.after(async () => {
      for (const server of servers)
        if (server.listening) await new Promise((r) => server.close(r));
      await cluster.stop();
      // Only remove the verified per-test directory.
      assert.ok(path.resolve(directory).startsWith(root + path.sep));
      await rm(directory, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 300,
      });
    });
    await cluster.initialise();
    await cluster.start();
    const roleClient = cluster.getPgClient();
    await roleClient.connect();
    await roleClient.query("CREATE ROLE anon; CREATE ROLE authenticated;");
    await roleClient.end();
    const url = `postgresql://postgres:local-test-only@127.0.0.1:${port}/postgres`;
    const start = async (options) => {
      const server = await createApp(options);
      servers.push(server);
      await new Promise((r) => server.listen(0, "127.0.0.1", r));
      return { server, base: `http://127.0.0.1:${server.address().port}` };
    };
    const first = await start({
      databaseUrl: url,
      bootstrapAdmin: { username: "admin", password: "123456" },
      production: true,
    });
    const grants = cluster.getPgClient();
    await grants.connect();
    await grants.query(
      "GRANT USAGE ON SCHEMA aac_private TO anon,authenticated; GRANT SELECT ON ALL TABLES IN SCHEMA aac_private TO anon,authenticated;",
    );
    await grants.end();
    const second = await start({ databaseUrl: url, production: true });
    function client(base) {
      let cookie = "";
      const json = async (route, body, otherBase = base) => {
        const res = await fetch(otherBase + route, {
          method: body ? "POST" : "GET",
          headers: { Cookie: cookie, "Content-Type": "application/json" },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (res.headers.get("set-cookie"))
          cookie = res.headers.get("set-cookie").split(";")[0];
        return { status: res.status, ...(await res.json()) };
      };
      return {
        json,
        action: async (action, payload) =>
          json("/api/action", {
            action,
            payload,
            version: (await json("/api/state")).version,
          }),
      };
    }
    const admin = client(first.base);
    assert.equal((await admin.json("/api/health")).status, 200);
    assert.equal((await admin.json("/api/status")).videoUploads, false);
    assert.equal(
      (
        await admin.json("/api/setup", {
          username: "other",
          password: "123456",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await admin.json("/api/login", {
          username: "admin",
          password: "123456",
          role: "admin",
        })
      ).status,
      200,
    );
    const created = await admin.action("saveChild", {
      name: "PG child",
      birthYear: 2015,
    });
    assert.equal(created.status, 200);
    const id = created.data.children[0].id;
    for (const role of ["teacher", "parent", "child"])
      assert.equal(
        (
          await admin.json("/api/users", {
            username: role,
            role,
            password: "123456",
            childIds: [id],
          })
        ).status,
        200,
      );
    const teacher = client(first.base),
      child = client(second.base),
      parent = client(second.base);
    for (const [c, role] of [
      [teacher, "teacher"],
      [child, "child"],
      [parent, "parent"],
    ])
      assert.equal(
        (
          await c.json("/api/login", {
            username: role,
            password: "123456",
            role,
          })
        ).status,
        200,
      );
    let state = await teacher.json("/api/state");
    assert.equal(state.data.lessons.length, 80);
    assert.equal(state.data.learningPlans.length, 3);
    const lesson = state.data.lessons[0];
    const drive = {
      url: "https://drive.google.com/file/d/drive_test_123456/view?resourcekey=key_123",
      title: "Video Drive",
      channel: "Teacher",
      note: "Practice",
    };
    assert.equal(
      (await teacher.action("saveLesson", { ...lesson, drive })).status,
      200,
    );
    assert.equal(
      (await parent.action("saveLesson", { ...lesson, drive })).status,
      403,
    );
    assert.equal((await teacher.json("/api/videos", {})).status, 410);
    state = await teacher.json("/api/state");
    const payload = {
      action: "saveLesson",
      payload: { ...state.data.lessons[0], goal: "Concurrent update" },
      version: state.version,
    };
    const concurrent = await Promise.all([
      teacher.json("/api/action", payload),
      teacher.json("/api/action", payload, second.base),
    ]);
    assert.deepEqual(concurrent.map((x) => x.status).sort(), [200, 409]);
    state = await teacher.json("/api/state");
    const plan = state.data.learningPlans[0];
    for (const stage of plan.stages) stage.lessonIds = [lesson.id];
    assert.equal((await teacher.action("savePlan", plan)).status, 200);
    assert.equal(
      (
        await teacher.action("gradeLesson", {
          childId: id,
          stageId: "1",
          lessonId: lesson.id,
          score: 80,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await teacher.action("gradeLesson", {
          childId: id,
          stageId: "2",
          lessonId: lesson.id,
          score: 90,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await teacher.action("gradeLesson", {
          childId: id,
          stageId: "1",
          lessonId: lesson.id,
          score: 81,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await teacher.action("gradeLesson", {
          childId: id,
          stageId: "2",
          lessonId: lesson.id,
          score: 90,
        })
      ).status,
      200,
    );
    const snapshot = (await admin.json("/api/backup")).data;
    assert.equal(
      snapshot.lessons.find((l) => l.id === lesson.id).drive.url,
      drive.url,
    );
    assert.equal((await admin.action("restore", snapshot)).status, 200);
    assert.equal((await admin.json("/api/recovery")).status, 200);
    await new Promise((r) => first.server.close(r));
    const restarted = await start({ databaseUrl: url, production: true });
    const persisted = await teacher.json(
      "/api/state",
      undefined,
      restarted.base,
    );
    assert.equal(persisted.status, 200);
    assert.deepEqual(persisted.data.learningPlans, snapshot.learningPlans);
    assert.equal((await child.json("/api/state")).status, 200);
    const sql = cluster.getPgClient();
    await sql.connect();
    const perms = await sql.query(
      "SELECT nspacl::text FROM pg_namespace WHERE nspname='aac_private'",
    );
    assert.ok(!perms.rows[0].nspacl.includes("=U/"));
    const permissions = await sql.query(
      "SELECT has_schema_privilege('anon','aac_private','USAGE') AS anon, has_table_privilege('authenticated','aac_private.users','SELECT') AS authenticated, relrowsecurity AS rls FROM pg_class WHERE oid='aac_private.users'::regclass",
    );
    assert.deepEqual(permissions.rows[0], {
      anon: false,
      authenticated: false,
      rls: true,
    });
    await sql.end();
    await cluster.createDatabase("migrated");
    const sqlite = await start({
      dbPath: path.join(directory, "source.sqlite"),
    });
    const local = client(sqlite.base);
    await local.json("/api/setup", {
      username: "original",
      password: "123456",
    });
    await local.action("saveChild", {
      name: "Existing child",
      birthYear: 2016,
    });
    const localSnapshot = (await local.json("/api/backup")).data;
    await new Promise((r) => sqlite.server.close(r));
    const migrationUrl = url.replace(/\/postgres$/, "/migrated");
    const migration = await migrateSQLite({
      sourcePath: path.join(directory, "source.sqlite"),
      databaseUrl: migrationUrl,
    });
    assert.equal(migration.children, 1);
    await assert.rejects(
      () =>
        migrateSQLite({
          sourcePath: path.join(directory, "source.sqlite"),
          databaseUrl: migrationUrl,
        }),
      /Đích đã có dữ liệu/,
    );
    const migrated = await start({
      databaseUrl: migrationUrl,
      production: true,
    });
    const oldUser = client(migrated.base);
    assert.equal(
      (
        await oldUser.json("/api/login", {
          username: "original",
          role: "admin",
          password: "123456",
        })
      ).status,
      200,
    );
    assert.deepEqual((await oldUser.json("/api/backup")).data, localSnapshot);
  },
);

test("Remote database TLS verifies certificates; production cannot silently use SQLite", async () => {
  const supabase = postgresOptions("postgresql://user:pass@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres");
  assert.equal(supabase.ssl.rejectUnauthorized, true);
  assert.ok(supabase.ssl.ca.some((cert) => cert.includes("BEGIN CERTIFICATE")));
  assert.equal(postgresOptions("postgresql://user:pass@evil-supabase.com/postgres").ssl.ca, undefined);
  assert.equal(
    postgresOptions(
      "postgresql://user:pass@example.com:5432/postgres?sslmode=no-verify",
    ).ssl.rejectUnauthorized,
    true,
  );
  await assert.rejects(() => createApp({ production: true }), /DATABASE_URL/);
});
