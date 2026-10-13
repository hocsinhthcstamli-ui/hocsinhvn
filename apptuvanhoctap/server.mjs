import {funKinds,validateFun} from './fun-model.mjs';
import { initialTemplates } from "./teacher-journeys.mjs";
import {addMathContent,mathQuestions} from './content/math-journey.mjs';
import {addComputerContent,computerQuestions} from './content/computer-journey.mjs';
import { puzzlePacks } from "./puzzle-catalog.mjs";
import { puzzleFiles } from "./puzzle-catalog.mjs";
import { addTopicContent } from "./content/topic-journeys.mjs";
import http from "node:http";
import { openDatabase, initializeDatabase } from "./database.mjs";
import { completeSeedData } from "./content/seed.mjs";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { domains, roles, seedData } from "./domain.mjs";
import { defaultPlan, availableLessonIds, stageUnlocked } from "./pathways.mjs";
import { createVideoStore } from "./videos.mjs";
import { artFiles } from "./art.mjs";
import { cardPictures } from "./card-art-manifest.mjs";
import { voiceClips } from "./voice-manifest.mjs";
import { youtubeValue } from "./youtube.mjs";
import { driveVideo } from "./drive.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
export function startupFailure(error) {
  // Only expose known configuration messages; never log connection strings or secrets.
  const messages = new Set([
    "Production requires DATABASE_URL; SQLite fallback is disabled.",
    "Configure ADMIN_USERNAME and ADMIN_PASSWORD for first startup, or import the existing database first.",
    "Invalid ADMIN_USERNAME.",
    "Replace ADMIN_PASSWORD before starting.",
    "Username không hợp lệ (tối đa 60 ký tự).",
    "Mật khẩu cần từ 6 đến 200 ký tự.",
    "DATABASE_URL phải là PostgreSQL.",
  ]);
  const code = /^[A-Z0-9_]{2,64}$/.test(error.code || "") ? error.code : "Error";
  return `Startup failed (${code}). ${messages.has(error.message) ? error.message : "Check DATABASE_URL, TLS and first-admin configuration."}`;
}
const fail = (message, status = 400) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
const hashToken = (token) => createHash("sha256").update(token).digest("hex");
function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(passwordHash(password, salt).split(":")[1], "hex"),
  );
}
function passwordValue(value, minimum = 1) {
  if (typeof value !== "string" || value.length < minimum || value.length > 200)
    fail(`Mật khẩu cần từ ${minimum} đến 200 ký tự.`);
  return value;
}
function str(value, name, max = 1000, required = true) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    fail(`${name} không hợp lệ (tối đa ${max} ký tự).`);
  return value.trim();
}
function integer(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max)
    fail(`${name} phải là số nguyên từ ${min} đến ${max}.`);
  return value;
}
function scores(value) {
  if (!value || typeof value !== "object") fail("Thiếu điểm đánh giá.");
  return Object.fromEntries(
    domains.map(([id]) => [id, integer(value[id], "Điểm đánh giá", 0, 4)]),
  );
}
function dateValue(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail("Ngày không hợp lệ.");
  return value;
}
function childValue(value) {
  return {
    id: str(value.id, "Mã hồ sơ", 100),
    name: str(value.name, "Tên trẻ", 100),
    birthYear: integer(
      value.birthYear,
      "Năm sinh",
      1900,
      new Date().getFullYear(),
    ),
    supportNote: str(value.supportNote ?? "", "Ghi chú", 3000, false),
    goals: str(value.goals ?? "", "Mục tiêu", 3000, false),
    assessment: scores(value.assessment),
  };
}
function lessonValue(value) {
  let drive;
  if (value.drive !== undefined) {
    try {
      drive = driveVideo(value.drive);
    } catch (error) {
      fail(error.message);
    }
  }
  let youtube;
  if (value.youtube !== undefined) {
    try {
      youtube = youtubeValue(value.youtube);
    } catch (error) {
      fail(error.message);
    }
  }
  if ([value.videoId, youtube, drive].filter(Boolean).length > 1)
    fail("Mỗi bài chỉ chọn một nguồn video.");
  if (value.videoId && !/^[a-f0-9-]{36}$/.test(value.videoId))
    fail("Mã video không hợp lệ.");
  if (!domains.some(([id]) => id === value.domain))
    fail("Lĩnh vực không hợp lệ.");
  if (
    !Array.isArray(value.cards) ||
    value.cards.length < 1 ||
    value.cards.length > 36
  )
    fail("Bài học cần 1–36 thẻ.");
  if (
    value.cards.some(
      (card) => !card || typeof card !== "object" || Array.isArray(card),
    )
  )
    fail("Thẻ bài học không hợp lệ.");
  return {
    ...(value.teachingGuide
      ? { teachingGuide: guideValue(value.teachingGuide) }
      : {}),
    id: str(value.id, "Mã bài", 100),
    title: str(value.title, "Tên bài", 150),
    videoId: value.videoId || "",
    ...(youtube !== undefined ? { youtube } : {}),
    ...(drive !== undefined ? { drive } : {}),
    domain: value.domain,
    level: integer(value.level, "Mức bài", 1, 3),
    goal: str(value.goal, "Mục tiêu", 1500),
    prompt: str(value.prompt, "Hướng dẫn", 500),
    source: ["aac", "topic", "behavior", "book", "custom"].includes(
      value.source,
    )
      ? value.source
      : "custom",
    cards: value.cards.map((card) => {
      const image = card.image || "";
      if (
        typeof image !== "string" ||
        image.length > 400000 ||
        (image &&
          !/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(image))
      )
        fail("Ảnh thẻ phải là PNG, JPEG hoặc WebP dưới 300 KB.");
      return {
        text: str(card.text, "Nội dung thẻ", 80),
        icon: str(card.icon || "💬", "Biểu tượng", 20),
        ...(image ? { image } : {}),
      };
    }),
  };
}
function guideValue(value) {
  if (!value || !["primary", "secondary"].includes(value.band))
    fail("Cấp học trong hướng dẫn không hợp lệ.");
  const list = (key, max) => {
    if (
      !Array.isArray(value[key]) ||
      value[key].length < 1 ||
      value[key].length > max
    )
      fail("Danh sách trong hướng dẫn không hợp lệ.");
    return value[key].map((item) => str(item, "Nội dung hướng dẫn", 1500));
  };
  return {
    band: value.band,
    phase: integer(value.phase, "Giai đoạn", 1, 20),
    durationMinutes: integer(value.durationMinutes, "Thời lượng", 1, 120),
    materials: list("materials", 12),
    steps: list("steps", 12),
    practice: list("practice", 10),
    success: str(value.success, "Tiêu chí", 2000),
    scoring: str(value.scoring, "Cách chấm", 3000),
    support: str(value.support, "Hỗ trợ", 3000),
    homePractice: str(value.homePractice, "Thực hành ở nhà", 2000),
  };
}
function recordValue(value) {
  const total = integer(value.total, "Tổng lượt", 1, 10000);
  return {
    id: str(value.id, "Mã bản ghi", 100),
    childId: str(value.childId, "Hồ sơ", 100),
    lessonId: str(value.lessonId, "Bài học", 100),
    date: dateValue(value.date),
    correct: integer(value.correct, "Số lượt đúng", 0, total),
    total,
    prompt: integer(value.prompt, "Mức nhắc", 0, 3),
    focus: integer(value.focus, "Tập trung", 1, 4),
    behavior: str(value.behavior ?? "", "Hành vi", 3000, false),
    note: str(value.note ?? "", "Nhận xét", 3000, false),
    authorId: str(value.authorId || "import", "Người ghi", 100),
    createdAt: str(
      value.createdAt || new Date().toISOString(),
      "Thời điểm",
      50,
    ),
  };
}
function planValue(value, lessons, allowScores = true) {
  if (!value || !Array.isArray(value.stages) || value.stages.length !== 3)
    fail("Mỗi lộ trình cần đúng 3 đích đến.");
  if (value.journeyId && !(/^(life|animals|vehicles|math|computer|custom-[a-f0-9-]{36})$/).test(value.journeyId)) fail("Invalid journey.");
  if(value.kind !== undefined && !['life','animals','vehicles','math','computer'].includes(value.kind))fail('Loại lộ trình không hợp lệ.');
  if(value.archived !== undefined && typeof value.archived !== 'boolean')fail('Trạng thái lộ trình không hợp lệ.');
  return {
    childId: str(value.childId, "Học sinh", 100),
    ...(value.journeyId ? { journeyId: value.journeyId } : {}),
    ...(value.title !== undefined ? { title: str(value.title, "Title", 150) } : {}),
    ...(value.description !== undefined ? { description: str(value.description, "Description", 1500, false) } : {}),
    ...(value.kind !== undefined ? {kind:value.kind} : {}),
    ...(value.archived ? {archived: true} : {}),
    stages: value.stages.map((stage, index) => {
      if (
        !stage ||
        !Array.isArray(stage.lessonIds) ||
        stage.lessonIds.length > 100 ||
        new Set(stage.lessonIds).size !== stage.lessonIds.length ||
        !stage.lessonIds.every((id) =>
          lessons.some((lesson) => lesson.id === id),
        )
      )
        fail("Danh sách bài học trong đích đến không hợp lệ (tối đa 100 bài).");
      const grades = allowScores ? stage.lessonScores || {} : {};
      if (
        typeof grades !== "object" ||
        Array.isArray(grades) ||
        Object.entries(grades).some(
          ([id, score]) =>
            !stage.lessonIds.includes(id) ||
            !Number.isInteger(score) ||
            score < 0 ||
            score > 100,
        )
      )
        fail("Tiến độ đích đến không hợp lệ.");
      return {
        id: String(index + 1),
        title: str(stage.title, "Tên đích đến", 150),
        goal: str(stage.goal || "", "Mục tiêu đích đến", 1500, false),
        lessonIds: stage.lessonIds,
        lessonScores: Object.fromEntries(Object.entries(grades)),
      };
    }),
  };
}
function templateValue(value, lessons) {
  str(value.id,'Mã mẫu',100);
  const plan = planValue({...value, childId:'template',journeyId:value.id},lessons,false);
  if(!['life','animals','vehicles','math','computer'].includes(value.kind))fail('Loại bộ mẫu không hợp lệ.');
  return {id:plan.journeyId,title:str(value.title,'Tên mẫu',150),description:str(value.description||'','Mô tả',1500,false),kind:value.kind,stages:plan.stages};
}
function activityValue(value) {
  if(!['puzzle','sentences','video','math','computer',...Object.keys(funKinds)].includes(value.kind))fail('Loại hoạt động không hợp lệ.');
  const total=funKinds[value.kind]?integer(value.total,'Số nhiệm vụ',2,8):value.kind==='puzzle'?4:5;
  if(value.total!==total || value.completed!==total)fail('Hoạt động chưa hoàn thành.');
  if(!Number.isFinite(Date.parse(str(value.at,'Thời gian',50))))fail('Thời gian không hợp lệ.');
  return {id:str(value.id,'Mã lượt',100),childId:str(value.childId,'Học sinh',100),journeyId:str(value.journeyId,'Lộ trình',100),itemId:str(value.itemId,'Bài / tranh',100),label:str(value.label,'Tên hoạt động',150),kind:value.kind,total,completed:total,mistakes:integer(value.mistakes,'Số lần thử chưa khớp',0,10000),at:value.at,authorId:str(value.authorId,'Người ghi',100)};
}
export function validateBackup(input) {
  const d = input?.data || input;
  if (!d || d.schemaVersion !== 2)
    fail("Bản sao lưu không đúng định dạng phiên bản 2.");
  for (const key of [
    "children",
    "lessons",
    "dailyRecords",
    "assessmentHistory",
    "practiceSessions",
  ]) {
    if (!Array.isArray(d[key]) || d[key].length > 30000)
      fail(`Danh sách ${key} không hợp lệ.`);
    if (
      d[key].some(
        (item) => !item || typeof item !== "object" || Array.isArray(item),
      )
    )
      fail(`Danh sách ${key} chứa mục không hợp lệ.`);
  }
  if (!d.lessons.length) fail("Cần ít nhất một bài học.");
  const clean = {
    schemaVersion: 2,
    children: d.children.map(childValue),
    lessons: d.lessons.map(lessonValue),
    dailyRecords: d.dailyRecords.map(recordValue),
  };
  const childIds = new Set(clean.children.map((c) => c.id));
  const lessonIds = new Set(clean.lessons.map((l) => l.id));
  for (const key of ["children", "lessons", "dailyRecords"])
    if (new Set(clean[key].map((x) => x.id)).size !== clean[key].length)
      fail("Bản sao lưu có mã trùng nhau.");
  for (const r of clean.dailyRecords)
    if (!childIds.has(r.childId) || !lessonIds.has(r.lessonId))
      fail("Bản ghi tham chiếu hồ sơ hoặc bài học không tồn tại.");
  clean.assessmentHistory = d.assessmentHistory.map((h) => {
    if (!childIds.has(h.childId)) fail("Lịch sử đánh giá thiếu hồ sơ.");
    return {
      id: str(h.id, "Mã đánh giá", 100),
      childId: h.childId,
      date: dateValue(h.date),
      scores: scores(h.scores),
      authorId: str(h.authorId || "import", "Người ghi", 100),
    };
  });
  clean.practiceSessions = d.practiceSessions.map((p) => {
    if (!childIds.has(p.childId) || !lessonIds.has(p.lessonId))
      fail("Phiên học tham chiếu dữ liệu không tồn tại.");
    return {
      id: str(p.id, "Mã phiên", 100),
      childId: p.childId,
      lessonId: p.lessonId,
      date: dateValue(p.date),
      sentence: str(p.sentence ?? "", "Câu ghép", 5000, false),
      authorId: str(p.authorId || "import", "Người ghi", 100),
    };
  });
  if (
    d.learningPlans !== undefined &&
    (!Array.isArray(d.learningPlans) ||
      d.learningPlans.length > clean.children.length * 30)
  )
    fail("Lộ trình trong bản sao lưu không hợp lệ.");
  clean.learningPlans = (d.learningPlans || []).map((p) =>
    planValue(p, clean.lessons),
  );
  if (
    new Set(clean.learningPlans.map((p) => `${p.childId}:${p.journeyId || "life"}`)).size !==
      clean.learningPlans.length ||
    clean.learningPlans.some((p) => !childIds.has(p.childId))
  )
    fail("Lộ trình tham chiếu học sinh không hợp lệ.");
  for (const c of clean.children)
    if (!clean.learningPlans.some((p) => p.childId === c.id && (!p.journeyId || p.journeyId === "life")))
      clean.learningPlans.push(defaultPlan(c.id, clean.lessons));
  if (d.journeyTemplates !== undefined) {
    if (!Array.isArray(d.journeyTemplates) || d.journeyTemplates.length > 100) fail("Invalid template library.");
    clean.journeyTemplates = d.journeyTemplates.map(t => templateValue(t, clean.lessons));
    if (new Set(clean.journeyTemplates.map(t=>t.id)).size !== clean.journeyTemplates.length) fail("Duplicate template IDs.");
  }
  if (d.activityResults !== undefined) {
    if (!Array.isArray(d.activityResults) || d.activityResults.length > 30000) fail("Invalid activity results.");
    clean.activityResults = d.activityResults.map(r => activityValue(r));
    if (clean.activityResults.some(r=>!childIds.has(r.childId))) fail("Unknown activity learner.");
    if (new Set(clean.activityResults.map(r=>r.id)).size !== clean.activityResults.length) fail("Duplicate activity IDs.");
  }
  if(d.contentImports!==undefined){
    if(!Array.isArray(d.contentImports)||d.contentImports.length>100)fail('Invalid content imports.');
    clean.contentImports=d.contentImports.map(v=>str(v,'Content import',100));
  }
  if(d.funActivities!==undefined){
    if(!Array.isArray(d.funActivities)||d.funActivities.length>200)fail("Too many activities.");
    clean.funActivities=d.funActivities.map(v=>{try{return {...validateFun(v),id:str(v.id,"Activity ID",100)};}catch(e){fail(e.message);}});
    if(new Set(clean.funActivities.map(v=>v.id)).size!==clean.funActivities.length)fail("Duplicate activity IDs.");
  }
  return clean;
}

