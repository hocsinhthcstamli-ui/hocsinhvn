let installPrompt;
function updateInstallButtons() {
  document.querySelectorAll("[data-pwa-install]").forEach((button) => {
    button.hidden = !installPrompt;
  });
}
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  updateInstallButtons();
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  updateInstallButtons();
});
function enhanceLayout() {
  updateInstallButtons();
  document.querySelectorAll(".admin-shell .report-table").forEach((table) => {
    const labels = [...table.querySelectorAll("thead th")].map(
      (th) => th.textContent,
    );
    table.querySelectorAll("tbody tr").forEach((row) =>
      [...row.cells].forEach((cell, index) => {
        cell.dataset.label = labels[index] || "";
      }),
    );
  });
  document.querySelectorAll(".admin-mobile [data-view]").forEach((button) => {
    const selected =
      button.classList.contains("active") ||
      button.dataset.view === document.querySelector("#view")?.dataset.page;
    if (selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}
new MutationObserver(enhanceLayout).observe(document.getElementById("app"), {
  childList: true,
  subtree: true,
});
enhanceLayout();
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-pwa-install]");
  if (!button || !installPrompt) return;
  button.disabled = true;
  try {
    await installPrompt.prompt();
    await installPrompt.userChoice;
  } finally {
    installPrompt = null;
    button.disabled = false;
    updateInstallButtons();
  }
});
const connection = document.getElementById("connection-status");
function updateConnection() {
  connection.hidden = navigator.onLine;
  connection.textContent =
    "Mất kết nối · Chưa thể lưu thay đổi. Hãy giữ trang này và kết nối lại.";
}
window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);
updateConnection();
// Remove the bottom menu while the software keyboard needs the space.
const viewport = window.visualViewport;
function updateKeyboard() {
  const editing = document.activeElement?.matches(
    "input:not([type=checkbox]):not([type=radio]),textarea,select",
  );
  document.body.classList.toggle(
    "keyboard-open",
    Boolean(editing && viewport && window.innerHeight - viewport.height > 120),
  );
}
viewport?.addEventListener("resize", updateKeyboard);
document.addEventListener("focusin", updateKeyboard);
document.addEventListener("focusout", () =>
  requestAnimationFrame(updateKeyboard),
);
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      const notifyUpdate = () => {
      if (!registration.waiting || !navigator.serviceWorker.controller) return;
        const notice = document.getElementById("app-update");
        notice.hidden = false;
        notice.querySelector("button").onclick = () => {
          // A user chooses to reload, so a form is never interrupted automatically.
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => location.reload(),
            { once: true },
          );
          registration.waiting.postMessage({ type: "ACTIVATE_UPDATE" });
        };
      };
      notifyUpdate();
      registration.addEventListener("updatefound", () =>
        registration.installing?.addEventListener("statechange", notifyUpdate),
      );
    })
    .catch(() => {
      /* The web application remains usable when installation is unavailable. */
    });
}
