import { DatabaseSync, backup } from "node:sqlite";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { openDatabase, initializeDatabase } from "../database.mjs";
import { completeSeedData } from "../content/seed.mjs";
import { validateBackup } from "../server.mjs";
import { youtubeValue } from "../youtube.mjs";
import { driveVideo } from "../drive.mjs";

export async function migrateSQLite({ sourcePath, databaseUrl, links = {} }) {
  if (!databaseUrl) throw new Error("Thiếu DATABASE_URL.");
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  let snapshot, users, audit, recovery, backupPath;
  try {
    const folder = path.join(path.dirname(sourcePath), "backups");
    await mkdir(folder, { recursive: true });
    backupPath = path.join(folder, `before-supabase-${Date.now()}.sqlite`);
    await backup(source, backupPath);
    // Read every table from one coherent SQLite snapshot while local app may run.
    source.exec("BEGIN");
    snapshot = source
      .prepare("SELECT version,data FROM app_state WHERE id=1")
      .get();
    users = source
      .prepare("SELECT * FROM users ORDER BY id")
      .all()
      .map((row) => ({ ...row }));
    audit = source
      .prepare("SELECT at,user_id,action FROM audit ORDER BY id")
      .all();
    recovery = source.prepare("SELECT at,data FROM recovery ORDER BY id").all();
    source.exec("COMMIT");
  } finally {
    source.close();
  }
  if (!snapshot || !users.some((u) => u.role === "admin"))
    throw new Error("Nguồn cần có dữ liệu và tài khoản quản trị.");
  const state = JSON.parse(snapshot.data);
  const convert = (data) => {
    for (const lesson of data.lessons)
      if (lesson.videoId) {
        const replacement = links[lesson.id];
        if (!replacement)
          throw new Error(
            `Bài ${lesson.id} còn video tải lên. Điền link thay thế trong tệp --video-links trước khi chuyển.`,
          );
        if (replacement.youtube && !replacement.drive) {
          lesson.youtube = youtubeValue(replacement.youtube);
          lesson.drive = null;
        } else if (replacement.drive && !replacement.youtube) {
          lesson.drive = driveVideo(replacement.drive);
          lesson.youtube = null;
        } else
          throw new Error(
            `Link thay thế cho ${lesson.id} phải có một nguồn youtube hoặc drive.`,
          );
        lesson.videoId = "";
      }
    validateBackup(data);
    return data;
  };
  convert(state);
  recovery = recovery.map((row) => ({
    ...row,
    data: JSON.stringify(convert(JSON.parse(row.data))),
  }));
  const db = await openDatabase({ databaseUrl });
  try {
    await initializeDatabase(db, completeSeedData());
    await db.scope(async () => {
      const target = await db
        .prepare("SELECT version,data FROM app_state WHERE id=1")
        .get();
      if (
        (await db.prepare("SELECT count(*) AS n FROM users").get()).n ||
        target.version !== 0 ||
        !isDeepStrictEqual(JSON.parse(target.data), completeSeedData())
      )
        throw new Error(
          "Đích đã có dữ liệu. Công cụ không ghi đè. Hãy dùng project/database trống hoặc tiếp tục dùng dữ liệu đích.",
        );
      await db
        .prepare("UPDATE app_state SET version=?,data=? WHERE id=1")
        .run(snapshot.version, JSON.stringify(state));
      for (const u of users)
        await db
          .prepare("INSERT INTO users VALUES(?,?,?,?,?,?)")
          .run(u.id, u.username, u.name, u.role, u.password, u.child_ids);
      for (const a of audit)
        await db
          .prepare("INSERT INTO audit(at,user_id,action) VALUES(?,?,?)")
          .run(a.at, a.user_id, a.action);
      for (const r of recovery)
        await db
          .prepare("INSERT INTO recovery(at,data) VALUES(?,?)")
          .run(r.at, r.data);
      const stored = await db
        .prepare("SELECT data FROM app_state WHERE id=1")
        .get();
      if (!isDeepStrictEqual(JSON.parse(stored.data), state))
        throw new Error("Đối chiếu dữ liệu không khớp; hủy giao dịch.");
      const storedUsers = await db
        .prepare("SELECT * FROM users ORDER BY id")
        .all();
      if (!isDeepStrictEqual(storedUsers, users))
        throw new Error("Đối chiếu tài khoản không khớp; hủy giao dịch.");
      await db
        .prepare("INSERT INTO audit(at,user_id,action) VALUES(?,?,?)")
        .run(new Date().toISOString(), "system", "migrateSQLite");
    });
    return {
      users: users.length,
      children: state.children.length,
      lessons: state.lessons.length,
      backup: backupPath,
      sessions:
        "Không chuyển phiên đăng nhập; đăng nhập lại bằng tài khoản cũ.",
    };
  } finally {
    await db.close();
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const sourcePath = path.resolve(
    args[0] && !args[0].startsWith("--") ? args[0] : "data/aac.sqlite",
  );
  const mappingIndex = args.indexOf("--video-links");
  try {
    const links =
      mappingIndex >= 0
        ? JSON.parse(await readFile(args[mappingIndex + 1], "utf8"))
        : {};
    console.log(
      JSON.stringify(
        await migrateSQLite({
          sourcePath,
          databaseUrl: process.env.DATABASE_URL,
          links,
        }),
        null,
        2,
      ),
    );
  } catch (error) {
    // Avoid printing pg connection objects or secrets.
    console.error(
      error.code
        ? `Migration failed (${error.code}). Check database connectivity/permissions.`
        : error.message,
    );
    process.exitCode = 1;
  }
}
