/* ============================================================
   attendance.js — Daily attendance marking
   Lets the user pick a date, mark each student present/absent
   with toggle radio buttons, see live counters and save.
   ============================================================ */

// In-memory working copy for the selected date: { studentId: "present"|"absent" }
let working = {};

/* ---------- Render the student list with toggles ---------- */
function renderAttendance() {
  const list = document.getElementById("att-list");
  const students = DB.getStudents();

  if (!students.length) {
    list.innerHTML = `<div class="empty">No students yet. Add students first on the <a href="students.html" style="color:var(--brand)">Students</a> page.</div>`;
    updateCounters();
    return;
  }

  list.innerHTML = students
    .map((s) => {
      const status = working[s.id] || "present"; // default to present
      return `<div class="att-row">
        <div class="who">
          <span class="avatar">${initials(s.name)}</span>
          <div>
            <strong>${escapeHtml(s.name)}</strong>
            <small>${escapeHtml(s.id)} · ${escapeHtml(s.department)} · ${escapeHtml(s.year)}-${escapeHtml(s.section)}</small>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="badge ${status === "present" ? "badge-present" : "badge-absent"}" id="badge-${s.id}">
            ${status === "present" ? "Present" : "Absent"}
          </span>
          <div class="toggle-group">
            <label>
              <input type="radio" name="att-${s.id}" value="present" ${status === "present" ? "checked" : ""}
                onchange="setStatus('${s.id}','present')" />
              <span class="t-present">Present</span>
            </label>
            <label>
              <input type="radio" name="att-${s.id}" value="absent" ${status === "absent" ? "checked" : ""}
                onchange="setStatus('${s.id}','absent')" />
              <span class="t-absent">Absent</span>
            </label>
          </div>
        </div>
      </div>`;
    })
    .join("");

  updateCounters();
}

/* ---------- Update one student's status ---------- */
function setStatus(id, status) {
  working[id] = status;
  const badge = document.getElementById("badge-" + id);
  if (badge) {
    badge.textContent = status === "present" ? "Present" : "Absent";
    badge.className = "badge " + (status === "present" ? "badge-present" : "badge-absent");
  }
  updateCounters();
}

/* ---------- Bulk actions ---------- */
function markAll(status) {
  DB.getStudents().forEach((s) => (working[s.id] = status));
  renderAttendance();
}

/* ---------- Live counters ---------- */
function updateCounters() {
  const students = DB.getStudents();
  let present = 0, absent = 0;
  students.forEach((s) => {
    if ((working[s.id] || "present") === "present") present++;
    else absent++;
  });
  const total = students.length;
  const pct = total ? Math.round((present / total) * 100) : 0;
  document.getElementById("m-present").textContent = present;
  document.getElementById("m-absent").textContent = absent;
  document.getElementById("m-total").textContent = total;
  document.getElementById("m-pct").textContent = pct + "%";
}

/* ---------- Load saved record for a date ---------- */
function loadDate() {
  const date = document.getElementById("att-date").value;
  const saved = DB.getAttendanceForDate(date);
  const students = DB.getStudents();
  working = {};
  students.forEach((s) => {
    working[s.id] = saved[s.id] || "present";
  });
  const status = document.getElementById("att-status");
  const saveBtn = document.getElementById("save-btn");
  if (Object.keys(saved).length) {
    status.textContent = `Saved record found for ${DB.prettyDate(date)} — edit and update.`;
    saveBtn.innerHTML = "🔄 Update Attendance";
  } else {
    status.textContent = `No record yet for ${DB.prettyDate(date)} — mark and save.`;
    saveBtn.innerHTML = "💾 Save Attendance";
  }
  renderAttendance();
}

/* ---------- Save ---------- */
function saveAttendance() {
  const date = document.getElementById("att-date").value;
  const students = DB.getStudents();
  if (!students.length) {
    toast("Add students before saving attendance.", "error");
    return;
  }
  const record = {};
  students.forEach((s) => (record[s.id] = working[s.id] || "present"));
  const wasUpdate = DB.saveAttendanceForDate(date, record);
  toast(wasUpdate ? "Attendance updated." : "Attendance saved.", "success");
  loadDate();
}

/* ---------- Wire up ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("att-date");
  dateInput.value = DB.todayStr();
  dateInput.max = DB.todayStr();
  loadDate();
  dateInput.addEventListener("change", loadDate);
  document.getElementById("save-btn").addEventListener("click", saveAttendance);
  document.getElementById("all-present").addEventListener("click", () => markAll("present"));
  document.getElementById("all-absent").addEventListener("click", () => markAll("absent"));
});