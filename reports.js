/* ============================================================
   reports.js — Reports & analytics page
   Aggregates attendance over a selected period and renders
   Chart.js line, pie and bar charts plus a performance table.
   ============================================================ */

let lineChart, pieChart, barChart;

/* ---------- Build list of date keys in range ---------- */
function datesInRange(range) {
  const days = range === "daily" ? 1 : range === "weekly" ? 7 : 30;
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(DB.todayStr(d));
  }
  return out;
}

/* ---------- Read theme-aware colors ---------- */
function chartColors() {
  const dark = DB.getTheme() === "dark";
  return {
    text: dark ? "#cbd5e1" : "#475569",
    grid: dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
  };
}

/* ---------- Main render ---------- */
function renderReports() {
  const range = document.getElementById("range").value;
  const dates = datesInRange(range);
  const attendance = DB.getAttendance();
  const students = DB.getStudents();

  // Only keep dates that actually have records
  const recorded = dates.filter((d) => attendance[d] && Object.keys(attendance[d]).length);

  document.getElementById("range-info").textContent = recorded.length
    ? `${recorded.length} day(s) with records · ${DB.prettyDate(recorded[0])} → ${DB.prettyDate(recorded[recorded.length - 1])}`
    : "No attendance records found for this period.";

  // ----- Aggregate totals -----
  let totalPresent = 0, totalAbsent = 0;
  const dailyPct = [];
  recorded.forEach((d) => {
    const rec = attendance[d];
    let p = 0, a = 0;
    Object.values(rec).forEach((v) => (v === "present" ? p++ : a++));
    totalPresent += p;
    totalAbsent += a;
    dailyPct.push(p + a ? Math.round((p / (p + a)) * 100) : 0);
  });
  const avgPct = totalPresent + totalAbsent
    ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
    : 0;

  document.getElementById("r-days").textContent = recorded.length;
  document.getElementById("r-present").textContent = totalPresent;
  document.getElementById("r-absent").textContent = totalAbsent;
  document.getElementById("r-pct").textContent = avgPct + "%";

  // ----- Per-student summary -----
  const perStudent = students.map((s) => {
    let present = 0, total = 0;
    recorded.forEach((d) => {
      const v = attendance[d][s.id];
      if (v) {
        total++;
        if (v === "present") present++;
      }
    });
    const pct = total ? Math.round((present / total) * 100) : 0;
    return { ...s, present, absent: total - present, total, pct };
  });

  renderPerfTable(perStudent);
  drawCharts(recorded, dailyPct, totalPresent, totalAbsent, perStudent);
}

/* ---------- Performance table ---------- */
function renderPerfTable(data) {
  const rows = document.getElementById("perf-rows");
  const empty = document.getElementById("perf-empty");
  if (!data.length) {
    rows.innerHTML = "";
    empty.innerHTML = `<div class="empty">No students to report on.</div>`;
    return;
  }
  empty.innerHTML = "";
  rows.innerHTML = data
    .map((s) => {
      const good = s.pct >= 75;
      const status = s.total === 0
        ? `<span class="badge badge-neutral">No data</span>`
        : good
        ? `<span class="badge badge-present">Good</span>`
        : `<span class="badge badge-absent">Low</span>`;
      return `<tr>
        <td><span class="badge badge-neutral">${escapeHtml(s.id)}</span></td>
        <td>${escapeHtml(s.name)}</td>
        <td>${s.present}</td>
        <td>${s.absent}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="progress" style="width:80px;"><span style="width:${s.pct}%"></span></div>
            <strong>${s.pct}%</strong>
          </div>
        </td>
        <td>${status}</td>
      </tr>`;
    })
    .join("");
}

/* ---------- Charts ---------- */
function drawCharts(dates, dailyPct, totalPresent, totalAbsent, perStudent) {
  const c = chartColors();
  const labels = dates.map((d) => DB.prettyDate(d).replace(/,.*/, "").replace(/^\w+ /, ""));

  [lineChart, pieChart, barChart].forEach((ch) => ch && ch.destroy());

  // Line chart — attendance % trend
  lineChart = new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Attendance %",
        data: dailyPct,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.15)",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#4f46e5",
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: c.text } } },
      scales: {
        y: { min: 0, max: 100, ticks: { color: c.text }, grid: { color: c.grid } },
        x: { ticks: { color: c.text }, grid: { color: c.grid } },
      },
    },
  });

  // Pie chart — present vs absent
  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [totalPresent, totalAbsent],
        backgroundColor: ["#16a34a", "#dc2626"],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { color: c.text } } },
    },
  });

  // Bar chart — per-student %
  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: perStudent.map((s) => s.name.split(" ")[0]),
      datasets: [{
        label: "Attendance %",
        data: perStudent.map((s) => s.pct),
        backgroundColor: perStudent.map((s) => (s.pct >= 75 ? "#2563eb" : "#f59e0b")),
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: c.text } } },
      scales: {
        y: { min: 0, max: 100, ticks: { color: c.text }, grid: { color: c.grid } },
        x: { ticks: { color: c.text }, grid: { color: c.grid } },
      },
    },
  });
}

/* ---------- Wire up ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderReports();
  document.getElementById("range").addEventListener("change", renderReports);
  // Re-render charts on theme change so colors stay readable
  document.getElementById("theme-btn").addEventListener("click", () => setTimeout(renderReports, 50));
});