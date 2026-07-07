/* ============================================================
   students.js — Student management page
   Handles add/edit/delete, search and department filtering.
   ============================================================ */

let pendingDeleteId = null;

/* ---------- Render the table ---------- */
function renderStudents() {
  const term = document.getElementById("search").value.trim().toLowerCase();
  const dept = document.getElementById("filter-dept").value;
  const rows = document.getElementById("student-rows");
  const empty = document.getElementById("empty-state");

  let list = DB.getStudents();
  if (dept) list = list.filter((s) => s.department === dept);
  if (term) {
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term) ||
        s.department.toLowerCase().includes(term)
    );
  }

  if (!list.length) {
    rows.innerHTML = "";
    empty.innerHTML = `<div class="empty">No students found. Click <strong>Add Student</strong> to get started.</div>`;
    return;
  }
  empty.innerHTML = "";

  rows.innerHTML = list
    .map(
      (s) => `<tr>
        <td><span class="badge badge-neutral">${escapeHtml(s.id)}</span></td>
        <td style="display:flex;align-items:center;gap:10px;">
          <span class="avatar" style="width:34px;height:34px;font-size:0.8rem;">${initials(s.name)}</span>
          ${escapeHtml(s.name)}
        </td>
        <td>${escapeHtml(s.department)}</td>
        <td>${escapeHtml(s.year)}</td>
        <td>${escapeHtml(s.section)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" onclick="editStudent('${s.id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="askDelete('${s.id}')">🗑️</button>
          </div>
        </td>
      </tr>`
    )
    .join("");
}

/* ---------- Populate department filter ---------- */
function refreshDeptFilter() {
  const sel = document.getElementById("filter-dept");
  const current = sel.value;
  const depts = [...new Set(DB.getStudents().map((s) => s.department))].sort();
  sel.innerHTML =
    `<option value="">All Departments</option>` +
    depts.map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");
  sel.value = current;
}

/* ---------- Add ---------- */
function openAdd() {
  document.getElementById("modal-title").textContent = "Add Student";
  document.getElementById("student-form").reset();
  document.getElementById("edit-id").value = "";
  document.getElementById("f-id").disabled = false;
  openModal("student-modal");
}

/* ---------- Edit ---------- */
function editStudent(id) {
  const s = DB.getStudent(id);
  if (!s) return;
  document.getElementById("modal-title").textContent = "Edit Student";
  document.getElementById("edit-id").value = s.id;
  document.getElementById("f-id").value = s.id;
  document.getElementById("f-id").disabled = true; // ID is the key, not editable
  document.getElementById("f-name").value = s.name;
  document.getElementById("f-dept").value = s.department;
  document.getElementById("f-year").value = s.year;
  document.getElementById("f-section").value = s.section;
  openModal("student-modal");
}

/* ---------- Save (add or update) ---------- */
function handleSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById("edit-id").value;
  const data = {
    id: document.getElementById("f-id").value.trim(),
    name: document.getElementById("f-name").value.trim(),
    department: document.getElementById("f-dept").value.trim(),
    year: document.getElementById("f-year").value,
    section: document.getElementById("f-section").value,
  };
  if (!data.id || !data.name || !data.department) {
    toast("Please fill all required fields.", "error");
    return;
  }

  let res;
  if (editId) {
    res = DB.updateStudent(editId, data);
  } else {
    res = DB.addStudent(data);
  }
  if (!res.ok) {
    toast(res.msg, "error");
    return;
  }
  closeModal("student-modal");
  toast(editId ? "Student updated." : "Student added.", "success");
  refreshDeptFilter();
  renderStudents();
}

/* ---------- Delete ---------- */
function askDelete(id) {
  const s = DB.getStudent(id);
  pendingDeleteId = id;
  document.getElementById("del-name").textContent = s ? `${s.name} (${s.id})` : id;
  openModal("delete-modal");
}
function confirmDelete() {
  if (pendingDeleteId) {
    DB.deleteStudent(pendingDeleteId);
    toast("Student deleted.", "success");
    pendingDeleteId = null;
    refreshDeptFilter();
    renderStudents();
  }
  closeModal("delete-modal");
}

/* ---------- Wire up ---------- */
document.addEventListener("DOMContentLoaded", () => {
  refreshDeptFilter();
  renderStudents();
  document.getElementById("add-btn").addEventListener("click", openAdd);
  document.getElementById("student-form").addEventListener("submit", handleSubmit);
  document.getElementById("search").addEventListener("input", renderStudents);
  document.getElementById("filter-dept").addEventListener("change", renderStudents);
  document.getElementById("confirm-delete").addEventListener("click", confirmDelete);
});