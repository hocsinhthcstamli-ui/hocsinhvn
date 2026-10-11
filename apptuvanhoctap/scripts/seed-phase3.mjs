import { DatabaseSync, backup } from "node:sqlite";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { phase3Lessons } from "../content/phase-3.mjs";
import { validateBackup } from "../server.mjs";

export async function importPhase3(dbPath) {
  const db = new DatabaseSync(dbPath, { open: true });
  db.exec("PRAGMA busy_timeout=5000");
  try {
    const before = db
      .prepare("SELECT version,data FROM app_state WHERE id=1")
      .get();
    if (!before)
      throw new Error("Cần khởi tạo ứng dụng trước khi nạp nội dung.");
    const beforeData = JSON.parse(before.data);
    const candidates = phase3Lessons.filter(
      (l) => !beforeData.lessons.some((old) => old.id === l.id),
    );
    if (!candidates.length)
      return {
        added: 0,
        skipped: phase3Lessons.length,
        version: before.version,
        backup: null,
      };
    const folder = path.join(path.dirname(dbPath), "backups");
    await mkdir(folder, { recursive: true });
    const backupPath = path.join(folder, `before-phase3-${Date.now()}.sqlite`);
    await backup(db, backupPath);
    db.exec("BEGIN IMMEDIATE");
    try {
      const latest = db
        .prepare("SELECT version,data FROM app_state WHERE id=1")
        .get();
      const data = JSON.parse(latest.data);
      const additions = phase3Lessons.filter(
        (l) => !data.lessons.some((old) => old.id === l.id),
      );
      const next = {
        ...data,
        lessons: [...data.lessons, ...structuredClone(additions)],
      };
      validateBackup(next);
      const serialized = JSON.stringify(next);
      if (Buffer.byteLength(serialized) > 22 * 1024 * 1024)
        throw new Error("Dữ liệu vượt giới hạn 22 MB.");
      if (additions.length) {
        db.prepare(
          "UPDATE app_state SET data=?,version=version+1 WHERE id=1",
        ).run(serialized);
        db.prepare("INSERT INTO audit(at,user_id,action) VALUES(?,?,?)").run(
          new Date().toISOString(),
          "system:phase3",
          `importPhase3:${additions.length}`,
        );
      }
      db.exec("COMMIT");
      return {
        added: additions.length,
        skipped: phase3Lessons.length - additions.length,
        version: latest.version + (additions.length ? 1 : 0),
        backup: backupPath,
      };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    db.close();
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dbPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(root, "data", "aac.sqlite");
  console.log(JSON.stringify(await importPhase3(dbPath), null, 2));
}
