import { createVietnameseSpeaker } from "./speech.mjs";
import { youtubeId, youtubeValue, videoSuggestions } from "./youtube.mjs";
import { driveVideo, driveEmbed } from "./drive.mjs";
import { picture } from "./art.mjs";
import { schoolBands, makeCurriculumPlan } from "./curriculum.mjs";
import { guideMarkup, curriculumChooser } from "./curriculum-ui.mjs";
import { availableLessonIds } from "./pathways.mjs";
import { pathwayView, planEditor } from "./pathway-ui.mjs";
import {
  domains,
  roles,
  domainName,
  assessment,
  recommended,
  sortedRecords,
  percent,
  localDate,
} from "./domain.mjs";
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const app = $("#app"),
  modal = $("#modal");
let videoUploads = false;
let data,
  user,
  version,
  view = "dashboard",
  childId = "",
  lessonId = "",
  selectedStage = "",
  curriculumBand = "all",
  sentence = [],
  users = [],
  editorCards = [],
  toastTimer,
  busy = false,
  pendingRestore = null;
let autoSpeak = true;
try {
  autoSpeak = localStorage.getItem("aac.autoSpeak") !== "off";
} catch {
  /* Keep the default if browser storage is unavailable. */
}
let filters = { domain: "all", level: "all", recommended: false, search: "" },
  reportRange = { from: "", to: "" };
const currentChild = () => data.children.find((c) => c.id === childId);
const currentLesson = () =>
  data.lessons.find((l) => l.id === lessonId) || data.lessons[0];
const manager = () => user.role === "teacher";
const currentPlan = () => data.learningPlans.find((p) => p.childId === childId);
const childLessons = () =>
  user.role === "child"
    ? data.lessons.filter((l) =>
        availableLessonIds(currentPlan()).includes(l.id),
      )
    : data.lessons;
const plansView = () =>
  (manager() ? curriculumChooser(data.lessons) : "") +
  pathwayView(
    currentPlan(),
    data.lessons,
    manager(),
    currentChild()?.name || "con",
    selectedStage,
  );
const navItems = () =>
  ({
    admin: [
      ["dashboard", "◫", "Tổng quan quản lý"],
      ["teachers", "♙", "Giáo viên"],
      ["children", "♧", "Học sinh"],
      ["users", "♙", "Tài khoản học sinh / phụ huynh"],
      ["settings", "⚙", "Tài khoản của tôi"],
    ],
    teacher: [
      ["pathways", "↗", "Lộ trình của bé"],
      ["dashboard", "◫", "Tổng quan"],
      ["children", "♧", "Học sinh phụ trách"],
      ["assessment", "◎", "Đánh giá kỹ năng"],
      ["lessons", "▤", "Dạy học"],
      ["kid", "☀", "Màn hình học"],
      ["daily", "✓", "Kết quả buổi học"],
      ["reports", "↗", "Tiến bộ"],
      ["content", "▧", "Soạn bài"],
      ["settings", "⚙", "Tài khoản của tôi"],
    ],
    parent: [
      ["pathways", "↗", "Lộ trình của con"],
      ["dashboard", "◫", "Con của tôi"],
      ["lessons", "▤", "Học tại nhà"],
      ["kid", "☀", "Màn hình học"],
      ["daily", "✓", "Ghi nhận tại nhà"],
      ["reports", "↗", "Tiến bộ của con"],
      ["settings", "⚙", "Tài khoản của tôi"],
    ],
    child: [
      ["pathways", "↗", "Lộ trình của con"],
      ["kid", "☀", "Học cùng con"],
      ["settings", "⚙", "Tài khoản"],
    ],
  })[user.role];
