import { importPhase3 } from "../scripts/seed-phase3.mjs";
import { importPhase2 } from "../scripts/seed-phase2.mjs";
import { createApp } from "../server.mjs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { importPhase1 } from "../scripts/seed-phase1.mjs";
const directory = await mkdtemp(path.join(tmpdir(), "aac-ui-"));
const dbPath = path.join(directory, "ui.sqlite");
const server = await createApp({
  dbPath,
  mediaDir: path.join(directory, "videos"),
});
await importPhase1(dbPath);
await importPhase2(dbPath);
await importPhase3(dbPath);
server.listen(3101, "127.0.0.1");
