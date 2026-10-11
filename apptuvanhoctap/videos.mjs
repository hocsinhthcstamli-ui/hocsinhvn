import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export function createVideoStore(db, directory, fail) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS videos(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL)",
  );
  const lookup = (id) => db.prepare("SELECT * FROM videos WHERE id=?").get(id);
  return {
    lookup,
    async upload(req, user, reauthorize) {
      const mime = req.headers["content-type"]?.split(";")[0];
      if (!["video/mp4", "video/webm"].includes(mime))
        fail("Chọn video MP4 hoặc WebM.", 415);
      if (Number(req.headers["content-length"]) > MAX_VIDEO_BYTES)
        fail("Video tối đa 100 MB.", 413);
      await mkdir(directory, { recursive: true });
      const id = randomUUID(),
        target = path.join(directory, id),
        temp = target + ".part";
      let size = 0,
        signature = Buffer.alloc(0);
      try {
        await pipeline(
          req,
          new Transform({
            transform(chunk, encoding, callback) {
              size += chunk.length;
              if (signature.length < 16)
                signature = Buffer.concat([
                  signature,
                  chunk.subarray(0, 16 - signature.length),
                ]);
              if (size > MAX_VIDEO_BYTES) {
                const error = new Error("Video tối đa 100 MB.");
                error.status = 413;
                callback(error);
              } else callback(null, chunk);
            },
          }),
          createWriteStream(temp, { flags: "wx" }),
        );
        const valid =
          mime === "video/mp4"
            ? signature.subarray(4, 8).toString() === "ftyp"
            : signature
                .subarray(0, 4)
                .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
        if (!valid || size < 16)
          fail("Tệp không đúng định dạng video MP4/WebM.", 415);
        await reauthorize();
        await rename(temp, target);
        db.prepare("INSERT INTO videos VALUES(?,?,?,?)").run(
          id,
          user.id,
          mime,
          size,
        );
        return { id, mime, size };
      } catch (error) {
        await rm(temp, { force: true });
        await rm(target, { force: true });
        throw error;
      }
    },
    async stream(req, res, video) {
      const file = path.join(directory, video.id);
      let info;
      try {
        info = await stat(file);
      } catch {
        fail("Không tìm thấy tệp video. Hãy nhờ giáo viên tải lại.", 404);
      }
      let start = 0,
        end = info.size - 1,
        status = 200;
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!match || (!match[1] && !match[2])) {
          res.setHeader("Content-Range", `bytes */${info.size}`);
          fail("Khoảng video không hợp lệ.", 416);
        }
        if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
        else {
          start = Number(match[1]);
          if (match[2]) end = Math.min(end, Number(match[2]));
        }
        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start > end ||
          start >= info.size
        ) {
          res.setHeader("Content-Range", `bytes */${info.size}`);
          fail("Khoảng video không hợp lệ.", 416);
        }
        status = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${info.size}`);
      }
      res.writeHead(status, {
        "Content-Type": video.mime,
        "Content-Length": end - start + 1,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      });
      if (req.method === "HEAD") return res.end();
      try {
        await pipeline(createReadStream(file, { start, end }), res);
      } catch (error) {
        if (!req.destroyed && !res.destroyed) throw error;
      }
    },
  };
}