export async function createApp({
  dbPath = path.join(root, "data", "aac.sqlite"),
  databaseUrl = "",
  bootstrapAdmin = null,
  production = false,
  secureCookie = production || process.env.COOKIE_SECURE === "1",
  mediaDir = path.join(path.dirname(dbPath), "videos"),
} = {}) {
  if (production && !databaseUrl)
    throw new Error(
      "Production requires DATABASE_URL; SQLite fallback is disabled.",
    );
  const db = await openDatabase({ dbPath, databaseUrl });
  await initializeDatabase(
    db,
    databaseUrl ? completeSeedData() : seedData(),
  ).catch(async (error) => {
    await db.close();
    throw error;
  });
  const videos = databaseUrl
    ? { lookup: () => undefined }
    : createVideoStore(db, mediaDir, fail);
  if (databaseUrl)
    await db
      .scope(async () => {
        if (!(await db.prepare("SELECT count(*) AS n FROM users").get()).n) {
          if (!bootstrapAdmin)
            throw new Error(
              "Configure ADMIN_USERNAME and ADMIN_PASSWORD for first startup, or import the existing database first.",
            );
          const username = str(
            bootstrapAdmin.username,
            "Username",
            60,
          ).toLowerCase();
          if (!/^[a-z0-9._-]{3,60}$/.test(username))
            throw new Error("Invalid ADMIN_USERNAME.");
          const password = passwordValue(bootstrapAdmin.password, 6);
          if (password === "REPLACE_WITH_YOUR_ADMIN_PASSWORD")
            throw new Error("Replace ADMIN_PASSWORD before starting.");
          await db
            .prepare("INSERT INTO users VALUES(?,?,?,?,?,?)")
            .run(
              randomUUID(),
              username,
              username,
              "admin",
              passwordHash(password),
              "[]",
            );
        }
      })
      .catch(async (error) => {
        await db.close();
        throw error;
      });
  // One-time additive migration; existing profiles and scores are preserved.
  await db
    .scope(async () => {
      const initial = await db
        .prepare("SELECT data FROM app_state WHERE id=1")
        .get();
      const migrated = JSON.parse(initial.data);
      let changed = false;
      if (!migrated.learningPlans) {
        migrated.learningPlans = migrated.children.map((c) =>
          defaultPlan(c.id, migrated.lessons),
        );
        changed = true;
      }
      changed = addTopicContent(migrated) || changed;
      if (!migrated.journeyTemplates) { migrated.journeyTemplates = initialTemplates(migrated.lessons); changed = true; }
      changed = addMathContent(migrated) || changed;
      changed = addComputerContent(migrated) || changed;
      if (changed) {
        validateBackup(migrated);
        await db.prepare("UPDATE app_state SET data=?,version=version+1 WHERE id=1").run(JSON.stringify(migrated));
      }
    })
    .catch(async (error) => {
      await db.close();
      throw error;
    });
  const readState = async () => {
    const row = await db.prepare("SELECT * FROM app_state WHERE id=1").get();
    return { version: row.version, data: JSON.parse(row.data) };
  };
  const audit = async (id, action) =>
    await db
      .prepare("INSERT INTO audit(at,user_id,action) VALUES(?,?,?)")
      .run(new Date().toISOString(), id, action);
  const publicUser = (u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    childIds: JSON.parse(u.child_ids),
  });
  const canChild = (user, id) =>
    user.role === "admin" || JSON.parse(user.child_ids).includes(id);
  const requireRole = (user, ...allowed) => {
    if (!allowed.includes(user.role))
      fail("Bạn không có quyền thực hiện thao tác này.", 403);
  };
  const filteredState = async (user) => {
    const result = await readState();
    if (user.role !== "teacher") delete result.data.journeyTemplates;
    if (result.data.activityResults) result.data.activityResults = ["teacher","parent"].includes(user.role) ? result.data.activityResults.filter(r=>canChild(user,r.childId)) : [];
    result.data.learningPlans = result.data.learningPlans.filter(
      (p) => user.role !== "admin" && canChild(user, p.childId) && (user.role !== "child" || !p.archived),
    );
    if(result.data.funActivities)result.data.funActivities=result.data.funActivities.filter(a=>result.data.learningPlans.some(p=>!p.archived&&(p.journeyId||"life")===a.journeyId));
    if (user.role !== "admin") {
      result.data.children = result.data.children.filter((c) =>
        canChild(user, c.id),
      );
      for (const key of [
        "dailyRecords",
        "assessmentHistory",
        "practiceSessions",
      ])
        result.data[key] = result.data[key].filter((r) =>
          canChild(user, r.childId),
        );
    }
    if (user.role === "admin") {
      result.users = (
        await db.prepare("SELECT * FROM users ORDER BY username").all()
      ).map(publicUser);
      result.data.children = result.data.children.map(
        ({ id, name, birthYear }) => ({ id, name, birthYear }),
      );
      for (const key of [
        "lessons",
        "dailyRecords",
        "assessmentHistory",
        "practiceSessions",
      ])
        result.data[key] = [];
    }
    if (user.role === "child") {
      const allowed = new Set(
        result.data.learningPlans.flatMap(availableLessonIds),
      );
      result.data.lessons = result.data.lessons.filter((l) =>
        allowed.has(l.id),
      );
      result.data.children = result.data.children.map(
        ({ id, name, birthYear }) => ({ id, name, birthYear }),
      );
      for (const key of [
        "dailyRecords",
        "assessmentHistory",
        "practiceSessions",
      ])
        result.data[key] = [];
    }
    return { ...result, user: publicUser(user) };
  };
  const attempts = new Map();
  function limit(address) {
    const now = Date.now();
    for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
    const a = attempts.get(address) || {
      count: 0,
      until: now + 10 * 60 * 1000,
    };
    a.count++;
    attempts.set(address, a);
    if (a.count > 25)
      fail("Đăng nhập quá nhiều lần. Vui lòng thử lại sau 10 phút.", 429);
  }
  async function auth(req) {
    const token = /(?:^|;\s*)aac_session=([a-f0-9]+)/.exec(
      req.headers.cookie || "",
    )?.[1];
    const user =
      token &&
      (await db
        .prepare(
          "SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires>?",
        )
        .get(hashToken(token), Date.now()));
    if (!user) fail("Vui lòng đăng nhập.", 401);
    return user;
  }
  async function session(res, id) {
    await db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
    const token = randomBytes(32).toString("hex");
    await db
      .prepare("INSERT INTO sessions VALUES(?,?,?)")
      .run(hashToken(token), id, Date.now() + 12 * 60 * 60 * 1000);
    res.setHeader(
      "Set-Cookie",
      `aac_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secureCookie ? "; Secure" : ""}`,
    );
  }
  function userInput(v, data) {
    const username = str(v.username, "Tên đăng nhập", 60).toLowerCase();
    if (!/^[a-z0-9._-]{3,60}$/.test(username))
      fail(
        "Tên đăng nhập dùng 3–60 chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.",
      );
    if (!Object.hasOwn(roles, v.role)) fail("Vai trò không hợp lệ.");
    if (
      v.childIds !== undefined &&
      (!Array.isArray(v.childIds) || v.childIds.length > 30000)
    )
      fail("Danh sách hồ sơ được gán không hợp lệ.");
    const childIds = [...new Set(v.childIds || [])];
    if (!childIds.every((id) => data.children.some((c) => c.id === id)))
      fail("Hồ sơ được gán không tồn tại.");
    return {
      username,
      name: str(v.name || username, "Tên người dùng", 100),
      role: v.role,
      childIds,
    };
  }
  async function body(req) {
    if (req.parsedBody) return req.parsedBody;
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 24 * 1024 * 1024) fail("Dữ liệu quá lớn (tối đa 24 MB).", 413);
      chunks.push(chunk);
    }
    let result;
    try {
      result = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      fail("Dữ liệu JSON không hợp lệ.");
    }
    if (!result || typeof result !== "object" || Array.isArray(result))
      fail("Dữ liệu phải là một đối tượng JSON.");
    return result;
  }
  const staticFiles = new Map([
    ["/fun-model.mjs","fun-model.mjs"],
    ["/fun-activities.mjs","fun-activities.mjs"],
    ['/computer-art.mjs','computer-art.mjs'],
    ['/content/computer-journey.mjs','content/computer-journey.mjs'],
    ['/math-art.mjs','math-art.mjs'],
    ['/content/math-journey.mjs','content/math-journey.mjs'],
    ...Object.values(cardPictures).map((file) => [file, file.slice(1)]),
    ...Object.values(voiceClips).map((file) => [file, file.slice(1)]),
    ["/card-art.mjs", "card-art.mjs"],
    ["/card-art-manifest.mjs", "card-art-manifest.mjs"],
    ["/voice-manifest.mjs", "voice-manifest.mjs"],
    ["/teacher-journeys.mjs", "teacher-journeys.mjs"],
    ["/lesson-activities.mjs", "lesson-activities.mjs"],
    ["/puzzle-catalog.mjs", "puzzle-catalog.mjs"],
    ["/puzzle-game.mjs", "puzzle-game.mjs"],
    ["/puzzle.css", "puzzle.css"],
    ...puzzleFiles.map(file => [file, file.slice(1)]),
    ...artFiles.map((file) => [file, file.slice(1)]),
    ["/art.mjs", "art.mjs"],
    ["/new-art.mjs", "new-art.mjs"],
    ["/journey-ui.mjs", "journey-ui.mjs"],
    ["/content/topic-journeys.mjs", "content/topic-journeys.mjs"],
    ["/content/topic-videos.mjs", "content/topic-videos.mjs"],
    ["/curriculum.mjs", "curriculum.mjs"],
    ["/curriculum-ui.mjs", "curriculum-ui.mjs"],
    ["/youtube.mjs", "youtube.mjs"],
    ["/drive.mjs", "drive.mjs"],
    ["/artwork.css", "artwork.css"],
    ...[
      "mobile.css",
      "pwa.js",
      "sw.js",
      "offline.html",
      "manifest.webmanifest",
      "assets/icons/app-192.png",
      "assets/icons/app-512.png",
      "assets/icons/app-maskable.png",
      "assets/icons/apple-touch-icon.png",
      "assets/avatars/student-01.webp",
      "assets/avatars/student-02.webp",
      "assets/avatars/student-03.webp",
      "assets/avatars/student-04.webp",
      "assets/avatars/student-05.webp",
    ].map((file) => ["/" + file, file]),
    ["/", "index.html"],
    ["/index.html", "index.html"],
    ["/app.js", "app.js"],
    ["/styles.css", "styles.css"],
    ["/domain.mjs", "domain.mjs"],
    ["/speech.mjs", "speech.mjs"],
    ["/pathways.mjs", "pathways.mjs"],
    ["/pathway-ui.mjs", "pathway-ui.mjs"],
    ["/materials/aac", "AAC TONG HOP.pdf"],
    ["/materials/topic", "chủ đề 16 hình.pdf"],
    ["/materials/behavior", "dạy hành vi nên - không nên.pdf"],
    ["/materials/book", "SÁCH GIAO TIẾP.pptx"],
  ]);
  const handler = async (req, res) => {
    const send = async (status, data) => {
      await db.finish();
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' data:; frame-src https://www.youtube-nocookie.com https://drive.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    try {
      const url = new URL(req.url, "http://localhost");
      const route = url.pathname;
      if (req.method === "POST") {
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host)
          fail("Nguồn yêu cầu không hợp lệ.", 403);
        if (
          route !== "/api/videos" &&
          !req.headers["content-type"]?.startsWith("application/json")
        )
          fail("Cần gửi dữ liệu JSON.", 415);
      }
      if (route === "/api/health" && req.method === "GET") {
        await db.prepare("SELECT version FROM app_state WHERE id=1").get();
        return await send(200, { ok: true });
      }
      if (route === "/api/status" && req.method === "GET")
        return await send(200, {
          videoUploads: !databaseUrl,
          needsSetup:
            (await db.prepare("SELECT count(*) AS n FROM users").get()).n === 0,
        });
      if (route === "/api/setup" && req.method === "POST") {
        if (production || databaseUrl)
          fail("Use the configured administrator account.", 403);
        if ((await db.prepare("SELECT count(*) AS n FROM users").get()).n)
          fail("Ứng dụng đã được thiết lập.", 409);
        const v = await body(req);
        // Recheck after awaiting the request body to prevent two initial administrators.
        if ((await db.prepare("SELECT count(*) AS n FROM users").get()).n)
          fail("Ứng dụng đã được thiết lập.", 409);
        const u = userInput(
          { ...v, role: "admin", childIds: [] },
          (await readState()).data,
        );
        const pass = passwordValue(v.password, 6);
        const id = randomUUID();
        await db
          .prepare("INSERT INTO users VALUES(?,?,?,?,?,?)")
          .run(id, u.username, u.name, "admin", passwordHash(pass), "[]");
        await audit(id, "setup");
        await session(res, id);
        return await send(201, { ok: true });
      }
      if (route === "/api/login" && req.method === "POST") {
        limit(
          process.env.TRUST_PROXY === "1"
            ? String(req.headers["x-forwarded-for"] || req.socket.remoteAddress)
                .split(",")
                .at(-1)
                .trim()
            : req.socket.remoteAddress,
        );
        const v = await body(req);
        const username = str(v.username, "Tên đăng nhập", 60).toLowerCase();
        const password = passwordValue(v.password);
        const u = await db
          .prepare("SELECT * FROM users WHERE username=?")
          .get(username);
        if (!u || !verifyPassword(password, u.password))
          fail("Tên đăng nhập hoặc mật khẩu không đúng.", 401);
        if (v.role !== undefined && v.role !== u.role)
          fail(
            "Vai trò đã chọn không đúng với tài khoản này. Vui lòng chọn lại.",
            403,
          );
        await session(res, u.id);
        return await send(200, { ok: true });
      }
      if (route.startsWith("/api/")) {
        const user = await auth(req);
        if (databaseUrl && route.startsWith("/api/videos"))
          fail("Use YouTube or Google Drive links on this server.", 410);
        if (route === "/api/videos" && req.method === "POST") {
          requireRole(user, "teacher");
          const video = await videos.upload(req, user, async () =>
            requireRole(await auth(req), "teacher"),
          );
          await audit(user.id, "uploadVideo");
          return await send(201, video);
        }
        if (
          route.startsWith("/api/videos/") &&
          ["GET", "HEAD"].includes(req.method)
        ) {
          requireRole(user, "teacher", "parent", "child");
          const video = videos.lookup(route.slice("/api/videos/".length));
          if (!video) fail("Không tìm thấy video.", 404);
          const state = (await readState()).data;
          const allowed = new Set(
            state.learningPlans
              .filter((p) => canChild(user, p.childId))
              .flatMap(availableLessonIds),
          );
          if (
            user.role !== "teacher" &&
            !state.lessons.some(
              (l) => l.videoId === video.id && allowed.has(l.id),
            )
          )
            fail("Bạn chưa được xem video của bài học này.", 403);
          return await videos.stream(req, res, video);
        }
        if (route === "/api/state" && req.method === "GET")
          return await send(200, await filteredState(user));
        if (route === "/api/logout" && req.method === "POST") {
          const token = /aac_session=([a-f0-9]+)/.exec(
            req.headers.cookie || "",
          )?.[1];
          if (token)
            await db
              .prepare("DELETE FROM sessions WHERE token=?")
              .run(hashToken(token));
          res.setHeader(
            "Set-Cookie",
            "aac_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
          );
          return await send(200, { ok: true });
        }
        if (route === "/api/password" && req.method === "POST") {
          const v = await body(req);
          if (!verifyPassword(passwordValue(v.current), user.password))
            fail("Mật khẩu hiện tại không đúng.");
          const next = passwordValue(v.password, 6);
          await db
            .prepare("UPDATE users SET password=? WHERE id=?")
            .run(passwordHash(next), user.id);
          await db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
          await session(res, user.id);
          await audit(user.id, "password");
          return await send(200, { ok: true });
        }
        if (route === "/api/users" && req.method === "GET") {
          requireRole(user, "admin");
          return await send(
            200,
            (
              await db.prepare("SELECT * FROM users ORDER BY username").all()
            ).map(publicUser),
          );
        }
        if (route === "/api/users" && req.method === "POST") {
          requireRole(user, "admin");
          const v = await body(req);
          const existing = v.id
            ? await db.prepare("SELECT * FROM users WHERE id=?").get(v.id)
            : null;
          if (v.id && !existing) fail("Tài khoản không tồn tại.", 404);
          if (v.delete) {
            if (v.id === user.id)
              fail("Không thể xóa tài khoản đang đăng nhập.");
            if (
              existing.role === "admin" &&
              (
                await db
                  .prepare("SELECT count(*) AS n FROM users WHERE role='admin'")
                  .get()
              ).n <= 1
            )
              fail("Cần giữ ít nhất một quản trị viên.");
            await db.prepare("DELETE FROM users WHERE id=?").run(v.id);
            await audit(user.id, "deleteUser");
            return await send(200, { ok: true });
          }
          const u = userInput(v, (await readState()).data);
          if (
            existing?.role === "admin" &&
            u.role !== "admin" &&
            (
              await db
                .prepare("SELECT count(*) AS n FROM users WHERE role='admin'")
                .get()
            ).n <= 1
          )
            fail("Cần giữ ít nhất một quản trị viên.");
          if (v.id === user.id && u.role !== "admin")
            fail("Không thể tự thay đổi vai trò đang đăng nhập.");
          if (!existing || v.password) {
            passwordValue(v.password, 6);
          }
          const id = existing?.id || randomUUID();
          const duplicate = await db
            .prepare("SELECT id FROM users WHERE username=? AND id<>?")
            .get(u.username, id);
          if (duplicate) fail("Tên đăng nhập đã được sử dụng.");
          await db
            .prepare(
              "INSERT INTO users VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET username=excluded.username,name=excluded.name,role=excluded.role,password=excluded.password,child_ids=excluded.child_ids",
            )
            .run(
              id,
              u.username,
              u.name,
              u.role,
              v.password ? passwordHash(v.password) : existing.password,
              JSON.stringify(u.childIds),
            );
          if (existing)
            await db.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
          if (id === user.id) await session(res, id);
          await audit(user.id, "saveUser");
          return await send(200, { ok: true });
        }
        if (route === "/api/assignments" && req.method === "POST") {
          requireRole(user, "admin");
          const v = await body(req);
          const snapshot = await readState();
          if (v.version !== snapshot.version)
            fail("Dữ liệu đã thay đổi. Hãy tải lại trước khi phân công.", 409);
          if (!snapshot.data.children.some((c) => c.id === v.childId))
            fail("Học sinh không tồn tại.", 404);
          if (!Array.isArray(v.teacherIds))
            fail("Danh sách giáo viên không hợp lệ.");
          const teachers = await db
            .prepare("SELECT * FROM users WHERE role='teacher'")
            .all();
          if (!v.teacherIds.every((id) => teachers.some((t) => t.id === id)))
            fail("Giáo viên không tồn tại.");
          await db.exec("BEGIN IMMEDIATE");
          try {
            for (const teacher of teachers) {
              const ids = JSON.parse(teacher.child_ids).filter(
                (id) => id !== v.childId,
              );
              if (v.teacherIds.includes(teacher.id)) ids.push(v.childId);
              await db
                .prepare("UPDATE users SET child_ids=? WHERE id=?")
                .run(JSON.stringify(ids), teacher.id);
            }
            await db.exec("UPDATE app_state SET version=version+1 WHERE id=1");
            await audit(user.id, "assignTeachers");
            await db.exec("COMMIT");
          } catch (e) {
            await db.exec("ROLLBACK");
            throw e;
          }
          return await send(200, await filteredState(user));
        }
        if (route === "/api/backup" && req.method === "GET") {
          requireRole(user, "admin");
          return await send(200, {
            exportedAt: new Date().toISOString(),
            data: (await readState()).data,
          });
        }
        if (route === "/api/recovery" && req.method === "GET") {
          requireRole(user, "admin");
          const previous = await db
            .prepare("SELECT * FROM recovery ORDER BY id DESC LIMIT 1")
            .get();
          if (!previous) fail("Chưa có bản dự phòng trước khôi phục.", 404);
          return await send(200, {
            exportedAt: previous.at,
            data: JSON.parse(previous.data),
          });
        }
        if (route === "/api/action" && req.method === "POST") {
          const { action, payload: v = {}, version } = await body(req);
          if (!v || typeof v !== "object" || Array.isArray(v))
            fail("Nội dung thao tác không hợp lệ.");
          const snapshot = await readState();
          let d = snapshot.data;
          if (version !== snapshot.version)
            fail(
              "Dữ liệu đã thay đổi ở phiên khác. Đã tải lại; hãy kiểm tra rồi lưu lại.",
              409,
            );
          const child = (id) => {
            const c = d.children.find((c) => c.id === id);
            if (!c) fail("Không tìm thấy hồ sơ.", 404);
            if (!canChild(user, id))
              fail("Bạn không được truy cập hồ sơ này.", 403);
            return c;
          };
          if (action === "saveChild") {
            requireRole(user, "admin", "teacher");
            if (user.role === "teacher" && !v.id)
              fail("Chỉ quản trị viên được thêm học sinh.", 403);
            const old = v.id ? child(v.id) : null;
            const c = childValue({
              ...v,
              ...(user.role === "admin"
                ? {
                    goals: old?.goals || "",
                    supportNote: old?.supportNote || "",
                  }
                : { name: old.name, birthYear: old.birthYear }),
              id: old?.id || randomUUID(),
              assessment:
                old?.assessment ||
                Object.fromEntries(domains.map(([id]) => [id, 0])),
            });
            if (old) d.children[d.children.indexOf(old)] = c;
            else {
              d.children.push(c);
              d.learningPlans.push(defaultPlan(c.id, d.lessons));
              addTopicContent(d);
            }
          } else if (action === "deleteChild") {
            requireRole(user, "admin");
            child(v.id);
            d.children = d.children.filter((c) => c.id !== v.id);
            d.learningPlans = d.learningPlans.filter((p) => p.childId !== v.id);
            if(d.activityResults)d.activityResults=d.activityResults.filter(r=>r.childId!==v.id);
            for (const key of [
              "dailyRecords",
              "assessmentHistory",
              "practiceSessions",
            ])
              d[key] = d[key].filter((r) => r.childId !== v.id);
          } else if (action === "saveTemplate") {
            requireRole(user, "teacher");
            const templates = d.journeyTemplates ||= [];
            const old = templates.find(t=>t.id===v.id);
            if (v.id && !old) fail("Template not found.",404);
            if (!old && templates.length >= 100) fail("Template limit reached.");
            const template = templateValue({...v,id:old?.id || `custom-${randomUUID()}`},d.lessons);
            if(old)templates[templates.indexOf(old)]=template;else templates.push(template);
          } else if (action === "deleteTemplate") {
            requireRole(user, "teacher");
            d.journeyTemplates = (d.journeyTemplates || []).filter(t=>t.id!==v.id);
          } else if (action === "archivePlan") {
            requireRole(user,"teacher"); child(v.childId);
            const plan=d.learningPlans.find(p=>p.childId===v.childId&&(p.journeyId||"life")===v.journeyId);
            if(!plan)fail("Plan not found.",404);
            plan.archived = true;
          } else if (action === "saveFun" || action === "deleteFun") {
            requireRole(user,"teacher");
            if(!d.learningPlans.some(p=>canChild(user,p.childId)&&!p.archived&&(p.journeyId||"life")===v.journeyId))fail("Journey unavailable.",403);
            const activities=d.funActivities ||= [];
            const old=activities.find(a=>a.id===v.id);
            if(v.id&&(!old||old.journeyId!==v.journeyId))fail("Activity not found.",404);
            if(action==="deleteFun")d.funActivities=activities.filter(a=>a.id!==v.id);
            else {
              let activity;try{activity=validateFun({...v,id:old?.id||randomUUID()});}catch(e){fail(e.message);}
              if(old)activities[activities.indexOf(old)]=activity;
              else {if(activities.length>=200)fail("Activity limit reached.");activities.push(activity);}
            }
          } else if (action === "activityResult") {
            requireRole(user,"teacher","parent","child"); child(v.childId);
            const plan=d.learningPlans.find(p=>p.childId===v.childId&&(p.journeyId||"life")===v.journeyId&&!p.archived);
            if(!plan)fail("Plan unavailable.",403);
            const item=funKinds[v.kind] ? (d.funActivities||[]).find(a=>a.id===v.itemId&&a.journeyId===v.journeyId&&a.kind===v.kind) : v.kind==="puzzle" ? puzzlePacks[plan.kind||v.journeyId]?.find(p=>p.id===v.itemId) : d.lessons.find(l=>l.id===v.itemId);
            if(!item)fail("Activity unavailable.");
            if(v.kind==='math'&&!mathQuestions[v.itemId])fail('Math activity unavailable.');
            if(v.kind==='computer'&&!computerQuestions[v.itemId])fail('Computer activity unavailable.');
            if(funKinds[v.kind] && v.total!==item.items.length)fail("Invalid activity total.");
            if(!funKinds[v.kind] && v.kind!=="puzzle" && !availableLessonIds(plan).includes(v.itemId))fail("Lesson locked.",403);
            const record=activityValue({...v,authorId:user.id,at:new Date().toISOString(),label:item.title});
            const results=d.activityResults ||= [];
            if(!results.some(r=>r.id===record.id)) {
              if(results.length>=30000)fail("Activity result limit reached.");
              results.push(record);
            }
          } else if (action === "savePlan") {
            requireRole(user, "teacher");
            child(v.childId);
            const old = d.learningPlans.find((p) => p.childId === v.childId && (p.journeyId || "life") === (v.journeyId || "life"));
            const plan = planValue(v, d.lessons, false);
            for (const stage of plan.stages)
              stage.lessonScores = Object.fromEntries(
                Object.entries(
                  old?.stages.find((s) => s.id === stage.id)?.lessonScores ||
                    {},
                ).filter(([id]) => stage.lessonIds.includes(id)),
              );
            if (old) d.learningPlans[d.learningPlans.indexOf(old)] = plan;
            else { if(d.learningPlans.filter(p=>p.childId===v.childId).length>=30)fail("Plan limit reached."); d.learningPlans.push(plan); }
          } else if (action === "gradeLesson") {
            requireRole(user, "teacher");
            child(v.childId);
            const plan = d.learningPlans.find((p) => p.childId === v.childId && (p.journeyId || "life") === (v.journeyId || "life"));
            if(plan?.archived)fail("Plan archived.",403);
            const index = plan?.stages.findIndex((s) => s.id === v.stageId);
            const stage = plan?.stages[index];
            if (!stage || !stage.lessonIds.includes(v.lessonId))
              fail("Bài học không nằm trong lộ trình.");
            if (v.score !== null) integer(v.score, "Điểm đánh giá", 0, 100);
            if (v.score !== null && !stageUnlocked(plan, index))
              fail("Điểm các đích đến trước phải trên 80%.", 403);
            const entries = Object.entries(stage.lessonScores || {}).filter(
              ([id]) => id !== v.lessonId,
            );
            if (v.score !== null) entries.push([v.lessonId, v.score]);
            stage.lessonScores = Object.fromEntries(entries);
          } else if (action === "assess") {
            requireRole(user, "teacher");
            const c = child(v.childId);
            c.assessment = scores(v.scores);
            d.assessmentHistory.push({
              id: randomUUID(),
              childId: c.id,
              date: dateValue(v.date),
              scores: c.assessment,
              authorId: user.id,
            });
          } else if (action === "saveLesson") {
            requireRole(user, "teacher");
            const old = d.lessons.find((l) => l.id === v.id);
            if (v.id && !old) fail("Không tìm thấy bài học.", 404);
            const l = lessonValue({
              ...v,
              youtube: v.youtube === undefined ? old?.youtube : v.youtube,
              drive: v.drive === undefined ? old?.drive : v.drive,
              teachingGuide:
                v.teachingGuide === undefined
                  ? old?.teachingGuide
                  : v.teachingGuide,
              id: old?.id || randomUUID(),
            });
            if (l.videoId && !videos.lookup(l.videoId))
              fail("Video không tồn tại. Hãy tải video lên trước.");
            if (old) d.lessons[d.lessons.indexOf(old)] = l;
            else d.lessons.push(l);
          } else if (action === "deleteLesson") {
            requireRole(user, "teacher");
            if (
              (d.journeyTemplates||[]).some(t=>t.stages.some(s=>s.lessonIds.includes(v.id))) ||
              d.learningPlans.some((p) =>
                p.stages.some((s) => s.lessonIds.includes(v.id)),
              )
            )
              fail(
                "Bài đang nằm trong lộ trình. Hãy bỏ bài khỏi lộ trình trước khi xóa.",
              );
            if (d.lessons.length === 1) fail("Cần giữ ít nhất một bài học.");
            if (
              d.dailyRecords.some((r) => r.lessonId === v.id) ||
              d.practiceSessions.some((r) => r.lessonId === v.id)
            )
              fail("Bài học đã có lịch sử; hãy sửa nội dung thay vì xóa.");
            d.lessons = d.lessons.filter((l) => l.id !== v.id);
          } else if (action === "saveRecord") {
            requireRole(user, "teacher", "parent");
            child(v.childId);
            if (!d.lessons.some((l) => l.id === v.lessonId))
              fail("Bài học không tồn tại.");
            const old = d.dailyRecords.find((r) => r.id === v.id);
            if (v.id && !old) fail("Không tìm thấy bản ghi.", 404);
            if (old) {
              child(old.childId);
              if (user.role === "parent" && old.authorId !== user.id)
                fail("Bạn chỉ được sửa bản ghi do mình tạo.", 403);
            }
            const r = recordValue({
              ...v,
              id: old?.id || randomUUID(),
              authorId: old?.authorId || user.id,
              createdAt: old?.createdAt || new Date().toISOString(),
            });
            if (old) d.dailyRecords[d.dailyRecords.indexOf(old)] = r;
            else d.dailyRecords.push(r);
          } else if (action === "deleteRecord") {
            requireRole(user, "teacher", "parent");
            const r = d.dailyRecords.find((r) => r.id === v.id);
            if (!r) fail("Không tìm thấy bản ghi.", 404);
            child(r.childId);
            if (user.role === "parent" && r.authorId !== user.id)
              fail("Bạn chỉ được xóa bản ghi do mình tạo.", 403);
            d.dailyRecords = d.dailyRecords.filter((r) => r.id !== v.id);
          } else if (action === "practice") {
            requireRole(user, "teacher", "parent", "child");
            child(v.childId);
            if (
              user.role === "child" &&
              !d.learningPlans.filter(p => p.childId === v.childId).flatMap(availableLessonIds).includes(v.lessonId)
            )
              fail("Bài học chưa được mở trong lộ trình của con.", 403);
            if (!d.lessons.some((l) => l.id === v.lessonId))
              fail("Bài học không tồn tại.");
            d.practiceSessions.push({
              id: randomUUID(),
              childId: v.childId,
              lessonId: v.lessonId,
              date: dateValue(v.date),
              sentence: str(v.sentence ?? "", "Câu ghép", 5000, false),
              authorId: user.id,
            });
          } else if (action === "restore") {
            requireRole(user, "admin");
            d = validateBackup(v);
            if (d.lessons.some((l) => l.videoId && !videos.lookup(l.videoId)))
              fail(
                "Bản sao lưu tham chiếu video chưa có trên máy chủ. Cần khôi phục kho video và cơ sở dữ liệu đầy đủ.",
              );
          } else fail("Thao tác không hợp lệ.");
          const serialized = JSON.stringify(d);
          if (Buffer.byteLength(serialized) > 22 * 1024 * 1024)
            fail(
              "Dữ liệu vượt giới hạn 22 MB. Hãy giảm số lượng hoặc kích thước ảnh.",
            );
          await db.exec("BEGIN IMMEDIATE");
          try {
            if (action === "restore") {
              await db
                .prepare("INSERT INTO recovery(at,data) VALUES(?,?)")
                .run(new Date().toISOString(), JSON.stringify(snapshot.data));
              await db.exec(
                "DELETE FROM recovery WHERE id NOT IN (SELECT id FROM recovery ORDER BY id DESC LIMIT 5)",
              );
            }
            await db
              .prepare(
                "UPDATE app_state SET data=?,version=version+1 WHERE id=1",
              )
              .run(serialized);
            if (action === "deleteChild" || action === "restore") {
              const ids = new Set(d.children.map((c) => c.id));
              for (const u of await db
                .prepare("SELECT id,child_ids FROM users")
                .all())
                await db
                  .prepare("UPDATE users SET child_ids=? WHERE id=?")
                  .run(
                    JSON.stringify(
                      JSON.parse(u.child_ids).filter((id) => ids.has(id)),
                    ),
                    u.id,
                  );
            }
            await audit(user.id, action);
            await db.exec("COMMIT");
          } catch (e) {
            await db.exec("ROLLBACK");
            throw e;
          }
          return await send(
            200,
            await filteredState(
              await db.prepare("SELECT * FROM users WHERE id=?").get(user.id),
            ),
          );
        }
        fail("Không tìm thấy API.", 404);
      }
      if (req.method !== "GET" && req.method !== "HEAD")
        fail("Phương thức không được hỗ trợ.", 405);
      const file = staticFiles.get(route);
      if (!file) fail("Không tìm thấy trang.", 404);
      if (route.startsWith("/materials/")) await auth(req);
      const ext = path.extname(file);
      const types = {
        ".webmanifest": "application/manifest+json; charset=utf-8",
        ".png": "image/png",
        ".webp": "image/webp",
        ".mp3": "audio/mpeg",
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".pdf": "application/pdf",
        ".pptx":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      };
      const content = await readFile(path.join(root, file));
      res.writeHead(200, {
        "Content-Type": types[ext] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (e) {
      await db.abort();
      if (!e.status) console.error("Request failed:", e.code || e.name);
      if (!res.headersSent)
        await send(e.status || 500, {
          error: e.status ? e.message : "Lỗi máy chủ. Vui lòng thử lại.",
        });
      else res.end();
    }
  };
  const server = http.createServer((req, res) => {
    const run = () => handler(req, res);
    const dispatch = async () => {
      // Read JSON before acquiring the database lock; a slow client must not
      // hold the global state transaction while uploading a request body.
      if (
        req.url.startsWith("/api/") &&
        req.method === "POST" &&
        req.headers["content-type"]?.startsWith("application/json")
      )
        req.parsedBody = await body(req);
      return req.url.startsWith("/api/") ? db.scope(run) : run();
    };
    dispatch().catch((error) => {
      if (!res.headersSent)
        res.writeHead(error.status || 503, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
      res.end(
        JSON.stringify({
          error: error.status
            ? error.message
            : "Database temporarily unavailable. Please retry.",
        }),
      );
    });
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  let closingDatabase;
  const closeDatabase = () => (closingDatabase ??= Promise.resolve(db.close()));
  server.on("close", closeDatabase);
  server.shutdown = async () => {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await closeDatabase();
  };
  return server;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = await createApp({
    databaseUrl: process.env.DATABASE_URL || "",
    production: process.env.NODE_ENV === "production",
    bootstrapAdmin:
      process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD
        ? {
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD,
          }
        : null,
  }).catch((error) => {
    console.error(startupFailure(error));
    process.exit(1);
  });
  const port = Number(process.env.PORT) || 3000;
  for (const signal of ["SIGTERM", "SIGINT"])
    process.once(signal, () => {
      const timer = setTimeout(() => process.exit(1), 20000);
      timer.unref();
      server.shutdown().then(
        () => process.exit(0),
        () => process.exit(1),
      );
    });
  server.listen(port, process.env.HOST || "127.0.0.1", () =>
    console.log(`Ứng dụng AAC: http://localhost:${port}`),
  );
}
