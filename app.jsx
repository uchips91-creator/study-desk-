import { useState, useEffect } from "react";

const DEFAULT_SUBJECTS = ["Math", "Science", "English", "Hindi", "S.ST"];
const PALETTE = ["#7c6af7","#059669","#ea580c","#db2777","#2563eb","#0891b2","#7c3aed","#b45309","#be123c","#15803d"];

function getGrade(pct) {
  if (pct >= 90) return { grade: "A+", color: "#059669" };
  if (pct >= 80) return { grade: "A", color: "#16a34a" };
  if (pct >= 70) return { grade: "B", color: "#7c6af7" };
  if (pct >= 60) return { grade: "C", color: "#d97706" };
  if (pct >= 50) return { grade: "D", color: "#ea580c" };
  return { grade: "F", color: "#ef4444" };
}

function getProgress(items) {
  if (!items.length) return 0;
  return Math.round((items.filter(i => i.done).length / items.length) * 100);
}

function Ring({ pct, color, size = 72, stroke = 6, label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
        <text x="50%" y="52%" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold" fontFamily="Nunito">{pct}%</text>
      </svg>
      {label && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>}
    </div>
  );
}

const TABS = [
  { id: "dashboard", icon: "🏠", label: "Home" },
  { id: "tasks", icon: "📋", label: "Tasks" },
  { id: "habits", icon: "🔥", label: "Habits" },
  { id: "grades", icon: "🎓", label: "Grades" },
  { id: "subjects", icon: "⚙️", label: "Subjects" },
];

