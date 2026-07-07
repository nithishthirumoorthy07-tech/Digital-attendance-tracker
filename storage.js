/* ============================================================
   storage.js — Shared LocalStorage data layer
   All pages include this file first. It exposes a global `DB`
   object with reusable functions for students, attendance,
   theme and activity log. Everything is stored in the browser
   so the app works fully offline with no backend.
   ============================================================ */

const KEYS = {
  students: "dat_students",
  attendance: "dat_attendance",
  theme: "dat_theme",
  activity: "dat_activity",
  seeded: "dat_seeded",
};

/* ---------- low-level helpers ---------- */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- date helpers ---------- */
function todayStr(d = new Date()) {
  // returns YYYY-MM-DD in local time
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}
function prettyDate(str) {
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

/* ============================================================
   DB — public API
   ============================================================ */
const DB = {
  KEYS,
  todayStr,
  prettyDate,

  /* ----- Students ----- */
  getStudents() {
    return read(KEYS.students, []);
  },
  saveStudents(list) {
    write(KEYS.students, list);
  },
  getStudent(id) {
    return this.getStudents().find((s) => s.id === id);
  },
  addStudent(student) {
    const list = this.getStudents();
    if (list.some((s) => s.id.toLowerCase() === student.id.toLowerCase())) {
      return { ok: false, msg: "A student with this ID already exists." };
    }
    list.push(student);
    this.saveStudents(list);
    this.logActivity(`Added student ${student.name} (${student.id})`);
    return { ok: true };
  },
  updateStudent(id, data) {
    const list = this.getStudents();
    const i = list.findIndex((s) => s.id === id);
    if (i === -1) return { ok: false, msg: "Student not found." };
    list[i] = { ...list[i], ...data, id }; // keep original id
    this.saveStudents(list);
    this.logActivity(`Updated student ${list[i].name} (${id})`);
    return { ok: true };
  },
  deleteStudent(id) {
    const list = this.getStudents();
    const st = list.find((s) => s.id === id);
    this.saveStudents(list.filter((s) => s.id !== id));
    // remove from attendance records too
    const att = this.getAttendance();
    Object.keys(att).forEach((day) => { delete att[day][id]; });
    write(KEYS.attendance, att);
    if (st) this.logActivity(`Deleted student ${st.name} (${id})`);
  },

  /* ----- Attendance ----- */
  getAttendance() {
    return read(KEYS.attendance, {});
  },
  getAttendanceForDate(date) {
    return this.getAttendance()[date] || {};
  },
  saveAttendanceForDate(date, record) {
    const att = this.getAttendance();
    const isUpdate = !!att[date];
    att[date] = record;
    write(KEYS.attendance, att);
    this.logActivity(`${isUpdate ? "Updated" : "Saved"} attendance for ${prettyDate(date)}`);
    return isUpdate;
  },

  /* ----- Theme ----- */
  getTheme() {
    return read(KEYS.theme, "light");
  },
  setTheme(t) {
    write(KEYS.theme, t);
  },

  /* ----- Activity log ----- */
  getActivity() {
    return read(KEYS.activity, []);
  },
  logActivity(text) {
    const list = this.getActivity();
    list.unshift({ text, at: Date.now() });
    write(KEYS.activity, list.slice(0, 12)); // keep last 12
  },

  /* ----- Reset ----- */
  resetAll() {
    localStorage.removeItem(KEYS.students);
    localStorage.removeItem(KEYS.attendance);
    localStorage.removeItem(KEYS.activity);
    localStorage.removeItem(KEYS.seeded);
    // keep theme preference
  },

  /* ----- Stats helpers ----- */
  statsForDate(date) {
    const rec = this.getAttendanceForDate(date);
    const total = this.getStudents().length;
    let present = 0, absent = 0;
    Object.values(rec).forEach((v) => (v === "present" ? present++ : absent++));
    const marked = present + absent;
    const pct = marked ? Math.round((present / marked) * 100) : 0;
    return { total, present, absent, marked, pct };
  },
};

/* ============================================================
   Seed sample data on first ever load so the dashboard,
   reports and charts look populated for presentation.
   ============================================================ */
(function seedSampleData() {
  if (localStorage.getItem(KEYS.seeded)) return;

  const sampleStudents = [
    { id: "CS101", name: "Aarav Sharma", department: "Computer Science", year: "2nd", section: "A" },
    { id: "CS102", name: "Diya Patel", department: "Computer Science", year: "2nd", section: "A" },
    { id: "CS103", name: "Rohan Mehta", department: "Computer Science", year: "2nd", section: "B" },
    { id: "EC201", name: "Ananya Iyer", department: "Electronics", year: "3rd", section: "A" },
    { id: "EC202", name: "Vivaan Gupta", department: "Electronics", year: "3rd", section: "B" },
    { id: "ME301", name: "Ishita Nair", department: "Mechanical", year: "1st", section: "A" },
    { id: "ME302", name: "Kabir Singh", department: "Mechanical", year: "1st", section: "B" },
    { id: "CS104", name: "Saanvi Rao", department: "Computer Science", year: "2nd", section: "A" },
  ];
  write(KEYS.students, sampleStudents);

  // Build attendance for the last 7 days with a realistic mix
  const attendance = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayStr(d);
    const day = d.getDay();
    if (day === 0) continue; // skip Sundays
    const rec = {};
    sampleStudents.forEach((s, idx) => {
      // deterministic-ish pattern so charts look natural
      const present = (idx + i) % 5 !== 0;
      rec[s.id] = present ? "present" : "absent";
    });
    attendance[key] = rec;
  }
  write(KEYS.attendance, attendance);

  write(KEYS.activity, [
    { text: "Welcome! Sample data loaded for demo.", at: Date.now() },
  ]);

  localStorage.setItem(KEYS.seeded, "1");
})();