function adminNavigation() {
  return [
    ["dashboard", "dashboard", "Tổng quan"],
    ["teachers", "users", "Giáo viên"],
    ["children", "children", "Học sinh"],
  ]
    .map(
      ([id, symbol, label]) =>
        `<button class="nav-item ${view === id || (id === "children" && view === "users") ? "active" : ""}" data-view="${id}">${icon(symbol)}<span>${label}</span></button>`,
    )
    .join("");
}
function renderAdmin() {
  const titles = {
    dashboard: "Tổng quan quản lý",
    teachers: "Quản lý giáo viên",
    children: "Quản lý học sinh",
    users: "Tài khoản học sinh / phụ huynh",
    settings: "Tài khoản của tôi",
  };
  const descriptions = {
    dashboard: "Quản lý nhân sự, học sinh và phân công phụ trách.",
    teachers: "Tạo tài khoản giáo viên và quản lý học sinh được giao.",
    children:
      "Quản lý thông tin học sinh, giáo viên phụ trách và tài khoản liên kết.",
    users: "Cấp quyền truy cập đúng học sinh cho học viên và gia đình.",
    settings: "Thông tin đăng nhập của bạn.",
  };
  const content = {
    dashboard: adminOverview,
    teachers: () => adminAccounts("teacher"),
    children: adminStudents,
    users: () => adminAccounts("family"),
    settings: settingsView,
  };
  app.innerHTML = `<div class="mobile-header"><a class="brand" href="/">🌿 <span>Cùng Con</span></a><span class="badge">Quản trị viên</span></div><div class="shell admin-shell"><aside class="sidebar"><a class="brand" href="/">🌿 <span>Cùng Con<small>QUẢN TRỊ HỆ THỐNG</small></span></a><nav aria-label="Quản lý"><p class="nav-label">QUẢN LÝ</p>${adminNavigation()}</nav><div class="admin-account-links"><button class="text-button" data-view="settings">${icon("settings")} Tài khoản của tôi</button><button class="text-button" data-action="logout">Đăng xuất</button></div></aside><main class="main"><header class="page-top"><div><p class="eyebrow">QUẢN TRỊ VIÊN</p><h1>${titles[view]}</h1><p class="page-description">${descriptions[view]}</p></div><span class="badge">${esc(user.username)}</span></header><div id="view" data-page="${view}" tabindex="-1">${content[view]()}</div></main></div><div class="mobile-tabs admin-mobile" role="navigation" aria-label="Quản lý nhanh">${adminNavigation()}<button data-view="settings">${icon("settings")}<span>Tài khoản</span></button></div>`;
}
function adminOverview() {
  const teachers = users.filter((u) => u.role === "teacher");
  const pending = data.children.filter(
    (c) => !teachers.some((u) => u.childIds.includes(c.id)),
  );
  return `<section class="metrics admin-metrics">${metric("Giáo viên", teachers.length, "Tài khoản giáo viên")}${metric("Học sinh", data.children.length, "Hồ sơ đang quản lý")}${metric("Chưa phân công", pending.length, "Học sinh chưa có giáo viên")}</section><div class="admin-quick-actions"><button class="primary" data-action="editUser" data-role="teacher">+ Thêm giáo viên</button><button class="secondary" data-action="editChild">+ Thêm học sinh</button></div><section class="panel section-space"><div class="section-heading"><div><h2>Học sinh cần phân công</h2><p class="muted">Giao học sinh cho giáo viên để bắt đầu theo dõi.</p></div><button class="text-button" data-view="children">Tất cả học sinh →</button></div>${pending.length ? `<div class="admin-pending">${pending.map((c) => `<div><span><strong>${esc(c.name)}</strong><small>Sinh năm ${c.birthYear} · Chưa có giáo viên</small></span><button class="secondary" data-action="assignTeachers" data-id="${esc(c.id)}">Phân công</button></div>`).join("")}</div>` : `<p class="muted">${data.children.length ? "Tất cả học sinh đã có giáo viên phụ trách." : "Chưa có học sinh. Thêm học sinh để bắt đầu quản lý."}</p>`}</section>`;
}
function adminAccounts(kind) {
  const teachers = kind === "teacher";
  const entries = users.filter((u) =>
    teachers ? u.role === "teacher" : ["parent", "child"].includes(u.role),
  );
  return `${teachers ? "" : '<button class="text-button" data-view="children">← Quay lại học sinh</button>'}<div class="section-heading"><p class="muted">${entries.length} tài khoản</p><button class="primary" data-action="editUser" data-role="${teachers ? "teacher" : "child"}">${teachers ? "+ Thêm giáo viên" : "+ Tạo tài khoản"}</button></div>${
    entries.length
      ? `<div class="report-scroll" tabindex="0" role="region" aria-label="Danh sách tài khoản"><table class="report-table"><thead><tr><th scope="col">Tên đăng nhập</th><th scope="col">Vai trò</th><th scope="col">${teachers ? "Học sinh phụ trách" : "Học sinh được liên kết"}</th><th scope="col">Thao tác</th></tr></thead><tbody>${entries
          .map(
            (u) =>
              `<tr><td><strong>${esc(u.username)}</strong></td><td>${roles[u.role]}</td><td>${esc(
                u.childIds
                  .map((id) => data.children.find((c) => c.id === id)?.name)
                  .filter(Boolean)
                  .join(", ") || "Chưa được gán học sinh",
              )}</td><td><div class="button-row"><button class="secondary" data-action="editUser" data-id="${esc(u.id)}">Chỉnh sửa</button><button class="text-button danger-text" data-action="askDeleteUser" data-id="${esc(u.id)}">Xóa</button></div></td></tr>`,
          )
          .join("")}</tbody></table></div>`
      : empty(
          teachers ? "Chưa có giáo viên" : "Chưa có tài khoản",
          "Tạo tài khoản và chọn học sinh được phụ trách hoặc liên kết.",
        )
  }`;
}
function adminStudents() {
  const teachers = users.filter((u) => u.role === "teacher");
  return `<div class="section-heading"><p class="muted">${data.children.length} học sinh</p><div class="button-row"><button class="secondary" data-view="users">Tài khoản học sinh / phụ huynh</button><button class="primary" data-action="editChild">+ Thêm học sinh</button></div></div>${
    data.children.length
      ? `<div class="report-scroll" tabindex="0" role="region" aria-label="Danh sách học sinh"><table class="report-table"><thead><tr><th scope="col">Học sinh</th><th scope="col">Giáo viên phụ trách</th><th scope="col">Tài khoản liên kết</th><th scope="col">Thao tác</th></tr></thead><tbody>${data.children
          .map(
            (c) =>
              `<tr><td><strong>${esc(c.name)}</strong><small>Sinh năm ${c.birthYear}</small></td><td>${esc(
                teachers
                  .filter((t) => t.childIds.includes(c.id))
                  .map((t) => t.username)
                  .join(", ") || "Chưa phân công",
              )}</td><td>${
                users
                  .filter(
                    (u) =>
                      ["parent", "child"].includes(u.role) &&
                      u.childIds.includes(c.id),
                  )
                  .map(
                    (u) =>
                      `<small>${roles[u.role]}: ${esc(u.username)}</small>`,
                  )
                  .join("") || "<small>Chưa có tài khoản</small>"
              }</td><td><div class="button-row"><button class="secondary" data-action="assignTeachers" data-id="${esc(c.id)}">Phân công</button><button class="text-button" data-action="editChild" data-id="${esc(c.id)}">Sửa</button><button class="text-button danger-text" data-action="askDeleteChild" data-id="${esc(c.id)}">Xóa</button></div></td></tr>`,
          )
          .join("")}</tbody></table></div>`
      : empty(
          "Chưa có học sinh",
          "Thêm thông tin học sinh, sau đó phân công giáo viên phụ trách.",
        )
  }`;
}
function toast(message, error = false) {
  const t = $("#toast");
  t.textContent = message;
  t.className = error ? "show error" : "show";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ""), 6000);
}
async function api(url, payload) {
  const res = await fetch(url, {
    method: payload === undefined ? "GET" : "POST",
    headers:
      payload === undefined ? {} : { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok) {
    const e = new Error(result.error || "Không thể kết nối máy chủ.");
    e.status = res.status;
    throw e;
  }
  return result;
}
function accept(result) {
  ({ data, user, version } = result);
  if (result.users) users = result.users;
  if (!data.children.some((c) => c.id === childId))
    childId = data.children[0]?.id || "";
  if (!data.lessons.some((l) => l.id === lessonId))
    lessonId = data.lessons[0]?.id || "";
}
async function load() {
  accept(await api("/api/state"));
}
async function mutate(action, payload, message = "Đã lưu thay đổi.") {
  try {
    accept(await api("/api/action", { action, payload, version }));
    modal.close();
    render();
    toast(message);
  } catch (e) {
    if (e.status === 409) {
      await load();
      modal.close();
      render();
    }
    throw e;
  }
}
function option(value, label, selected) {
  return `<option value="${esc(value)}" ${String(value) === String(selected) ? "selected" : ""}>${esc(label)}</option>`;
}
function empty(title, text, button = "") {
  return `<div class="empty"><span class="empty-icon">🌱</span><h2>${esc(title)}</h2><p>${esc(text)}</p>${button}</div>`;
}
function metric(label, value, detail = "") {
  return `<article class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
}
function badge(text) {
  return `<span class="badge">${esc(text)}</span>`;
}
function field(label, content) {
  const control = content.replace(
    /^<(input|select|textarea)\b/,
    `<$1 aria-label="${esc(label)}"`,
  );
  return `<label>${label}${control}</label>`;
}
function input(name, value = "", type = "text", extra = "") {
  return `<input name="${name}" type="${type}" value="${esc(value)}" ${extra}>`;
}
function textarea(name, value = "", extra = "") {
  return `<textarea name="${name}" ${extra}>${esc(value)}</textarea>`;
}
function submit(label = "Lưu thay đổi") {
  return `<p class="form-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-action="closeModal">Hủy</button><button class="primary" type="submit">${label}</button></div>`;
}
function openModal(title, html) {
  modal.innerHTML = `<div class="dialog-heading"><h2>${esc(title)}</h2><button class="icon-button" data-action="closeModal" aria-label="Đóng">×</button></div>${html}`;
  modal.showModal();
}
function confirmAction(title, text, action, id = "") {
  openModal(
    title,
    `<p>${esc(text)}</p><div class="form-actions"><button class="secondary" data-action="closeModal">Hủy</button><button class="danger" data-action="${action}" data-id="${esc(id)}">Xác nhận</button></div>`,
  );
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function formatDate(date) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
async function boot() {
  try {
    const status = await api("/api/status");
    videoUploads = status.videoUploads === true;
    if (status.needsSetup) return renderAuth(true);
    await load();
    if (user.role === "child") view = "pathways";
    render();
  } catch (e) {
    if (e.status === 401) renderAuth();
    else {
      app.innerHTML = empty(
        "Chưa kết nối được ứng dụng",
        "Hãy khởi động máy chủ bằng npm start rồi mở http://localhost:3000.",
        '<button class="primary" data-action="retry">Thử lại</button>',
      );
      toast(e.message, true);
    }
  }
}
function renderAuth(setup = false) {
  app.innerHTML = `<main class="auth-layout"><section class="auth-story"><a class="brand" href="/">🌿 <span>Cùng Con</span></a><p class="eyebrow">TỪNG BƯỚC NHỎ, MỖI NGÀY</p><h1>Cùng con học.<br>Cùng con lớn lên.</h1><p>Một nơi để lưu hành trình học tập, thực hành giao tiếp AAC và kết nối gia đình với giáo viên.</p><div class="auth-tiles"><span>${picture("badge-connect", "auth-sticker", true)}<small>Giao tiếp</small></span><span>${picture("badge-start", "auth-sticker", true)}<small>Khám phá</small></span><span>${picture("badge-independent", "auth-sticker", true)}<small>Đồng hành</small></span></div></section><section class="auth-card"><span class="badge">${setup ? "Bắt đầu hành trình" : "Chào mừng trở lại"}</span><h2>${setup ? "Thiết lập ứng dụng" : "Đăng nhập"}</h2><p class="muted">${setup ? "Tạo tài khoản quản trị đầu tiên để quản lý hồ sơ và cấp tài khoản cho giáo viên, phụ huynh." : "Dùng tài khoản được quản trị viên cấp cho bạn."}</p><form data-form="${setup ? "setup" : "login"}">${field("Tên đăng nhập", input("username", "", "text", 'required minlength="3" maxlength="60" pattern="[a-zA-Z0-9._-]+" autocomplete="username"'))}${field(
    "Vai trò",
    `<select name="role" required aria-label="Vai trò">${
      setup
        ? option("admin", "Quản trị viên", "admin")
        : '<option value="">Chọn vai trò</option>' +
          Object.entries(roles)
            .map(([id, label]) => option(id, label, ""))
            .join("")
    }</select>`,
  )}${field("Mật khẩu", input("password", "", "password", `required ${setup ? 'minlength="6"' : ""} maxlength="200" autocomplete="${setup ? "new-password" : "current-password"}"`))}${setup ? '<p class="hint">Mật khẩu tối thiểu 6 ký tự. Hãy lưu lại để đăng nhập lần sau.</p>' : ""}<p class="form-error" role="alert"></p><button class="primary full" type="submit">${setup ? "Tạo tài khoản & bắt đầu" : "Đăng nhập"} →</button></form><p class="hint">Dữ liệu được lưu trên máy chủ của ứng dụng.</p></section></main>`;
}

function icon(name) {
  const paths = {
    dashboard:
      '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    children:
      '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 5a5 5 0 0 1 3 5"/>',
    assessment:
      '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3h6v4H9zM9 12h6m-6 4h4"/>',
    lessons:
      '<path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
    kid: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
    daily:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5 3 3 5-5"/>',
    reports: '<path d="M4 3v18h17M8 16l4-5 4 2 5-7"/>',
    content:
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M17 14v7m-3-3h7"/>',
    users:
      '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0m4-13v6m-3-3h6"/>',
    settings:
      '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  };
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.lessons}</svg>`;
}
function navigation() {
  const groups = [
    ["MỖI NGÀY", ["dashboard", "pathways", "lessons", "daily", "reports"]],
    [
      "THEO DÕI & QUẢN LÝ",
      ["children", "assessment", "content", "users", "settings"],
    ],
  ];
  return groups
    .map(([label, ids]) => {
      const entries = navItems().filter(([id]) => ids.includes(id));
      return entries.length
        ? `<div class="nav-group"><p class="nav-label">${label}</p>${entries.map(([id, , title]) => `<button data-view="${id}" class="nav-item ${view === id ? "active" : ""}" ${view === id ? 'aria-current="page"' : ""}>${icon(id)}<span>${title}</span></button>`).join("")}</div>`
        : "";
    })
    .join("");
}
function mobileNavigation() {
  const items =
    user.role === "child"
      ? [
          ["kid", "Học cùng con"],
          ["settings", "Tài khoản"],
        ]
      : [
          ["dashboard", "Trang chủ"],
          ["pathways", "Lộ trình"],
          ["daily", "Ghi kết quả"],
          ["reports", "Tiến bộ"],
        ];
  return `<div class="mobile-tabs" role="navigation" aria-label="Điều hướng nhanh">${items.map(([id, label]) => `<button data-view="${id}" ${view === id ? 'aria-current="page"' : ""}>${icon(id)}<span>${label}</span></button>`).join("")}<button data-action="openMenu" aria-haspopup="dialog">${icon("menu")}<span>Menu</span></button></div>`;
}

function render() {
  if (!navItems().some(([id]) => id === view)) view = navItems()[0][0];
  const c = currentChild();
  if (
    user.role === "child" &&
    c &&
    view === "kid" &&
    !childLessons().some((l) => l.id === lessonId)
  )
    view = "pathways";
  if (view === "pathways" && user.role === "child" && c) {
    app.innerHTML = `<div class="focus-shell"><header class="focus-header"><div class="focus-brand"><span aria-hidden="true">🌿</span><strong>Cùng con học</strong></div><label class="focus-child">Hồ sơ trẻ<select id="childPicker">${data.children.map((ch) => option(ch.id, ch.name, childId)).join("")}</select></label><button class="secondary learning-exit" data-action="openMenu">Người đồng hành</button></header><main class="focus-main"><div id="view" data-page="pathways">${plansView()}</div></main></div>`;
    return;
  }
  if (user.role === "admin") {
    renderAdmin();
    return;
  }
  if (view === "kid" && c) {
    app.innerHTML = `<div class="focus-shell">
      <header class="focus-header"><div class="focus-brand"><span aria-hidden="true">🌿</span><strong>Cùng con học</strong></div>
        <label class="focus-child">Hồ sơ trẻ<select id="childPicker">${data.children.map((ch) => option(ch.id, ch.name, childId)).join("")}</select></label>
        ${user.role === "child" ? '<button class="secondary learning-exit" data-action="openMenu">Người đồng hành</button>' : '<button class="secondary learning-exit" data-view="lessons">← Chọn bài khác</button>'}
      </header><main class="focus-main"><div id="view" data-page="${view}" tabindex="-1">${kidView(c)}</div></main>
    </div>`;
    return;
  }
  const descriptions = {
    pathways: "Bài học và tiến độ riêng cho từng bé, từng bước một.",
    dashboard: "Một nơi để bắt đầu buổi học hôm nay.",
    children: "Mỗi trẻ, một hành trình riêng.",
    assessment: "Ghi nhận khả năng hiện tại để chọn bài phù hợp.",
    lessons: "Chọn một bài, rồi cùng con thực hành.",
    kid: "Chạm vào hình để con nói điều mình muốn.",
    daily: "Lưu lại những điều con đã làm được.",
    reports: "Nhìn lại từng bước tiến của con.",
    content: "Chuẩn bị những thẻ học quen thuộc với trẻ.",
    users: "Kết nối giáo viên và gia đình.",
    settings: "Quản lý tài khoản và bảo quản dữ liệu.",
  };
  app.innerHTML = `<a class="skip-link" href="#view">Đến nội dung chính</a>
    <div class="mobile-header"><a class="brand" href="/">🌿 <span>Cùng Con</span></a><button class="secondary" data-action="openMenu" aria-haspopup="dialog">${icon("menu")} Menu</button></div>
    <div class="shell ${view === "kid" ? "child-layout" : ""}">
      <aside class="sidebar"><a class="brand" href="/">🌿 <span>Cùng Con<small>HỌC TẬP & GIAO TIẾP AAC</small></span></a>
        <nav aria-label="Điều hướng chính">${navigation()}</nav>
        <div class="user-box"><span class="avatar">${esc(user.name.slice(0, 1).toUpperCase())}</span><div><strong>${esc(user.name)}</strong><small>${roles[user.role]}</small></div><button class="icon-button" data-action="logout" aria-label="Đăng xuất" title="Đăng xuất">↪</button></div>
      </aside>
      <main class="main"><header class="page-top"><div><p class="eyebrow">CÙNG CON MỖI NGÀY</p><h1>${view === "dashboard" ? "Hôm nay" : navItems().find(([id]) => id === view)[2]}</h1><p class="page-description">${descriptions[view]}</p></div>
        <div class="child-picker"><span class="picker-avatar" aria-hidden="true">${c ? esc(c.name.slice(0, 1)) : "+"}</span><div><label for="childPicker">Đang đồng hành cùng</label><select id="childPicker" ${!data.children.length ? "disabled" : ""}>${data.children.length ? data.children.map((ch) => option(ch.id, ch.name, childId)).join("") : "<option>Chưa có hồ sơ</option>"}</select></div></div>
      </header><div id="view" data-page="${view}" tabindex="-1">${renderView(c)}</div><footer>Đồng hành từng bước · Cùng Con AAC <span>Mỗi tiến bộ nhỏ đều đáng được ghi nhận.</span></footer></main>
    </div>${mobileNavigation()}`;
}
function renderView(c) {
  if (!c && !["children", "content", "users", "settings"].includes(view))
    return empty(
      "Bắt đầu với hồ sơ của con",
      manager()
        ? "Chưa có học sinh được phân công. Quản trị viên cần giao học sinh cho tài khoản giáo viên này."
        : "Chưa có hồ sơ được gán cho tài khoản. Hãy liên hệ quản trị viên.",
      "",
    );
  return {
    pathways: plansView,
    dashboard: () => dashboard(c),
    children: childrenView,
    assessment: () => assessmentView(c),
    lessons: () => lessonsView(c),
    kid: () => kidView(c),
    daily: () => dailyView(c),
    reports: () => reportsView(c),
    content: contentView,
    settings: settingsView,
  }[view]();
}
function bars(c) {
  return `<div class="skill-bars">${domains.map(([id, name]) => `<div><div class="bar-label"><span>${name}</span><strong>${c.assessment[id]}/4</strong></div><progress max="4" value="${c.assessment[id]}" aria-label="${name}"></progress></div>`).join("")}</div>`;
}
function lessonTile(l) {
  return `<article class="lesson-tile"><div class="tile-art" aria-hidden="true">${l.cards
    .slice(0, 3)
    .map((card) =>
      card.image
        ? `<img src="${esc(card.image)}" alt="">`
        : `<span>${esc(card.icon)}</span>`,
    )
    .join(
      "",
    )}</div><div class="tile-body"><div class="tags">${badge(domainName(l.domain))}${badge("Mức " + l.level)}</div><h3>${esc(l.title)}</h3><p>${esc(l.goal)}</p><button class="secondary" data-action="openLesson" data-id="${esc(l.id)}">Mở bài học <span>→</span></button></div></article>`;
}
function dashboard(c) {
  const a = assessment(c),
    records = sortedRecords(data.dailyRecords, c.id),
    suggested = recommended(c, data.lessons),
    latest = records[0];
  const lastAssessment = data.assessmentHistory
    .filter((h) => h.childId === c.id)
    .at(-1);
  const next = suggested[0] || data.lessons[0];
  return `<section class="welcome"><div><span class="badge light">SẴN SÀNG CHO BUỔI HỌC MỚI</span><h2>Hôm nay ${esc(c.name)}<br>mình cùng học nhé!</h2><p>${esc(c.goals || "Bắt đầu bằng một bài học nhỏ, theo nhịp của con.")}</p><div class="button-row"><button class="primary start-button" data-action="openLesson" data-id="${esc(next.id)}">${icon("kid")} Bắt đầu học cùng con</button><button class="welcome-link" data-view="lessons">Chọn bài khác →</button></div><small class="suggested-caption">Bài gợi ý: ${esc(next.title)}</small></div><div class="welcome-illustration" aria-hidden="true">${picture("buddy-growing", "welcome-art", true)}</div></section>
    <section class="daily-steps" aria-label="Các bước của buổi học">
      ${manager() ? `<button class="step-card" data-view="assessment"><span class="step-number">1</span><span><strong>Đánh giá kỹ năng</strong><small>${lastAssessment ? "Lần gần nhất: " + formatDate(lastAssessment.date) : "Bắt đầu từ khả năng của con"}</small></span>${icon("arrow")}</button>` : `<button class="step-card" data-view="reports"><span class="step-number">1</span><span><strong>Xem tiến bộ</strong><small>Nắm tình hình trước buổi học</small></span>${icon("arrow")}</button>`}
      <button class="step-card" data-view="lessons"><span class="step-number">2</span><span><strong>Chọn bài học</strong><small>${suggested.length} bài phù hợp để tham khảo</small></span>${icon("arrow")}</button>
      <button class="step-card" data-action="editRecord"><span class="step-number">3</span><span><strong>Ghi kết quả</strong><small>Lưu nhận xét sau khi học xong</small></span>${icon("arrow")}</button>
    </section>
    <div class="section-heading"><div><h2>Hành trình của ${esc(c.name)}</h2><p class="muted">Những ghi nhận được lưu đến hôm nay</p></div><button class="text-button" data-view="reports">Xem chi tiết →</button></div>
    <section class="metrics">${metric("Mức kỹ năng", a.level + "/4", a.label)}${metric("Buổi đã ghi nhận", records.length, "Buổi có kết quả đánh giá")}${metric("Kết quả gần nhất", latest ? percent(latest.correct, latest.total) + "%" : "—", latest ? formatDate(latest.date) : "Chưa có buổi học")}${metric("Lượt thực hành", data.practiceSessions.filter((p) => p.childId === c.id).length, "Lượt con thực hành với thẻ")}</section>
    <div class="section-heading"><div><h2>Bài học gợi ý</h2><p class="muted">Chọn bài phù hợp với hứng thú của con</p></div><button class="text-button" data-view="lessons">Xem tất cả →</button></div><div class="lesson-grid">${suggested.slice(0, 3).map(lessonTile).join("") || "<p>Chưa có bài phù hợp. Bạn có thể thêm học liệu mới.</p>"}</div>
    <div class="two-columns section-space"><section class="panel"><h2>Kỹ năng hiện tại</h2>${bars(c)}</section><section class="panel"><h2>Ghi nhận gần đây</h2>${
      records
        .slice(0, 3)
        .map((r) => recordCard(r, false))
        .join("") ||
      '<p class="muted">Sau buổi học đầu tiên, kết quả và nhận xét sẽ hiện ở đây.</p>'
    }<button class="secondary" data-view="daily">Xem lịch sử buổi học →</button></section></div>`;
}
function childrenView() {
  return `<div class="section-heading"><p class="muted">${data.children.length} hồ sơ · Theo dõi riêng hành trình của từng trẻ.</p></div><div class="profile-grid">${data.children.map((ch) => `<article class="panel profile-card"><span class="profile-avatar">${esc(ch.name.slice(0, 1))}</span><h2>${esc(ch.name)}</h2><p class="muted">Sinh năm ${ch.birthYear}</p>${badge(assessment(ch).label)}<p>${esc(ch.goals || "Chưa đặt mục tiêu.")}</p><p class="muted">${esc(ch.supportNote)}</p><div class="button-row"><button class="secondary" data-action="selectChild" data-id="${esc(ch.id)}">Theo dõi</button><button class="text-button" data-action="editChild" data-id="${esc(ch.id)}">Sửa</button>${user.role === "admin" ? `<button class="text-button danger-text" data-action="askDeleteChild" data-id="${esc(ch.id)}">Xóa</button>` : ""}</div></article>`).join("") || empty("Chưa có hồ sơ", "Nhấn “Thêm hồ sơ” để bắt đầu.")}</div>`;
}
function editChild(id) {
  if (user.role === "admin") {
    const c = data.children.find((c) => c.id === id) || {
      name: "",
      birthYear: new Date().getFullYear() - 4,
    };
    openModal(
      id ? "Sửa thông tin học sinh" : "Thêm học sinh",
      `<form data-form="child" data-id="${esc(id || "")}">${field("Tên học sinh", input("name", c.name, "text", 'required maxlength="100"'))}${field("Năm sinh", input("birthYear", c.birthYear, "number", `required min="1900" max="${new Date().getFullYear()}"`))}${submit("Lưu học sinh")}</form>`,
    );
    return;
  }

  const c = data.children.find((c) => c.id === id) || {
    name: "",
    birthYear: new Date().getFullYear() - 4,
    goals: "",
    supportNote: "",
  };
  openModal(
    id ? "Chỉnh sửa hồ sơ" : "Thêm hồ sơ trẻ",
    `<form data-form="child" data-id="${esc(id || "")}"><div class="form-grid">${field("Tên trẻ", input("name", c.name, "text", 'readonly maxlength="100"'))}${field("Năm sinh", input("birthYear", c.birthYear, "number", "readonly"))}</div>${field("Mục tiêu học tập", textarea("goals", c.goals, 'maxlength="3000"'))}${field("Đặc điểm, nhu cầu hỗ trợ", textarea("supportNote", c.supportNote, 'maxlength="3000"'))}${submit("Lưu hồ sơ")}</form>`,
  );
}
function assessmentView(c) {
  return `<div class="two-columns"><section class="panel"><h2>Đánh giá kỹ năng</h2><p class="muted">0: chưa thể hiện · 1: hỗ trợ nhiều · 2: đang hình thành · 3: nhắc nhẹ · 4: độc lập</p><form data-form="assessment">${field("Ngày đánh giá", input("date", localDate(), "date", "required"))}${domains.map(([id, name]) => `<fieldset class="score-row"><legend>${name}</legend><div class="score-options">${[0, 1, 2, 3, 4].map((n) => `<label><input type="radio" name="${id}" value="${n}" ${c.assessment[id] === n ? "checked" : ""}><span><b>${n}</b><small>${["Chưa thể hiện", "Hỗ trợ nhiều", "Đang hình thành", "Nhắc nhẹ", "Độc lập"][n]}</small></span></label>`).join("")}</div></fieldset>`).join("")}<p class="form-error" role="alert"></p><button class="primary" type="submit">Lưu lần đánh giá</button></form></section><section class="panel"><h2>Lịch sử đánh giá</h2><p class="muted">Mỗi lần lưu tạo một mốc để so sánh tiến bộ. Mức gợi ý không phải kết luận chẩn đoán.</p>${
    data.assessmentHistory
      .filter((h) => h.childId === c.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20)
      .map(
        (h) =>
          `<div class="history-item"><strong>${formatDate(h.date)}</strong><p>Điểm trung bình: ${assessment({ assessment: h.scores }).average.toFixed(1)}/4</p><small>${domains.map(([id, name]) => `${name}: ${h.scores[id]}`).join(" · ")}</small></div>`,
      )
      .join("") || "<p>Chưa có lần đánh giá nào được lưu.</p>"
  }</section></div>`;
}
function lessonsView(c) {
  const rec = new Set(recommended(c, data.lessons).map((l) => l.id));
  const lessons = data.lessons.filter(
    (l) =>
      (filters.domain === "all" || l.domain === filters.domain) &&
      (filters.level === "all" || l.level === Number(filters.level)) &&
      (!filters.recommended || rec.has(l.id)) &&
      l.title
        .toLocaleLowerCase("vi")
        .includes(filters.search.toLocaleLowerCase("vi")),
  );
  return `<section class="panel filter-row"><label>Tìm bài học<input id="lessonSearch" type="search" placeholder="Nhập tên bài…" value="${esc(filters.search)}"></label><label>Lĩnh vực<select id="domainFilter">${option("all", "Tất cả lĩnh vực", filters.domain)}${domains.map(([id, name]) => option(id, name, filters.domain)).join("")}</select></label><label>Mức học<select id="levelFilter">${option("all", "Tất cả mức", filters.level)}${[1, 2, 3].map((n) => option(n, "Mức " + n, filters.level)).join("")}</select></label><label class="check-label"><input id="recommendedFilter" type="checkbox" ${filters.recommended ? "checked" : ""}>Chỉ bài gợi ý</label></section><p class="muted">${lessons.length} bài học · Chọn bài để thực hành cùng con.</p><div class="lesson-grid">${lessons.map(lessonTile).join("")}</div>${!lessons.length ? empty("Không tìm thấy bài học", "Thử bỏ bớt bộ lọc để tìm bài phù hợp.", '<button class="secondary" data-action="resetFilters">Xóa bộ lọc</button>') : ""}`;
}
function kidView(c) {
  const l = currentLesson();
  return `<section class="learning-panel"><div class="learning-heading"><label>Bài học<select id="kidLesson">${childLessons()
    .map((x) => option(x.id, x.title, l.id))
    .join(
      "",
    )}</select></label><span class="badge">${esc(c.name)}</span></div>${lessonVideo(l)}${l.teachingGuide && user.role !== "child" ? `<button class="text-button" data-action="viewTeachingGuide" data-id="${esc(l.id)}">Hướng dẫn đồng hành và thực hành tại nhà</button>` : ""}<div class="learning-cue">${picture("buddy-welcome", "cue-buddy", true)}<h2>${esc(l.prompt)}</h2></div><p class="muted">1. Chạm vào hình · 2. Đọc câu · 3. Hoàn thành</p><div class="sentence-heading"><strong>Câu của con</strong><span>Chọn một thẻ nhiều lần nếu cần</span></div><div id="sentence" class="sentence" aria-live="polite">${sentenceMarkup()}</div><div class="button-row sentence-tools"><button class="secondary" data-action="speakSentence">🔊 Đọc câu</button><button class="text-button" data-action="undoWord">↶ Bỏ thẻ cuối</button><button class="text-button danger-text" data-action="clearSentence">Xóa câu</button><label class="check-label"><input type="checkbox" id="autoSpeak" ${autoSpeak ? "checked" : ""}>Đọc khi chọn thẻ</label></div><div class="aac-grid">${l.cards.map((card, i) => `<button class="aac-card" data-action="addWord" data-index="${i}" aria-label="${esc(card.text)}">${card.image ? `<img src="${esc(card.image)}" alt="">` : `<span class="aac-symbol" aria-hidden="true">${esc(card.icon)}</span>`}<strong>${esc(card.text)}</strong></button>`).join("")}</div><div class="learning-bottom"><p class="hint">Hoàn thành sẽ lưu lượt thực hành và câu ghép. Điểm đúng/sai do người đồng hành ghi riêng.</p><button class="primary" data-action="completePractice">✓ Hoàn thành lượt học</button></div></section>`;
}
function lessonVideo(lesson) {
  if (lesson.drive) {
    const video = lesson.drive;
    return `${user.role === "child" ? '<button class="text-button" data-view="pathways">← Về lộ trình của con</button>' : ""}<section class="lesson-video"><h3>${esc(video.title)}</h3><p class="hint">Nguồn: ${esc(video.channel)} · Google Drive</p><div class="youtube-player"><button class="primary" data-action="playDrive" data-id="${esc(lesson.id)}">▶ Xem video bài học</button></div><p>${esc(video.note)}</p><p class="hint">Cần Internet và quyền xem video. Xem video không cộng điểm lộ trình.</p><a href="${esc(video.url)}" target="_blank" rel="noopener noreferrer">Mở trên Google Drive nếu không phát được ↗</a></section>`;
  }
  if (lesson.youtube) {
    const video = lesson.youtube;
    return `${user.role === "child" ? '<button class="text-button" data-view="pathways">← Về lộ trình của con</button>' : ""}<section class="lesson-video"><h3>${esc(video.title)}</h3><p class="hint">Nguồn: ${esc(video.channel)} · YouTube</p><div class="youtube-player"><button class="primary" data-action="playYoutube" data-id="${esc(lesson.id)}">▶ Xem video bài học</button></div><p>${esc(video.note)}</p><p class="hint">Cần Internet. Xem video không cộng điểm lộ trình.</p><a href="${esc(video.url)}" target="_blank" rel="noopener noreferrer">Mở trên YouTube nếu không phát được ↗</a></section>`;
  }
  return `${user.role === "child" ? '<button class="text-button" data-view="pathways">← Về lộ trình của con</button>' : ""}${lesson.videoId ? `<section class="lesson-video"><div class="video-heading">${picture("badge-connect")}<h3>Video hướng dẫn</h3></div><video controls playsinline preload="metadata" aria-label="Video ${esc(lesson.title)}" src="/api/videos/${esc(lesson.videoId)}"></video><p class="hint">Xem mẫu, rồi cùng con thực hành bằng các thẻ bên dưới.</p></section>` : ""}`;
}
function videoEditor(lesson) {
  return `${youtubeEditor(lesson)}${driveEditor(lesson)}${videoUploads ? uploadVideoEditor(lesson) : `<input type="hidden" name="videoId" value="${esc(lesson.videoId || "")}">`}`;
}
function driveEditor(lesson) {
  const video = lesson.drive || {};
  return `<details class="video-editor" ${lesson.drive ? "open" : ""}><summary>Video Google Drive</summary><p class="hint">Dán link tệp video và cấp quyền xem cho người học. Với video bài giảng dùng chung, có thể chọn “Bất kỳ ai có đường liên kết → Người xem”. Không chia sẻ công khai video riêng của học sinh.</p><label>Liên kết Google Drive<input type="url" name="driveUrl" maxlength="1000" placeholder="https://drive.google.com/file/d/.../view" value="${esc(video.url || "")}"></label><label>Tên video Drive<input name="driveTitle" maxlength="200" value="${esc(video.title || "")}"></label><label>Người tạo hoặc nguồn video<input name="driveChannel" maxlength="150" value="${esc(video.channel || "")}"></label><label>Thực hành sau video<textarea name="driveNote" maxlength="1000">${esc(video.note || "")}</textarea></label><button type="button" class="text-button" data-action="removeDrive">Bỏ liên kết Google Drive</button></details>`;
}
function youtubeEditor(lesson) {
  const video = lesson.youtube || {};
  const suggestions = videoSuggestions.filter((v) =>
    v.lessonIds.includes(lesson.id),
  );
  return `<section class="video-editor"><h3>Video YouTube</h3><p class="hint">Chọn một liên kết YouTube hoặc Google Drive cho mỗi bài. Xem trước để chọn nội dung tiếng Việt phù hợp với học sinh rồi lưu bài.</p><label>Liên kết YouTube<input name="youtubeUrl" type="url" maxlength="1000" placeholder="https://www.youtube.com/watch?v=..." value="${esc(video.url || "")}"></label><label>Tên video<input name="youtubeTitle" maxlength="200" value="${esc(video.title || "")}"></label><label>Tên kênh nguồn<input name="youtubeChannel" maxlength="150" value="${esc(video.channel || "")}"></label><label>Gợi ý thực hành sau video<textarea name="youtubeNote" maxlength="1000">${esc(video.note || "")}</textarea></label><button type="button" class="text-button" data-action="removeYoutube">Bỏ liên kết YouTube</button>${suggestions.length ? `<details><summary>Nguồn gợi ý để xem trước (${suggestions.length})</summary>${suggestions.map((v) => `<article class="video-suggestion"><strong>${esc(v.title)}</strong><p class="hint">${esc(v.review)}</p><p>${esc(v.channel)} · ${esc(v.duration)}</p><a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer">Xem nguồn trên YouTube ↗</a><p>${esc(v.note)}</p><button type="button" class="secondary" data-action="useYoutubeSuggestion" data-id="${v.id}">Điền nguồn này vào bài</button></article>`).join("")}</details>` : ""}</section>`;
}
function uploadVideoEditor(lesson) {
  return `<section class="video-editor"><h3>Video bài học</h3><p class="hint">MP4 hoặc WebM, tối đa 100 MB. Nên dùng MP4 (H.264/AAC), video ngắn 1–3 phút, nói tiếng Việt rõ và có chữ hướng dẫn.</p><input type="hidden" name="videoId" value="${esc(lesson.videoId || "")}"><label>Chọn video bài học<input id="lessonVideo" type="file" accept="video/mp4,video/webm,.mp4,.webm"></label><div id="videoPreview">${lesson.videoId ? `<video controls playsinline preload="metadata" src="/api/videos/${esc(lesson.videoId)}" aria-label="Video bài học hiện tại"></video>` : ""}</div><button type="button" class="text-button" data-action="removeLessonVideo">Bỏ video đính kèm</button><p id="videoUploadStatus" role="status"></p><progress id="videoUploadProgress" max="100" value="0" hidden aria-label="Tiến độ tải video"></progress></section>`;
}
function uploadLessonVideo(file) {
  if (file.size > 100 * 1024 * 1024) throw new Error("Video tối đa 100 MB.");
  const mime =
    file.type ||
    (/\.mp4$/i.test(file.name)
      ? "video/mp4"
      : /\.webm$/i.test(file.name)
        ? "video/webm"
        : "");
  if (!["video/mp4", "video/webm"].includes(mime))
    throw new Error("Chọn video MP4 hoặc WebM.");
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/videos");
    request.setRequestHeader("Content-Type", mime);
    request.timeout = 10 * 60 * 1000;
    const status = $("#videoUploadStatus"),
      progress = $("#videoUploadProgress");
    progress.hidden = false;
    status.textContent = "Đang tải video, vui lòng giữ trang này mở…";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        progress.value = Math.round((event.loaded * 100) / event.total);
        status.textContent = `Đang tải video: ${progress.value}%`;
      }
    };
    request.onerror = () =>
      reject(new Error("Mất kết nối khi tải video. Hãy thử lưu lại."));
    request.ontimeout = () =>
      reject(new Error("Tải video quá lâu. Kiểm tra mạng rồi thử lại."));
    request.onload = () => {
      let result;
      try {
        result = JSON.parse(request.responseText);
      } catch {
        reject(new Error("Máy chủ chưa nhận được video. Hãy thử lại."));
        return;
      }
      if (request.status >= 400) {
        reject(new Error(result.error || "Không tải được video."));
        return;
      }
      status.textContent = "Đã tải video. Đang lưu bài học…";
      resolve(result.id);
    };
    request.send(file);
  });
}
function sentenceMarkup() {
  return sentence.length
    ? sentence
        .map((word) => `<span class="sentence-word">${esc(word)}</span>`)
        .join("")
    : '<span class="muted">Câu của con sẽ xuất hiện ở đây…</span>';
}
let vietnameseSpeaker;
function speak(text) {
  if (!text) return toast("Hãy chọn ít nhất một thẻ.");
  if (!("speechSynthesis" in window))
    return toast("Trình duyệt này chưa hỗ trợ đọc thành tiếng.", true);
  vietnameseSpeaker ||= createVietnameseSpeaker(
    speechSynthesis,
    SpeechSynthesisUtterance,
    toast,
  );
  return vietnameseSpeaker(text);
}
function recordCard(r, editable = true) {
  const l = data.lessons.find((l) => l.id === r.lessonId);
  return `<article class="record-card"><div class="record-title"><strong>${esc(l?.title || "Bài học")}</strong><span class="badge">${percent(r.correct, r.total)}%</span></div><small>${formatDate(r.date)} · Đúng ${r.correct}/${r.total} · Nhắc ${r.prompt}/3 · Tập trung ${r.focus}/4</small>${r.behavior ? `<p><b>Quan sát:</b> ${esc(r.behavior)}</p>` : ""}${r.note ? `<p>${esc(r.note)}</p>` : ""}${editable && (manager() || r.authorId === user.id) ? `<div class="button-row"><button class="text-button" data-action="editRecord" data-id="${esc(r.id)}">Chỉnh sửa</button><button class="text-button danger-text" data-action="askDeleteRecord" data-id="${esc(r.id)}">Xóa</button></div>` : ""}</article>`;
}
function dailyView(c) {
  const records = sortedRecords(data.dailyRecords, c.id);
  return `<div class="section-heading"><p class="muted">Ghi lại kết quả thực tế sau mỗi buổi học.</p><button class="primary" data-action="editRecord">+ Ghi nhận buổi học</button></div><div class="two-columns"><section class="panel"><h2>Lịch sử buổi học</h2>${records.map((r) => recordCard(r)).join("") || '<p class="muted">Chưa có buổi học được ghi nhận.</p>'}</section><section class="panel"><h2>Thực hành của con</h2><p class="hint">Các lượt thực hành chưa chấm điểm.</p>${
    data.practiceSessions
      .filter((p) => p.childId === c.id)
      .slice()
      .reverse()
      .slice(0, 30)
      .map(
        (p) =>
          `<article class="history-item"><strong>${esc(data.lessons.find((l) => l.id === p.lessonId)?.title)}</strong><small>${formatDate(p.date)}</small><p>${esc(p.sentence || "Chưa ghép câu")}</p></article>`,
      )
      .join("") || '<p class="muted">Chưa có lượt thực hành.</p>'
  }</section></div>`;
}
function editRecord(id) {
  const r = data.dailyRecords.find((r) => r.id === id) || {
    date: localDate(),
    lessonId: lessonId || data.lessons[0]?.id,
    correct: 0,
    total: 10,
    prompt: 0,
    focus: 3,
    behavior: "",
    note: "",
  };
  openModal(
    id ? "Chỉnh sửa buổi học" : "Ghi nhận buổi học",
    `<form data-form="record" data-id="${esc(id || "")}"><div class="form-grid">${field("Ngày học", input("date", r.date, "date", "required"))}${field("Bài học", `<select name="lessonId">${data.lessons.map((l) => option(l.id, l.title, r.lessonId)).join("")}</select>`)}${field("Số lượt đúng", input("correct", r.correct, "number", 'required min="0" max="10000" step="1"'))}${field("Tổng số lượt", input("total", r.total, "number", 'required min="1" max="10000" step="1"'))}${field("Mức nhắc", `<select name="prompt">${["Không nhắc", "Nhắc nhẹ", "Nhắc bằng cử chỉ", "Hỗ trợ nhiều"].map((s, n) => option(n, `${n} – ${s}`, r.prompt)).join("")}</select>`)}${field("Mức tập trung", `<select name="focus">${["Thấp", "Cần nhắc", "Tốt", "Rất tốt"].map((s, n) => option(n + 1, `${n + 1} – ${s}`, r.focus)).join("")}</select>`)}</div>${field("Hành vi quan sát", textarea("behavior", r.behavior, 'maxlength="3000"'))}${field("Nhận xét và bước tiếp theo", textarea("note", r.note, 'maxlength="3000"'))}${submit("Lưu buổi học")}</form>`,
  );
}
function reportRecords(c) {
  return sortedRecords(data.dailyRecords, c.id).filter(
    (r) =>
      (!reportRange.from || r.date >= reportRange.from) &&
      (!reportRange.to || r.date <= reportRange.to),
  );
}
function reportTable(records) {
  if (!records.length)
    return '<p class="muted">Chưa có ghi nhận trong khoảng ngày đã chọn.</p>';
  return `<p class="table-hint">Kết quả từng buổi · Có thể cuộn ngang để xem đủ thông tin trên điện thoại.</p><div class="report-scroll" tabindex="0" role="region" aria-label="Bảng kết quả buổi học"><table class="report-table"><caption class="visually-hidden">Chi tiết kết quả theo buổi học</caption><thead><tr><th scope="col">Ngày học</th><th scope="col">Bài học</th><th scope="col">Kết quả</th><th scope="col">Hỗ trợ</th><th scope="col">Quan sát và nhận xét</th></tr></thead><tbody>${records.map((r) => `<tr><td>${formatDate(r.date)}</td><td><strong>${esc(data.lessons.find((l) => l.id === r.lessonId)?.title || "Bài học")}</strong></td><td><strong>${percent(r.correct, r.total)}%</strong><small>Đúng ${r.correct}/${r.total} lượt</small></td><td>Nhắc: ${r.prompt}/3<small>Tập trung: ${r.focus}/4</small></td><td>${esc(r.note || "Chưa có nhận xét")}${r.behavior ? `<small>Quan sát: ${esc(r.behavior)}</small>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
}
function reportsView(c) {
  const records = reportRecords(c),
    total = records.reduce((s, r) => s + r.total, 0),
    correct = records.reduce((s, r) => s + r.correct, 0);
  return `<section class="panel filter-row"><label>Từ ngày<input id="reportFrom" type="date" value="${reportRange.from}"></label><label>Đến ngày<input id="reportTo" type="date" value="${reportRange.to}"></label><button class="secondary" data-action="exportCsv">↓ Xuất CSV</button><button class="secondary" data-action="print">In / lưu PDF</button></section><h2 class="print-title">Báo cáo tiến bộ · ${esc(c.name)}</h2><section class="metrics">${metric("Số buổi học", records.length)}${metric("Tỷ lệ đúng tổng hợp", total ? percent(correct, total) + "%" : "—", total ? `${correct}/${total} lượt` : "Chưa có dữ liệu")}${metric("Mức nhắc trung bình", records.length ? (records.reduce((s, r) => s + r.prompt, 0) / records.length).toFixed(1) + "/3" : "—")}${metric("Tập trung trung bình", records.length ? (records.reduce((s, r) => s + r.focus, 0) / records.length).toFixed(1) + "/4" : "—")}</section><div class="two-columns"><section class="panel"><h2>Kết quả theo buổi</h2><p class="hint">Tối đa 20 buổi gần nhất trong khoảng đã chọn. Các bài có thể khác độ khó.</p><div class="trend-list">${
    records
      .slice(0, 20)
      .reverse()
      .map(
        (r) =>
          `<div><div class="bar-label"><span>${formatDate(r.date)} · ${esc(data.lessons.find((l) => l.id === r.lessonId)?.title)}</span><b>${percent(r.correct, r.total)}%</b></div><progress max="100" value="${percent(r.correct, r.total)}" aria-label="Kết quả ${formatDate(r.date)}"></progress></div>`,
      )
      .join("") || "<p>Chưa có dữ liệu trong khoảng này.</p>"
  }</div></section><section class="panel"><h2>Kỹ năng hiện tại</h2>${bars(c)}<p class="hint">Dựa trên lần đánh giá được lưu gần nhất, không phụ thuộc bộ lọc ngày.</p></section></div><section class="panel section-space"><h2>Chi tiết ghi nhận</h2>${reportTable(records)}</section>`;
}
function contentView() {
  const lessons = data.lessons.filter(
    (l) => curriculumBand === "all" || l.teachingGuide?.band === curriculumBand,
  );
  return `<section class="lesson-cover-banner">${picture("lesson-cover", "", true)}<div><h2>Chuẩn bị một bài học nhỏ</h2><p>Video mẫu, thẻ hình và những điều gần gũi với con.</p></div></section><label class="curriculum-filter">Cấp học<select id="curriculumBand">${option("all", "Tất cả bài học", curriculumBand)}${Object.entries(
    schoolBands,
  )
    .map(([key, label]) => option(key, label, curriculumBand))
    .join(
      "",
    )}</select></label><div class="section-heading"><p class="muted">${lessons.length} bài học · Tạo thẻ bằng biểu tượng hoặc ảnh của bạn.</p><button class="primary" data-action="editLesson">+ Thêm bài học</button></div><section class="panel materials"><h2>Tài liệu tham khảo</h2><div class="button-row"><a href="/materials/aac" target="_blank" rel="noopener">AAC tổng hợp ↗</a><a href="/materials/topic" target="_blank" rel="noopener">Chủ đề 16 hình ↗</a><a href="/materials/behavior" target="_blank" rel="noopener">Hành vi nên / không nên ↗</a><a href="/materials/book">Sách giao tiếp (PPTX) ↓</a></div><p class="hint">Mở tài liệu gốc để tham khảo; nội dung PDF/PPTX chưa được tự động chuyển thành thẻ.</p></section><div class="profile-grid section-space">${lessons.map((l) => `<article class="panel"><div class="tags">${badge(domainName(l.domain))}${badge("Mức " + l.level)}${l.teachingGuide ? badge(schoolBands[l.teachingGuide.band]) : ""}</div><h2>${esc(l.title)}</h2><p>${esc(l.goal)}</p><p class="muted">${l.cards.length} thẻ</p><div class="button-row">${l.teachingGuide ? `<button class="primary" data-action="viewTeachingGuide" data-id="${esc(l.id)}">Hướng dẫn dạy & chấm điểm</button>` : ""}<button class="secondary" data-action="editLesson" data-id="${esc(l.id)}">Chỉnh sửa</button><button class="text-button danger-text" data-action="askDeleteLesson" data-id="${esc(l.id)}">Xóa</button></div></article>`).join("")}</div>`;
}
function editLesson(id) {
  const l = data.lessons.find((l) => l.id === id) || {
    title: "",
    domain: "communication",
    level: 1,
    goal: "",
    prompt: "Con hãy chọn thẻ.",
    source: "custom",
    cards: [{ text: "", icon: "💬" }],
  };
  editorCards = structuredClone(l.cards);
  openModal(
    id ? "Chỉnh sửa bài học" : "Thêm bài học",
    `<form data-form="lesson" data-id="${esc(id || "")}">${field("Tên bài học", input("title", l.title, "text", 'required maxlength="150"'))}<div class="form-grid">${field("Lĩnh vực", `<select name="domain">${domains.map(([id, name]) => option(id, name, l.domain)).join("")}</select>`)}${field("Mức bài học", `<select name="level">${[1, 2, 3].map((n) => option(n, "Mức " + n, l.level)).join("")}</select>`)}</div>${field("Mục tiêu", textarea("goal", l.goal, 'required maxlength="1500"'))}${field("Hướng dẫn cho trẻ", input("prompt", l.prompt, "text", 'required maxlength="500"'))}<input type="hidden" name="source" value="${esc(l.source)}">${videoEditor(l)}<h3>Thẻ giao tiếp</h3><p class="hint">Ảnh PNG/JPEG/WebP dưới 300 KB mỗi thẻ. Biểu tượng được dùng khi không có ảnh.</p><div id="cardEditor">${cardEditorMarkup()}</div><button type="button" class="secondary" data-action="addEditorCard">+ Thêm thẻ</button>${submit("Lưu bài học")}</form>`,
  );
}
function cardEditorMarkup() {
  return editorCards
    .map(
      (c, i) =>
        `<div class="card-editor" data-card="${i}"><div class="editor-preview">${c.image ? `<img src="${esc(c.image)}" alt="Ảnh thẻ ${i + 1}">` : `<span>${esc(c.icon)}</span>`}</div><label>Nội dung ${i + 1}<input data-card-field="text" value="${esc(c.text)}" required maxlength="80"></label><label>Biểu tượng<input data-card-field="icon" value="${esc(c.icon)}" maxlength="20" aria-label="Biểu tượng thẻ ${i + 1}"></label><label class="upload-label">Chọn ảnh<input type="file" data-card-image="${i}" accept="image/png,image/jpeg,image/webp"></label>${c.image ? `<button type="button" class="text-button" data-action="removeImage" data-index="${i}">Bỏ ảnh</button>` : ""}<button type="button" class="icon-button danger-text" data-action="removeEditorCard" data-index="${i}" aria-label="Xóa thẻ ${i + 1}">×</button></div>`,
    )
    .join("");
}
function editUser(id, requestedRole) {
  const u = users.find((u) => u.id === id) || {
    username: "",
    role: requestedRole || (view === "teachers" ? "teacher" : "child"),
    childIds: [],
  };
  const allowed = u.role === "teacher" ? ["teacher"] : ["child", "parent"];
  openModal(
    id
      ? "Sửa tài khoản"
      : u.role === "teacher"
        ? "Thêm giáo viên"
        : "Tạo tài khoản học sinh / phụ huynh",
    `<form data-form="user" data-id="${esc(id || "")}">${field("Tên đăng nhập", input("username", u.username, "text", 'required minlength="3" maxlength="60" pattern="[a-zA-Z0-9._-]+" autocomplete="off"'))}${field("Vai trò", `<select name="role">${allowed.map((role) => option(role, roles[role], u.role)).join("")}</select>`)}${field(id ? "Mật khẩu mới (để trống nếu giữ nguyên)" : "Mật khẩu", input("password", "", "password", `${id ? "" : "required"} minlength="6" maxlength="200" autocomplete="new-password"`))}<fieldset><legend>${u.role === "teacher" ? "Học sinh phụ trách" : "Học sinh được liên kết"}</legend>${data.children.map((c) => `<label class="check-label"><input name="childIds" type="checkbox" value="${esc(c.id)}" ${u.childIds.includes(c.id) ? "checked" : ""}>${esc(c.name)}</label>`).join("") || '<p class="hint">Thêm học sinh trước khi liên kết.</p>'}</fieldset>${submit("Lưu tài khoản")}</form>`,
  );
}
function settingsView() {
  return `<section class="panel account-panel"><h2>Tài khoản của tôi</h2><p>${esc(user.username)} · ${roles[user.role]}</p><form data-form="password">${field("Mật khẩu hiện tại", input("current", "", "password", 'required autocomplete="current-password" maxlength="200"'))}${field("Mật khẩu mới", input("password", "", "password", 'required minlength="6" maxlength="200" autocomplete="new-password"'))}<p class="form-error" role="alert"></p><button class="primary" type="submit">Đổi mật khẩu</button></form><hr><button class="secondary" data-action="logout">Đăng xuất</button></section><section class="panel install-panel"><h2>Cùng Con trên điện thoại</h2><p>Thêm ứng dụng vào màn hình chính để mở nhanh, với không gian hiển thị rộng hơn.</p><button class="primary" type="button" data-pwa-install hidden>Cài ứng dụng</button><p>Trên iPhone: mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính. Trên Android: chọn Cài ứng dụng trong menu trình duyệt.</p><p class="muted">Cần kết nối mạng để đăng nhập, học và lưu dữ liệu.</p></section>`;
}
async function navigate(next) {
  modal.close();
  clearTimeout(toastTimer);
  $("#toast").className = "";
  if (user.role === "admin" || next === "pathways") await load();
  view = next;
  sentence = [];
  render();
  window.scrollTo(0, 0);
}
async function exportBackup() {
  const backup = await api("/api/backup");
  download(
    `cung-con-${localDate()}-${Date.now()}.json`,
    JSON.stringify(backup, null, 2),
    "application/json",
  );
}
function csvExport() {
  const records = reportRecords(currentChild());
  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const rows = [
    [
      "Ngày",
      "Trẻ",
      "Bài học",
      "Đúng",
      "Tổng",
      "Tỷ lệ (%)",
      "Mức nhắc",
      "Tập trung",
      "Hành vi",
      "Nhận xét",
    ],
    ...records.map((r) => [
      r.date,
      currentChild().name,
      data.lessons.find((l) => l.id === r.lessonId)?.title,
      r.correct,
      r.total,
      percent(r.correct, r.total),
      r.prompt,
      r.focus,
      r.behavior,
      r.note,
    ]),
  ];
  download(
    `tien-bo-${localDate()}.csv`,
    "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
  toast("Đã xuất báo cáo CSV.");
}
function migrateLegacy(old) {
  if (
    !old ||
    !Array.isArray(old.children) ||
    !Array.isArray(old.lessons) ||
    !Array.isArray(old.dailyRecords)
  )
    throw new Error(
      "Không tìm thấy dữ liệu demo hợp lệ trong trình duyệt này.",
    );
  return {
    schemaVersion: 2,
    children: old.children,
    lessons: old.lessons.map((l) => ({
      ...l,
      source: "custom",
      cards: l.cards.map((c) => ({ text: c[0], icon: "💬" })),
    })),
    dailyRecords: old.dailyRecords.map((r) => ({
      ...r,
      authorId: user.id,
      createdAt: r.date + "T12:00:00.000Z",
    })),
    assessmentHistory: [],
    practiceSessions: [],
  };
}
const actions = {
  viewTeachingGuide: (el) => {
    const lesson = data.lessons.find((l) => l.id === el.dataset.id);
    if (lesson?.teachingGuide)
      openModal(lesson.title, guideMarkup(lesson.teachingGuide));
  },
  previewCurriculum: (el) => {
    const plan = makeCurriculumPlan(childId, el.dataset.band, data.lessons);
    openModal(
      `Mẫu ${schoolBands[el.dataset.band]}`,
      `<p class="hint">Đây là bản xem trước cho ${esc(currentChild().name)}. Chỉ khi bấm lưu, danh sách bài mới thay thế lộ trình đang dùng và điểm mở khóa được tính lại. ${plan.stages.map((stage, i) => `Lộ trình ${i + 1}: ${stage.lessonIds.length} bài`).join(" · ")}.</p>${planEditor(plan, data.lessons)}`,
    );
  },
  openStage: (el) => {
    selectedStage = el.dataset.id;
    render();
    $(".pathway-lessons")?.scrollIntoView({ block: "start" });
  },
  refreshPlans: async () => {
    await load();
    render();
    toast("Đã cập nhật tiến độ.");
  },
  editPlan: () =>
    openModal(
      `Lộ trình của ${currentChild().name}`,
      planEditor(currentPlan(), data.lessons),
    ),
  removePlanGrade: (el) =>
    mutate(
      "gradeLesson",
      {
        childId,
        stageId: el.dataset.stage,
        lessonId: el.dataset.id,
        score: null,
      },
      "Đã xóa điểm bài học và tính lại điểm lộ trình.",
    ),
  movePlanLesson: (el) => {
    const plan = structuredClone(currentPlan());
    const stage = plan.stages.find((s) => s.id === el.dataset.stage),
      index = stage.lessonIds.indexOf(el.dataset.id),
      next = index + Number(el.dataset.direction);
    if (next < 0 || next >= stage.lessonIds.length) return;
    [stage.lessonIds[index], stage.lessonIds[next]] = [
      stage.lessonIds[next],
      stage.lessonIds[index],
    ];
    return mutate("savePlan", plan, "Đã sắp xếp bài học.");
  },
  removeLessonVideo: () => {
    $('#modal [name="videoId"]').value = "";
    $("#lessonVideo").value = "";
    $("#videoPreview").innerHTML = "";
    $("#videoUploadStatus").textContent = "Video sẽ được gỡ khỏi bài khi lưu.";
  },
  removeYoutube: () => {
    for (const name of [
      "youtubeUrl",
      "youtubeTitle",
      "youtubeChannel",
      "youtubeNote",
    ])
      $(`#modal [name="${name}"]`).value = "";
  },
  removeDrive: () => {
    for (const name of ["driveUrl", "driveTitle", "driveChannel", "driveNote"])
      $(`#modal [name="${name}"]`).value = "";
  },
  playDrive: (el) => {
    const lesson = data.lessons.find((l) => l.id === el.dataset.id);
    if (!lesson?.drive) return;
    const frame = document.createElement("iframe");
    frame.src = driveEmbed(lesson.drive);
    frame.title = lesson.drive.title;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allow = "encrypted-media; fullscreen";
    frame.allowFullscreen = true;
    el.parentElement.replaceChildren(frame);
  },
  useYoutubeSuggestion: (el) => {
    const video = videoSuggestions.find((v) => v.id === el.dataset.id);
    if (!video) return;
    for (const [name, value] of Object.entries({
      youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
      youtubeTitle: video.title,
      youtubeChannel: video.channel,
      youtubeNote: video.note,
    }))
      $(`#modal [name="${name}"]`).value = value;
  },
  playYoutube: (el) => {
    const lesson = data.lessons.find((l) => l.id === el.dataset.id);
    if (!lesson?.youtube) return;
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${youtubeId(lesson.youtube.url)}?playsinline=1&rel=0`;
    frame.title = lesson.youtube.title;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allow = "encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    el.parentElement.replaceChildren(frame);
  },
  assignTeachers: (el) => {
    const c = data.children.find((c) => c.id === el.dataset.id);
    const teachers = users.filter((u) => u.role === "teacher");
    openModal(
      "Phân công giáo viên",
      `<p>Học sinh: <strong>${esc(c.name)}</strong></p><form data-form="assignments" data-id="${esc(c.id)}"><fieldset><legend>Giáo viên phụ trách</legend>${teachers.map((u) => `<label class="check-label"><input type="checkbox" name="teacherIds" value="${esc(u.id)}" ${u.childIds.includes(c.id) ? "checked" : ""}>${esc(u.username)}</label>`).join("") || "<p>Chưa có giáo viên. Hãy tạo tài khoản giáo viên trước.</p>"}</fieldset>${submit("Lưu phân công")}</form>`,
    );
  },

  openMenu: () =>
    openModal(
      "Bạn muốn làm gì?",
      `<p class="menu-user">${esc(user.name)} · ${roles[user.role]}</p><nav class="menu-navigation" aria-label="Tất cả chức năng">${navigation()}</nav><button class="secondary full" data-action="logout">Đăng xuất</button>`,
    ),
  resetFilters: () => {
    filters = { domain: "all", level: "all", recommended: false, search: "" };
    render();
  },
  recordAfterPractice: () => {
    modal.close();
    editRecord();
  },

  retry: boot,
  closeModal: () => modal.close(),
  logout: async () => {
    await api("/api/logout", {});
    data = null;
    user = null;
    modal.close();
    renderAuth();
  },
  editChild: (el) => editChild(el.dataset.id),
  selectChild: (el) => {
    childId = el.dataset.id;
    return navigate("dashboard");
  },
  askDeleteChild: (el) =>
    confirmAction(
      "Xóa hồ sơ trẻ?",
      "Toàn bộ đánh giá, điểm và lượt thực hành của hồ sơ này cũng sẽ bị xóa.",
      "deleteChild",
      el.dataset.id,
    ),
  deleteChild: (el) =>
    mutate("deleteChild", { id: el.dataset.id }, "Đã xóa hồ sơ."),
  openLesson: (el) => {
    lessonId = el.dataset.id;
    return navigate("kid");
  },
  addWord: (el) => {
    const text = currentLesson().cards[Number(el.dataset.index)].text;
    if (sentence.length >= 50)
      return toast("Câu đã đủ 50 thẻ. Hãy xóa hoặc hoàn thành lượt học.");
    sentence.push(text);
    $("#sentence").innerHTML = sentenceMarkup();
    if ($("#autoSpeak").checked) speak(text);
  },
  undoWord: () => {
    sentence.pop();
    $("#sentence").innerHTML = sentenceMarkup();
  },
  clearSentence: () => {
    sentence = [];
    $("#sentence").innerHTML = sentenceMarkup();
  },
  speakSentence: () => speak(sentence.join(" ")),
  completePractice: async () => {
    if (!sentence.length) return toast("Hãy chọn thẻ trước khi hoàn thành.");
    await mutate(
      "practice",
      {
        childId,
        lessonId: currentLesson().id,
        date: localDate(),
        sentence: sentence.join(" "),
      },
      "Đã lưu lượt thực hành. Con làm tốt lắm!",
    );
    sentence = [];
    render();
    openModal(
      "Con đã hoàn thành lượt học!",
      `<div class="completion">${picture("buddy-success", "completion-sticker", true)}<p>Đã lưu lượt thực hành của ${esc(currentChild().name)}.</p><p class="muted">${user.role === "child" ? "Con có thể tiếp tục học khi sẵn sàng." : "Bạn có muốn ghi nhận kết quả của buổi học này không?"}</p></div><div class="form-actions"><button class="secondary" data-action="closeModal">Học tiếp</button>${user.role !== "child" ? '<button class="primary" data-action="recordAfterPractice">Ghi kết quả buổi học</button>' : ""}</div>`,
    );
  },
  editRecord: (el) => editRecord(el.dataset.id),
  askDeleteRecord: (el) =>
    confirmAction(
      "Xóa ghi nhận?",
      "Bản ghi buổi học này sẽ bị xóa.",
      "deleteRecord",
      el.dataset.id,
    ),
  deleteRecord: (el) =>
    mutate("deleteRecord", { id: el.dataset.id }, "Đã xóa ghi nhận."),
  editLesson: (el) => editLesson(el.dataset.id),
  askDeleteLesson: (el) =>
    confirmAction(
      "Xóa bài học?",
      "Chỉ có thể xóa bài học chưa có lịch sử học tập.",
      "deleteLesson",
      el.dataset.id,
    ),
  deleteLesson: (el) =>
    mutate("deleteLesson", { id: el.dataset.id }, "Đã xóa bài học."),
  addEditorCard: () => {
    if (editorCards.length >= 36) return toast("Mỗi bài tối đa 36 thẻ.");
    editorCards.push({ text: "", icon: "💬" });
    $("#cardEditor").innerHTML = cardEditorMarkup();
  },
  removeEditorCard: (el) => {
    if (editorCards.length === 1) return toast("Cần ít nhất một thẻ.");
    editorCards.splice(Number(el.dataset.index), 1);
    $("#cardEditor").innerHTML = cardEditorMarkup();
  },
  removeImage: (el) => {
    delete editorCards[Number(el.dataset.index)].image;
    $("#cardEditor").innerHTML = cardEditorMarkup();
  },
  editUser: (el) => editUser(el.dataset.id, el.dataset.role),
  askDeleteUser: (el) =>
    confirmAction(
      "Xóa tài khoản?",
      "Người dùng này sẽ không thể đăng nhập. Dữ liệu học tập vẫn được giữ.",
      "deleteUser",
      el.dataset.id,
    ),
  deleteUser: async (el) => {
    await api("/api/users", { id: el.dataset.id, delete: true });
    users = await api("/api/users");
    modal.close();
    render();
    toast("Đã xóa tài khoản.");
  },
  exportCsv: csvExport,
  print: () => window.print(),
  backup: exportBackup,
  recovery: async () => {
    const backup = await api("/api/recovery");
    download(
      "cung-con-du-phong.json",
      JSON.stringify(backup, null, 2),
      "application/json",
    );
  },
  restore: async () => {
    await exportBackup();
    await mutate("restore", pendingRestore, "Đã khôi phục dữ liệu.");
    pendingRestore = null;
  },
  legacyImport: () => {
    let old;
    try {
      old = JSON.parse(localStorage.getItem("aacLearningApp.v1"));
    } catch {
      throw new Error("Không đọc được dữ liệu demo cũ.");
    }
    pendingRestore = migrateLegacy(old);
    confirmAction(
      "Nhập dữ liệu demo cũ?",
      "Dữ liệu demo trong trình duyệt này sẽ thay thế dữ liệu học tập hiện tại. Một bản sao dữ liệu hiện tại sẽ được tải xuống.",
      "restore",
    );
  },
};
document.addEventListener("click", async (event) => {
  const el = event.target.closest("[data-action],[data-view]");
  if (!el) return;
  if (busy) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  busy = true;
  el.disabled = true;
  try {
    if (el.dataset.view) await navigate(el.dataset.view);
    else await actions[el.dataset.action]?.(el);
  } catch (e) {
    toast(e.message, true);
    if (e.status === 401) renderAuth();
  } finally {
    busy = false;
    el.disabled = false;
  }
});
document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  if (busy) return;
  busy = true;
  const button = $('button[type="submit"]', form);
  button.disabled = true;
  const error = $(".form-error", form);
  error.textContent = "";
  const values = Object.fromEntries(new FormData(form)),
    id = form.dataset.id || undefined;
  try {
    switch (form.dataset.form) {
      case "assignments":
        try {
          accept(
            await api("/api/assignments", {
              childId: id,
              teacherIds: new FormData(form).getAll("teacherIds"),
              version,
            }),
          );
          modal.close();
          render();
          toast("Đã lưu phân công giáo viên.");
        } catch (e) {
          if (e.status === 409) {
            await load();
            modal.close();
            render();
          }
          throw e;
        }
        break;

      case "login":
      case "setup":
        await api("/api/" + form.dataset.form, values);
        await load();
        selectedStage = "";
        view = user.role === "child" ? "pathways" : "dashboard";
        render();
        break;
      case "child":
        await mutate(
          "saveChild",
          { ...values, id, birthYear: Number(values.birthYear) },
          "Đã lưu hồ sơ trẻ.",
        );
        break;
      case "assessment":
        await mutate(
          "assess",
          {
            childId,
            date: values.date,
            scores: Object.fromEntries(
              domains.map(([id]) => [id, Number(values[id])]),
            ),
          },
          "Đã lưu đánh giá và cập nhật bài gợi ý.",
        );
        break;
      case "record":
        if (Number(values.correct) > Number(values.total))
          throw new Error("Số lượt đúng không được lớn hơn tổng lượt.");
        await mutate(
          "saveRecord",
          {
            ...values,
            id,
            childId,
            correct: Number(values.correct),
            total: Number(values.total),
            prompt: Number(values.prompt),
            focus: Number(values.focus),
          },
          "Đã lưu kết quả buổi học.",
        );
        break;
      case "grade":
        await mutate(
          "gradeLesson",
          {
            childId,
            stageId: form.dataset.stage,
            lessonId: id,
            score: Number(values.score),
          },
          "Đã lưu điểm đánh giá của giáo viên.",
        );
        break;
      case "plan": {
        const fields = new FormData(form);
        const stages = currentPlan().stages.map((stage) => {
          const selected = fields.getAll(`stage${stage.id}`);
          return {
            ...stage,
            title: values[`title${stage.id}`],
            goal: values[`goal${stage.id}`],
            lessonIds: [
              ...stage.lessonIds.filter((id) => selected.includes(id)),
              ...selected.filter((id) => !stage.lessonIds.includes(id)),
            ],
          };
        });
        await mutate(
          "savePlan",
          { childId, stages },
          "Đã lưu lộ trình riêng của bé.",
        );
        break;
      }
      case "lesson":
        values.drive = values.driveUrl.trim()
          ? driveVideo({
              url: values.driveUrl,
              title: values.driveTitle,
              channel: values.driveChannel,
              note: values.driveNote,
            })
          : null;
        values.youtube = values.youtubeUrl.trim()
          ? youtubeValue({
              url: values.youtubeUrl,
              title: values.youtubeTitle,
              channel: values.youtubeChannel,
              note: values.youtubeNote,
            })
          : null;
        if (
          [
            values.youtube,
            values.drive,
            values.videoId || $("#lessonVideo")?.files[0],
          ].filter(Boolean).length > 1
        )
          throw new Error(
            "Mỗi bài chỉ chọn một nguồn video. Hãy bỏ liên kết hoặc tệp cũ trước khi đổi nguồn.",
          );
        if ($("#lessonVideo")?.files[0]) {
          values.videoId = await uploadLessonVideo($("#lessonVideo").files[0]);
          $('[name="videoId"]', form).value = values.videoId;
          $("#lessonVideo").value = "";
        }
        await mutate(
          "saveLesson",
          { ...values, id, level: Number(values.level), cards: editorCards },
          "Đã lưu bài học.",
        );
        break;
      case "user":
        await api("/api/users", {
          ...values,
          id,
          childIds: new FormData(form).getAll("childIds"),
        });
        users = await api("/api/users");
        await load();
        modal.close();
        render();
        toast("Đã lưu tài khoản.");
        break;
      case "password":
        await api("/api/password", values);
        form.reset();
        toast("Đã đổi mật khẩu. Các phiên đăng nhập cũ đã được kết thúc.");
        break;
    }
  } catch (e) {
    error.textContent = e.message;
    toast(e.message, true);
  } finally {
    busy = false;
    button.disabled = false;
  }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.dataset.cardField) {
    const index = Number(el.closest("[data-card]").dataset.card);
    editorCards[index][el.dataset.cardField] = el.value;
  }
  if (el.id === "lessonSearch") {
    const caret = el.selectionStart;
    filters.search = el.value;
    $("#view").innerHTML = lessonsView(currentChild());
    $("#lessonSearch").focus();
    $("#lessonSearch").setSelectionRange(caret, caret);
  }
});
document.addEventListener("change", async (event) => {
  const el = event.target;
  try {
    if (el.id === "curriculumBand") {
      curriculumBand = el.value;
      $("#view").innerHTML = contentView();
      $("#curriculumBand").focus();
    }
    if (el.id === "autoSpeak") {
      autoSpeak = el.checked;
      try {
        localStorage.setItem("aac.autoSpeak", autoSpeak ? "on" : "off");
      } catch {
        /* Preference remains valid for this visit. */
      }
    }
    if (el.id === "childPicker") {
      childId = el.value;
      selectedStage = "";
      if (user.role === "child") view = "pathways";
      sentence = [];
      render();
    }
    if (el.id === "kidLesson") {
      lessonId = el.value;
      sentence = [];
      render();
    }
    if (["domainFilter", "levelFilter", "recommendedFilter"].includes(el.id)) {
      if (el.id === "domainFilter") filters.domain = el.value;
      if (el.id === "levelFilter") filters.level = el.value;
      if (el.id === "recommendedFilter") filters.recommended = el.checked;
      $("#view").innerHTML = lessonsView(currentChild());
    }
    if (el.id === "reportFrom" || el.id === "reportTo") {
      const previous = { ...reportRange };
      reportRange[el.id === "reportFrom" ? "from" : "to"] = el.value;
      if (
        reportRange.from &&
        reportRange.to &&
        reportRange.from > reportRange.to
      ) {
        reportRange = previous;
        el.value = previous[el.id === "reportFrom" ? "from" : "to"];
        toast("Ngày bắt đầu phải trước ngày kết thúc.", true);
        return;
      }
      $("#view").innerHTML = reportsView(currentChild());
    }
    if (el.dataset.cardImage !== undefined) {
      const f = el.files[0];
      if (!f) return;
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
        f.size > 300000
      )
        throw new Error("Chọn ảnh PNG, JPEG hoặc WebP dưới 300 KB.");
      const image = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error("Không đọc được ảnh."));
        r.readAsDataURL(f);
      });
      editorCards[Number(el.dataset.cardImage)].image = image;
      $("#cardEditor").innerHTML = cardEditorMarkup();
    }
    if (el.id === "restoreFile") {
      const f = el.files[0];
      if (!f) return;
      if (f.size > 24 * 1024 * 1024)
        throw new Error("Bản sao lưu tối đa 24 MB.");
      pendingRestore = JSON.parse(await f.text());
      if (pendingRestore?.children && !pendingRestore.schemaVersion)
        pendingRestore = migrateLegacy(pendingRestore);
      if ((pendingRestore?.data || pendingRestore)?.schemaVersion !== 2)
        throw new Error("Bản sao lưu không đúng phiên bản 2.");
      confirmAction(
        "Khôi phục dữ liệu?",
        "Dữ liệu học tập hiện tại sẽ được thay thế bằng bản sao lưu đã chọn. Dữ liệu hiện tại sẽ được tải xuống trước khi thay thế.",
        "restore",
      );
      el.value = "";
    }
  } catch (e) {
    toast(e.message, true);
  }
});
boot();
