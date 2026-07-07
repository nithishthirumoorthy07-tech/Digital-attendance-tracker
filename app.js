/* ============================================================
   app.js — Dashboard logic
   Reads data from LocalStorage (via DB) and fills the
   stat cards, today's summary and recent activity panel.
   ============================================================ */

function renderDashboard() {
  const today = DB.todayStr();
  const s = DB.statsForDate(today);

  // Top stat cards
  document.getElementById("st-total").textContent = s.total;
  document.getElementById("st-present").textContent = s.present;
  document.getElementById("st-absent").textContent = s.absent;
  document.getElementById("st-pct").textContent = s.pct + "%";

  // Today's summary
  document.getElementById("summary-date").textContent = DB.prettyDate(today);
  document.getElementById("sum-present").textContent = s.present;
  document.getElementById("sum-absent").textContent = s.absent;
  document.getElementById("sum-unmarked").textContent = Math.max(0, s.total - s.marked);
  document.getElementById("sum-pct").textContent = s.pct + "%";
  document.getElementById("sum-bar").style.width = s.pct + "%";

  // Recent activity
  const list = document.getElementById("activity-list");
  const activity = DB.getActivity();
  if (!activity.length) {
    list.innerHTML = `<div class="empty">No activity yet.</div>`;
  } else {
    list.innerHTML = activity
      .map(
        (a) => `<li>
          <span class="dot"></span>
          <span>${escapeHtml(a.text)}</span>
          <time>${timeAgo(a.at)}</time>
        </li>`
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", renderDashboard);