const card = { background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px #0000000a" };
const inp = (extra = {}) => ({ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 13px", color: "#1e293b", fontSize: 13, outline: "none", fontFamily: "Nunito, sans-serif", ...extra });

export default function App() {
  const [tab, setTab] = useState("dashboard");

  const [subjects, setSubjects] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("sp_subjects"));
      return s && s.length ? s : DEFAULT_SUBJECTS.map((name, i) => ({ name, color: PALETTE[i] }));
    } catch { return DEFAULT_SUBJECTS.map((name, i) => ({ name, color: PALETTE[i] })); }
  });

  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem("sp_w_tasks")) || []; } catch { return []; } });
  const [habits, setHabits] = useState(() => { try { return JSON.parse(localStorage.getItem("sp_w_habits")) || [{ id: 1, name: "Study 2 hours", done: false }, { id: 2, name: "Complete homework", done: false }, { id: 3, name: "Revise notes", done: false }]; } catch { return []; } });
  const [exams, setExams] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sp_w_exams")) || [];
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("sp_subjects", JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem("sp_w_tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("sp_w_habits", JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem("sp_w_exams", JSON.stringify(exams)); }, [exams]);

  const subjectColors = Object.fromEntries(subjects.map(s => [s.name, s.color]));

  // Subject manager state
  const [newSubName, setNewSubName] = useState("");
  const [newSubColor, setNewSubColor] = useState(PALETTE[0]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const addSubject = () => {
    if (!newSubName.trim()) return;
    if (subjects.find(s => s.name.toLowerCase() === newSubName.trim().toLowerCase())) return;
    setSubjects(p => [...p, { name: newSubName.trim(), color: newSubColor }]);
    setNewSubName("");
    setNewSubColor(PALETTE[subjects.length % PALETTE.length]);
  };

  const deleteSubject = (name) => {
    setSubjects(p => p.filter(s => s.name !== name));
    setTasks(p => p.filter(t => t.subject !== name));
    setExams(p => p.filter(e => e.subject !== name));
    setDeleteConfirm(null);
  };

  const [newTask, setNewTask] = useState({ text: "", subject: "", priority: "medium" });
  useEffect(() => { if (subjects.length && !newTask.subject) setNewTask(p => ({ ...p, subject: subjects[0].name })); }, [subjects]);

  const [taskFilter, setTaskFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [newHabit, setNewHabit] = useState("");
  const [examForm, setExamForm] = useState({ subject: "", name: "", obtained: "", total: "100" });
  useEffect(() => { if (subjects.length && !examForm.subject) setExamForm(p => ({ ...p, subject: subjects[0].name })); }, [subjects]);

  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState({});
  const priorityColors = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

  const addTask = () => { if (!newTask.text.trim() || !newTask.subject) return; setTasks(p => [...p, { id: Date.now(), ...newTask, done: false, created: new Date().toLocaleDateString("en-IN") }]); setNewTask(p => ({ ...p, text: "" })); };
  const toggleTask = id => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = id => setTasks(p => p.filter(t => t.id !== id));
  const addHabit = () => { if (!newHabit.trim()) return; setHabits(p => [...p, { id: Date.now(), name: newHabit, done: false }]); setNewHabit(""); };
  const toggleHabit = id => setHabits(p => p.map(h => h.id === id ? { ...h, done: !h.done } : h));
  const deleteHabit = id => setHabits(p => p.filter(h => h.id !== id));
  const addExam = () => { if (!examForm.name.trim() || examForm.obtained === "" || !examForm.subject) return; setExams(p => [...p, { id: Date.now(), ...examForm, obtained: Number(examForm.obtained), total: Number(examForm.total) }]); setExamForm(p => ({ ...p, name: "", obtained: "" })); };
  const deleteExam = id => setExams(p => p.filter(e => e.id !== id));
  const saveEdit = id => { setExams(p => p.map(e => e.id === id ? { ...e, obtained: Number(editVal.obtained), total: Number(editVal.total) } : e)); setEditId(null); };

  const taskPct = getProgress(tasks);
  const habitPct = getProgress(habits);
  const allObtained = exams.reduce((a, e) => a + e.obtained, 0);
  const allTotal = exams.reduce((a, e) => a + e.total, 0);
  const gradePct = allTotal ? Math.round((allObtained / allTotal) * 100) : 0;
  const { grade: overallGrade, color: gradeColor } = getGrade(gradePct);

  const subjectAvg = subjects.map(s => {
    const se = exams.filter(e => e.subject === s.name);
    if (!se.length) return { ...s, pct: 0, count: 0 };
    const to = se.reduce((a, e) => a + e.obtained, 0);
    const tm = se.reduce((a, e) => a + e.total, 0);
    return { ...s, pct: Math.round((to / tm) * 100), count: se.length };
  });

  const filteredTasks = tasks
    .filter(t => taskFilter === "all" ? true : taskFilter === "done" ? t.done : !t.done)
    .filter(t => subjectFilter === "all" ? true : t.subject === subjectFilter);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", color: "#1e293b", fontFamily: "Nunito, sans-serif", paddingBottom: 80 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* TOP BAR */}
      <div style={{ background: "#ffffff", padding: "18px 20px 14px", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 8px #0000000d" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1e293b" }}>📚 StudyDesk</h1>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{new Date().toDateString()}</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Ring pct={taskPct} color="#7c6af7" size={54} stroke={5} label="Tasks" />
            <Ring pct={habitPct} color="#059669" size={54} stroke={5} label="Habits" />
            <Ring pct={gradePct} color={gradeColor} size={54} stroke={5} label="Grades" />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Today's Summary</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Tasks Done", val: `${tasks.filter(t=>t.done).length}/${tasks.length}`, pct: taskPct, color: "#7c6af7", icon: "📋" },
                { label: "Habits Done", val: `${habits.filter(h=>h.done).length}/${habits.length}`, pct: habitPct, color: "#059669", icon: "🔥" },
                { label: "Overall Grade", val: overallGrade, pct: gradePct, color: gradeColor, icon: "🎓" },
              ].map(s => (
                <div key={s.label} style={{ ...card, padding: "16px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <p style={{ margin: "6px 0 2px", fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</p>
                  <p style={{ margin: "0 0 8px", fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{s.label}</p>
                  <div style={{ background: "#f1f5f9", borderRadius: 99, height: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                </div>
              ))}
            </div>

            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Subject Grades</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(118px,1fr))", gap: 10, marginBottom: 20 }}>
              {subjectAvg.map(s => {
                const { grade, color } = getGrade(s.pct);
                return (
                  <div key={s.name} style={{ ...card, padding: "12px 10px", textAlign: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, margin: "0 auto 6px" }} />
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: s.color }}>{s.name}</p>
                    <p style={{ margin: "4px 0 2px", fontSize: 20, fontWeight: 900, color }}>{s.count ? grade : "—"}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{s.count ? `${s.pct}%` : "No data"}</p>
                  </div>
                );
              })}
            </div>

            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Pending Tasks</p>
            {tasks.filter(t => !t.done).length === 0
              ? <div style={{ ...card, padding: 20, textAlign: "center", color: "#94a3b8" }}>🎉 All tasks done!</div>
              : tasks.filter(t => !t.done).slice(0, 3).map(task => (
                <div key={task.id} style={{ ...card, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${subjectColors[task.subject] || "#94a3b8"}` }}>
                  <button onClick={() => toggleTask(task.id)} style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid #cbd5e1", background: "none", cursor: "pointer", flexShrink: 0 }} />
                  <p style={{ margin: 0, flex: 1, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{task.text}</p>
                  <span style={{ fontSize: 11, background: (subjectColors[task.subject]||"#94a3b8") + "18", color: subjectColors[task.subject]||"#94a3b8", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{task.subject}</span>
                </div>
              ))
            }

            <p style={{ margin: "16px 0 12px", fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Today's Habits</p>
            {habits.map(h => (
              <div key={h.id} style={{ ...card, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, opacity: h.done ? 0.6 : 1 }}>
                <button onClick={() => toggleHabit(h.id)} style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${h.done ? "#059669" : "#cbd5e1"}`, background: h.done ? "#059669" : "none", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{h.done ? "✓" : ""}</button>
                <p style={{ margin: 0, flex: 1, fontSize: 13, fontWeight: 600, textDecoration: h.done ? "line-through" : "none", color: h.done ? "#94a3b8" : "#1e293b" }}>{h.name}</p>
                {h.done && <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>Done 🎉</span>}
              </div>
            ))}
          </div>
        )}

        {/* TASKS */}
        {tab === "tasks" && (
          <div>
            <div style={{ ...card, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>➕ New Task</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={newTask.text} onChange={e => setNewTask(p => ({ ...p, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="e.g. Complete Math homework..." style={{ ...inp({ flex: 1, minWidth: 160 }) }} />
                <select value={newTask.subject} onChange={e => setNewTask(p => ({ ...p, subject: e.target.value }))} style={inp({ cursor: "pointer" })}>
                  {subjects.map(s => <option key={s.name}>{s.name}</option>)}
                </select>
                <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} style={inp({ cursor: "pointer" })}>
                  <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
                </select>
                <button onClick={addTask} style={{ background: "#7c6af7", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Add</button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["all","pending","done"].map(f => (
                  <button key={f} onClick={() => setTaskFilter(f)} style={{ padding: "5px 14px", borderRadius: 99, border: "none", cursor: "pointer", background: taskFilter === f ? "#7c6af7" : "#e2e8f0", color: taskFilter === f ? "#fff" : "#64748b", fontSize: 12, fontWeight: 700 }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
                ))}
                <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ ...inp({ fontSize: 12, padding: "5px 10px", cursor: "pointer" }) }}>
                  <option value="all">All Subjects</option>
                  {subjects.map(s => <option key={s.name}>{s.name}</option>)}
                </select>
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{tasks.filter(t=>t.done).length}/{tasks.length} done</span>
            </div>

            <div style={{ background: "#e2e8f0", borderRadius: 99, height: 6, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${taskPct}%`, background: "linear-gradient(90deg,#7c6af7,#a78bfa)", borderRadius: 99, transition: "width 0.5s" }} />
            </div>

            {filteredTasks.length === 0
              ? <div style={{ textAlign: "center", padding: 40, color: "#cbd5e1" }}><p style={{ fontSize: 32 }}>📝</p><p>No tasks here!</p></div>
              : filteredTasks.map(task => (
                <div key={task.id} style={{ ...card, padding: "13px 15px", marginBottom: 9, display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${subjectColors[task.subject]||"#94a3b8"}`, opacity: task.done ? 0.5 : 1 }}>
                  <button onClick={() => toggleTask(task.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${task.done ? "#7c6af7" : "#cbd5e1"}`, background: task.done ? "#7c6af7" : "none", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{task.done ? "✓" : ""}</button>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, textDecoration: task.done ? "line-through" : "none", color: task.done ? "#94a3b8" : "#1e293b" }}>{task.text}</p>
                    <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, background: (subjectColors[task.subject]||"#94a3b8")+"18", color: subjectColors[task.subject]||"#94a3b8", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{task.subject}</span>
                      <span style={{ fontSize: 11, background: priorityColors[task.priority]+"18", color: priorityColors[task.priority], padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{task.priority}</span>
                      <span style={{ fontSize: 11, color: "#cbd5e1" }}>{task.created}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
              ))
            }
          </div>
        )}

        {/* HABITS */}
        {tab === "habits" && (
          <div>
            <div style={{ ...card, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>➕ New Habit</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key === "Enter" && addHabit()} placeholder="e.g. Revise Hindi notes..." style={{ ...inp({ flex: 1 }) }} />
                <button onClick={addHabit} style={{ background: "#059669", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Add</button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>Today's Progress</span>
              <span style={{ fontSize: 13, color: "#059669", fontWeight: 800 }}>{habits.filter(h=>h.done).length}/{habits.length}</span>
            </div>
            <div style={{ background: "#e2e8f0", borderRadius: 99, height: 6, marginBottom: 18, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${habitPct}%`, background: "linear-gradient(90deg,#059669,#34d399)", borderRadius: 99, transition: "width 0.5s" }} 
