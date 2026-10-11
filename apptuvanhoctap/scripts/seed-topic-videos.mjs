import { DatabaseSync, backup } from 'node:sqlite';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBackup } from '../server.mjs';
import { topicLessons } from '../content/topic-journeys.mjs';
import { attachTopicVideos } from '../content/topic-videos.mjs';
export function attachReviewedVideos(data) {
  const next = structuredClone(data);
  const attached = attachTopicVideos(next, topicLessons);
  validateBackup(next);
  return { data: next, attached, skipped: [] };
}

export async function importTopicVideos(dbPath) {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA busy_timeout=5000');
  try {
    const read = () => db.prepare('SELECT version,data FROM app_state WHERE id=1').get();
    const before = read();
    if (!before) throw new Error('Cần khởi tạo và nạp bộ bài trước khi gắn video.');
    const preview = attachReviewedVideos(JSON.parse(before.data));
    if (!preview.attached.length) return { attached: [], skipped: preview.skipped, version: before.version, backup: null };
    const folder = path.join(path.dirname(dbPath), 'backups');
    await mkdir(folder, {recursive: true});
    const backupPath = path.join(folder, `before-topic-videos-${Date.now()}.sqlite`);
    await backup(db, backupPath);
    db.exec('BEGIN IMMEDIATE');
    try {
      const latest = read();
      const result = attachReviewedVideos(JSON.parse(latest.data));
      if (result.attached.length) {
        const serialized = JSON.stringify(result.data);
        if (Buffer.byteLength(serialized) > 22 * 1024 * 1024) throw new Error('Dữ liệu vượt giới hạn 22 MB.');
        db.prepare('UPDATE app_state SET data=?,version=version+1 WHERE id=1').run(serialized);
        db.prepare('INSERT INTO audit(at,user_id,action) VALUES(?,?,?)').run(new Date().toISOString(), 'system:topic-videos', `importTopicVideos:${result.attached.join(',')}`);
      }
      db.exec('COMMIT');
      return {attached: result.attached, skipped: result.skipped, version: latest.version + (result.attached.length ? 1 : 0), backup: backupPath};
    } catch(error) {db.exec('ROLLBACK'); throw error;}
  } finally {db.close();}
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  console.log(JSON.stringify(await importTopicVideos(process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'data', 'aac.sqlite')), null, 2));
}
