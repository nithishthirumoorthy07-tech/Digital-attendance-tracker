/* ============================================================
   ui.js — Shared UI helpers
   Sidebar, theme toggle, live clock, toasts, modal helpers,
   loader and active-nav highlighting. Included on every page
   (after storage.js).
   ============================================================ */

/* ---------- Theme ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // sync any theme toggle inputs on the page
  document.querySelectorAll("[data-theme-toggle]").forEach((el) => {
    el.checked = theme === "dark";
  });
  const icon = document.getElementById("theme-icon");
  if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
}
function toggleTheme() {
  const next = DB.getTheme() === "dark" ? "light" : "dark";
  DB.setTheme(next);
  applyTheme(next);
  toast(`${next === "dark" ? "Dark" : "Light"} mode enabled`, "success");
}
// Apply saved theme immediately to avoid a flash
applyTheme(DB.getTheme());

/* ---------- Live clock ---------- */
function startClock() {
  const timeEl = document.getElementById("clock-time");
  const dateEl = document.getElementById("clock-date");
  if (!timeEl) return;
  const tick = () => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString();
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: "long", month: "short", day: "numeric",
      });
    }
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- Sidebar (mobile) ---------- */
function setupSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const ham = document.getElementById("hamburger");
  const backdrop = document.getElementById("backdrop");
  if (!sidebar || !ham) return;
  const close = () => { sidebar.classList.remove("open"); backdrop.classList.remove("show"); };
  ham.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("show");
  });
  backdrop.addEventListener("click", close);
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

/* ---------- Highlight active nav link ---------- */
function highlightNav() {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === page) a.classList.add("active");
  });
}

/* ---------- Toast notifications ---------- */
function toast(message, type = "info") {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const icon = type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️";
  el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

/* ---------- Modal helpers ---------- */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("open");
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("open");
}
// Close modal when clicking the dark overlay
document.addEventListener("click", (e) => {
  if (e.target.classList && e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});

/* ---------- Loader ---------- */
function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add("hide");
    setTimeout(() => (loader.style.display = "none"), 400);
  }, 350);
}

/* ---------- Boot every page ---------- */
document.addEventListener("DOMContentLoaded", () => {
  highlightNav();
  startClock();
  setupSidebar();
  hideLoader();
  // wire any top theme toggle button
  const tbtn = document.getElementById("theme-btn");
  if (tbtn) tbtn.addEventListener("click", toggleTheme);
});

/* ---------- Reusable HTML fragment builders ---------- */
// Returns initials avatar text from a full name
function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}